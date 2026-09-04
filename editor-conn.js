/* ===== 层间连线:几何与渲染(layered + flow) ===== */
function canvasRef() { return document.getElementById('archCanvas'); }

/* 布局坐标:相对 .canvas 边框盒,除以 transform 缩放(与导出共用同一几何基准) */
function connP(el) {
  var R = canvasRef().getBoundingClientRect();
  var s = R.width / (canvasRef().offsetWidth || 1);
  var r = el.getBoundingClientRect();
  return { x: (r.left - R.left) / s, y: (r.top - R.top) / s, w: r.width / s, h: r.height / s };
}

/* 解析全部有效连线 → 画线元素列表(供 on-screen overlay 与 SVG 导出共用) */
function connItems() {
  if (!diagram) return [];
  if (diagram.layout !== 'layered') return [];
  if (!diagram.showConnections) return [];
  var conns = diagram.connections || [];
  if (!conns.length) return [];
  var cv = canvasRef();
  if (!cv) return [];
  var sections = cv.querySelectorAll('section.layer');
  if (!sections.length) return [];
  /* 索引层 section → data-id */
  var secMap = {};
  sections.forEach(function(sec) { secMap[sec.getAttribute('data-id')] = sec; });
  /* 每层锚点 y 与 bandEdgeX */
  var bandData = {};
  var allBandEdges = [];
  sections.forEach(function(sec) {
    var band = sec.querySelector('.band');
    if (!band) return;
    var bP = connP(band);
    var sP = connP(sec);
    bandData[sec.getAttribute('data-id')] = { anchorY: bP.y + bP.h / 2, bandEdgeX: sP.x };
    allBandEdges.push(sP.x);
  });
  if (!allBandEdges.length) return [];
  /* rail:bandEdgeX 平均值左移 15px */
  var avgEdge = allBandEdges.reduce(function(a, b) { return a + b; }, 0) / allBandEdges.length;
  var railCenterX = avgEdge - 15;
  /* 按有序对 (from,to) 分组 */
  var groups = {}, groupOrder = [];
  conns.forEach(function(c) {
    var fromEl = secMap[c.from], toEl = secMap[c.to];
    if (!fromEl || !toEl || c.from === c.to) return;
    var key = c.from + '|' + c.to;
    if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
    groups[key].push(c);
  });
  var items = [];
  groupOrder.forEach(function(key) {
    var arr = groups[key], n = arr.length;
    arr.forEach(function(c, i) {
      var fromBD = bandData[c.from], toBD = bandData[c.to];
      if (!fromBD || !toBD) return;
      var y1 = fromBD.anchorY, y2 = toBD.anchorY;
      var bandEdgeX = fromBD.bandEdgeX;
      var laneX = railCenterX + (i - (n - 1) / 2) * 6;
      var d = 'M ' + bandEdgeX + ' ' + y1 + ' H ' + laneX + ' V ' + y2 + ' H ' + bandEdgeX;
      var style = c.style || 'solid';
      var label = c.label || '';
      items.push({ d: d, style: style, label: label, lx: laneX, ly: (y1 + y2) / 2 });
    });
  });
  return items;
}

/* flow 相邻列间隙箭头:仅 layers[i]→layers[i+1] 水平段;带说明时标签置于箭头正上方 */
function connFlowItems() {
  if (!diagram) return [];
  if (diagram.layout !== 'flow') return [];
  if (!diagram.showConnections) return [];
  var conns = diagram.connections || [];
  if (!conns.length) return [];
  var cv = canvasRef();
  if (!cv) return [];
  var cols = cv.querySelectorAll('.flow-col');
  if (!cols.length) return [];
  /* 依序对应 layers */
  var layerIds = (diagram.layers || []).map(function(l) { return l.id; });
  var colMap = {};
  cols.forEach(function(col) { colMap[col.getAttribute('data-id')] = col; });
  var items = [];
  conns.forEach(function(c) {
    var fi = layerIds.indexOf(c.from), ti = layerIds.indexOf(c.to);
    if (fi < 0 || ti < 0 || ti !== fi + 1) return;          /* 仅相邻列 */
    var fromCol = colMap[c.from], toCol = colMap[c.to];
    if (!fromCol || !toCol) return;
    var fr = connP(fromCol), tr = connP(toCol);
    var x1 = fr.x + fr.w, x2 = tr.x;
    var top = Math.min(fr.y, tr.y);
    var y = top + (Math.max(fr.y + fr.h, tr.y + tr.h) - top) / 2;
    var it = { d: 'M ' + (x1 + 2) + ' ' + y + ' H ' + (x2 - 2), style: c.style || 'solid' };
    if (c.label) {
      /* 间隙已按标签宽度加宽(renderFlow);标签居中放箭头正上方 */
      it.label = c.label;
      it.lx = (x1 + x2) / 2;
      it.ly = y - 15;
    }
    items.push(it);
  });
  return items;
}

/* XML 转义(复用 esc 但需独立以防环境差异) */
function connEsc(s) {
  return String(s ?? '').replace(/[&<>"]/g, function(c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; });
}

/* 返回可直接拼入导出 SVG 的连线 XML 片段(仅当 showConnections 且有效连线) */
function connSvgXml() {
  var items = (diagram && diagram.layout === 'flow') ? connFlowItems() : connItems();
  if (!items.length) return '';
  var parts = [];
  /* 独立 marker id 防与 DOM overlay 混淆 */
  parts.push('<defs><marker id="connArrX" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">' +
    '<path d="M0,0 L8,3 L0,6 Z" fill="#64748b"/></marker></defs>');
  items.forEach(function(it) {
    var dash = '';
    if (it.style === 'dashed') dash = ' stroke-dasharray="6 4"';
    else if (it.style === 'dotted') dash = ' stroke-dasharray="2 4"';
    parts.push('<path d="' + it.d + '" fill="none" stroke="#64748b" stroke-width="1.5"' +
      ' marker-end="url(#connArrX)"' + dash + '/>');
    if (it.label) {
      var tw = it.label.length * 11 + 10, th = 18;
      parts.push('<rect x="' + (it.lx - tw / 2).toFixed(1) + '" y="' + (it.ly - th / 2).toFixed(1) + '"' +
        ' width="' + tw.toFixed(1) + '" height="' + th.toFixed(1) + '" rx="2" fill="#fff" stroke="#cbd5e1" stroke-width="1"/>');
      parts.push('<text x="' + it.lx.toFixed(1) + '" y="' + it.ly.toFixed(1) + '"' +
        ' text-anchor="middle" dominant-baseline="central" font-size="11" fill="#475569">' +
        connEsc(it.label) + '</text>');
    }
  });
  return parts.join('');
}

/* ===== draw.io 导出 ===== */

/* XML/HTML 双层转义:文本 → HTML 实体(给 draw.io html=1 渲染) → XML 属性实体 */
function drawioEsc(s) {
  /* 第一层:HTML 实体(供 draw.io html=1 属性内的富文本) */
  var h = String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  /* 第二层:XML 属性值(放在 value="..." 内) */
  return h.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/* 生成 draw.io XML 字符串(纯函数式,读当前 DOM+diagram) */
function buildDrawioXml() {
  if (!diagram) return '';
  var title = diagram.title || '架构图';
  var layout = diagram.layout || 'layered';
  var cells = [];
  /* 根 cell 骨架 */
  cells.push('<mxCell id="0"/>');
  cells.push('<mxCell id="1" parent="0"/>');

  /* 从 DOM 读取所有 [data-id] 元素的布局坐标 → id→{x,y,w,h} */
  var cv = document.getElementById('archCanvas');
  if (!cv) return '';
  var allEls = cv.querySelectorAll('[data-id]');
  var elMap = {};
  allEls.forEach(function(el) {
    var did = el.getAttribute('data-id');
    if (!elMap[did]) {
      var pp = connP(el);
      elMap[did] = { x: pp.x, y: pp.y, w: pp.w, h: pp.h };
    }
  });

  var idMap = {}; /* dataId → drawio cell id */
  var nextId = 10;

  if (layout === 'layered' || layout === 'flow') {
    /* 每层 → swimlane; flow 用 horizontal=1 + startSize=36, layered 保持原参数 */
    var isFlow = layout === 'flow';
    var swimStyle = isFlow
      ? 'swimlane;horizontal=1;startSize=36;whiteSpace=wrap;html=1;fillColor=#fff;strokeColor=#64748b;'
      : 'swimlane;horizontal=0;startSize=52;whiteSpace=wrap;html=1;fillColor=#fff;strokeColor=#64748b;';
    (diagram.layers || []).forEach(function(layer) {
      var sec = cv.querySelector('section.layer[data-id="' + layer.id + '"]');
      if (!sec) return;
      var geo = elMap[layer.id];
      if (!geo) return;
      idMap[layer.id] = 'l_' + layer.id;
      var n = (layer.name || layer.title || '').replace(/"/g, '&quot;');
      cells.push('<mxCell id="l_' + layer.id + '" value="' + drawioEsc(n) + '"' +
        ' style="' + swimStyle + '"' +
        ' vertex="1" parent="1">' +
        '<mxGeometry x="' + geo.x.toFixed(1) + '" y="' + geo.y.toFixed(1) + '"' +
        ' width="' + geo.w.toFixed(1) + '" height="' + geo.h.toFixed(1) + '" as="geometry"/></mxCell>');

      /* 分组/模块 → 子 cell(坐标相对父左上角) */
      (layer.groups || []).forEach(function(g) {
        var gGeo = elMap[g.id];
        if (!gGeo) return;
        var gid = 'g_' + g.id;
        idMap[g.id] = gid;
        cells.push('<mxCell id="' + gid + '" value="' + drawioEsc(g.title || '') + '"' +
          ' style="rounded=0;whiteSpace=wrap;html=1;fillColor=#eef5fc;strokeColor=#b9d8f0;"' +
          ' vertex="1" parent="l_' + layer.id + '">' +
          '<mxGeometry x="' + (gGeo.x - geo.x).toFixed(1) + '" y="' + (gGeo.y - geo.y).toFixed(1) + '"' +
          ' width="' + gGeo.w.toFixed(1) + '" height="' + gGeo.h.toFixed(1) + '" as="geometry"/></mxCell>');

        (g.blocks || []).forEach(function(b) {
          var bGeo = elMap[b.id];
          if (!bGeo) return;
          var bid = 'b_' + b.id;
          idMap[b.id] = bid;
          /* label = 标题 + items(HTML 多行);用 &lt;b&gt; 等 HTML 实体,drawioEsc 再做 XML 属性转义 */
          var lines = ['&lt;b&gt;' + drawioEsc(b.title || '') + '&lt;/b&gt;'];
          (b.items || []).forEach(function(it) { lines.push(drawioEsc(itemText(it))); });
          cells.push('<mxCell id="' + bid + '" value="' + drawioEsc(lines.join('&lt;br&gt;')) + '"' +
            ' style="rounded=0;whiteSpace=wrap;html=1;fillColor=#2379bd;fontColor=#fff;strokeColor=#1a5c94;"' +
            ' vertex="1" parent="' + gid + '">' +
            '<mxGeometry x="' + (bGeo.x - gGeo.x).toFixed(1) + '" y="' + (bGeo.y - gGeo.y).toFixed(1) + '"' +
            ' width="' + bGeo.w.toFixed(1) + '" height="' + bGeo.h.toFixed(1) + '" as="geometry"/></mxCell>');
        });
      });
    });

    /* 连线:仅 layered 输出(从 diagram.connections 直接读,与 showConnections 无关) */
    if (layout === 'layered') {
      (diagram.connections || []).forEach(function(c) {
        var srcId = idMap[c.from], tgtId = idMap[c.to];
        if (!srcId || !tgtId) return;
        var style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;strokeColor=#64748b;exitX=0;exitY=0.5;entryX=0;entryY=0.5;';
        if (c.style === 'dashed') style += 'dashed=1;';
        else if (c.style === 'dotted') style += 'dashed=1;dashPattern=2 4;';
        var val = c.label ? ' value="' + drawioEsc(c.label) + '"' : '';
        if (c.label) style += 'labelBackgroundColor=#ffffff;';
        cells.push('<mxCell id="e_' + c.id + '"' + val +
          ' style="' + style + '"' +
          ' edge="1" parent="1" source="' + srcId + '" target="' + tgtId + '"/>');
      });
    }

  }

  /* sidebar:右侧竖条 → 平铺 cell(parent=1) */
  (diagram.sidebar || []).forEach(function(sb) {
    var geo = elMap[sb.id];
    if (!geo) return;
    var lines = ['&lt;b&gt;' + drawioEsc(sb.title || '') + '&lt;/b&gt;'];
    (sb.items || []).forEach(function(it) { lines.push(drawioEsc(itemText(it))); });
    cells.push('<mxCell id="s_' + sb.id + '" value="' + drawioEsc(lines.join('&lt;br&gt;')) + '"' +
      ' style="swimlane;horizontal=0;startSize=32;whiteSpace=wrap;html=1;fillColor=#183c63;fontColor=#fff;strokeColor=#2c78c2;"' +
      ' vertex="1" parent="1">' +
      '<mxGeometry x="' + geo.x.toFixed(1) + '" y="' + geo.y.toFixed(1) + '"' +
      ' width="' + geo.w.toFixed(1) + '" height="' + geo.h.toFixed(1) + '" as="geometry"/></mxCell>');
  });

  /* legend:底部图例 → 平铺 cell(parent=1) */
  (diagram.legend || []).forEach(function(lg) {
    var geo = elMap[lg.id];
    if (!geo) return;
    cells.push('<mxCell id="leg_' + lg.id + '" value="' + drawioEsc(lg.title || '') + '"' +
      ' style="rounded=0;whiteSpace=wrap;html=1;fillColor=' + (lg.color || '#2379bd') + ';fontColor=#fff;strokeColor=#64748b;"' +
      ' vertex="1" parent="1">' +
      '<mxGeometry x="' + geo.x.toFixed(1) + '" y="' + geo.y.toFixed(1) + '"' +
      ' width="' + geo.w.toFixed(1) + '" height="' + geo.h.toFixed(1) + '" as="geometry"/></mxCell>');
  });

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<mxfile host="app.diagrams.net">\n' +
    '<diagram name="' + drawioEsc(title) + '">\n' +
    '<mxGraphModel dx="0" dy="0" grid="1" gridSize="10" page="1">\n' +
    '<root>\n' + cells.join('\n') + '\n</root>\n' +
    '</mxGraphModel>\n</diagram>\n</mxfile>';
}

/* 下载 .drawio 文件 */
function exportDrawio() {
  if (!diagram) return;
  var xml = buildDrawioXml();
  if (!xml) return;
  var blob = new Blob([xml], { type: 'application/vnd.jgraph.mxfile' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (diagram.title || '架构图') + '.drawio';
  a.click();
  URL.revokeObjectURL(a.href);
}

/* 依据 diagram 重画(或清除)canvas 内 .conn-overlay */
function drawConnections() {
  var cv = canvasRef();
  if (!cv) return;
  /* 双分支:layered 走 rail 正交,flow 走相邻列水平箭头 */
  var items = [];
  if (diagram) {
    items = diagram.layout === 'layered' ? connItems() : diagram.layout === 'flow' ? connFlowItems() : [];
  }
  var old = cv.querySelector('.conn-overlay');
  if (old) old.remove();
  if (!items.length) return;
  /* 构建 SVG overlay */
  var ns = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'conn-overlay');
  var defs = document.createElementNS(ns, 'defs');
  var marker = document.createElementNS(ns, 'marker');
  marker.setAttribute('id', 'connArr');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '8');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');
  var arrowPath = document.createElementNS(ns, 'path');
  arrowPath.setAttribute('d', 'M0,0 L8,3 L0,6 Z');
  arrowPath.setAttribute('fill', '#64748b');
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);
  items.forEach(function(it) {
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', it.d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#64748b');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('marker-end', 'url(#connArr)');
    if (it.style === 'dashed') path.setAttribute('stroke-dasharray', '6 4');
    else if (it.style === 'dotted') path.setAttribute('stroke-dasharray', '2 4');
    svg.appendChild(path);
    /* 标签(白底矩形 + 居中文字;layered 在 rail 旁,flow 在箭头正上方) */
    if (it.label) {
      var tw = it.label.length * 11 + 10, th = 18;
      var rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', it.lx - tw / 2);
      rect.setAttribute('y', it.ly - th / 2);
      rect.setAttribute('width', tw);
      rect.setAttribute('height', th);
      rect.setAttribute('rx', '2');
      rect.setAttribute('fill', '#fff');
      rect.setAttribute('stroke', '#cbd5e1');
      rect.setAttribute('stroke-width', '1');
      svg.appendChild(rect);
      var text = document.createElementNS(ns, 'text');
      text.setAttribute('x', it.lx);
      text.setAttribute('y', it.ly);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', '#475569');
      text.textContent = it.label;
      svg.appendChild(text);
    }
  });
  cv.appendChild(svg);
}
