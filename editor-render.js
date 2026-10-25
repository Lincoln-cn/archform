
/* 只产出 .arch 这一段 HTML(标题/图例/侧栏/板式全在里面),不碰画布、树、缩放、连线。
   缩略图就是靠它在离屏容器里拼出来的:不必借真实画布,也就没有整棵树 + 缩放 + 连线的开销。
   canvasId=false 时不带 id —— 缩略图一屏十几份,不能和真画布的 #archCanvas 撞 id。 */
function buildArchHtml(d0, extraCls, extraStyle, canvasId) {
  const cls = 'arch' + (extraCls ? ' ' + extraCls : '');
  const st = extraStyle ? ' style="' + extraStyle + '"' : '';
  const idAttr = canvasId === false ? '' : ' id="archCanvas"';
  return '<div class="' + cls + '"' + st + '><div class="canvas"' + idAttr + '>' + renderBody(d0) + '</div></div>';
}

function render() {
  if (!diagram) { document.getElementById('captureArea').innerHTML = '<div class="empty-tip">点击右上角"加载模板"或"新增层"开始</div>'; return; }
  const area = document.getElementById('captureArea');
  area.classList.add('editing');
  area.innerHTML = buildArchHtml();
  // 点击画布节点选中
  area.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); selectById(el.getAttribute('data-id')); });
  });
  renderTree();
  applyZoom(currentFit || zoom, true);   // 渲染后保持当前缩放
  drawConnections();
}

function renderBody(d0) {
  const d = d0 || diagram;
  const L = layoutOf(d);
  const h = '<h1 data-id="' + d.id + '" data-role="title">' + esc(d.title) + '</h1>' +
            (d.subtitle ? '<div class="subtitle" data-id="' + d.id + '" data-role="subtitle">' + esc(d.subtitle) + '</div>' : '');
  /* 布局只负责摆盒子;下面两段包装由布局声明的 caps 决定,不再按布局名写分支 */
  let body = L.render(d);
  if (L.caps.railPad && d.showConnections && (d.connections || []).length > 0) {
    /* 左内边距随连线轨道数增长,给多条平行竖轨留出横向空间(与 connItems 的车道算法一致) */
    body = '<div class="lay-stack" style="padding-left:' + connRailPad(d.connections) + 'px">' + body + '</div>';
  }
  if (L.caps.sidebar && d.sidebar && d.sidebar.length) {
    body = '<div class="side-layout">' +
           '<div class="side-main">' + body + '</div>' +
           '<div class="side-divider"></div>' +
           renderSidebar(d) + '</div>';
  }
  return h + body + renderLegend(d);
}

/* ---- 底部图例通栏 ---- */
function renderLegend(d) {
  if (!d.legend || !d.legend.length) return '';
  const items = (d.legend || []).map(l => {
    return '<span class="legend-item" data-id="' + l.id + '" data-role="legend">' +
           '<span class="lg-sw" style="background:' + esc(l.color || '#2379bd') + '"></span>' +
           esc(l.title || '') + '</span>';
  }).join('');
  return '<div class="legend-bar" data-role="legend-bar">' + items + '</div>';
}

/* ---- 右侧垂直通栏（体系说明） ---- */
function renderSidebar(d) {
  const bars = (d.sidebar || []).map(b => {
    const items = (b.items || []).map(it => {
      var t = itemText(it), r = splitRefs(t);
      /* 拆单字 span:flex column + space-between 沿条目高度均分字距;角标作为整体项 */
      var chars = Array.from(r.plain || '').map(function(ch) {
        return ch === ' ' ? '<span class="sb-gap"></span>' : '<span>' + esc(ch) + '</span>';
      }).join('');
      var inner = chars + r.refs.map(refTagHtml).join('');
      var cls = (r.refs.length || r.plain) ? 'sb-item' + (r.refs.length ? ' has-ref' : '') : 'sb-item';
      return '<div class="' + cls + '" data-role="sidebar-item" title="' + esc(t) + '">' + inner + '</div>';
    }).join('');
    const cls = (b.items && b.items.length) ? 'sbar' : 'sbar no-items';
    return '<div class="' + cls + '" data-id="' + b.id + '" data-role="sidebar">' +
           '<div class="sb-title" style="background:' + (b.color || '#2379bd') + '" data-id="' + b.id + '" data-role="sidebar-title">' + esc(b.title) + '</div>' +
           (items ? '<div class="sb-items">' + items + '</div>' : '') + '</div>';
  }).join('');
  return '<div class="sidebar">' + bars + '</div>';
}

/* ---- 条目渲染 helper（layered/flow 共用） ---- */
function renderItemsHtml(items) {
  return (items || []).map(it => {
    var t = itemText(it), r = splitRefs(t);
    var inner = esc(r.plain) + r.refs.map(refTagHtml).join('');
    var cls = 'item' + (r.refs.length ? ' has-ref' : '');
    return '<span class="' + cls + '" data-role="item"' + (r.refs.length ? ' title="' + esc(t) + '"' : '') + '>' + inner + '</span>';
  }).join('');
}

/* ---- layered 多层横向 ---- */
function renderLayered(d) {
  return (d.layers || []).map(layer => {
    const cols = layer.cols || 3;
    /* 列数不超过实际分组数：少于 cols 个分组时不再空出右侧整列（2 组按 3 列排会白占 1/3 宽度） */
    const gcount = Math.max(1, (layer.groups || []).length);
    const fitCols = Math.min(cols, gcount);
    const colCls = fitCols === 2 ? 'col2' : (fitCols === 1 ? 'col1' : 'col3');
    const groups = (layer.groups || []).map(g => {
      const blocks = (g.blocks || []).map(b => {
        const spanCls = b.span === 2 ? ' span2' : '';
        const items = renderItemsHtml(b.items);
        return '<div class="card' + spanCls + '" data-id="' + b.id + '" data-role="card">' +
               '<div class="t">' + esc(b.title) + '</div>' +
               (items ? '<div class="items">' + items + '</div>' : '') + '</div>';
      }).join('');
      return '<div class="subdomain" data-id="' + g.id + '" data-role="group">' +
             '<div class="sd-title">' + esc(g.title) + '</div>' +
             '<div class="cards">' + blocks + '</div></div>';
    }).join('');
    const statText = layer.autoStat !== false ? calcLayerStat(layer) : (layer.stat || '');
    const stat = statText ? '<span class="stat">' + esc(statText) + '</span>' : '';
    return '<section class="layer" data-id="' + layer.id + '" data-role="layer">' +
           '<div class="band" data-id="' + layer.id + '" data-role="band" style="background:' + (layer.bandColor || '#2379bd') + '">' + esc(layer.name) + '</div>' +
           '<div class="body" style="background:' + tintColor(layer.bandColor || '#2379bd', 0.93) + '">' +
           '<div class="layer-head" data-id="' + layer.id + '" data-role="layer-head"><span class="zh">' + esc(layer.name) + '</span>' + stat + '</div>' +
           '<div class="groups ' + colCls + '">' + groups + '</div>' +
           '</div></section>';
  }).join('');
}

/* ---- table 清单表格 ----
   同一份数据换一种摆法:块=一行,块的条目=这一行其余的格子,分组=分区行,层=分区大标题。
   这样「属性」不再是挤在卡片里的短标签,而是一列列对齐,能按列扫读。
   列名从 diagram.ext.table.columns 读(没有就从数据推:第一列叫「模块」,其余叫「列 1/列 2」)。 */
function renderTable(d) {
  const layers = d.layers || [];
  const ext = (d.ext && d.ext.table) || {};
  let cols = Array.isArray(ext.columns) ? ext.columns.map(c => String(c == null ? '' : c)) : [];
  let nCol = Math.max(cols.length, 1);
  layers.forEach(layer => (layer.groups || []).forEach(g => (g.blocks || []).forEach(b => {
    nCol = Math.max(nCol, 1 + ((b.items || []).length));
  })));
  while (cols.length < nCol) cols.push(cols.length === 0 ? '模块' : '列 ' + cols.length);
  cols = cols.slice(0, nCol);
  /* 第一列稍宽(放名称),其余等宽 */
  const colsCss = 'minmax(110px,1.5fr) ' + new Array(nCol - 1).fill('1fr').join(' ');

  const head = '<div class="tb-head" data-role="table-head">' +
    cols.map((c, i) => '<div class="tb-hc' + (i === 0 ? ' c1' : '') + '" data-role="table-cell">' + esc(c) + '</div>').join('') +
    '</div>';

  const body = layers.map(layer => {
    /* 表格里「3 分组 · 12 模块 · 60 条目」不好读,换成行/分区口径 */
    const rowCount = (layer.groups || []).reduce((n, g) => n + (g.blocks || []).length, 0);
    const statText = layer.autoStat !== false
      ? ((layer.groups || []).length + ' 分区 · ' + rowCount + ' 行')
      : (layer.stat || '');
    const stat = statText ? '<span class="stat">' + esc(statText) + '</span>' : '';
    const groups = (layer.groups || []).map(g => {
      const blocks = (g.blocks || []).map(b => {
        const items = b.items || [];
        const cells = items.map(t => '<div class="tb-cell" data-role="item">' + esc(itemText(t)) + '</div>').join('');
        const pad = new Array(Math.max(0, nCol - 1 - items.length)).fill('<div class="tb-cell" data-role="item"></div>').join('');
        return '<div class="tb-row" data-id="' + b.id + '" data-role="card">' +
               '<div class="tb-cell c1" data-role="item"><span class="t">' + esc(b.title) + '</span></div>' +
               cells + pad + '</div>';
      }).join('');
      return '<div class="tb-group" data-id="' + g.id + '" data-role="group">' +
             '<div class="tb-gh" data-id="' + g.id + '" data-role="group-head">' +
             '<span class="gh-t">' + esc(g.title) + '</span>' +
             '<span class="gh-n">' + (g.blocks || []).length + ' 行</span></div>' +
             blocks + '</div>';
    }).join('');
    return '<section class="tb-layer" data-id="' + layer.id + '" data-role="layer">' +
           '<div class="tb-lh" data-id="' + layer.id + '" data-role="layer-head">' +
           '<span class="zh">' + esc(layer.name) + '</span>' + stat + '</div>' +
           groups + '</section>';
  }).join('');

  return '<div class="tb-wrap" data-role="table" style="--tb-cols:' + colsCss + '">' + head + body + '</div>';
}

/* ---- flow 横向流向 ---- */
function renderFlow(d) {
  const layers = d.layers || [];
  /* 逐边界间隙:默认 14px;带说明文字的相邻连线把间隙加宽到能放下标签 */
  const gapFor = (i) => {
    if (d.showConnections && (d.connections || []).length) {
      let need = 0;
      (d.connections || []).forEach(c => {
        if (c.from === layers[i].id && c.to === layers[i + 1].id && c.label) {
          need = Math.max(need, (c.label.length || 1) * 11 + 10 + 8);
        }
      });
      if (need) return Math.ceil(need);
    }
    return 14;
  };
  return '<div class="flow-lanes">' +
    layers.map((layer, li) => {
      const groups = (layer.groups || []).map(g => {
        const blocks = (g.blocks || []).map(b => {
          const items = renderItemsHtml(b.items);
          return '<div class="card" data-id="' + b.id + '" data-role="card">' +
                 '<div class="t">' + esc(b.title) + '</div>' +
                 (items ? '<div class="items">' + items + '</div>' : '') + '</div>';
        }).join('');
        return '<div class="subdomain" data-id="' + g.id + '" data-role="group">' +
               '<div class="sd-title">' + esc(g.title) + '</div>' +
               '<div class="cards">' + blocks + '</div></div>';
      }).join('');
      const statText = layer.autoStat !== false ? calcLayerStat(layer) : (layer.stat || '');
      const stat = statText ? '<span class="stat">' + esc(statText) + '</span>' : '';
      const ml = li > 0 ? ' style="margin-left:' + gapFor(li - 1) + 'px"' : '';
      return '<section class="layer flow-col" data-id="' + layer.id + '" data-role="layer"' + ml + '>' +
             '<div class="band flow-band" data-id="' + layer.id + '" data-role="band" style="background:' + (layer.bandColor || '#2379bd') + '">' +
             '<span class="band-title">' + esc(layer.name) + '</span>' + stat + '</div>' +
             '<div class="body" style="background:' + tintColor(layer.bandColor || '#2379bd', 0.93) + '">' +
             '<div class="groups col1">' + groups + '</div>' +
             '</div></section>';
    }).join('') +
  '</div>';
}



