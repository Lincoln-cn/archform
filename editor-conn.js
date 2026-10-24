/* ===== 层间连线:几何与渲染(layered + flow) ===== */
function canvasRef() { return document.getElementById('archCanvas'); }

/* 连线数据来源:编辑面板预览时传 opts.conns(草稿)+opts.force,不读写 diagram */
function connListFor(opts) {
  if (opts && opts.conns) return opts.conns;
  return (diagram && diagram.connections) || [];
}
function connForceFor(opts) {
  if (opts && opts.force) return true;
  return !!(diagram && diagram.showConnections);
}
/* 轨道分配:纵向区间「相交」的线才分到不同轨道;首尾相接(lo == hi,即一条 A→B→C 的链)
   共用一条竖轨。入参用层序号(整数)表示区间,这样「相接」与「同一段」天然可分:
   [0,1] 与 [1,2] 相接 ⇒ 同轨;[1,2] 与 [1,2](A→B 与 B→A)区间重合 ⇒ 分轨。
   spans 需按 lo 升序传入,结果写回 s.lane。 */
function connAssignLanes(spans) {
  var laneHi = [];
  (spans || []).forEach(function(s) {
    var k = -1;
    for (var i = 0; i < laneHi.length; i++) {
      if (s.lo >= laneHi[i]) { k = i; break; }   /* >= 表示允许首尾相接 */
    }
    if (k < 0) { k = laneHi.length; laneHi.push(s.hi); }
    else { laneHi[k] = s.hi; }
    s.lane = k;
  });
  return laneHi.length;
}
/* 需要几条平行竖轨(上限 6)。padding 必须在渲染前算出,故用层序号估算区间,
   与 connItems 用的是同一套分配规则 ⇒ 两者结论必然一致。 */
function connLaneCount(conns) {
  var idx = {}, list = (diagram && diagram.layers) || [];
  list.forEach(function(l, i) { idx[l.id] = i; });
  var spans = [];
  (conns || []).forEach(function(c) {
    if (!c || !c.from || !c.to || c.from === c.to) return;
    var a = idx[c.from], b = idx[c.to];
    if (a == null || b == null) return;
    spans.push({ lo: Math.min(a, b), hi: Math.max(a, b) });
  });
  if (!spans.length) return 0;
  spans.sort(function(x, y) { return x.lo - y.lo || x.hi - y.hi; });
  return Math.min(connAssignLanes(spans), 6);
}
/* .lay-stack 左内边距:每条轨道留 12px 横向空间,基准 30px */
function connRailPad(conns) {
  return 30 + Math.max(0, connLaneCount(conns) - 1) * 12;
}
/* 连线说明白底宽度:按实际字形测量(与覆盖层 font-size:11px 同字号),带缓存 */
var _connMeasureCtx = null, _connLabelCache = {};
function connLabelWidth(text) {
  var s = String(text || '');
  if (!s) return 0;
  if (_connLabelCache[s] != null) return _connLabelCache[s];
  var w;
  try {
    if (!_connMeasureCtx) _connMeasureCtx = document.createElement('canvas').getContext('2d');
    _connMeasureCtx.font = '600 11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    w = _connMeasureCtx.measureText(s).width;
  } catch (e) { w = s.length * 7; }
  w = Math.max(24, Math.ceil(w) + 10);
  _connLabelCache[s] = w;
  return w;
}

/* 布局坐标:相对 .canvas 边框盒,除以 transform 缩放(与导出共用同一几何基准) */
function connP(el) {
  var R = canvasRef().getBoundingClientRect();
  var s = R.width / (canvasRef().offsetWidth || 1);
  var r = el.getBoundingClientRect();
  return { x: (r.left - R.left) / s, y: (r.top - R.top) / s, w: r.width / s, h: r.height / s };
}

/* 解析全部有效连线 → 画线元素列表(供 on-screen overlay 与 SVG 导出共用) */
function connItems(opts) {
  if (!diagram) return [];
  if (diagram.layout !== 'layered') return [];
  if (!connForceFor(opts)) return [];
  var conns = connListFor(opts);
  if (!conns.length) return [];
  var cv = canvasRef();
  if (!cv) return [];
  var sections = cv.querySelectorAll('section.layer');
  if (!sections.length) return [];
  /* 每层锚点 y 与层左缘 x(层名色带左沿) */
  var bandData = {};
  var edgeXs = [];
  sections.forEach(function(sec) {
    var band = sec.querySelector('.band');
    if (!band) return;
    var bP = connP(band);
    var sP = connP(sec);
    bandData[sec.getAttribute('data-id')] = { anchorY: bP.y + bP.h / 2, bandEdgeX: sP.x };
    edgeXs.push(sP.x);
  });
  if (!edgeXs.length) return [];
  var minEdge = Math.min.apply(null, edgeXs);
  /* 每条线先算自己的纵向区间(用层序号,便于区分「相接」与「重合」),再按「相交才分轨」
     统一分配竖轨:相邻层的链式连线首尾相接 ⇒ 全部落在同一条竖轨上,上下对齐;
     只有 A→B 与 B→A 这类真正重叠的线才往外让 12px。 */
  var idx = {}, layerList = (diagram.layers || []);
  layerList.forEach(function(l, i) { idx[l.id] = i; });
  var segs = [];
  conns.forEach(function(c) {
    var fromBD = bandData[c.from], toBD = bandData[c.to];
    if (!fromBD || !toBD || c.from === c.to) return;
    var a = idx[c.from], b = idx[c.to];
    if (a == null || b == null) return;
    var y1 = fromBD.anchorY, y2 = toBD.anchorY;
    segs.push({ c: c, y1: y1, y2: y2,
                x1: fromBD.bandEdgeX, x2: toBD.bandEdgeX,
                lo: Math.min(a, b), hi: Math.max(a, b) });
  });
  if (!segs.length) return [];
  segs.sort(function(a, b) { return a.lo - b.lo || a.hi - b.hi; });
  connAssignLanes(segs);
  var items = [];
  segs.forEach(function(sg) {
    /* 轨道上限 6 条(与 connRailPad 的留白一致),再多就叠在最外那条上 */
    var lane = Math.min(sg.lane, 5);
    var x = Math.max(6, minEdge - 10 - lane * 12);
    var d = 'M ' + sg.x1 + ' ' + sg.y1 + ' H ' + x + ' V ' + sg.y2 + ' H ' + sg.x2;
    items.push({ d: d, style: sg.c.style || 'solid', label: sg.c.label || '',
                 lx: x, ly: (sg.y1 + sg.y2) / 2, _a: sg.y1, _b: sg.y2,
                 from: sg.c.from, to: sg.c.to, cid: sg.c.id || '' });
  });
  /* 说明文字错开:纵向跨度相同的线(A→B 与 B→A、同层对多条)共用一段竖轨,
     标签若不分开会互相压住,故按「跨度」分组后组内沿纵向等分。 */
  var bySpan = {};
  items.forEach(function(it) {
    var k = Math.round(Math.min(it._a, it._b)) + ':' + Math.round(Math.max(it._a, it._b));
    (bySpan[k] = bySpan[k] || []).push(it);
  });
  Object.keys(bySpan).forEach(function(k) {
    var arr = bySpan[k];
    if (arr.length < 2) return;
    arr.sort(function(a, b) { return a.lx - b.lx; });     /* 左轨在上,顺序稳定 */
    var top = Math.min(arr[0]._a, arr[0]._b), bot = Math.max(arr[0]._a, arr[0]._b);
    arr.forEach(function(it, j) {
      it.ly = top + (bot - top) * (j + 1) / (arr.length + 1);
    });
  });
  items.forEach(function(it) { delete it._a; delete it._b; });
  return items;
}

/* 说明白底框(画布局部坐标):超出画布左右边界时向内贴边,避免标签被裁掉半截 */
function connLabelBox(it, tw, th) {
  var cv = canvasRef();
  var maxW = (cv && cv.offsetWidth) || 0;
  var x = it.lx - tw / 2;
  if (maxW > 0) {
    if (x < 2) x = 2;
    if (x + tw > maxW - 2) x = Math.max(2, maxW - 2 - tw);
  }
  return { x: x, y: it.ly - th / 2, w: tw, h: th, cx: x + tw / 2 };
}

/* flow 相邻列间隙箭头:仅 layers[i]→layers[i+1] 水平段;带说明时标签置于箭头正上方 */
function connFlowItems(opts) {
  if (!diagram) return [];
  if (diagram.layout !== 'flow') return [];
  if (!connForceFor(opts)) return [];
  var conns = connListFor(opts);
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
    '<path d="M0,0 L8,3 L0,6 Z" fill="#475569"/></marker></defs>');
  items.forEach(function(it) {
    var dash = '';
    if (it.style === 'dashed') dash = ' stroke-dasharray="6 4"';
    else if (it.style === 'dotted') dash = ' stroke-dasharray="2 4"';
    parts.push('<path d="' + it.d + '" fill="none" stroke="#475569" stroke-width="1.5"' +
      ' marker-end="url(#connArrX)"' + dash + '/>');
    if (it.label) {
      var tw = connLabelWidth(it.label), th = 18;
      var lb = connLabelBox(it, tw, th);
      parts.push('<rect x="' + lb.x.toFixed(1) + '" y="' + lb.y.toFixed(1) + '"' +
        ' width="' + lb.w.toFixed(1) + '" height="' + lb.h.toFixed(1) + '" rx="2" fill="#fff" stroke="#cbd5e1" stroke-width="1"/>');
      parts.push('<text x="' + lb.cx.toFixed(1) + '" y="' + it.ly.toFixed(1) + '"' +
        ' text-anchor="middle" dominant-baseline="central" font-size="11" fill="#475569">' +
        connEsc(it.label) + '</text>');
    }
  });
  return parts.join('');
}

/* ===== draw.io 导出 ===== */

/* HTML 文本转义:只作用于"文字内容",供 html=1 的 label(draw.io 会把它当 HTML 解析) */
function drawioHtmlText(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* XML 属性转义:一次到位(& < > " '),用于 value="..." / name="..." 等属性。
   注意:已经按 HTML 转义过的 <b>/<br> 不能再被当作"文本"转一次 ——
   若写成字面 &lt;b&gt; 再被转义,文件里就是 &amp;lt;b&amp;gt;,draw.io 读出来
   的 label 会显示成字面文本 "<b>标题</b>" 而不是加粗标题。 */
function drawioEsc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/* 多行富文本 label:标题加粗 + 每条一行(文字走 HTML 层,整串再走 XML 属性层) */
function drawioLabelHtml(title, items) {
  var html = '<b>' + drawioHtmlText(title || '') + '</b>';
  (items || []).forEach(function(it) {
    var t = drawioHtmlText(itemText(it));
    if (t.trim()) html += '<br>' + t;
  });
  return html;
}

/* 读当前配色方案的 CSS 变量(applyThemeVars 把变量挂在 :root 上),导出配色与画布一致 */
function drawioThemeVar(name, fallback) {
  try {
    var v = String(getComputedStyle(document.documentElement).getPropertyValue(name) || '').trim();
    if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?$/.test(v)) return v.slice(0, 7);
  } catch (e) {}
  return fallback;
}

/* 颜色校验:图例色块 / 竖条颜色是用户输入,非法值会让整条 draw.io style 失效 */
function drawioHex(c, fallback) {
  var s = String(c || '').trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ? s : fallback;
}

/* 生成 draw.io XML 字符串(纯函数式,读当前 DOM+diagram) */
function buildDrawioXml() {
  if (!diagram) return '';
  var title = diagram.title || '架构图';
  var isFlow = diagram.layout === 'flow';
  var cv = document.getElementById('archCanvas');
  if (!cv) return '';

  /* 元素分类:同一个 data-id 会出现在多个元素上(标题 h1 与副标题、层 section 与它的 .band、
     分组 .subdomain 与图例 .legend-item),所以不能只按 data-id 建一张几何表;
     按「元素种类 + data-id」分别取,图例按 DOM 顺序与 diagram.legend 一一对位。 */
  var kinds = { layer: {}, group: {}, card: {}, sbar: {} };
  var legendEls = [];
  var titleEl = null, subEl = null;
  var noCls = { contains: function() { return false; } };
  cv.querySelectorAll('[data-id]').forEach(function(el) {
    var id = el.getAttribute('data-id');
    var cl = el.classList || noCls;
    if (el.tagName === 'H1') { if (!titleEl) titleEl = el; return; }
    if (cl.contains('subtitle')) { if (!subEl) subEl = el; return; }
    if (!id) return;
    if (cl.contains('layer')) { if (!kinds.layer[id]) kinds.layer[id] = el; }
    else if (cl.contains('subdomain')) { if (!kinds.group[id]) kinds.group[id] = el; }
    else if (cl.contains('card')) { if (!kinds.card[id]) kinds.card[id] = el; }
    else if (cl.contains('sbar')) { if (!kinds.sbar[id]) kinds.sbar[id] = el; }
    else if (cl.contains('legend-item')) legendEls.push(el);
  });
  /* 元素几何:取不到 / NaN / 0 尺寸一律返回 null,宁可不画也不写坏 cell */
  function rectOf(el) {
    if (!el) return null;
    var g = connP(el);
    if (!isFinite(g.x) || !isFinite(g.y) || !isFinite(g.w) || !isFinite(g.h)) return null;
    return (g.w > 0.5 && g.h > 0.5) ? g : null;
  }
  function geoXml(g, ox, oy) {
    return '<mxGeometry x="' + (g.x - (ox || 0)).toFixed(1) + '" y="' + (g.y - (oy || 0)).toFixed(1) + '"' +
      ' width="' + g.w.toFixed(1) + '" height="' + g.h.toFixed(1) + '" as="geometry"/>';
  }
  /* 内容包围盒 → 页面尺寸;不写 pageWidth/Height 时 draw.io 按 A4 出页,内容大半在页外 */
  var bx1 = -Infinity, by1 = -Infinity;
  function bump(g) { bx1 = Math.max(bx1, g.x + g.w); by1 = Math.max(by1, g.y + g.h); }

  var cells = [];
  /* 根 cell 骨架 */
  cells.push('<mxCell id="0"/>');
  cells.push('<mxCell id="1" parent="0"/>');
  var idMap = {}; /* dataId → drawio cell id */

  /* 配色跟随当前方案(画布卡片是浅底深字,不是纯蓝底白字) */
  var cDash = drawioThemeVar('--dash', '#2c78c2');
  var cBlue = drawioThemeVar('--blue', '#2379bd');
  var cCardBg = drawioThemeVar('--card-bg', '#dbeaf7');
  var cCardBorder = drawioThemeVar('--card-border', '#8ebbdc');
  var cCardInk = drawioThemeVar('--card-ink', '#1a5c94');
  var cGroupBg = drawioThemeVar('--group-bg', '#e8f1f9');
  var cGroupBorder = drawioThemeVar('--group-border', '#b9d8f0');
  var cGroupInk = drawioThemeVar('--group-ink', '#183c63');
  var cSbarBg = drawioThemeVar('--sbar', '#183c63');
  var cSbarBorder = drawioThemeVar('--sbar-border', '#2c78c2');
  var cMuted = drawioThemeVar('--ink-muted', '#5a7a9a');

  /* 图名 / 副标题:缺了它们 draw.io 里只剩一堆方块,找不到图名。
     纯文本 label(不写 html=1),用户文字里的 < > 才不会被当成标签渲染。 */
  var tGeo = rectOf(titleEl);
  if (tGeo) {
    bump(tGeo);
    cells.push('<mxCell id="title" value="' + drawioEsc(title) + '"' +
      ' style="text;whiteSpace=wrap;align=left;verticalAlign=middle;fontSize=26;fontStyle=1;strokeColor=none;fillColor=none;fontColor=' + cGroupInk + ';"' +
      ' vertex="1" parent="1">' + geoXml(tGeo) + '</mxCell>');
  }
  var subGeo = rectOf(subEl);
  if (subGeo) {
    bump(subGeo);
    cells.push('<mxCell id="subtitle" value="' + drawioEsc(diagram.subtitle || '') + '"' +
      ' style="text;whiteSpace=wrap;align=left;verticalAlign=middle;fontSize=13;strokeColor=none;fillColor=none;fontColor=' + cMuted + ';"' +
      ' vertex="1" parent="1">' + geoXml(subGeo) + '</mxCell>');
  }

  /* 每层 → swimlane; flow 用 horizontal=1 + startSize=36, layered 用左侧竖排色带 */
  var swimStyle = isFlow
    ? 'swimlane;horizontal=1;startSize=36;whiteSpace=wrap;html=1;fontStyle=1;fontSize=15;fontColor=#ffffff;'
    : 'swimlane;horizontal=0;startSize=52;whiteSpace=wrap;html=1;fontStyle=1;fontSize=17;fontColor=#ffffff;';
  (diagram.layers || []).forEach(function(layer) {
    var lGeo = rectOf(kinds.layer[layer.id]);
    if (!lGeo) return;
    var band = drawioHex(layer.bandColor, cBlue);
    var lid = 'l_' + layer.id;
    idMap[layer.id] = lid;
    bump(lGeo);
    cells.push('<mxCell id="' + lid + '" value="' + drawioEsc(drawioHtmlText(layer.name || '')) + '"' +
      ' style="' + swimStyle + 'fillColor=' + band + ';swimlaneFillColor=' + tintColor(band, 0.93) +
      ';strokeColor=' + cDash + ';" vertex="1" parent="1">' + geoXml(lGeo) + '</mxCell>');

    /* 分组/模块 → 子 cell(坐标相对父左上角,draw.io 才认父子关系) */
    (layer.groups || []).forEach(function(g) {
      var gGeo = rectOf(kinds.group[g.id]);
      if (!gGeo) return;
      var gid = 'g_' + g.id;
      idMap[g.id] = gid;
      bump(gGeo);
      cells.push('<mxCell id="' + gid + '" value="' + drawioEsc(drawioHtmlText(g.title || '')) + '"' +
        ' style="rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;align=center;fontStyle=1;fontSize=15;' +
        'fillColor=' + cGroupBg + ';strokeColor=' + cGroupBorder + ';fontColor=' + cGroupInk + ';"' +
        ' vertex="1" parent="' + lid + '">' + geoXml(gGeo, lGeo.x, lGeo.y) + '</mxCell>');

      /* 模块卡片:标题加粗 + 条目逐行(html=1 富文本 label,只需一次 XML 属性转义) */
      (g.blocks || []).forEach(function(b) {
        var bGeo = rectOf(kinds.card[b.id]);
        if (!bGeo) return;
        idMap[b.id] = 'b_' + b.id;
        bump(bGeo);
        cells.push('<mxCell id="b_' + b.id + '" value="' + drawioEsc(drawioLabelHtml(b.title, b.items)) + '"' +
          ' style="rounded=0;whiteSpace=wrap;html=1;verticalAlign=middle;align=center;fontSize=13;' +
          'fillColor=' + cCardBg + ';strokeColor=' + cCardBorder + ';fontColor=' + cCardInk + ';"' +
          ' vertex="1" parent="' + gid + '">' + geoXml(bGeo, gGeo.x, gGeo.y) + '</mxCell>');
      });
    });
  });

  /* 层间连线:必须带 <mxGeometry> 才是合法 edge cell(缺了几何,draw.io 里连线会漂、不可编辑) */
  (diagram.connections || []).forEach(function(c) {
    var srcId = idMap[c.from], tgtId = idMap[c.to];
    if (!srcId || !tgtId || c.from === c.to) return;
    var style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;strokeColor=#475569;';
    style += isFlow
      ? 'exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;'
      : 'exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;';
    if (c.style === 'dashed') style += 'dashed=1;';
    else if (c.style === 'dotted') style += 'dashed=1;dashPattern=2 4;';
    if (c.label) style += 'labelBackgroundColor=#ffffff;fontColor=#475569;fontSize=11;';
    var val = c.label ? ' value="' + drawioEsc(c.label) + '"' : '';
    cells.push('<mxCell id="e_' + c.id + '"' + val + ' style="' + style + '"' +
      ' edge="1" parent="1" source="' + srcId + '" target="' + tgtId + '">' +
      '<mxGeometry relative="1" as="geometry"/></mxCell>');
  });

  /* sidebar:右侧竖条 → swimlane(标题带) + 条目文本子 cell;不能把所有文字塞进标题带 */
  (diagram.sidebar || []).forEach(function(sb) {
    var sGeo = rectOf(kinds.sbar[sb.id]);
    if (!sGeo) return;
    var sid = 's_' + sb.id;
    bump(sGeo);
    cells.push('<mxCell id="' + sid + '" value="' + drawioEsc(drawioHtmlText(sb.title || '')) + '"' +
      ' style="swimlane;horizontal=1;startSize=30;whiteSpace=wrap;html=1;fontStyle=1;fontSize=14;collapsible=0;' +
      'fillColor=' + drawioHex(sb.color, cBlue) + ';swimlaneFillColor=' + cSbarBg + ';strokeColor=' + cSbarBorder + ';fontColor=#ffffff;"' +
      ' vertex="1" parent="1">' + geoXml(sGeo) + '</mxCell>');
    var txt = (sb.items || []).map(function(it) { return drawioHtmlText(itemText(it)).trim(); })
      .filter(function(t) { return t; }).join('<br>');
    if (txt) {
      cells.push('<mxCell id="' + sid + '_i" value="' + drawioEsc(txt) + '"' +
        ' style="text;html=1;whiteSpace=wrap;align=center;verticalAlign=middle;fontSize=13;strokeColor=none;fillColor=none;fontColor=#ffffff;"' +
        ' vertex="1" parent="' + sid + '">' +
        '<mxGeometry x="4" y="34" width="' + Math.max(1, sGeo.w - 8).toFixed(1) +
        '" height="' + Math.max(1, sGeo.h - 38).toFixed(1) + '" as="geometry"/></mxCell>');
    }
  });

  /* legend:底部图例 → 色块 + 文字两个 cell(与画布一致:小色块 + 灰字,不是整块染色白字)。
     图例的 data-id 复用分组 id,按 DOM 顺序取第 i 个图例元素,取不到再退回同 id 分组。 */
  (diagram.legend || []).forEach(function(lg, i) {
    var lgGeo = rectOf(legendEls[i]) || rectOf(kinds.group[lg.id]);
    if (!lgGeo) return;
    bump(lgGeo);
    var sw = 14, swY = lgGeo.y + Math.max(0, (lgGeo.h - sw) / 2);
    cells.push('<mxCell id="leg_' + lg.id + '" value=""' +
      ' style="rounded=0;whiteSpace=wrap;html=1;fillColor=' + drawioHex(lg.color, cBlue) +
      ';strokeColor=' + cGroupBorder + ';" vertex="1" parent="1">' +
      '<mxGeometry x="' + lgGeo.x.toFixed(1) + '" y="' + swY.toFixed(1) +
      '" width="' + sw + '" height="' + sw + '" as="geometry"/></mxCell>');
    cells.push('<mxCell id="legt_' + lg.id + '" value="' + drawioEsc(lg.title || '') + '"' +
      ' style="text;whiteSpace=wrap;align=left;verticalAlign=middle;fontSize=13;strokeColor=none;fillColor=none;fontColor=' + cMuted + ';"' +
      ' vertex="1" parent="1">' +
      '<mxGeometry x="' + (lgGeo.x + sw + 6).toFixed(1) + '" y="' + lgGeo.y.toFixed(1) +
      '" width="' + Math.max(1, lgGeo.w - sw - 6).toFixed(1) + '" height="' + lgGeo.h.toFixed(1) + '" as="geometry"/></mxCell>');
  });

  var pageW = isFinite(bx1) ? Math.max(200, Math.ceil(bx1) + 20) : 850;
  var pageH = isFinite(by1) ? Math.max(200, Math.ceil(by1) + 20) : 1100;
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<mxfile host="app.diagrams.net">\n' +
    '<diagram id="' + drawioEsc(diagram.id || 'archform') + '" name="' + drawioEsc(title) + '">\n' +
    '<mxGraphModel dx="0" dy="0" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1"' +
    ' fold="1" page="1" pageScale="1" pageWidth="' + pageW + '" pageHeight="' + pageH + '" math="0" shadow="0">\n' +
    '<root>\n' + cells.join('\n') + '\n</root>\n' +
    '</mxGraphModel>\n</diagram>\n</mxfile>';
}

/* 下载 .drawio 文件 */
function exportDrawio() {
  if (!diagram) return;
  var xml = '';
  try { xml = buildDrawioXml(); } catch (err) {
    alert('draw.io 导出失败:' + (err && err.message ? err.message : err));
    return;
  }
  /* 一个 cell 都没量到时宁可报错,也不要导出空图 */
  if (!xml || xml.indexOf('vertex="1"') < 0) {
    alert('没读到任何元素坐标,请等画布渲染完成后再导出');
    return;
  }
  var blob = new Blob([xml], { type: 'application/vnd.jgraph.mxfile' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (diagram.title || '架构图') + '.drawio';
  document.body.appendChild(a);
  a.click();
  a.remove();
  /* 立即 revoke 在部分浏览器会掐断下载(得到空/截断文件),延后释放 */
  setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
}

/* 依据 diagram 重画(或清除)canvas 内 .conn-overlay;opts 供编辑面板实时预览 */
function drawConnections(opts) {
  var cv = canvasRef();
  if (!cv) return;
  /* 双分支:layered 走多轨道正交,flow 走相邻列水平箭头 */
  var items = [];
  if (diagram) {
    items = diagram.layout === 'layered' ? connItems(opts) : diagram.layout === 'flow' ? connFlowItems(opts) : [];
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
  arrowPath.setAttribute('fill', '#475569');
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);
  /* 每条线一个 <g>:悬停时整组(线 + 说明)一起高亮,便于在密集连线里认出某一条 */
  items.forEach(function(it, idx) {
    var g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'conn-g');
    g.setAttribute('data-ci', String(idx));
    if (it.cid) g.setAttribute('data-conn-id', it.cid);
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('class', 'conn-path');
    path.setAttribute('d', it.d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#475569');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('marker-end', 'url(#connArr)');
    if (it.style === 'dashed') path.setAttribute('stroke-dasharray', '6 4');
    else if (it.style === 'dotted') path.setAttribute('stroke-dasharray', '2 4');
    g.appendChild(path);
    /* 标签(白底矩形 + 居中文字;layered 在轨道旁,flow 在箭头正上方) */
    if (it.label) {
      var tw = connLabelWidth(it.label), th = 18;
      var lb = connLabelBox(it, tw, th);
      var rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('class', 'conn-label-bg');
      rect.setAttribute('x', lb.x);
      rect.setAttribute('y', lb.y);
      rect.setAttribute('width', lb.w);
      rect.setAttribute('height', lb.h);
      rect.setAttribute('rx', '2');
      rect.setAttribute('fill', '#fff');
      rect.setAttribute('stroke', '#cbd5e1');
      rect.setAttribute('stroke-width', '1');
      g.appendChild(rect);
      var text = document.createElementNS(ns, 'text');
      text.setAttribute('class', 'conn-label');
      text.setAttribute('x', lb.cx);
      text.setAttribute('y', it.ly);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', '#475569');
      text.textContent = it.label;
      g.appendChild(text);
    }
    svg.appendChild(g);
  });
  cv.appendChild(svg);
}
