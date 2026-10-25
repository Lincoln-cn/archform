/* ================= 内容树（渲染 / 节点操作 / 快速录入） ================= */
/* 节点类型的中文名、取子规则、能否新增/复制都来自 editor-core.js 的 NODE_TYPES 注册表 */
const collapsed = new Set();   // 已折叠的节点 id
// SIDEBAR_ROOT / LEGEND_ROOT 定义在 editor-core.js（findNode 依赖）

/* 节点类型图标（内联 SVG，零依赖） */
const TREE_ICON_SVG = {
  diagram:   '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="12" height="12" rx="2"/><rect x="5.5" y="5.5" width="5" height="5" rx="1"/></svg>',
  layer:     '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 4h12M2 8h12M2 12h8"/></svg>',
  group:     '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1"/><rect x="8" y="8" width="5.5" height="5.5" rx="1"/></svg>',
  block:     '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="10" height="10" rx="2"/></svg>',
  container: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="12" height="12" rx="2"/><rect x="6" y="6" width="4" height="4" rx=".5"/></svg>',
  section:   '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 4h10M3 8h10M3 12h10"/></svg>',
  legend:    '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><circle cx="8" cy="8" r="3.5"/></svg>'
};

/* 操作按钮图标（内联 SVG） */
const ACT_SVG = {
  plus:  '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 2.5v7M2.5 6h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>',
  up:    '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 9.5v-7M3 5.5 6 2.5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  down:  '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 2.5v7M3 6.5 6 9.5l3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  close: '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>'
};

function renderTree() {
  const tree = document.getElementById('tree');
  if (!diagram) { tree.innerHTML = ''; return; }
  tree.innerHTML = treeNode(diagram);
  // 快速录入栏作为面板独立底栏(置于树之后;每次渲染先移除旧实例,避免重复)
  const panel = tree.parentElement;
  const oldQa = panel.querySelector('.quick-add');
  if (oldQa) oldQa.remove();
  const qa = document.createElement('div');
  qa.innerHTML = renderQuickAdd();
  panel.appendChild(qa.firstElementChild);
  // 绑定快速录入事件
  const input = document.getElementById('qaInput');
  if (input) {
    input.addEventListener('keydown', qaKeydown);
  }
}

function treeChildren(node) {
  if (node.id === SIDEBAR_ROOT.id) return diagram.sidebar || [];
  if (node.id === LEGEND_ROOT.id) return diagram.legend || [];
  const t = nodeType(node);
  if (t === 'diagram') {
    const kids = node.layers || [];
    return [...kids, SIDEBAR_ROOT, LEGEND_ROOT];
  }
  return childList(node);
}

function treeNode(node) {
  const t = nodeType(node);
  const sel = node.id === selectedId ? ' sel' : '';
  const kids = treeChildren(node);
  const isCollapsed = collapsed.has(node.id);
  const hasKids = kids && kids.length;
  // 展开/折叠箭头：CSS 伪元素绘制，open = 展开态（向下），默认 = 折叠态（向右）
  const caret = hasKids
    ? '<span class="caret' + (isCollapsed ? '' : ' open') + '" title="展开/折叠"></span>'
    : '<span class="caret leaf"></span>';
  let childrenHtml = '';
  if (hasKids && !isCollapsed) {
    childrenHtml = '<ul>' + kids.map(k => treeNode(k)).join('') + '</ul>';
  }
  const actAdd = canAddChild(node)
    ? '<button class="abtn" title="新增子项" data-act="add">' + ACT_SVG.plus + '</button>' : '';
  const actUp = '<button class="abtn" title="上移" data-act="up">' + ACT_SVG.up + '</button>';
  const actDown = '<button class="abtn" title="下移" data-act="down">' + ACT_SVG.down + '</button>';
  const actDel = '<button class="abtn danger" title="删除" data-act="del">' + ACT_SVG.close + '</button>';
  return '<li>' +
    '<div class="tnode' + sel + '" data-id="' + node.id + '">' +
    caret + '<span class="ico t-' + t + '">' + (TREE_ICON_SVG[t] || '') + '</span>' +
    '<span class="txt">' + esc(nodeName(node)) + '</span>' +
    '<span class="act">' + actAdd + actUp + actDown + actDel + '</span>' +
    '</div>' + childrenHtml + '</li>';
}

function childList(node) {
  if (!node) return null;
  if (node.id === SIDEBAR_ROOT.id) return diagram.sidebar || (diagram.sidebar = []);
  if (node.id === LEGEND_ROOT.id) return diagram.legend || (diagram.legend = []);
  const cfg = NODE_TYPES[nodeType(node)];
  if (!cfg || !cfg.children.length) return null;
  const f = cfg.children[0];
  return node[f] || (node[f] = []);
}

/* 这个节点能不能直接新增子项（树上的「+」与右键菜单都问它） */
function canAddChild(node) {
  if (!node) return false;
  if (node.id === SIDEBAR_ROOT.id || node.id === LEGEND_ROOT.id) return true;
  const cfg = NODE_TYPES[nodeType(node)];
  return !!(cfg && cfg.addType);
}

/* ================= 编辑操作 ================= */
function selectById(id) {
  selectedId = id;
  renderTree();
  renderProps();
  highlightSel();
  qaSyncFromSelection();
}
function highlightSel() {
  document.querySelectorAll('#captureArea [data-id]').forEach(el => {
    const isSel = el.getAttribute('data-id') === selectedId;
    // 选中：琥珀金描边 + 白色内衬环 + 淡金色外发光（与蓝色系互补、不遮内容）
    el.style.outline = isSel ? '2px solid #f5a623' : '';
    el.style.outlineOffset = isSel ? '1px' : '';
    el.style.boxShadow = isSel ? '0 0 0 2px rgba(255,255,255,.9), 0 0 12px rgba(245,166,35,.45)' : '';
  });
}

function addChild(parentType) {
  if (!diagram) diagram = newDiagram();
  pushUndo();
  const target = selectedId ? findNode(selectedId) : (parentType === 'diagram' ? diagram : null);
  if (!target) return;
  if (target.id === SIDEBAR_ROOT.id) {
    (diagram.sidebar = diagram.sidebar || []).push(NODE_DEFAULTS.sidebarItem());
  } else if (target.id === LEGEND_ROOT.id) {
    (diagram.legend = diagram.legend || []).push(NODE_DEFAULTS.legendItem());
  } else {
    /* 新增什么节点由注册表的 addType 决定：图→层、层→分组、分组→模块 */
    const cfg = NODE_TYPES[nodeType(target)];
    if (!cfg || !cfg.addType) return;
    const field = NODE_TYPES[cfg.addType].field;
    (target[field] = target[field] || []).push(NODE_DEFAULTS[cfg.addType]());
  }
  persist(); render();
}
function removeSelected() {
  if (!selectedId) return;
  const parent = findParent(selectedId);
  if (!parent) return;
  const list = childList(parent);
  const idx = list.findIndex(n => n.id === selectedId);
  if (idx >= 0) {
    if (!confirm('删除「' + nodeName(findNode(selectedId)) + '」？')) return;
    pushUndo();
    const node = findNode(selectedId);
    list.splice(idx, 1);
    // 删层时联动清理相关连线
    if (node && nodeType(node) === 'layer') {
      diagram.connections = (diagram.connections || []).filter(c => c.from !== selectedId && c.to !== selectedId);
    }
    selectedId = null;
    persist(); render(); renderProps();
  }
}
function moveSelected(dir) {
  if (!selectedId) return;
  const parent = findParent(selectedId);
  if (!parent) return;
  const list = childList(parent);
  const idx = list.findIndex(n => n.id === selectedId);
  const ni = idx + dir;
  if (idx < 0 || ni < 0 || ni >= list.length) return;
  pushUndo();
  const tmp = list[idx]; list[idx] = list[ni]; list[ni] = tmp;
  persist(); render();
}
function findParent(id, node = diagram) {
  if (diagram && diagram.sidebar && diagram.sidebar.some(s => s.id === id)) return SIDEBAR_ROOT;
  if (diagram && diagram.legend && diagram.legend.some(s => s.id === id)) return LEGEND_ROOT;
  if (!node) return null;
  const cfg = NODE_TYPES[nodeType(node)];
  if (!cfg) return null;
  for (const f of cfg.children) {
    const kids = node[f];
    if (Array.isArray(kids) && kids.some(k => k.id === id)) return node;
  }
  for (const f of cfg.children) {
    const kids = node[f];
    if (!Array.isArray(kids)) continue;
    for (const k of kids) { const r = findParent(id, k); if (r) return r; }
  }
  return null;
}

/* ================= 树内快速录入（单条） ================= */
const _qa = { level: 'layer', parentId: null, lastId: null };
/* 录入层级链来自注册表:只有 chain:true 的节点类型参与（层→分组→模块），末尾再补「条目」 */
const QA_LEVELS = NODE_TYPE_LIST
  .filter(t => NODE_TYPES[t].chain)
  .sort((a, b) => NODE_TYPES[a].depth - NODE_TYPES[b].depth)
  .concat('item');
const QA_LABEL = { item: '条目' };
const qaLabel = lv => QA_LABEL[lv] || (NODE_TYPES[lv] ? NODE_TYPES[lv].label : lv);

function renderQuickAdd() {
  const ico = { layer: '&#9638;', group: '&#9636;', block: '&#9632;', item: '&#8226;' };
  const ph = { layer: '输入层名称，回车确认', group: '输入分组名称', block: '输入模块名称', item: '输入条目（逗号分隔多个）' };
  return '<div class="quick-add">' +
    '<div class="qa-row">' +
      '<span class="qa-ico" id="qaIco">' + (ico[_qa.level] || '&#8226;') + '</span>' +
      '<input id="qaInput" class="qa-input" type="text" placeholder="' + ph[_qa.level] + '" autocomplete="off">' +
    '</div>' +
    '<div class="qa-now" id="qaNow">' + qaCurrentText() + '</div>' +
    '<div class="qa-keys">' +
      '<div class="qa-k-t">快捷键</div>' +
      '<div class="qa-grid">' +
        '<div class="qa-krow"><kbd>Enter</kbd><span>确认新增</span></div>' +
        '<div class="qa-krow"><kbd>Tab</kbd><span>下钻一级</span></div>' +
        '<div class="qa-krow"><kbd>Shift+Tab</kbd><span>上升一级</span></div>' +
        '<div class="qa-krow"><kbd>Esc</kbd><span>退出</span></div>' +
      '</div>' +
    '</div>' +
    '</div>';
}

function qaCurrentText() {
  if (_qa.level === QA_LEVELS[0]) return '当前选择：<b>顶层</b>（新增' + qaLabel(_qa.level) + '）';
  const parent = _qa.parentId ? findNode(_qa.parentId) : null;
  if (!parent) return '当前选择：<b>顶层</b>（新增' + qaLabel(QA_LEVELS[0]) + '）';
  const names = [];
  let cur = parent;
  while (cur) {
    const t = nodeType(cur);
    if (NODE_TYPES[t] && NODE_TYPES[t].chain) names.unshift(nodeName(cur));
    const p = findParent(cur.id);
    cur = (p && p.id !== SIDEBAR_ROOT.id && p.id !== LEGEND_ROOT.id) ? p : null;
  }
  return '当前选择：<b>' + esc(names.join(' / ')) + '</b>（新增' + qaLabel(_qa.level) + '）';
}

function qaUpdateHint() {
  const ico = { layer: '&#9638;', group: '&#9636;', block: '&#9632;', item: '&#8226;' };
  const ph = { layer: '输入层名称，回车确认', group: '输入分组名称', block: '输入模块名称', item: '输入条目（逗号分隔多个）' };
  const icoEl = document.getElementById('qaIco');
  if (icoEl) icoEl.innerHTML = ico[_qa.level] || '&#8226;';
  const nowEl = document.getElementById('qaNow');
  if (nowEl) nowEl.innerHTML = qaCurrentText();
  const input = document.getElementById('qaInput');
  if (input) input.placeholder = ph[_qa.level];
}

function qaLevelFromNode(node) {
  const t = nodeType(node);
  const cfg = NODE_TYPES[t];
  if (!cfg || !cfg.chain) return QA_LEVELS[0];
  const i = QA_LEVELS.indexOf(t);
  return (i >= 0 && i < QA_LEVELS.length - 1) ? QA_LEVELS[i + 1] : QA_LEVELS[QA_LEVELS.length - 1];
}

function qaSyncFromSelection() {
  if (!selectedId || !diagram) { _qa.level = QA_LEVELS[0]; _qa.parentId = null; _qa.lastId = null; return; }
  const node = findNode(selectedId);
  if (!node) return;
  const cfg = NODE_TYPES[nodeType(node)];
  if (cfg && cfg.chain) { _qa.level = qaLevelFromNode(node); _qa.parentId = node.id; }
  else { _qa.level = QA_LEVELS[0]; _qa.parentId = null; }
  _qa.lastId = null;
  qaUpdateHint();
}

function qaCommit() {
  const input = document.getElementById('qaInput');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  if (!diagram) diagram = newDiagram();
  pushUndo();

  const lv = _qa.level;
  if (lv === 'item') {
    /* 最末一级:往模块里塞条目（逗号分隔可一次多条） */
    const holderType = QA_LEVELS[QA_LEVELS.length - 2];
    const parent = _qa.parentId ? findNode(_qa.parentId) : null;
    const block = parent && nodeType(parent) === holderType ? parent : null;
    if (!block) { alert('请先创建一个' + NODE_TYPES[holderType].label); return; }
    const items = val.split(/[,，、;/]+/).map(s => s.trim()).filter(Boolean);
    block.items = block.items || [];
    block.items.push(...items);
  } else {
    /* 层/分组/模块:父节点类型就是链上的上一级 */
    const parentType = QA_LEVELS[QA_LEVELS.indexOf(lv) - 1];
    let parent = null;
    if (!parentType) {
      parent = diagram;                                  // 顶层:直接挂到图上
    } else {
      const cand = _qa.parentId ? findNode(_qa.parentId) : null;
      if (cand && nodeType(cand) === parentType) parent = cand;
      /* 最上一级容器只有一个来源,没选中就落到最后一个(与旧行为一致:分组落到最后一层) */
      if (!parent && parentType === QA_LEVELS[0]) {
        const list = diagram[NODE_TYPES[parentType].field] || [];
        parent = list[list.length - 1] || null;
      }
    }
    if (!parent) { alert('请先创建一个' + NODE_TYPES[parentType].label); return; }
    const obj = NODE_DEFAULTS[lv]();
    obj[NODE_TYPES[lv].nameKey] = val;
    const field = NODE_TYPES[lv].field;
    (parent[field] = parent[field] || []).push(obj);
    _qa.lastId = obj.id;
    _qa.parentId = obj.id;
    const next = QA_LEVELS[QA_LEVELS.indexOf(lv) + 1];
    if (next) _qa.level = next;
  }

  input.value = '';
  selectedId = _qa.lastId;
  // 展开父节点
  if (_qa.parentId) collapsed.delete(_qa.parentId);
  persist(); render(); renderProps();
  qaUpdateHint();
  // 滚动到新节点
  setTimeout(() => {
    const sel = document.querySelector('.tree .tnode.sel');
    if (sel) sel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, 50);
}

function qaKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    qaCommit();
  } else if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    const cur = QA_LEVELS.indexOf(_qa.level);
    if (cur < QA_LEVELS.length - 1) {
      if (_qa.lastId) {
        _qa.parentId = _qa.lastId;
        _qa.level = QA_LEVELS[cur + 1];
      } else if (_qa.parentId) {
        const parent = findNode(_qa.parentId);
        if (parent) {
          _qa.level = qaLevelFromNode(parent);
        }
      }
      qaUpdateHint();
    }
  } else if (e.key === 'Tab' && e.shiftKey) {
    e.preventDefault();
    const cur = QA_LEVELS.indexOf(_qa.level);
    if (cur > 0) {
      _qa.level = QA_LEVELS[cur - 1];
      if (_qa.parentId) {
        const parent = findNode(_qa.parentId);
        if (parent) {
          const grandparent = findParent(parent.id);
          _qa.parentId = grandparent ? grandparent.id : null;
        }
      }
      _qa.lastId = null;
      qaUpdateHint();
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    const input = document.getElementById('qaInput');
    if (input) input.value = '';
    _qa.level = QA_LEVELS[0]; _qa.parentId = null; _qa.lastId = null;
    qaUpdateHint();
  }
}

/* ================= 复制 / 粘贴 ================= */
let _clipboard = null;   // { type: 'layer'|'group'|'block', node: 深拷贝(新ID) }

function cloneWithNewIds(node) {
  const clone = JSON.parse(JSON.stringify(node));
  /* 子节点数组名来自注册表：加一种节点类型不用在这里补分支 */
  const renew = n => {
    if (!n || typeof n !== 'object') return;
    if (n.id) n.id = uid();
    const cfg = NODE_TYPES[nodeType(n)];
    if (!cfg) return;
    cfg.children.forEach(f => { if (Array.isArray(n[f])) n[f].forEach(renew); });
  };
  renew(clone);
  return clone;
}

function copySelected() {
  if (!selectedId) return;
  const node = findNode(selectedId);
  if (!node) return;
  const t = nodeType(node);
  if (!NODE_TYPES[t] || !NODE_TYPES[t].copyable) return;
  _clipboard = { type: t, node: cloneWithNewIds(node) };
}

function pasteToTarget(targetId) {
  if (!_clipboard) return;
  const target = targetId ? findNode(targetId) : diagram;
  if (!target) return;
  const tt = targetId ? nodeType(target) : 'diagram';
  const ct = _clipboard.type;
  const field = NODE_TYPES[ct] && NODE_TYPES[ct].field;
  if (!field) return;
  const clone = cloneWithNewIds(_clipboard.node);   // 每次粘贴再克隆，避免共享引用
  let inserted = null;

  if (canContain(tt, ct)) {
    /* 目标能直接装下它：追加到目标里 */
    (target[field] = target[field] || []).push(clone);
    inserted = clone;
  } else {
    /* 否则插到目标后面（同级）；父节点必须能装下 */
    const parent = findParent(target.id);
    if (parent && canContain(nodeType(parent), ct)) {
      const list = parent[field] || (parent[field] = []);
      const idx = list.findIndex(n => n.id === target.id);
      list.splice(idx + 1, 0, clone);
      inserted = clone;
    }
  }
  /* 特例：把模块粘到层上 —— 塞进它第一个分组（没有就建一个），否则这一粘就没着落 */
  if (!inserted && ct === 'block' && tt === 'layer') {
    if (!Array.isArray(target.groups)) target.groups = [];
    if (target.groups.length) target.groups[0].blocks.push(clone);
    else target.groups.push({ id: uid(), title: '新分组', blocks: [clone] });
    inserted = clone;
  }

  if (inserted) {
    selectedId = inserted.id;
    if (targetId) collapsed.delete(targetId);
    persist(); render(); renderProps();
  }
}

function pasteSelected() {
  pasteToTarget(selectedId);
}

/* ================= 右键菜单 ================= */
function showTreeMenu(e, id) {
  e.preventDefault();
  e.stopPropagation();
  selectedId = id;
  renderTree(); renderProps(); highlightSel(); qaSyncFromSelection();

  // 移除旧菜单
  const old = document.getElementById('treeCtxMenu');
  if (old) old.remove();

  const node = findNode(id);
  const t = nodeType(node);
  const cfg = NODE_TYPES[t] || { children: [], copyable: false };
  const hasClip = !!_clipboard;
  const menu = document.createElement('div');
  menu.id = 'treeCtxMenu';
  menu.className = 'tree-ctx-menu';
  let items = '';
  if (canAddChild(node)) {
    items += '<button type="button" data-ctx="add">新建子项</button>';
  }
  if (cfg.copyable) {
    items += '<button type="button" data-ctx="copy">复制</button>';
  }
  items += '<button type="button" data-ctx="paste"' + (hasClip ? '' : ' disabled') + '>粘贴</button>';
  /* 虚拟根与"通栏容器"没有兄弟，不能上下移；其余都能删 */
  if (t !== 'diagram' && t !== 'container') {
    items += '<hr>' +
      '<button type="button" data-ctx="up">上移</button>' +
      '<button type="button" data-ctx="down">下移</button>' +
      '<hr>' +
      '<button type="button" data-ctx="del" class="danger">删除</button>';
  }
  menu.innerHTML = items;
  menu.style.left = Math.min(e.clientX, window.innerWidth - 160) + 'px';
  menu.style.top = Math.min(e.clientY, window.innerHeight - 220) + 'px';
  document.body.appendChild(menu);

  menu.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-ctx]');
    if (!btn || btn.disabled) return;
    const act = btn.getAttribute('data-ctx');
    menu.remove();
    if (act === 'add') addChild(t);
    else if (act === 'copy') copySelected();
    else if (act === 'paste') pasteSelected();
    else if (act === 'up') moveSelected(-1);
    else if (act === 'down') moveSelected(1);
    else if (act === 'del') removeSelected();
  });

  // 点击其他区域关闭
  const closeMenu = ev => {
    if (!ev.target.closest('#treeCtxMenu')) {
      menu.remove();
      document.removeEventListener('mousedown', closeMenu, true);
      document.removeEventListener('keydown', escClose);
    }
  };
  const escClose = ev => { if (ev.key === 'Escape') { menu.remove(); document.removeEventListener('mousedown', closeMenu, true); document.removeEventListener('keydown', escClose); } };
  document.addEventListener('mousedown', closeMenu, true);
  document.addEventListener('keydown', escClose);
}

/* ---- 绑定：树右键 + Ctrl+C/V 快捷键 ---- */
function initTreeExtras() {
  const tree = document.getElementById('tree');
  if (tree) {
    tree.addEventListener('contextmenu', e => {
      const tnode = e.target.closest('.tnode');
      if (tnode) {
        const id = tnode.getAttribute('data-id');
        showTreeMenu(e, id);
      }
    });
  }
  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;   // 输入框内不拦截
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copySelected(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteSelected(); }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTreeExtras);
else initTreeExtras();
