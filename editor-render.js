
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
}

function renderBody() {
  const d = diagram;
  const h = '<h1 data-id="' + d.id + '">' + esc(d.title) + '</h1>' +
            (d.subtitle ? '<div class="subtitle" data-id="' + d.id + '">' + esc(d.subtitle) + '</div>' : '');
  let body = '';
  if (d.layout === 'layered') {
    body = renderLayered(d);
    if (d.sidebar && d.sidebar.length) {
      const w = d.sidebarWidth || 460;
      body = '<div class="side-layout" style="--sidebar-w:' + w + 'px">' +
             '<div class="side-main">' + body + '</div>' +
             '<div class="side-divider"></div>' +
             renderSidebar(d) + '</div>';
    }
  }
  else if (d.layout === 'cards') body = renderCards(d);
  else if (d.layout === 'central') body = renderCentral(d);
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
    const items = (b.items || []).map(it => '<div class="sb-item">' + esc(it) + '</div>').join('');
    const cls = (b.items && b.items.length) ? 'sbar' : 'sbar no-items';
    return '<div class="' + cls + '" data-id="' + b.id + '">' +
           '<div class="sb-title" style="background:' + (b.color || '#2379bd') + '" data-id="' + b.id + '">' + esc(b.title) + '</div>' +
           (items ? '<div class="sb-items">' + items + '</div>' : '') + '</div>';
  }).join('');
  return '<div class="sidebar">' + bars + '</div>';
}

/* ---- layered 多层横向 ---- */
function renderLayered(d) {
  return (d.layers || []).map(layer => {
    const cols = layer.cols || 3;
    const colCls = cols === 2 ? 'col2' : (cols === 1 ? 'col1' : 'col3');
    const groups = (layer.groups || []).map(g => {
      const blocks = (g.blocks || []).map(b => {
        const spanCls = b.span === 2 ? ' span2' : '';
        const items = (b.items || []).map(it => '<span class="item">' + esc(it) + '</span>').join('');
        return '<div class="card' + spanCls + '" data-id="' + b.id + '">' +
               '<div class="t">' + esc(b.title) + '</div>' +
               (items ? '<div class="items">' + items + '</div>' : '') + '</div>';
      }).join('');
      return '<div class="subdomain" data-id="' + g.id + '">' +
             '<div class="sd-title">' + esc(g.title) + '</div>' +
             '<div class="cards">' + blocks + '</div></div>';
    }).join('');
    const stat = layer.stat ? '<span class="stat">' + esc(layer.stat) + '</span>' : '';
    return '<section class="layer" data-id="' + layer.id + '">' +
           '<div class="band" data-id="' + layer.id + '" style="background:' + (layer.bandColor || '#2379bd') + '">' + esc(layer.name) + '</div>' +
           '<div class="body">' +
           '<div class="layer-head" data-id="' + layer.id + '"><span class="zh">' + esc(layer.name) + '</span>' + stat + '</div>' +
           '<div class="groups ' + colCls + '">' + groups + '</div>' +
           '</div></section>';
  }).join('');
}

/* ---- cards 卡片网格（DL1~DL3） ---- */
function renderCards(d) {
  const cards = (d.layers || []).map(c => {
    const groups = (c.groups || []).map(g => {
      const rows = (g.blocks || []).map(b => {
        const tags = (b.items || []).map(it => {
          let cls = 'tag';
          if (typeof it === 'object') cls += ' ' + (it.cat ? 'cat-' + it.cat : '') + (it.reuse ? ' reuse' : '');
          return '<span class="' + cls + '">' + esc(typeof it === 'object' ? it.text : it) + '</span>';
        }).join('');
        return '<div class="dl3-item" data-id="' + b.id + '">' +
               '<div><div class="dl3-name">' + esc(b.title) + '</div>' +
               (b.sub ? '<div class="dl3-entity">' + esc(b.sub) + '</div>' : '') + '</div>' +
               (tags ? '<div class="dl3-tags">' + tags + '</div>' : '') + '</div>';
      }).join('');
      return '<div class="dl2-group" data-id="' + g.id + '">' +
             '<div class="dl2-title">' + esc(g.title) + '</div>' +
             '<div class="dl3-list">' + rows + '</div></div>';
    }).join('');
    return '<div class="dl1-card" data-id="' + c.id + '">' +
           '<div class="dl1-header"><div class="dl1-title">' + esc(c.name) + '</div>' +
           (c.owner ? '<span class="owner-tag">' + esc(c.owner) + '</span>' : '') + '</div>' +
           '<div class="dl1-body">' + groups + '</div></div>';
  }).join('');
  return '<div class="domain-grid">' + cards + '</div>';
}

/* ---- central/组合视图（统一 layers 结构：上/左/核心/右/其余=下） ---- */
function renderCentral(d) {
  const L = d.layers || [];
  const top = L[0], left = L[1], core = L[2], right = L[3], bottoms = L.slice(4);
  const renderZone = (layer, cls) => {
    const blocks = (layer && layer.groups && layer.groups[0] && layer.groups[0].blocks) || [];
    const bs = blocks.map(b => {
      return '<div class="central-block" data-id="' + b.id + '">' +
             '<div class="cb-t">' + esc(b.title) + '</div>' +
             (b.sub ? '<div class="cb-s">' + esc(b.sub) + '</div>' : '') + '</div>';
    }).join('');
    return '<div class="' + cls + '"><div class="central-title" data-id="' + (layer ? layer.id : '') + '">' +
           esc(layer ? layer.name : '') + '</div>' + bs + '</div>';
  };
  const bottom = (bottoms || []).map(layer => {
    const blocks = (layer.groups && layer.groups[0] && layer.groups[0].blocks) || [];
    return blocks.map(b => {
      return '<div class="central-block" data-id="' + b.id + '">' +
             '<div class="cb-t">' + esc(b.title) + '</div>' +
             (b.sub ? '<div class="cb-s">' + esc(b.sub) + '</div>' : '') + '</div>';
    }).join('');
  }).join('');
  return '<div class="central-wrap">' +
    renderZone(top, 'central-top') + renderZone(left, 'central-left') +
    renderZone(core, 'central-core') + renderZone(right, 'central-right') +
    (bottom ? '<div class="central-bottom">' + bottom + '</div>' : '') + '</div>';
}

