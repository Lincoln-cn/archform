
"use strict";
/* ================= 状态 ================= */
let diagram = null;      // 当前图数据
let selectedId = null;   // 选中节点 id
const uid = () => Math.random().toString(36).slice(2, 9);
const LS_KEY = 'arch-editor-data';
/* 虚拟容器节点（结构树中代表右侧通栏 / 底部图例） */
const SIDEBAR_ROOT = { id: '__sidebar', title: '右侧通栏（体系说明）' };
const LEGEND_ROOT = { id: '__legend', title: '底部图例' };

/* ================= 数据版本化 ================= */
const SCHEMA_VERSION = 1;
/* 迁移/校验旧数据:返回迁移后的图;若返回 {error} 表示无法加载(版本过高) */
function migrateDiagram(d) {
  if (!d || typeof d !== 'object') return null;
  const v = d.schemaVersion == null ? 1 : d.schemaVersion;
  if (typeof v !== 'number' || v > SCHEMA_VERSION) {
    return { error: '该文件由更新版本创建（schemaVersion ' + v + '），请升级工具后再打开。' };
  }
  if (v === 1) {
    d.schemaVersion = 1;
    d.title = typeof d.title === 'string' ? d.title : '未命名架构图';
    d.subtitle = typeof d.subtitle === 'string' ? d.subtitle : '';
    if (d.layout !== 'cards' && d.layout !== 'central') d.layout = 'layered';
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

const DEFAULT_THEME_VARS = { '--blue':'#2379bd', '--blue2':'#2f80c2', '--dash':'#2c78c2', '--panel':'#c8ddef', '--bg':'#ffffff', '--text':'#26384a' };

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
  { name: '青蓝', color: '#0e7a8a' },
];

/* ================= 默认数据 ================= */
function newDiagram() {
  return {
    schemaVersion: 1,
    title: "未命名架构图",
    subtitle: "",
    layout: "layered",
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
  if (node.layers) {
    for (const l of node.layers) { const r = findNode(id, l); if (r) return r; }
  }
  if (node.groups) {
    for (const g of node.groups) { const r = findNode(id, g); if (r) return r; }
  }
  if (node.blocks) {
    for (const b of node.blocks) { const r = findNode(id, b); if (r) return r; }
  }
  if (node.rows) {
    for (const b of node.rows) { const r = findNode(id, b); if (r) return r; }
  }
  if (diagram && diagram.sidebar) {
    for (const b of diagram.sidebar) { if (b.id === id) return b; }
  }
  if (diagram && diagram.legend) {
    for (const b of diagram.legend) { if (b.id === id) return b; }
  }
  return null;
}
function nodeType(node) {
  if (!node) return null;
  if (node.id === SIDEBAR_ROOT.id || node.id === LEGEND_ROOT.id) return 'container';
  if (node.layers) return 'diagram';
  if (node.groups) return 'layer';
  if (node.blocks) return 'group';
  if (node.rows) return 'container';
  if (node.items !== undefined || node.sub !== undefined || node.code !== undefined) return 'block';
  if (node.list !== undefined) return 'section';
  if (node.color !== undefined) return 'legend';
  return 'node';
}
function nodeName(node) {
  const t = nodeType(node);
  if (t === 'diagram') return node.title || '图';
  if (t === 'layer') return node.name || '层';
  if (t === 'group') return node.title || '分组';
  if (t === 'container') return node.title || '区域';
  if (t === 'block') return node.title || '模块';
  if (t === 'section') return node.title || '分区';
  if (t === 'legend') return node.title || '图例项';
  return '';
}

/* ================= 渲染引擎 ================= */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

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
  result.schemaVersion = 1;
  result.title = (result.layers[0] && result.layers[0].name) || '未命名架构图';
  result.subtitle = '';
  result.layout = 'layered';
  return result;
}
