
"use strict";
/* ================= 状态 ================= */
let diagram = null;      // 当前图数据
let selectedId = null;   // 选中节点 id
const uid = () => Math.random().toString(36).slice(2, 9);
const LS_KEY = 'arch-editor-data';
/* 虚拟容器节点（结构树中代表右侧通栏 / 底部图例） */
const SIDEBAR_ROOT = { id: '__sidebar', title: '右侧通栏（体系说明）' };
const LEGEND_ROOT = { id: '__legend', title: '底部图例' };

/* ================= 节点类型注册表 =================
   一种节点类型 = 一条描述。结构树的取子/新增/复制、属性面板的字段顺序与条件、
   名称取哪个键，全部在这里声明；加一种节点类型（比如表格的「行」）只需在这里加一条，
   再去布局的渲染函数里把它画出来，不要在 nodeType / childList / addChild /
   renderProps 里到处补 if。

   字段说明：
     label     中文名（树、提示文案用）
     nameKey   标题取自哪个键（nodeName 用）
     depth     层级深度（快速录入的「下钻一级」用；越大越深）
     field     它父节点里存它的数组名（layers / groups / blocks / rows …）
     children  它的子节点存哪些数组（深层树递归用）
     addType   点「+」时新建哪种节点；null = 不能直接新增子项
     copyable  能否复制
     chain     是否属于「层 → 分组 → 模块」这条纵向主链（快速录入按它的 depth 排序）
     probe     老数据没有 type 字段时，靠结构猜类型（顺序即优先级）
     fields    属性面板字段；可以是数组，也可以是 (node, ctx) => 数组
               字段 kind：text | color | select | check | chips | button | hint
               value(node) 取当前值（默认 node[k]）；options(node,ctx) 选项；
               when(node,ctx) 条件显示；label 可为函数 (node,ctx) => '文字' */
const NODE_TYPES = {
  diagram: {
    label: '图', nameKey: 'title', depth: 0, field: null,
    children: ['layers'], addType: 'layer', copyable: false,
    probe: n => Array.isArray(n.layers),
    fields: [
      { k: 'title', label: '图标题', kind: 'text' },
      { k: 'subtitle', label: '副标题（可空）', kind: 'text' },
      { k: 'layout', label: '布局范式', kind: 'select', options: () => LAYOUT_LIST.map(L => [L.id, L.name]) },
      /* 清单布局专属：列名存在 diagram.ext.table.columns（布局专属数据只写 ext.<布局id>） */
      {
        k: 'tbColumns', label: '表头列名（逗号分隔）', kind: 'text', only: ['table'],
        list: 'ext.table.columns',
        value: n => {
          const c = n.ext && n.ext.table && n.ext.table.columns;
          return Array.isArray(c) ? c.join('、') : '';
        },
      },
    ],
  },
  layer: {
    label: '层', nameKey: 'name', depth: 1, field: 'layers', chain: true,
    children: ['groups'], addType: 'group', copyable: true,
    probe: n => Array.isArray(n.groups),
    fields: [
      { k: 'name', label: '层名称', kind: 'text' },
      { k: 'bandColor', label: '竖条颜色', kind: 'color' },
      { k: 'autoStat', label: '自动计算统计', kind: 'check', value: n => n.autoStat !== false },
      { k: 'stat', label: '层统计文字', kind: 'text', when: n => n.autoStat === false },
      { k: 'cols', label: '分组列数', kind: 'select', value: n => String(n.cols || 3), options: () => [['3', '3列'], ['2', '2列'], ['1', '1列']] },
      { kind: 'button', label: '编辑层间连线…', cls: 'ce-open', attr: 'data-open-conn', attrValue: n => n.id },
    ],
  },
  group: {
    label: '分组', nameKey: 'title', depth: 2, field: 'groups', chain: true,
    children: ['blocks'], addType: 'block', copyable: true,
    probe: n => Array.isArray(n.blocks),
    fields: [{ k: 'title', label: '分组标题', kind: 'text' }],
  },
  container: {
    /* v0.4「卡片式」遗留:diagram.rows。侧栏/图例的虚拟根也是 container,字段按根 id 分 */
    label: '区域', nameKey: 'title', depth: 0, field: 'rows',
    children: ['rows'], addType: null, copyable: false,
    probe: n => Array.isArray(n.rows),
    fields: (node) => (node.id === LEGEND_ROOT.id ? [{
      kind: 'hint', group: '底部图例通栏',
      html: '点击结构树中"底部图例"行上的 <b>+</b> 新增图例项；选中图例项后可编辑色块颜色与描述文字。',
    }] : [{
      kind: 'hint', group: '右侧通栏（体系说明）',
      html: '点击结构树中"右侧通栏"行上的 <b>+</b> 新增体系；选中体系后可编辑名称与说明条目。',
    }]),
  },
  block: {
    label: '模块', nameKey: 'title', depth: 3, field: 'blocks', chain: true,
    children: [], addType: null, copyable: true,
    probe: n => n.items !== undefined || n.sub !== undefined || n.code !== undefined,
    fields: [
      { k: 'title', label: (n, ctx) => (ctx.inSidebar ? '体系名称' : '模块名称'), kind: 'text' },
      { k: 'color', label: '竖条颜色', kind: 'color', when: (n, ctx) => ctx.inSidebar },
      { k: 'sub', label: '副标题（可空）', kind: 'text', when: (n, ctx) => !ctx.inSidebar },
      { k: 'span', label: '跨列（1=正常，2=整行）', kind: 'text', value: n => String(n.span || 1), when: (n, ctx) => !ctx.inSidebar },
      { k: 'items', kind: 'chips', group: (n, ctx) => (ctx.inSidebar ? '体系说明条目' : '条目列表') },
    ],
  },
  section: {
    /* v0.4 遗留的「分区」节点（node.list） */
    label: '分区', nameKey: 'title', depth: 2, field: 'list',
    children: ['blocks'], addType: 'block', copyable: false,
    probe: n => n.list !== undefined,
    fields: [{ k: 'title', label: '标题', kind: 'text' }],
  },
  legend: {
    label: '图例项', nameKey: 'title', depth: 3, field: 'legend',
    children: [], addType: null, copyable: false,
    probe: n => n.color !== undefined,
    fields: [
      { k: 'color', label: '色块颜色', kind: 'color' },
      { k: 'title', label: '图例描述', kind: 'text' },
    ],
  },
};
const NODE_TYPE_LIST = Object.keys(NODE_TYPES);

/* 新建节点时的默认对象（树上的「+」与快速录入共用，避免各处各写一份） */
const NODE_DEFAULTS = {
  layer: () => ({ id: uid(), name: '新层', bandColor: '#2379bd', cols: 3, groups: [] }),
  group: () => ({ id: uid(), title: '新分组', blocks: [] }),
  block: () => ({ id: uid(), title: '新模块', items: [] }),
  sidebarItem: () => ({ id: uid(), title: '新体系', items: [] }),
  legendItem: () => ({ id: uid(), title: '图例说明', color: '#2379bd' }),
};

/* 属性面板要显示的字段（container 的字段按虚拟根 id 分，所以 fields 允许是函数） */
function nodeFieldsOf(type, node, ctx) {
  const cfg = NODE_TYPES[type];
  if (!cfg) return [];
  const list = typeof cfg.fields === 'function' ? cfg.fields(node, ctx) : cfg.fields;
  return (list || []).filter(f => {
    if (f.only && !(ctx.layout && f.only.indexOf(ctx.layout) >= 0)) return false;
    if (f.when && !f.when(node, ctx)) return false;
    return true;
  });
}
/* 按 "a.b.c" 写嵌套值（布局专属数据如 ext.table.columns 走这里，不要往根上堆散字段） */
function setPath(obj, path, val) {
  const parts = String(path || '').split('.').filter(Boolean);
  if (!parts.length || !obj) return;
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== 'object' || Array.isArray(cur[p])) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = val;
}

/* 父节点能不能直接装下某种子节点（层的 children 里有 groups，组装的字段就是 groups） */
function canContain(parentType, childType) {
  const pc = NODE_TYPES[parentType], cc = NODE_TYPES[childType];
  if (!pc || !cc || !cc.field) return false;
  return pc.children.indexOf(cc.field) >= 0;
}

/* ================= 数据版本化 ================= */
const SCHEMA_VERSION = 2;
/* v2 幂等规范化:connections/showConnections 字段兜底 */
function normalizeV2(d) {
  const VALID_STYLES = { solid: 1, dashed: 1, dotted: 1 };
  if (!Array.isArray(d.connections)) d.connections = [];
  d.connections.forEach(c => {
    if (!c.id) c.id = uid();
    c.from = String(c.from || '');
    c.to = String(c.to || '');
    if (!VALID_STYLES[c.style]) c.style = 'solid';
    if (typeof c.label !== 'string') c.label = '';
  });
  /* 字段缺失时按「有没有连线」兜底:老文件里存了连线却没有开关字段,默认应该显示出来 */
  if (d.showConnections == null) d.showConnections = d.connections.length > 0;
}
/* 迁移/校验旧数据:返回迁移后的图;若返回 {error} 表示无法加载(版本过高) */
function migrateDiagram(d) {
  if (!d || typeof d !== 'object') return null;
  const v = d.schemaVersion == null ? 1 : d.schemaVersion;
  if (typeof v !== 'number' || v > SCHEMA_VERSION) {
    return { error: '该文件由更新版本创建（schemaVersion ' + v + '），请升级工具后再打开。' };
  }
  // v1 规范化:缺省视为 v1 的旧数据/模板仍走它
  if (v <= 1) {
    d.title = typeof d.title === 'string' ? d.title : '未命名架构图';
    d.subtitle = typeof d.subtitle === 'string' ? d.subtitle : '';
    // layout 迁移统一在 normalizeV2 之后处理
    if (!Array.isArray(d.layers)) d.layers = [];
    (d.layers || []).forEach(l => {
      if (!l || typeof l !== 'object') return;
      if (typeof l.name !== 'string') l.name = '新层';
      if (!l.bandColor) l.bandColor = '#2379bd';
      if (!Array.isArray(l.groups)) l.groups = [];
      (l.groups || []).forEach(g => {
        if (!g || typeof g !== 'object') return;
        if (typeof g.title !== 'string') g.title = '分组';
        if (!Array.isArray(g.blocks)) g.blocks = [];
        (g.blocks || []).forEach(b => {
          if (!b || typeof b !== 'object') return;
          if (typeof b.title !== 'string') b.title = '模块';
          if (!Array.isArray(b.items)) b.items = [];
        });
      });
    });
    if (d.sidebar != null && !Array.isArray(d.sidebar)) d.sidebar = [];
    if (d.legend != null && !Array.isArray(d.legend)) d.legend = [];
  }
  // v2 幂等兜底(任何版本都执行)
  normalizeV2(d);
  // 布局范式以 editor-layout.js 的注册表为准:未知/缺失一律退到默认布局
  if (!isKnownLayout(d.layout)) d.layout = DEFAULT_LAYOUT;
  // 布局专属数据的落脚点(如 ext.table.columns);migrate 保留未知字段,所以这里只需保证是对象
  if (!d.ext || typeof d.ext !== 'object' || Array.isArray(d.ext)) d.ext = {};
  d.schemaVersion = 2;
  return d;
}
function validateDiagram(d) {
  if (!d || typeof d !== 'object' || d.error) return false;
  return Array.isArray(d.layers);
}

/* ================= 统计自动计算 ================= */
function calcLayerStat(layer) {
  const gc = (layer.groups || []).length;
  let bc = 0, ic = 0;
  (layer.groups || []).forEach(g => {
    bc += (g.blocks || []).length;
    (g.blocks || []).forEach(b => { ic += (b.items || []).length; });
  });
  const p = [];
  if (gc) p.push(gc + ' 分组');
  if (bc) p.push(bc + ' 模块');
  if (ic) p.push(ic + ' 条目');
  return p.join(' · ');
}

/* ================= 模板完整校验 ================= */
function validateDiagramFull(d) {
  const errors = [], warnings = [];
  if (!d || typeof d !== 'object') { errors.push('数据无效'); return { valid: false, errors, warnings }; }
  if (!Array.isArray(d.layers) || d.layers.length === 0) errors.push('至少需要 1 个层');
  const ids = new Set();
  const checkId = (node, path) => {
    if (!node || !node.id) return;
    if (ids.has(node.id)) errors.push('重复 ID: ' + node.id + '（' + path + '）');
    else ids.add(node.id);
  };
  (d.layers || []).forEach((l, li) => {
    checkId(l, '层' + (li + 1));
    if (typeof l.name !== 'string') warnings.push('层' + (li + 1) + ' 缺少名称');
    if (l.cols != null && ![1,2,3].includes(l.cols)) warnings.push('层「' + l.name + '」的列数应为 1/2/3');
    if (!l.groups || l.groups.length === 0) warnings.push('层「' + l.name + '」没有分组');
    (l.groups || []).forEach((g, gi) => {
      checkId(g, '层' + (li + 1) + '/分组' + (gi + 1));
      (g.blocks || []).forEach((b, bi) => {
        checkId(b, '层' + (li + 1) + '/分组' + (gi + 1) + '/模块' + (bi + 1));
        if (b.span != null && ![1,2].includes(b.span)) warnings.push('模块「' + b.title + '」的跨列应为 1 或 2');
      });
    });
  });
  (d.sidebar || []).forEach((s, i) => checkId(s, '通栏' + (i + 1)));
  (d.legend || []).forEach((l, i) => checkId(l, '图例' + (i + 1)));
  /* 连线校验(只报告、不修改数据) */
  const connIds = new Set();
  (d.connections || []).forEach((c, i) => {
    if (c.id && connIds.has(c.id)) errors.push('重复连接 ID: ' + c.id);
    else if (c.id) connIds.add(c.id);
    if (!ids.has(c.from)) warnings.push('连接 ' + (c.id || i) + ' 的 from 端点「' + c.from + '」不存在');
    if (!ids.has(c.to)) warnings.push('连接 ' + (c.id || i) + ' 的 to 端点「' + c.to + '」不存在');
    if (c.from && c.from === c.to) warnings.push('连接 ' + (c.id || i) + ' 自环(from===to)');
    if (c.style && !{ solid:1, dashed:1, dotted:1 }[c.style]) warnings.push('连接 ' + (c.id || i) + ' 的线型「' + c.style + '」非法，渲染将按 solid 处理');
  });
  return { valid: errors.length === 0, errors, warnings };
}

/* ================= 撤销/重做 ================= */
const undoStack = [], redoStack = [];
const MAX_UNDO = 50;
let _undoSuppressed = false;
let _undoFocusPushed = false;

function pushUndo() {
  if (!diagram || _undoSuppressed) return;
  undoStack.push(JSON.parse(JSON.stringify(diagram)));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
}

const DEFAULT_THEME_VARS = {
  '--blue': '#2379bd', '--blue2': '#2f80c2', '--dash': '#2c78c2', '--panel': '#c8ddef',
  '--bg': '#ffffff', '--text': '#26384a',
  '--group-bg': '#e8f1f9', '--group-border': '#b9d8f0', '--group-ink': '#183c63',
  '--card-bg': '#dbeaf7', '--card-border': '#8ebbdc', '--card-ink': '#1a5c94',
  '--ink-muted': '#5a7a9a'
};

function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.parse(JSON.stringify(diagram)));
  diagram = undoStack.pop();
  selectedId = null;
  applyThemeVars((diagram.theme && diagram.theme.vars) || DEFAULT_THEME_VARS);
  persist(); render(); renderProps();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.parse(JSON.stringify(diagram)));
  diagram = redoStack.pop();
  selectedId = null;
  applyThemeVars((diagram.theme && diagram.theme.vars) || DEFAULT_THEME_VARS);
  persist(); render(); renderProps();
}

/* 竖条预置颜色方案 */
const BAND_COLORS = [
  { name: '亮蓝', color: '#2f80c2' },
  { name: '主蓝', color: '#2379bd' },
  { name: '中蓝', color: '#1a5c94' },
  { name: '深蓝', color: '#143c66' },
  { name: '藏蓝', color: '#0e2a47' },
  { name: '墨蓝', color: '#081c33' },
];

/* ================= 默认数据 ================= */
function newDiagram() {
  return {
    schemaVersion: 2,
    title: "未命名架构图",
    subtitle: "",
    layout: "layered",
    connections: [],
    showConnections: false,
    layers: [
      { id: uid(), name: "示例层", bandColor: "#2379bd", groups: [
        { id: uid(), title: "示例分组", blocks: [
          { id: uid(), title: "示例模块", items: ["功能条目一", "功能条目二"], span: null }
        ] }
      ] }
    ]
  };
}

/* ================= 节点查找 ================= */
function findNode(id, node = diagram) {
  if (id === SIDEBAR_ROOT.id) return SIDEBAR_ROOT;
  if (id === LEGEND_ROOT.id) return LEGEND_ROOT;
  if (!node) return null;
  if (node.id === id) return node;
  const cfg = NODE_TYPES[nodeType(node)];
  if (cfg) {
    for (const f of cfg.children) {
      const kids = node[f];
      if (!Array.isArray(kids)) continue;
      for (const k of kids) { const r = findNode(id, k); if (r) return r; }
    }
  }
  /* 侧栏 / 图例挂在图根的两个独立数组上,不在任何子节点里 */
  if (nodeType(node) === 'diagram') {
    for (const b of (diagram && diagram.sidebar) || []) { if (b.id === id) return b; }
    for (const b of (diagram && diagram.legend) || []) { if (b.id === id) return b; }
  }
  return null;
}
function nodeType(node) {
  if (!node) return null;
  if (node.id === SIDEBAR_ROOT.id || node.id === LEGEND_ROOT.id) return 'container';
  /* 新数据可以显式写 type（布局自定义的节点类型走这条路）;老数据没写,按结构探测 */
  if (typeof node.type === 'string' && NODE_TYPES[node.type]) return node.type;
  for (const t of NODE_TYPE_LIST) {
    const probe = NODE_TYPES[t].probe;
    if (probe && probe(node)) return t;
  }
  return 'node';
}
function nodeName(node) {
  const cfg = NODE_TYPES[nodeType(node)];
  if (!cfg) return '';
  return node[cfg.nameKey] || cfg.label;
}

/* ================= 渲染引擎 ================= */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* 颜色工具:hex→rgb→hex;mixColor(hex, amt, base) 将 hex 与 base(默认白)按 amt(0~1)混合 */
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  var s = hex.replace(/\s+/g, '');
  if (s.charAt(0) === '#') s = s.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
}
function rgbToHex(r, g, b) {
  var h = function (n) {
    var v = Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
    return (v < 16 ? '0' : '') + v.toString(16);
  };
  return '#' + h(r) + h(g) + h(b);
}
function mixColor(hex, amt, base) {
  var a = hexToRgb(hex);
  if (!a) return typeof hex === 'string' && hex.trim() ? hex.trim() : '#cccccc';
  var b = hexToRgb(base) || { r: 255, g: 255, b: 255 };
  var t = (typeof amt === 'number' && isFinite(amt)) ? Math.max(0, Math.min(1, amt)) : 0.5;
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}
function tintColor(hex, amt) { return mixColor(hex, amt, '#ffffff'); }

/* 角标解析:items 文本中 [kw:target](kw 白名单)渲染为角标 */
const REF_KWS = ['调用','依赖','数据','接口','推送','订阅'];
const REF_RE = new RegExp('\\s*\\[(' + REF_KWS.join('|') + ')\\s*[:：]\\s*([^\\[\\]]+?)\\]\\s*', 'g');
function splitRefs(text) {
  var s = String(text || '');
  var refs = [], plain;
  plain = s.replace(REF_RE, function(_, kw, target) {
    refs.push({ kw: kw, target: target.trim() });
    return '';
  }).trim();
  return { plain: plain, refs: refs };
}
function itemText(it) {
  return typeof it === 'object' ? (it.text || '') : String(it || '');
}
/* 角标徽标 HTML:kw/target 一律转义,防止破坏标记(文本与 title 属性) */
function refTagHtml(ref) {
  var title = esc('[' + ref.kw + ':' + ref.target + ']');
  return '<i class="ref-tag" title="' + title + '">' + esc(ref.kw) + '\u00b7' + esc(ref.target) + '</i>';
}

/* ================= 缩进文本解析（从文本生成图） ================= */
function parseIndented(text) {
  const lines = text.split(/\r?\n/);
  const result = { layers: [] };
  let curLayer = null, curGroup = null;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    // 计算缩进：Tab 算 1 级，每 2 个空格算 1 级
    let depth = 0, i = 0;
    while (i < raw.length) {
      if (raw[i] === '\t') { depth++; i++; }
      else if (raw[i] === ' ') {
        let sp = 0;
        while (i < raw.length && raw[i] === ' ') { sp++; i++; }
        depth += Math.round(sp / 2);
      } else break;
    }
    const t = raw.trim();
    if (!t) continue;
    if (depth === 0) {
      curLayer = { id: uid(), name: t, bandColor: '#2379bd', cols: 3, groups: [] };
      result.layers.push(curLayer);
      curGroup = null;
    } else if (depth === 1) {
      if (!curLayer) { curLayer = { id: uid(), name: '未命名层', bandColor: '#2379bd', cols: 3, groups: [] }; result.layers.push(curLayer); }
      curGroup = { id: uid(), title: t, blocks: [] };
      curLayer.groups.push(curGroup);
    } else if (depth === 2) {
      if (!curGroup) {
        if (!curLayer) { curLayer = { id: uid(), name: '未命名层', bandColor: '#2379bd', cols: 3, groups: [] }; result.layers.push(curLayer); }
        curGroup = { id: uid(), title: '未命名分组', blocks: [] }; curLayer.groups.push(curGroup);
      }
      curGroup.blocks.push({ id: uid(), title: t, items: [], span: null });
    } else {
      if (!curGroup || curGroup.blocks.length === 0) continue;
      const block = curGroup.blocks[curGroup.blocks.length - 1];
      block.items.push(...t.split(/[,，、;/]+/).map(s => s.trim()).filter(Boolean));
    }
  }
  result.schemaVersion = 2;
  result.title = (result.layers[0] && result.layers[0].name) || '未命名架构图';
  result.subtitle = '';
  result.layout = DEFAULT_LAYOUT;
  result.ext = {};
  result.connections = [];
  result.showConnections = false;
  return result;
}
