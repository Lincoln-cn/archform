
function render() {
  if (!diagram) { document.getElementById('captureArea').innerHTML = '<div class="empty-tip">点击右上角"加载模板"或"新增层"开始</div>'; return; }
  const area = document.getElementById('captureArea');
  area.classList.add('editing');
  area.innerHTML = '<div class="arch"><div class="canvas" id="archCanvas">' + renderBody() + '</div></div>';
  // 点击画布节点选中
  area.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); selectById(el.getAttribute('data-id')); });
  });
  renderTree();
  applyZoom(currentFit || zoom, true);   // 渲染后保持当前缩放
  drawConnections();
}

function renderBody() {
  const d = diagram;
  const h = '<h1 data-id="' + d.id + '">' + esc(d.title) + '</h1>' +
            (d.subtitle ? '<div class="subtitle" data-id="' + d.id + '">' + esc(d.subtitle) + '</div>' : '');
  let body = '';
  if (d.layout === 'layered') {
    body = renderLayered(d);
    if (d.showConnections && (d.connections || []).length > 0) {
      body = '<div class="lay-stack">' + body + '</div>';
    }
    if (d.sidebar && d.sidebar.length) {
      body = '<div class="side-layout">' +
             '<div class="side-main">' + body + '</div>' +
             '<div class="side-divider"></div>' +
             renderSidebar(d) + '</div>';
    }
  }
  else if (d.layout === 'flow') {
    body = renderFlow(d);
    if (d.sidebar && d.sidebar.length) {
      body = '<div class="side-layout">' +
             '<div class="side-main">' + body + '</div>' +
             '<div class="side-divider"></div>' +
             renderSidebar(d) + '</div>';
    }
  }
  return h + body + renderLegend(d);
}

/* ---- 底部图例通栏 ---- */
function renderLegend(d) {
  if (!d.legend || !d.legend.length) return '';
  const items = (d.legend || []).map(l => {
    return '<span class="legend-item" data-id="' + l.id + '">' +
           '<span class="lg-sw" style="background:' + esc(l.color || '#2379bd') + '"></span>' +
           esc(l.title || '') + '</span>';
  }).join('');
  return '<div class="legend-bar">' + items + '</div>';
}

/* ---- 右侧垂直通栏（体系说明） ---- */
function renderSidebar(d) {
  const bars = (d.sidebar || []).map(b => {
    const items = (b.items || []).map(it => {
      var t = itemText(it), r = splitRefs(t);
      var inner = esc(r.plain) + r.refs.map(refTagHtml).join('');
      var cls = (r.refs.length || r.plain) ? 'sb-item' + (r.refs.length ? ' has-ref' : '') : 'sb-item';
      return '<div class="' + cls + '" title="' + esc(t) + '">' + inner + '</div>';
    }).join('');
    const cls = (b.items && b.items.length) ? 'sbar' : 'sbar no-items';
    return '<div class="' + cls + '" data-id="' + b.id + '">' +
           '<div class="sb-title" style="background:' + (b.color || '#2379bd') + '" data-id="' + b.id + '">' + esc(b.title) + '</div>' +
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
    return '<span class="' + cls + '"' + (r.refs.length ? ' title="' + esc(t) + '"' : '') + '>' + inner + '</span>';
  }).join('');
}

/* ---- layered 多层横向 ---- */
function renderLayered(d) {
  return (d.layers || []).map(layer => {
    const cols = layer.cols || 3;
    const colCls = cols === 2 ? 'col2' : (cols === 1 ? 'col1' : 'col3');
    const groups = (layer.groups || []).map(g => {
      const blocks = (g.blocks || []).map(b => {
        const spanCls = b.span === 2 ? ' span2' : '';
        const items = renderItemsHtml(b.items);
        return '<div class="card' + spanCls + '" data-id="' + b.id + '">' +
               '<div class="t">' + esc(b.title) + '</div>' +
               (items ? '<div class="items">' + items + '</div>' : '') + '</div>';
      }).join('');
      return '<div class="subdomain" data-id="' + g.id + '">' +
             '<div class="sd-title">' + esc(g.title) + '</div>' +
             '<div class="cards">' + blocks + '</div></div>';
    }).join('');
    const statText = layer.autoStat !== false ? calcLayerStat(layer) : (layer.stat || '');
    const stat = statText ? '<span class="stat">' + esc(statText) + '</span>' : '';
    return '<section class="layer" data-id="' + layer.id + '">' +
           '<div class="band" data-id="' + layer.id + '" style="background:' + (layer.bandColor || '#2379bd') + '">' + esc(layer.name) + '</div>' +
           '<div class="body" style="background:' + tintColor(layer.bandColor || '#2379bd', 0.93) + '">' +
           '<div class="layer-head" data-id="' + layer.id + '"><span class="zh">' + esc(layer.name) + '</span>' + stat + '</div>' +
           '<div class="groups ' + colCls + '">' + groups + '</div>' +
           '</div></section>';
  }).join('');
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
          return '<div class="card" data-id="' + b.id + '">' +
                 '<div class="t">' + esc(b.title) + '</div>' +
                 (items ? '<div class="items">' + items + '</div>' : '') + '</div>';
        }).join('');
        return '<div class="subdomain" data-id="' + g.id + '">' +
               '<div class="sd-title">' + esc(g.title) + '</div>' +
               '<div class="cards">' + blocks + '</div></div>';
      }).join('');
      const statText = layer.autoStat !== false ? calcLayerStat(layer) : (layer.stat || '');
      const stat = statText ? '<span class="stat">' + esc(statText) + '</span>' : '';
      const ml = li > 0 ? ' style="margin-left:' + gapFor(li - 1) + 'px"' : '';
      return '<section class="layer flow-col" data-id="' + layer.id + '"' + ml + '>' +
             '<div class="band flow-band" data-id="' + layer.id + '" style="background:' + (layer.bandColor || '#2379bd') + '">' +
             '<span class="band-title">' + esc(layer.name) + '</span>' + stat + '</div>' +
             '<div class="body" style="background:' + tintColor(layer.bandColor || '#2379bd', 0.93) + '">' +
             '<div class="groups col1">' + groups + '</div>' +
             '</div></section>';
    }).join('') +
  '</div>';
}



