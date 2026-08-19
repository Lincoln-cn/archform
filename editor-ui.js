/* ================= 内容树 ================= */
const TREE_ICON = { diagram: '▣', layer: '▤', group: '▥', block: '▦', container: '▧', section: '▨', legend: '◉' };
const TREE_LABEL = { diagram: '图', layer: '层', group: '分组', block: '模块', container: '区域', section: '分区', legend: '图例' };
const collapsed = new Set();   // 已折叠的节点 id
const SIDEBAR_ROOT = { id: '__sidebar', title: '右侧通栏（体系说明）' };   // 虚拟容器节点
const LEGEND_ROOT = { id: '__legend', title: '底部图例' };                 // 虚拟容器节点

function renderTree() {
  const tree = document.getElementById('tree');
  if (!diagram) { tree.innerHTML = ''; return; }
  tree.innerHTML = treeNode(diagram);
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

/* ================= 属性面板 ================= */
function renderProps() {
  const box = document.getElementById('props');
  if (!selectedId || !diagram) { box.innerHTML = '<div class="empty-tip">选中左侧结构树节点或画布模块进行编辑</div>'; return; }
  const node = findNode(selectedId);
  if (!node) { box.innerHTML = ''; return; }
  const t = nodeType(node);
  let h = '';
  if (t === 'diagram') {
    h += field('title', '图标题', node.title);
    h += field('subtitle', '副标题（可空）', node.subtitle);
    h += selField('layout', '布局范式', node.layout,
      [['layered','多层横向'],['cards','卡片网格'],['central','中央核心']]);
  } else if (t === 'layer') {
    h += field('name', '层名称', node.name);
    h += colorPicker('bandColor', '竖条颜色', node.bandColor);
    h += field('stat', '层统计文字（可空）', node.stat);
    h += selField('cols', '分组列数', String(node.cols || 3), [['3','3列'],['2','2列'],['1','1列']]);
  } else if (t === 'group') {
    h += field('title', '分组标题', node.title);
  } else if (t === 'block') {
    const inSidebar = findParent(node.id) && findParent(node.id).id === SIDEBAR_ROOT.id;
    h += field('title', inSidebar ? '体系名称' : '模块名称', node.title);
    if (inSidebar) {
      h += colorPicker('color', '竖条颜色', node.color);
      h += '<div class="prop-group"><div class="pg-title">体系说明条目</div>' + chipEditor('items') + '</div>';
    } else {
      h += field('sub', '副标题（可空）', node.sub);
      h += field('span', '跨列（1=正常，2=整行）', String(node.span || 1));
      h += '<div class="prop-group"><div class="pg-title">条目列表</div>' + chipEditor('items') + '</div>';
    }
  } else if (t === 'container') {
    if (node.id === SIDEBAR_ROOT.id) {
      h += '<div class="prop-group"><div class="pg-title">右侧通栏（体系说明）</div>' +
           '<div class="hint">点击结构树中"右侧通栏"行上的 <b>+</b> 新增体系；选中体系后可编辑名称与说明条目。</div></div>';
    } else if (node.id === LEGEND_ROOT.id) {
      h += '<div class="prop-group"><div class="pg-title">底部图例通栏</div>' +
           '<div class="hint">点击结构树中"底部图例"行上的 <b>+</b> 新增图例项；选中图例项后可编辑色块颜色与描述文字。</div></div>';
    }
  } else if (t === 'legend') {
    h += colorPicker('color', '色块颜色', node.color);
    h += field('title', '图例描述', node.title);
  } else if (t === 'section') {
    h += field('title', '标题', node.title);
  }
  box.innerHTML = h;
}

function field(key, label, val) {
  return '<div class="prop-field"><label>' + label + '</label>' +
    '<input type="text" value="' + esc(val ?? '') + '" data-k="' + key + '"></div>';
}
/* 竖条颜色选择器：预置色块 + 自定义取色器 */
function colorPicker(field, label, val) {
  const cur = (val || '#2379bd').toLowerCase();
  const swatches = BAND_COLORS.map(c => {
    const selCls = c.color.toLowerCase() === cur ? ' sel' : '';
    return '<button type="button" class="sw' + selCls + '" data-color="' + c.color + '"' +
           ' data-color-field="' + field + '" style="background:' + c.color + '" title="' + c.name + '"></button>';
  }).join('');
  return '<div class="prop-field"><label>' + label + '</label>' +
    '<div class="color-row">' + swatches +
    '<input type="color" data-k="' + field + '" value="' + esc(cur) + '" title="自定义颜色">' +
    '</div></div>';
}
function selField(key, label, val, opts) {
  const os = opts.map(o => '<option value="' + o[0] + '"' + (String(val) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('');
  return '<div class="prop-field"><label>' + label + '</label><select data-k="' + key + '">' + os + '</select></div>';
}
function chipEditor(key) {
  const node = findNode(selectedId);
  const items = (node && node[key]) || [];
  const chips = items.map((it, i) => {
    const text = typeof it === 'object' ? (it.text || '') : it;
    return '<span class="chip-item">' + esc(text) + '<button data-chip-del="' + i + '">×</button></span>';
  }).join('');
  return '<div class="chip-edit">' + chips + '</div>' +
    '<div class="chip-add-row"><input type="text" id="chipInput" placeholder="输入后回车新增"><button data-chip-add="' + key + '">新增</button></div>';
}

/* ================= 编辑操作 ================= */
function selectById(id) {
  selectedId = id;
  renderTree();
  renderProps();
  highlightSel();
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

/* ================= 持久化 / 导入导出 ================= */
function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(diagram)); } catch (e) {}
}
function saveToLocal() { persist(); alert('已保存到本地浏览器'); }

function exportJson() {
  const blob = new Blob([JSON.stringify(diagram, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (diagram.title || '架构图') + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadJsonFile() { document.getElementById('fileJson').click(); }

/* ================= 缩放与预览 ================= */
let zoom = 100;
function applyZoom(v, skipFit) {
  zoom = Math.max(30, Math.min(200, Math.round(v)));
  const cap = document.getElementById('captureArea');
  const wrap = document.getElementById('zoomWrap');
  const z = zoom / 100;
  const bw = cap.offsetWidth;          // 布局宽（transform 不影响）
  const bh = cap.offsetHeight;         // 布局高
  cap.style.transform = 'scale(' + z + ')';
  wrap.style.width = (bw * z) + 'px';
  wrap.style.height = (bh * z) + 'px';
  document.getElementById('zoomRange').value = zoom;
  document.getElementById('zoomVal').textContent = zoom + '%';
  if (!skipFit) currentFit = null;
}
function zoomFit() {
  const panel = document.getElementById('canvasPanel');
  const avail = panel.clientWidth - 28;         // padding 14*2
  const cap = document.getElementById('captureArea');
  const v = Math.floor(avail / cap.offsetWidth * 100);
  currentFit = Math.max(30, Math.min(200, v));
  applyZoom(currentFit, true);
}
let currentFit = null;

let previewing = false;
function togglePreview() {
  previewing = !previewing;
  document.body.classList.toggle('preview', previewing);
  document.querySelectorAll('[data-cmd="preview"]').forEach(el => {
    el.textContent = previewing ? '退出预览（Esc）' : '预览（Esc退出）';
  });
  if (previewing) {
    // 预览时去掉编辑高亮，且隐藏编辑痕迹（含选中边框）
    document.getElementById('captureArea').classList.remove('editing');
    document.getElementById('captureArea').querySelectorAll('[data-id]').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.boxShadow = '';
    });
    document.getElementById('props').innerHTML = '';
    setTimeout(zoomFit, 50);   // 预览面板变宽后，重新适应全屏
  } else {
    document.getElementById('captureArea').classList.add('editing');
    renderProps();
    setTimeout(zoomFit, 50);   // 恢复编辑区宽度
  }
}

/* ================= 新建空白图 ================= */
function newBlank() {
  if (!confirm('新建空白图？当前内容将丢失（可先点"导出JSON"备份）。')) return;
  diagram = { schemaVersion: 1, id: uid(), title: '未命名架构图', subtitle: '', layout: 'layered', layers: [] };
  selectedId = null;
  persist(); render(); renderProps();
}

/* ================= SVG 导出（离线，替代 html2canvas，无任何网络依赖） ================= */
/* 以现有 DOM 渲染为布局引擎：测量元素坐标生成纯 SVG（不用 foreignObject，保证可栅格化） */
function buildSvgString() {
  const root = document.querySelector('#captureArea .arch .canvas');
  if (!root) throw new Error('画布未就绪');
  const R = root.getBoundingClientRect();
  const scale = R.width / (root.offsetWidth || 1);   // 还原 transform 缩放
  const W = Math.ceil(R.width / scale), H = Math.ceil(R.height / scale);
  const parts = [];
  collectSvg(root, R, scale, parts);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
    parts.join('') + '</svg>';
}
function collectSvg(el, rootRect, scale, parts) {
  const r = el.getBoundingClientRect();
  const w = r.width / scale, h = r.height / scale;
  if (w < 0.5 || h < 0.5) return;                       // 隐藏/空元素跳过
  const x = (r.left - rootRect.left) / scale;
  const y = (r.top - rootRect.top) / scale;
  const st = getComputedStyle(el);
  // 背景 / 边框矩形（虚线边框转 stroke-dasharray）
  const bg = st.backgroundColor;
  const bw = parseFloat(st.borderTopWidth) || 0;
  if (bg !== 'rgba(0, 0, 0, 0)' || bw > 0) {
    const rx = parseFloat(st.borderTopLeftRadius) || 0;
    const dash = st.borderTopStyle === 'dashed' ? ' stroke-dasharray="7 4"' : '';
    parts.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '"' +
      ' rx="' + rx + '" ry="' + rx + '" fill="' + (bg !== 'rgba(0, 0, 0, 0)' ? bg : 'none') + '"' +
      (bw > 0 ? ' stroke="' + st.borderTopColor + '" stroke-width="' + bw + '"' + dash : '') + '/>');
  }
  // 直接文本节点（子元素文本由子元素自己绘制）
  let text = '';
  for (const n of el.childNodes) { if (n.nodeType === 3) text += n.nodeValue; }
  text = text.trim();
  if (text) {
    const fs = parseFloat(st.fontSize) || 13;
    // font-family 计算值含双引号，转单引号避免破坏 SVG 属性语法
    const css = ('font-size:' + fs + 'px;font-weight:' + st.fontWeight + ';font-family:' + st.fontFamily + ';fill:' + st.color +
      (st.letterSpacing !== 'normal' ? ';letter-spacing:' + st.letterSpacing : '')).replace(/"/g, "'");
    const tx = x + w / 2, ty = y + h / 2;
    if (/vertical/.test(st.writingMode)) {
      parts.push('<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" text-anchor="middle"' +
        ' style="' + css + ';writing-mode:vertical-rl;text-orientation:mixed">' + esc(text) + '</text>');
    } else {
      const pTop = parseFloat(st.paddingTop) || 0, pBottom = parseFloat(st.paddingBottom) || 0;
      const pLeft = parseFloat(st.paddingLeft) || 0, pRight = parseFloat(st.paddingRight) || 0;
      let sx, anchor;
      if (st.textAlign === 'center') { sx = x + w / 2; anchor = 'middle'; }
      else if (st.textAlign === 'right') { sx = x + w - pRight; anchor = 'end'; }
      else { sx = x + pLeft; anchor = 'start'; }
      const sy = y + pTop + (h - pTop - pBottom) / 2 + fs * 0.35;
      parts.push('<text x="' + sx.toFixed(1) + '" y="' + sy.toFixed(1) + '" text-anchor="' + anchor + '" style="' + css + '">' + esc(text) + '</text>');
    }
  }
  for (const c of el.children) collectSvg(c, rootRect, scale, parts);
}
function svgToPngDataUrl(svgText, scale) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width = img.naturalWidth * scale;
        cv.height = img.naturalHeight * scale;
        const ctx = cv.getContext('2d');
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(cv.toDataURL('image/png'));
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG 渲染失败')); };
    img.src = url;
  });
}

/* ================= 保存为 HTML ================= */
let ARCH_CSS = '';   // 架构图渲染规范样式（从编辑器样式表提取）

function exportHtml() {
  const area = document.getElementById('captureArea');
  const clone = area.cloneNode(true);
  clone.classList.remove('editing');
  clone.querySelectorAll('[data-id]').forEach(el => {
    el.removeAttribute('data-id');
    el.style.outline = '';
    el.style.outlineOffset = '';
    el.style.boxShadow = '';
  });
  const inner = clone.innerHTML;
  const title = diagram.title || '架构图';
  let svgXml = '';
  try { svgXml = buildSvgString(); } catch (e) {}
  const btnCss = '.export-toolbar{position:fixed;right:24px;top:20px;z-index:9999;}' +
    '.download-btn{border:0;border-radius:6px;background:#1677ff;color:#fff;padding:10px 18px;' +
    'font-size:14px;font-family:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(22,119,255,.28);}' +
    '.download-btn:hover{background:#0958d9}.download-btn:disabled{opacity:.65;cursor:wait}' +
    'body{background:#f7fbff}';
  /* 内联 SVG → PNG 栅格化，产物完全离线可用（无 CDN 依赖） */
  const script = "<script>var SVG_XML=" + JSON.stringify(svgXml).replace(/</g, '\\u003c') + ";" +
    "document.getElementById('downloadPng').addEventListener('click',async function(){var btn=this;btn.disabled=true;btn.textContent='正在生成...';try{" +
    "var img=new Image(),url=URL.createObjectURL(new Blob([SVG_XML],{type:'image/svg+xml;charset=utf-8'}));img.src=url;" +
    "await new Promise(function(ok,er){img.onload=ok;img.onerror=function(){er(new Error('SVG加载失败'))}});" +
    "var s=2,cv=document.createElement('canvas');cv.width=img.naturalWidth*s;cv.height=img.naturalHeight*s;" +
    "var ctx=cv.getContext('2d');ctx.scale(s,s);ctx.drawImage(img,0,0);URL.revokeObjectURL(url);" +
    "var a=document.createElement('a'),t=new Date().toISOString().slice(0,19).replace(/[T:]/g,'-');" +
    "a.download=document.title+'-'+t+'.png';a.href=cv.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();" +
    "}catch(err){alert('PNG生成失败：'+err.message)}finally{btn.disabled=false;btn.textContent='下载PNG'}});<\/script>";
  const html = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(title) + '</title>\n<style>' + ARCH_CSS + currentThemeCss() + btnCss + '</style>\n</head>\n<body>\n' +
    '<div class="export-toolbar"><button id="downloadPng" class="download-btn" type="button">下载PNG</button></div>\n' +
    inner + '\n' + script + '\n</body>\n</html>';
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = title + '.html';
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ================= 导出 SVG / PNG（均离线） ================= */
function exportSvg() {
  if (!diagram) return;
  try {
    const svg = buildSvgString();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (diagram.title || '架构图') + '.svg';
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    alert('SVG生成失败：' + (err && err.message ? err.message : err));
  }
}
async function exportPng() {
  const btn = document.getElementById('btnExport');
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = '正在生成...';
  try {
    const dataUrl = await svgToPngDataUrl(buildSvgString(), 2);
    const a = document.createElement('a');
    const time = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    a.download = (diagram.title || '架构图') + '-' + time + '.png';
    a.href = dataUrl;
    document.body.appendChild(a); a.click(); a.remove();
  } catch (err) {
    alert('PNG生成失败：' + (err && err.message ? err.message : err));
  } finally {
    btn.disabled = false; btn.textContent = old;
  }
}

/* ================= 模板加载 ================= */
function fillTemplateSelect() {
  const sel = document.getElementById('selTemplate');
  const tpls = (window.ARCH_TEMPLATES || {});
  sel.innerHTML = '<option value="">— 选择预置模板 —</option>' +
    Object.keys(tpls).map(k => '<option value="' + k + '">' + esc(tpls[k].title || k) + '</option>').join('');
}
function loadTemplate() {
  const key = document.getElementById('selTemplate').value;
  const tpls = window.ARCH_TEMPLATES || {};
  if (!key || !tpls[key]) return;
  const migrated = migrateDiagram(JSON.parse(JSON.stringify(tpls[key])));   // 深拷贝 + 版本迁移
  if (!migrated || migrated.error) { alert(migrated ? migrated.error : '模板数据无效'); return; }
  diagram = migrated;
  selectedId = null;
  persist(); render(); renderProps();
}

/* ================= 配色方案 ================= */
const COLOR_SCHEMES = [
  { id: 'blue', name: '经典蓝', colors: ['#2f80c2', '#2379bd', '#1a5c94', '#143c66', '#0e2a47', '#0e7a8a'], vars: { '--blue': '#2379bd', '--blue2': '#2f80c2', '--dash': '#2c78c2', '--panel': '#c8ddef' } },
  { id: 'green', name: '青绿', colors: ['#34d399', '#10b981', '#059669', '#047857', '#065f46', '#0e7490'], vars: { '--blue': '#059669', '--blue2': '#10b981', '--dash': '#10b981', '--panel': '#d1fae5' } },
  { id: 'violet', name: '紫罗兰', colors: ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'], vars: { '--blue': '#7c3aed', '--blue2': '#8b5cf6', '--dash': '#8b5cf6', '--panel': '#ede9fe' } },
  { id: 'amber', name: '暖橙', colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#c2410c'], vars: { '--blue': '#d97706', '--blue2': '#f59e0b', '--dash': '#f59e0b', '--panel': '#fef3c7' } },
  { id: 'forest', name: '墨绿', colors: ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'], vars: { '--blue': '#16a34a', '--blue2': '#22c55e', '--dash': '#4ade80', '--panel': '#dcfce7' } },
  { id: 'slate', name: '灰蓝', colors: ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#0369a1'], vars: { '--blue': '#334155', '--blue2': '#475569', '--dash': '#94a3b8', '--panel': '#e2e8f0' } }
];
function currentScheme() {
  const t = (diagram && diagram.theme) || {};
  if (t.custom) return { id: '__custom', name: '自定义', custom: true, colors: t.custom, vars: t.vars };
  return COLOR_SCHEMES.find(s => s.id === t.id) || COLOR_SCHEMES[0];
}
function applyThemeVars(vars) {
  const root = document.documentElement.style;
  Object.entries(vars || {}).forEach(([k, v]) => root.setProperty(k, v));
}
function applyScheme(scheme) {
  if (!diagram) return;
  // 颜色替换：先按"当前方案色阶"反向定位索引（保证连续套用不同方案不卡色），
  // 再回退到预置色板；两者都不命中（自定义颜色）则保留
  const cur = currentScheme();
  const replace = c => {
    const s = String(c || '').toLowerCase();
    let i = (cur.colors || []).findIndex(x => String(x).toLowerCase() === s);
    if (i < 0) i = BAND_COLORS.findIndex(b => b.color.toLowerCase() === s);
    return i >= 0 ? scheme.colors[i] : c;
  };
  (diagram.layers || []).forEach(l => {
    if (l.bandColor) l.bandColor = replace(l.bandColor);
    (l.groups || []).forEach(g => (g.blocks || []).forEach(b => { if (b.color) b.color = replace(b.color); }));
  });
  (diagram.sidebar || []).forEach(s => { if (s.color) s.color = replace(s.color); });
  (diagram.legend || []).forEach(x => { if (x.color) x.color = replace(x.color); });
  diagram.theme = { id: scheme.id, custom: scheme.custom ? scheme.colors : null, vars: scheme.vars };
  applyThemeVars(scheme.vars);
  persist(); render(); renderProps();
}
function fillSchemeMenu() {
  const cur = currentScheme();
  const list = document.getElementById('schemeList');
  list.innerHTML = COLOR_SCHEMES.map(s =>
    '<button type="button" data-scheme="' + s.id + '"' + (s.id === cur.id ? ' class="sel"' : '') + '>' +
    '<span class="sch-dots">' + s.colors.map(c => '<i style="background:' + c + '"></i>').join('') + '</span>' +
    esc(s.name) + '</button>').join('');
  const row = document.getElementById('schemeCustomRow');
  row.innerHTML = cur.colors.map((c, i) =>
    '<input type="color" data-scheme-i="' + i + '" value="' + esc(c) + '" title="第' + (i + 1) + '档">').join('');
}
function applyCustomScheme() {
  const colors = [...document.querySelectorAll('#schemeCustomRow input')].map(i => i.value);
  applyScheme({
    id: '__custom', custom: true, colors,
    vars: { '--blue': colors[1] || '#2379bd', '--blue2': colors[0] || '#2f80c2', '--dash': colors[1] || '#2c78c2', '--panel': (colors[2] || '#143c66') + '40' }
  });
}

/* ================= 事件绑定 ================= */
function bindEvents() {
  // 工具栏
  document.getElementById('btnLoadTemplate').addEventListener('click', loadTemplate);
  document.getElementById('btnAddLayer').addEventListener('click', () => {
    if (!diagram) diagram = newDiagram();
    diagram.layers.push({ id: uid(), name: '新层', bandColor: '#2379bd', cols: 3, groups: [] });
    persist(); render();
  });
  document.getElementById('btnExport').addEventListener('click', exportPng);
  document.getElementById('fileJson').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const migrated = migrateDiagram(parsed);
        if (!migrated || migrated.error) { alert(migrated ? migrated.error : 'JSON 数据无效'); return; }
        diagram = migrated;
        selectedId = null;
        persist(); render(); renderProps();
        alert('导入成功');
      } catch (err) { alert('JSON 解析失败：' + err.message); }
    };
    reader.readAsText(f);
    e.target.value = '';
  });
  // 结构树：展开/折叠、选择与操作
  document.getElementById('tree').addEventListener('click', e => {
    const tnode = e.target.closest('.tnode');
    if (tnode) {
      const id = tnode.getAttribute('data-id');
      const caretEl = e.target.closest('.caret');
      if (caretEl) {
        // 点击展开/折叠箭头（不选中）
        if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id);
        renderTree();
        return;
      }
      const actBtn = e.target.closest('[data-act]');
      if (actBtn) {
        selectedId = id;
        const act = actBtn.getAttribute('data-act');
        if (act === 'add') { selectedId = id; collapsed.delete(id); addChild(nodeType(findNode(id))); }
        else if (act === 'up') { selectedId = id; moveSelected(-1); }
        else if (act === 'down') { selectedId = id; moveSelected(1); }
        else if (act === 'del') { selectedId = id; removeSelected(); }
        return;
      }
      if (id === selectedId) { selectedId = null; }
      else selectById(id);
    }
  });
  // 缩放
  document.getElementById('zoomRange').addEventListener('input', e => { applyZoom(parseInt(e.target.value, 10)); });
  document.getElementById('btnFit').addEventListener('click', zoomFit);
  // 右侧通栏宽度拖拽（委托在画布容器，渲染重建后仍有效）
  document.getElementById('captureArea').addEventListener('mousedown', e => {
    const div = e.target.closest('.side-divider');
    if (!div || !diagram) return;
    e.preventDefault();
    div.classList.add('active');
    const layout = div.parentElement;
    const startX = e.clientX;
    const startW = diagram.sidebarWidth || parseFloat(getComputedStyle(layout).getPropertyValue('--sidebar-w')) || 460;
    const onMove = ev => {
      const w = Math.max(200, Math.min(900, startW + (ev.clientX - startX)));
      layout.style.setProperty('--sidebar-w', w + 'px');
      diagram.sidebarWidth = w;
    };
    const onUp = () => {
      div.classList.remove('active');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (diagram.sidebarWidth) persist();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && previewing) togglePreview();
  });
  // 下拉菜单：展开/收起
  const closeMenus = () => document.querySelectorAll('.menu-drop.open').forEach(m => m.classList.remove('open'));
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const drop = document.getElementById('menu-' + btn.getAttribute('data-menu'));
      const wasOpen = drop.classList.contains('open');
      closeMenus();
      if (!wasOpen) {
        if (btn.getAttribute('data-menu') === 'scheme') fillSchemeMenu();   // 打开配色菜单时刷新
        drop.classList.add('open');
      }
    });
  });
  // 配色方案：套用预置 / 应用自定义 / 恢复默认
  document.getElementById('schemeList').addEventListener('click', e => {
    const btn = e.target.closest('[data-scheme]');
    if (!btn) return;
    const scheme = COLOR_SCHEMES.find(s => s.id === btn.getAttribute('data-scheme'));
    if (scheme) { applyScheme(scheme); closeMenus(); }
  });
  document.getElementById('schemeApplyCustom').addEventListener('click', () => {
    applyCustomScheme();
    fillSchemeMenu();
    closeMenus();
  });
  document.getElementById('schemeReset').addEventListener('click', () => {
    applyScheme(COLOR_SCHEMES[0]);
    closeMenus();
  });
  // 菜单命令分发
  document.querySelectorAll('.menu-drop').forEach(drop => {
    drop.addEventListener('click', e => {
      const item = e.target.closest('[data-cmd]');
      if (!item) return;
      const cmd = item.getAttribute('data-cmd');
      closeMenus();
      if (cmd === 'new') newBlank();
      else if (cmd === 'save') saveToLocal();
      else if (cmd === 'import') loadJsonFile();
      else if (cmd === 'export-json') exportJson();
      else if (cmd === 'export-svg') exportSvg();
      else if (cmd === 'export-html') exportHtml();
      else if (cmd === 'preview') togglePreview();
      else if (cmd === 'fit') zoomFit();
      else if (cmd === 'zoom-100') applyZoom(100);
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.menu')) closeMenus();
  }, true);   // 捕获阶段：不受画布内 stopPropagation 影响
  // 属性面板：输入时不重建属性面板（否则中文输入法组合会被中断），
  // 只更新数据 + 重渲染画布；选中其他节点时 renderProps 会自然重建
  document.getElementById('props').addEventListener('input', e => {
    const el = e.target.closest('[data-k]');
    if (!el || !selectedId) return;
    const node = findNode(selectedId);
    if (!node) return;
    const k = el.getAttribute('data-k');
    let v = el.value;
    if (k === 'cols') v = parseInt(v, 10) || 3;
    if (k === 'span') v = parseInt(v, 10) || 1;
    node[k] = v;
    persist();
    render();
    highlightSel();
  });
  document.getElementById('props').addEventListener('click', e => {
    if (!selectedId) return;
    const node = findNode(selectedId);
    if (!node) return;
    // 竖条颜色色块选择
    const sw = e.target.closest('[data-color]');
    if (sw) {
      const field = sw.getAttribute('data-color-field');
      node[field] = sw.getAttribute('data-color');
      persist(); render(); highlightSel(); renderProps();
      return;
    }
    const delBtn = e.target.closest('[data-chip-del]');
    if (delBtn) {
      node.items.splice(parseInt(delBtn.getAttribute('data-chip-del'), 10), 1);
      persist(); render(); renderProps(); return;
    }
    const addBtn = e.target.closest('[data-chip-add]');
    if (addBtn) {
      const input = document.getElementById('chipInput');
      const v = input.value.trim();
      if (v) { (node.items = node.items || []).push(v); input.value = ''; }
      persist(); render(); renderProps();
    }
  });
  document.getElementById('props').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'chipInput') {
      const node = findNode(selectedId);
      if (!node) return;
      const v = e.target.value.trim();
      if (v) { (node.items = node.items || []).push(v); e.target.value = ''; }
      persist(); render(); renderProps();
    }
  });
}

/* ================= 初始化 ================= */
function init() {
  // 提取架构图渲染规范样式（供"保存为HTML"使用）
  const styleEl = document.querySelector('style');
  const st = styleEl.textContent;
  const sMark = st.indexOf('架构图渲染规范');
  const eMark = st.indexOf('编辑器 UI');
  if (sMark > -1 && eMark > sMark) {
    ARCH_CSS = st.slice(st.lastIndexOf('/*', sMark), eMark);
  }
  fillTemplateSelect();
  bindEvents();
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const migrated = migrateDiagram(JSON.parse(saved));
      if (migrated && !migrated.error) { diagram = migrated; }
      else if (migrated && migrated.error) { alert(migrated.error); }
    }
  } catch (e) {}
  if (!diagram) {
    const tpls = window.ARCH_TEMPLATES || {};
    const migrated = tpls['logical'] ? migrateDiagram(JSON.parse(JSON.stringify(tpls['logical']))) : null;
    diagram = migrated && !migrated.error ? migrated : newDiagram();
  }
  // 恢复配色主题（CSS 变量随图持久化，刷新后保持一致）
  const th = diagram.theme && diagram.theme.vars;
  if (th) applyThemeVars(th);
  render();
  zoomFit();
}
/* 导出 HTML 时把当前主题变量写进样式 */
function currentThemeCss() {
  const vars = (diagram && diagram.theme && diagram.theme.vars) || {};
  const entries = Object.entries(vars);
  if (!entries.length) return '';
  return ':root{' + entries.map(([k, v]) => k + ':' + v + ';').join('') + '}';
}
document.addEventListener('DOMContentLoaded', init);