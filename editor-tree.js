/* ================= 内容树（渲染 / 节点操作 / 快速录入） ================= */
const TREE_ICON = { diagram: '▣', layer: '▤', group: '▥', block: '▦', container: '▧', section: '▨', legend: '◉' };
const TREE_LABEL = { diagram: '图', layer: '层', group: '分组', block: '模块', container: '区域', section: '分区', legend: '图例' };
const collapsed = new Set();   // 已折叠的节点 id
// SIDEBAR_ROOT / LEGEND_ROOT 定义在 editor-core.js（findNode 依赖）

function renderTree() {
  const tree = document.getElementById('tree');
  if (!diagram) { tree.innerHTML = ''; return; }
  tree.innerHTML = treeNode(diagram);
  // 追加快速录入栏
  const qa = document.createElement('div');
  qa.innerHTML = renderQuickAdd();
  tree.appendChild(qa.firstElementChild);
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
  const caret = hasKids ? '<span class="caret" title="展开/折叠">' + (isCollapsed ? '▶' : '▼') + '</span>' : '<span class="caret"></span>';
  let childrenHtml = '';
  if (hasKids && !isCollapsed) {
    childrenHtml = '<ul>' + kids.map(k => treeNode(k)).join('') + '</ul>';
  }
  const actAdd = t === 'diagram' || t === 'layer' || t === 'group' || t === 'container' ? '<button title="新增子项" data-act="add">+</button>' : '';
  const actUp = '<button title="上移" data-act="up">↑</button>';
  const actDown = '<button title="下移" data-act="down">↓</button>';
  const actDel = '<button title="删除" data-act="del">×</button>';
  return '<li>' +
    '<div class="tnode' + sel + '" data-id="' + node.id + '">' +
    caret + '<span class="ico">' + (TREE_ICON[t] || '•') + '</span>' +
    '<span class="txt">' + esc(nodeName(node)) + '</span>' +
    '<span class="act">' + actAdd + actUp + actDown + actDel + '</span>' +
    '</div>' + childrenHtml + '</li>';
}

function childList(node) {
  const t = nodeType(node);
  if (t === 'diagram') return node.layers || [];
  if (t === 'layer') return node.groups || [];
  if (t === 'group') return node.blocks || [];
  if (node.id === SIDEBAR_ROOT.id) return diagram.sidebar || [];
  if (node.id === LEGEND_ROOT.id) return diagram.legend || [];
  return null;
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
  if (parentType === 'diagram') {
    diagram.layers.push({ id: uid(), name: '新层', bandColor: '#2379bd', cols: 3, groups: [] });
  } else {
    const node = selectedId ? findNode(selectedId) : null;
    if (!node) return;
    const t = nodeType(node);
    if (t === 'diagram') {
      node.layers.push({ id: uid(), name: '新层', bandColor: '#2379bd', cols: 3, groups: [] });
    } else if (t === 'layer') {
      node.groups.push({ id: uid(), title: '新分组', blocks: [] });
    } else if (t === 'group') {
      node.blocks.push({ id: uid(), title: '新模块', items: [] });
    } else if (t === 'container' && node.id === SIDEBAR_ROOT.id) {
      (diagram.sidebar = diagram.sidebar || []).push({ id: uid(), title: '新体系', items: [] });
    } else if (t === 'container' && node.id === LEGEND_ROOT.id) {
      (diagram.legend = diagram.legend || []).push({ id: uid(), title: '图例说明', color: '#2379bd' });
    }
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
    list.splice(idx, 1);
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
  const kids = childList(node);
  if (kids && kids.some(k => k.id === id)) return node;
  if (node.layers) for (const l of node.layers) { const r = findParent(id, l); if (r) return r; }
  if (node.groups) for (const g of node.groups) { const r = findParent(id, g); if (r) return r; }
  if (node.blocks) for (const b of node.blocks) { const r = findParent(id, b); if (r) return r; }
  if (node.rows) for (const b of node.rows) { const r = findParent(id, b); if (r) return r; }
  return null;
}

/* ================= 树内快速录入（单条） ================= */
const _qa = { level: 'layer', parentId: null, lastId: null };

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
      '<table>' +
        '<tr><td><kbd>Enter</kbd></td><td>确认新增</td></tr>' +
        '<tr><td><kbd>Tab</kbd></td><td>下钻一级</td></tr>' +
        '<tr><td><kbd>Shift+Tab</kbd></td><td>上升一级</td></tr>' +
        '<tr><td><kbd>Esc</kbd></td><td>退出</td></tr>' +
      '</table>' +
    '</div>' +
    '</div>';
}

function qaCurrentText() {
  const label = { layer: '层', group: '分组', block: '模块', item: '条目' };
  if (_qa.level === 'layer') return '当前选择：<b>顶层</b>（新增层）';
  const parent = _qa.parentId ? findNode(_qa.parentId) : null;
  if (!parent) return '当前选择：<b>顶层</b>（新增层）';
  const names = [];
  let cur = parent;
  while (cur) {
    const t = nodeType(cur);
    if (t === 'layer' || t === 'group' || t === 'block') names.unshift(nodeName(cur));
    const p = findParent(cur.id);
    cur = (p && p.id !== SIDEBAR_ROOT.id && p.id !== LEGEND_ROOT.id) ? p : null;
  }
  return '当前选择：<b>' + esc(names.join(' / ')) + '</b>（新增' + label[_qa.level] + '）';
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

function qaLevelDepth() {
  return { layer: 0, group: 1, block: 2, item: 3 }[_qa.level] || 0;
}

function qaLevelFromNode(node) {
  const t = nodeType(node);
  if (t === 'layer') return 'group';
  if (t === 'group') return 'block';
  if (t === 'block') return 'item';
  return 'layer';
}

function qaSyncFromSelection() {
  if (!selectedId || !diagram) { _qa.level = 'layer'; _qa.parentId = null; _qa.lastId = null; return; }
  const node = findNode(selectedId);
  if (!node) return;
  const t = nodeType(node);
  if (t === 'layer') { _qa.level = 'group'; _qa.parentId = node.id; }
  else if (t === 'group') { _qa.level = 'block'; _qa.parentId = node.id; }
  else if (t === 'block') { _qa.level = 'item'; _qa.parentId = node.id; }
  else { _qa.level = 'layer'; _qa.parentId = null; }
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

  if (_qa.level === 'layer') {
    const layer = { id: uid(), name: val, bandColor: '#2379bd', cols: 3, groups: [] };
    diagram.layers.push(layer);
    _qa.lastId = layer.id;
    _qa.parentId = layer.id;
    _qa.level = 'group';
  } else if (_qa.level === 'group') {
    const parent = _qa.parentId ? findNode(_qa.parentId) : null;
    const layer = parent && nodeType(parent) === 'layer' ? parent : (diagram.layers[diagram.layers.length - 1]);
    if (!layer) { alert('请先创建一个层'); return; }
    const group = { id: uid(), title: val, blocks: [] };
    layer.groups.push(group);
    _qa.lastId = group.id;
    _qa.parentId = group.id;
    _qa.level = 'block';
  } else if (_qa.level === 'block') {
    const parent = _qa.parentId ? findNode(_qa.parentId) : null;
    const group = parent && nodeType(parent) === 'group' ? parent : null;
    if (!group) { alert('请先创建一个分组'); return; }
    const block = { id: uid(), title: val, items: [], span: null };
    group.blocks.push(block);
    _qa.lastId = block.id;
    _qa.parentId = block.id;
    _qa.level = 'item';
  } else if (_qa.level === 'item') {
    const parent = _qa.parentId ? findNode(_qa.parentId) : null;
    const block = parent && nodeType(parent) === 'block' ? parent : null;
    if (!block) { alert('请先创建一个模块'); return; }
    const items = val.split(/[,，、;/]+/).map(s => s.trim()).filter(Boolean);
    block.items.push(...items);
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
    const depths = ['layer', 'group', 'block', 'item'];
    const cur = depths.indexOf(_qa.level);
    if (cur < depths.length - 1) {
      if (_qa.lastId) {
        _qa.parentId = _qa.lastId;
        _qa.level = depths[cur + 1];
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
    const depths = ['layer', 'group', 'block', 'item'];
    const cur = depths.indexOf(_qa.level);
    if (cur > 0) {
      _qa.level = depths[cur - 1];
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
    _qa.level = 'layer'; _qa.parentId = null; _qa.lastId = null;
    qaUpdateHint();
  }
}

/* ================= 复制 / 粘贴 ================= */
let _clipboard = null;   // { type: 'layer'|'group'|'block', node: 深拷贝(新ID) }

function cloneWithNewIds(node) {
  const clone = JSON.parse(JSON.stringify(node));
  const renew = n => {
    if (n && n.id) n.id = uid();
    if (n.layers) n.layers.forEach(renew);
    if (n.groups) n.groups.forEach(renew);
    if (n.blocks) n.blocks.forEach(renew);
    if (n.rows) n.rows.forEach(renew);
  };
  renew(clone);
  return clone;
}

function copySelected() {
  if (!selectedId) return;
  const node = findNode(selectedId);
  if (!node) return;
  const t = nodeType(node);
  if (t !== 'layer' && t !== 'group' && t !== 'block') return;
  _clipboard = { type: t, node: cloneWithNewIds(node) };
}

function pasteToTarget(targetId) {
  if (!_clipboard) return;
  const target = targetId ? findNode(targetId) : diagram;
  if (!target) return;
  const tt = targetId ? nodeType(target) : 'diagram';
  const ct = _clipboard.type;
  const clone = cloneWithNewIds(_clipboard.node);   // 每次粘贴再克隆，避免共享引用
  let inserted = null;

  if (ct === 'layer') {
    if (tt === 'layer') {
      const idx = diagram.layers.findIndex(l => l.id === target.id);
      diagram.layers.splice(idx + 1, 0, clone);
      inserted = clone;
    } else if (tt === 'diagram') {
      diagram.layers.push(clone);
      inserted = clone;
    }
  } else if (ct === 'group') {
    if (tt === 'layer') {
      target.groups.push(clone);
      inserted = clone;
    } else if (tt === 'group') {
      const parent = findParent(target.id);
      if (parent && parent.groups) {
        const idx = parent.groups.findIndex(g => g.id === target.id);
        parent.groups.splice(idx + 1, 0, clone);
        inserted = clone;
      }
    }
  } else if (ct === 'block') {
    if (tt === 'group') {
      target.blocks.push(clone);
      inserted = clone;
    } else if (tt === 'block') {
      const parent = findParent(target.id);
      if (parent && parent.blocks) {
        const idx = parent.blocks.findIndex(b => b.id === target.id);
        parent.blocks.splice(idx + 1, 0, clone);
        inserted = clone;
      }
    } else if (tt === 'layer') {
      if (target.groups.length) target.groups[0].blocks.push(clone);
      else target.groups.push({ id: uid(), title: '新分组', blocks: [clone] });
      inserted = clone;
    }
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
  const hasClip = !!_clipboard;
  const menu = document.createElement('div');
  menu.id = 'treeCtxMenu';
  menu.className = 'tree-ctx-menu';
  let items = '';
  if (t === 'diagram' || t === 'layer' || t === 'group' || t === 'container') {
    items += '<button type="button" data-ctx="add">新建子项</button>';
  }
  if (t === 'layer' || t === 'group' || t === 'block') {
    items += '<button type="button" data-ctx="copy">复制</button>';
  }
  items += '<button type="button" data-ctx="paste"' + (hasClip ? '' : ' disabled') + '>粘贴</button>';
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
