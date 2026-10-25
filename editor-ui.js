/* ================= 属性面板 ================= */
/* 面板字段全部来自 editor-core.js 的 NODE_TYPES[type].fields,
   这里只负责把「字段描述」画成控件 —— 加一种节点类型/布局专属字段不用改这个文件。 */
function renderProps() {
  const box = document.getElementById('props');
  if (!selectedId || !diagram) { box.innerHTML = '<div class="empty-tip">选中左侧结构树节点或画布模块进行编辑</div>'; return; }
  const node = findNode(selectedId);
  if (!node) { box.innerHTML = ''; return; }
  const t = nodeType(node);
  const parent = findParent(node.id);
  const ctx = {
    type: t,
    layout: layoutOf(diagram).id,
    inSidebar: !!(parent && parent.id === SIDEBAR_ROOT.id),
  };
  box.innerHTML = nodeFieldsOf(t, node, ctx).map(f => propFieldHtml(f, node, ctx)).join('');
}

/* 一个字段 → 一个控件（kind 的含义见 editor-core.js 注册表注释） */
function propFieldHtml(f, node, ctx) {
  const label = typeof f.label === 'function' ? f.label(node, ctx) : f.label;
  const group = typeof f.group === 'function' ? f.group(node, ctx) : f.group;
  const val = f.value ? f.value(node, ctx) : node[f.k];
  switch (f.kind) {
    case 'text':
      return field(f.k, label, val, f);
    case 'color':
      return colorPicker(f.k, label, val);
    case 'select':
      return selField(f.k, label, val, typeof f.options === 'function' ? f.options(node, ctx) : f.options);
    case 'check':
      return '<div class="prop-field"><label><input type="checkbox" data-k="' + f.k + '"' +
        (val ? ' checked' : '') + '> ' + label + '</label></div>';
    case 'chips':
      return '<div class="prop-group"><div class="pg-title">' + group + '</div>' + chipEditor(f.k) + '</div>';
    case 'button':
      return '<div class="prop-field"><button type="button" class="' + (f.cls || '') + '" ' +
        f.attr + '="' + esc(f.attrValue ? f.attrValue(node, ctx) : '') + '">' + label + '</button></div>';
    case 'hint':
      return '<div class="prop-group"><div class="pg-title">' + group + '</div>' +
        '<div class="hint">' + f.html + '</div></div>';
    default:
      return '';
  }
}

function field(key, label, val, f) {
  /* data-list="a.b.c" 表示写进嵌套路径（逗号分隔的数组），用于布局专属数据如 ext.table.columns */
  const list = f && f.list ? ' data-list="' + f.list + '"' : '';
  return '<div class="prop-field"><label>' + label + '</label>' +
    '<input type="text" value="' + esc(val ?? '') + '" data-k="' + key + '"' + list + '></div>';
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
    var dot = text.indexOf('[') >= 0 ? '<span class="ref-dot"></span>' : '';
    return '<span class="chip-item">' + dot + esc(text) + '<button data-chip-del="' + i + '">×</button></span>';
  }).join('');
  return '<div class="chip-edit">' + chips + '</div>' +
    '<div class="chip-add-row"><input type="text" id="chipInput" placeholder="输入后回车新增(支持 [调用:xx]/[依赖:xx] 角标)"><button data-chip-add="' + key + '">新增</button></div>';
}

/* ================= 连线菜单按钮文案同步 ================= */
function updateConnBtn() {
  var btn = document.querySelector('[data-cmd="show-conn"]');
  if (!btn) return;
  btn.textContent = (diagram && diagram.showConnections) ? '隐藏层间连线' : '显示层间连线';
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
function startBlank() {
  const hasContent = !!(diagram && (diagram.layers || []).length);
  // 已有内容才问一句(首访/空图直接给新图,不打断从启动面板进入的流程)
  if (hasContent && !confirm('新建空白图？当前内容将丢失（可先点"导出JSON"备份）。')) return;
  pushUndo();
  diagram = { schemaVersion: 2, id: uid(), title: '未命名架构图', subtitle: '', layout: DEFAULT_LAYOUT, ext: {}, connections: [], showConnections: false, layers: [] };
  selectedId = null;
  applyThemeVars(COLOR_SCHEMES[0].vars);   // 空白图恢复默认配色
  persist(); render(); renderProps();
}
function newBlank() { startBlank(); }

/* ================= 缩略图渲染(开始页与模板库共用) ================= */
/* 做法:用 buildArchHtml 在离屏容器里把 .arch 拼出来,直接塞进格子再等比缩下来。
   不借真实画布 —— 于是不必渲染整棵树/缩放/连线,既不会闪,也不会改动用户当前那张图。
   配色变量写在缩略图自己身上(:root 不动)。
   缓存按「面板 + 模板」分开存:开始页和模板库各留一份,省得两个面板互相偷节点
   (偷来偷去会让"已经画好"的那一面变空,再打开又得整块重排)。 */
const THUMB_W = 1600;          // 画布标准宽度:缩略图按它渲染再缩下来,与真图布局一致
const thumbCache = new Map();  // 'start|key' / 'lib|key' -> 已画好的 .arch 节点(只缓存自带配色的模板)
let thumbToken = 0;            // 换面板/关闭时作废还没跑完的任务
let thumbOwner = null;         // 当前在铺缩略图的是谁:'start' | 'lib'
function endThumbSession(owner) {
  if (owner && thumbOwner !== owner) return;   // 不是自己的任务,别去停别人的
  thumbToken++;
  thumbOwner = null;
}

/* 把缓存里的缩略图填进格子(顺带按新格子宽度重算缩放);返回还需要现画的 key。
   写法上刻意「先全部插入、再统一读宽度、最后写 transform」:边插边读会让每张图都触发一次整块重排。 */
function fillThumbSlots(owner, keys, hostOf) {
  const missing = [];
  const placed = [];
  keys.forEach(k => {
    const host = hostOf(k);
    if (!host) return;
    const node = thumbCache.get(owner + '|' + k);
    if (!node) { missing.push(k); return; }
    if (node.parentNode !== host) { host.innerHTML = ''; host.appendChild(node); }
    placed.push([node, host]);
  });
  placed.forEach(([node, host]) => {
    node.style.transform = 'scale(' + ((host.clientWidth || 240) / THUMB_W).toFixed(4) + ')';
  });
  return missing;
}

/* 现画一个缩略图:克隆模板 → 映射配色 → 拼 .arch HTML → 塞进格子 → 固化配色变量 */
function paintThumb(host, tpl, fallbackVars, hostW) {
  if (!host || !tpl) return false;
  if (host.querySelector('.sp-shot')) return true;   // 已经有成品了(缓存刚搬进来的)
  const d = migrateDiagram(JSON.parse(JSON.stringify(tpl)));
  if (!d || d.error) return false;
  let vars = fallbackVars;
  if (tpl.scheme && schemeDiagram(d, tpl.scheme)) {
    const s = COLOR_SCHEMES.find(x => x.id === tpl.scheme);
    if (s) vars = s.vars;
  }
  const scale = ((hostW || 240) / THUMB_W).toFixed(4);
  host.innerHTML = buildArchHtml(d, 'sp-shot', 'width:' + THUMB_W + 'px;transform:scale(' + scale + ')', false);
  applyThemeVars(vars, host.firstChild);
  void host.offsetHeight;   // 当场把这张的排版算进本帧预算,别让十几张的排版堆到帧末一次爆掉
  return true;
}

/* 一帧只铺一张:每张要排版一整幅 1600px 的真图,一帧塞几张就会把这一帧拖到 100ms 以上。
   铺完再让出主线程 —— 面板立刻能点,缩略图在后面几帧里一张张浮现(13 张约 0.2~0.3 秒铺满)。 */
function renderTemplateThumbs(owner, keys, hostOf, onShot) {
  thumbToken++;
  const token = thumbToken;
  thumbOwner = owner;
  const savedVars = (diagram && diagram.theme && diagram.theme.vars) || COLOR_SCHEMES[0].vars;
  const tpls = window.ARCH_TEMPLATES || {};
  let i = 0;
  let hostW = 0;                                    // 格子宽度只量一次(同一栅格里都一样宽)
  const step = () => {
    if (token !== thumbToken) return;                 // 面板已关/已换:剩下的不画了
    if (i >= keys.length) { thumbOwner = null; return; }
    const k = keys[i++];
    const host = hostOf(k);
    if (host) {
      if (!hostW) hostW = host.clientWidth || 240;
      try {
        paintThumb(host, tpls[k], savedVars, hostW);
        if (onShot && host.firstChild) onShot(k, host);
      } catch (e) {
        host.innerHTML = '<span class="sp-ph">预览生成失败</span>';
      }
    }
    if (i < keys.length) requestAnimationFrame(step);
    else thumbOwner = null;
  };
  requestAnimationFrame(step);
}

/* ================= 启动面板(欢迎页:讲功能 + 新建空图 + 从模板创建) ================= */
function openStartPanel() {
  const el = document.getElementById('startPanel');
  if (!el) return;
  if (!el.hidden) return;   // 已经开着就不再重跑(重进会把格子重建一遍,缩略图白搬一次)
  el.hidden = false;
  /* 同模板库:面板先亮,格子与缩略图下一帧再铺,首屏点击不当场卡一下 */
  requestAnimationFrame(() => { if (!el.hidden) fillStartPanel(); });
}
function closeStartPanel() {
  const el = document.getElementById('startPanel');
  if (!el || el.hidden) return;
  endThumbSession('start');   // 停掉还没画完的缩略图任务(画到一半的格子下次再补)
  el.hidden = true;
}
function fillStartPanel() {
  const grid = document.getElementById('spGrid');
  if (!grid) return;
  const tpls = window.ARCH_TEMPLATES || {};
  const keys = Object.keys(tpls);
  const cnt = document.getElementById('spCount');
  if (cnt) cnt.textContent = '共 ' + keys.length + ' 个模板 · 缩略图由当前渲染引擎实时生成';
  /* 模板集合没变就沿用现有格子,只把缓存的缩略图补/搬回去(重开面板不再重建 13 块大结构) */
  const sig = keys.join('|');
  const reuse = grid.getAttribute('data-sig') === sig && grid.children.length === keys.length + 1;
  if (!reuse) {
    let html = '<button type="button" class="sp-tile sp-tile-blank" id="spBlankTile">' +
                 '<span class="sp-plus">+</span>' +
                 '<span class="sp-blank-t">空白图</span>' +
                 '<span class="sp-blank-d">从一层一张卡开始</span>' +
               '</button>';
    keys.forEach(k => {
      const t = tpls[k] || {};
      const lay = layoutShort(t.layout);
      const tags = (t.tags || []).map(x => '<i class="sp-tag">' + esc(x) + '</i>').join('');
      html += '<button type="button" class="sp-tile" data-sp-tpl="' + esc(k) + '">' +
                '<span class="sp-thumb" data-sp-thumb="' + esc(k) + '"><span class="sp-ph">生成预览…</span></span>' +
                '<span class="sp-meta">' +
                  '<span class="sp-tile-title">' + esc(t.title || k) + '</span>' +
                  '<span class="sp-tile-desc">' + esc(t.desc || '（暂无说明）') + '</span>' +
                  '<span class="sp-tags"><i class="sp-tag lay">' + lay + '</i>' + tags + '</span>' +
                '</span>' +
              '</button>';
    });
    grid.innerHTML = html;
    grid.setAttribute('data-sig', sig);
  }
  const missing = fillThumbSlots('start', keys, k => document.querySelector('[data-sp-thumb="' + k + '"]'));
  if (missing.length) {
    renderTemplateThumbs('start', missing,
      k => document.querySelector('[data-sp-thumb="' + k + '"]'),
      (k, host) => { if ((tpls[k] || {}).scheme) thumbCache.set('start|' + k, host.firstChild); });
  }
}

/* ================= 模板库(搜索 + 板式/场景筛选 + 实时缩略图) ================= */
/* 与开始页共用 .sp-tile 与缩略图渲染,只是多了搜索与筛选;模板涨到几十个也只是滚动 + 搜索。 */
let tlFilter = { q: '', lay: 'all', tag: '' };

function tplLibMatches(key) {
  const t = (window.ARCH_TEMPLATES || {})[key] || {};
  const lay = layoutOf(t).id;
  if (tlFilter.lay !== 'all' && lay !== tlFilter.lay) return false;
  if (tlFilter.tag && (t.tags || []).indexOf(tlFilter.tag) < 0) return false;
  const q = tlFilter.q.trim().toLowerCase();
  if (!q) return true;
  const hay = (t.title || '') + ' ' + (t.desc || '') + ' ' + (t.tags || []).join(' ') + ' ' + key;
  return hay.toLowerCase().indexOf(q) >= 0;
}

/* 板式筛选按钮由布局注册表生成(层次 / 流向 / 清单 …),再带上一颗「全部」。
   以后在 editor-layout.js 里加一种板式,这里自动多一颗按钮,不用改界面代码。 */
function fillTplLibSeg() {
  const box = document.getElementById('tlSeg');
  if (!box) return;
  const tpls = window.ARCH_TEMPLATES || {};
  const keys = Object.keys(tpls);
  const countOf = id => keys.filter(k => id === 'all' || layoutOf(tpls[k]).id === id).length;
  const items = [{ id: 'all', short: '全部', name: '全部板式' }].concat(
    LAYOUT_LIST.map(L => ({ id: L.id, short: L.short, name: L.name })));
  const sig = items.map(x => x.id + ':' + countOf(x.id)).join('|');
  if (box.getAttribute('data-sig') !== sig) {
    box.innerHTML = items.map(x =>
      '<button type="button" data-lay="' + esc(x.id) + '" title="' + esc(x.name) + '">' +
        esc(x.short) + '<i class="tl-n">' + countOf(x.id) + '</i>' +
      '</button>').join('');
    box.setAttribute('data-sig', sig);
  }
  Array.prototype.forEach.call(box.querySelectorAll('button'), b => {
    b.classList.toggle('on', b.getAttribute('data-lay') === tlFilter.lay);
  });
}

function fillTplLib() {
  fillTplLibSeg();
  const tpls = window.ARCH_TEMPLATES || {};
  const tags = [];
  Object.keys(tpls).forEach(k => (tpls[k].tags || []).forEach(t => { if (tags.indexOf(t) < 0) tags.push(t); }));
  const box = document.getElementById('tlTags');
  if (box) {
    box.classList.remove('open');
    box.innerHTML = tags.map(t =>
      '<button type="button" class="tl-tag" data-tl-tag="' + esc(t) + '">' + esc(t) + '</button>').join('');
    const more = document.getElementById('tlMore');
    // 先露两行,标签一多(模板变多时)就折叠,给个展开开关,别让标签行吃掉整屏
    if (more) { more.hidden = box.scrollHeight <= box.clientHeight + 2; more.textContent = '更多标签'; }
  }
  renderTplLib();
}

function renderTplLib() {
  const grid = document.getElementById('tlGrid');
  if (!grid) return;
  const tpls = window.ARCH_TEMPLATES || {};
  const all = Object.keys(tpls);
  const keys = all.filter(tplLibMatches);
  const cnt = document.getElementById('tlCount');
  if (cnt) cnt.textContent = keys.length === all.length ? String(all.length) : keys.length + ' / ' + all.length;
  if (!keys.length) {
    grid.removeAttribute('data-sig');
    grid.innerHTML = '<div class="tl-empty">没有匹配的模板：换个关键词，或点上方「全部」看所有模板</div>';
    return;
  }
  /* 同一批模板就沿用现有格子(切筛选/重开面板不重建 DOM),只把缓存的缩略图补/搬回去 */
  const sig = keys.join('|');
  const reuse = grid.getAttribute('data-sig') === sig && grid.children.length === keys.length;
  if (!reuse) {
    grid.innerHTML = keys.map(k => {
      const t = tpls[k] || {};
      const lay = layoutShort(t.layout);
      const tags = (t.tags || []).map(x => '<i class="sp-tag">' + esc(x) + '</i>').join('');
      return '<button type="button" class="sp-tile" data-tl-tpl="' + esc(k) + '">' +
               '<span class="sp-thumb" data-tl-thumb="' + esc(k) + '"><span class="sp-ph">生成预览…</span></span>' +
               '<span class="sp-meta">' +
                 '<span class="sp-tile-title">' + esc(t.title || k) + '</span>' +
                 '<span class="sp-tile-desc">' + esc(t.desc || '（暂无说明）') + '</span>' +
                 '<span class="sp-tags"><i class="sp-tag lay">' + lay + '</i>' + tags + '</span>' +
               '</span>' +
             '</button>';
    }).join('');
    grid.setAttribute('data-sig', sig);
  }
  /* 已经画过的直接从缓存搬节点(不重新解析 HTML),剩下的按帧现画 */
  const missing = fillThumbSlots('lib', keys, k => grid.querySelector('[data-tl-thumb="' + k + '"]'));
  if (missing.length) {
    renderTemplateThumbs('lib', missing,
      k => grid.querySelector('[data-tl-thumb="' + k + '"]'),
      (k, host) => { if ((tpls[k] || {}).scheme) thumbCache.set('lib|' + k, host.firstChild); });
  }
}

function openTplLib() {
  const el = document.getElementById('tplLib');
  if (!el) return;
  if (!el.hidden) return;
  const spEl = document.getElementById('startPanel');
  if (spEl && !spEl.hidden) closeStartPanel();   // 两个浮层不叠着开(开始页里再点「模板」时)
  tlFilter = { q: '', lay: 'all', tag: '' };
  const s = document.getElementById('tlSearch');
  if (s) s.value = '';
  fillTplLibSeg();   // 板式按钮先就位(顺带把「全部」点亮),别等下一帧
  el.hidden = false;
  if (s) { try { s.focus(); } catch (e) { } }
  /* 面板先亮、内容下一帧再铺:13 个格子 + 标签和搜索框一起建要几十毫秒,
     放在点击这一帧里就是那一下「点下去没反应」。 */
  requestAnimationFrame(() => { if (!el.hidden) fillTplLib(); });
}

function closeTplLib() {
  const el = document.getElementById('tplLib');
  if (!el || el.hidden) return;
  endThumbSession('lib');   // 停掉还没画完的缩略图任务(画到一半的格子下次再补)
  el.hidden = true;
}

function pickTemplateFromLib(key) {
  if (!key || !(window.ARCH_TEMPLATES || {})[key]) return;
  const hasContent = !!(diagram && (diagram.layers || []).length);
  if (hasContent && !confirm('从模板新建会替换当前图，确定继续？（可用 Ctrl+Z 撤销）')) return;
  // 顺序同开始页:先关(关闭时会还原被借用的画布),再加载新模板;反过来新图会被还原覆盖
  closeTplLib();
  loadTemplateByKey(key, { useTemplateScheme: true });
}

/* ================= 从文本生成图 ================= */
function showTextGenModal() {
  const old = document.getElementById('textGenModal');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'textGenModal';
  overlay.className = 'tg-overlay';
  overlay.innerHTML =
    '<div class="tg-dialog">' +
      '<div class="tg-title">从文本生成图</div>' +
      '<div class="tg-hint">用缩进表示层级（Tab 或每 2 个空格一级）：depth 0=层 · 1=分组 · 2=模块 · 3=条目（逗号分隔多个）</div>' +
      '<textarea id="tgInput" class="tg-textarea" spellcheck="false" placeholder="展示层\n  前端组件\n    登录页面\n      用户名,密码,验证码"></textarea>' +
      '<div class="tg-preview" id="tgPreview"><div class="tg-empty">输入文本后在此预览结构</div></div>' +
      '<div class="tg-actions">' +
        '<button type="button" id="tgGen" class="tg-btn primary">生成新图</button>' +
        '<button type="button" id="tgCancel" class="tg-btn">取消</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  document.getElementById('tgInput').addEventListener('input', updateTextGenPreview);
  document.getElementById('tgCancel').addEventListener('click', () => overlay.remove());
  document.getElementById('tgGen').addEventListener('click', confirmTextGen);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('tgInput').addEventListener('keydown', e => {
    if (e.key === 'Escape') overlay.remove();
  });
  document.getElementById('tgInput').focus();
}

function updateTextGenPreview() {
  const input = document.getElementById('tgInput');
  const preview = document.getElementById('tgPreview');
  if (!input || !preview) return;
  if (!input.value.trim()) { preview.innerHTML = '<div class="tg-empty">输入文本后在此预览结构</div>'; return; }
  const d = parseIndented(input.value);
  if (!d.layers.length) { preview.innerHTML = '<div class="tg-empty">未识别到有效结构</div>'; return; }
  preview.innerHTML = d.layers.map(l => {
    const bc = l.groups.reduce((s, g) => s + g.blocks.length, 0);
    let html = '<div class="tg-node tg-layer"><span class="tg-ico">&#9638;</span><b>' + esc(l.name) + '</b>' +
               ' <span class="tg-cnt">' + l.groups.length + ' 分组 · ' + bc + ' 模块</span>';
    for (const g of l.groups) {
      html += '<div class="tg-node tg-group"><span class="tg-ico">&#9636;</span>' + esc(g.title) +
              ' <span class="tg-cnt">' + g.blocks.length + ' 模块</span></div>';
    }
    return html + '</div>';
  }).join('');
}

function confirmTextGen() {
  const input = document.getElementById('tgInput');
  if (!input || !input.value.trim()) { alert('请先输入文本'); return; }
  const d = parseIndented(input.value);
  if (!d.layers.length) { alert('未识别到有效结构'); return; }
  pushUndo();
  diagram = d;
  selectedId = null;
  applyThemeVars(COLOR_SCHEMES[0].vars);
  document.getElementById('textGenModal').remove();
  persist(); render(); renderProps();
  alert('已生成：' + d.layers.length + ' 层');
}

/* ================= 层间连线编辑面板 ================= */
/* 右侧浮层面板(不遮画布):改连线时能同时看到图。
   · 起点/终点是「手柄」按钮:点一下进入点选态,直接在画布上点层(捕获阶段拦下,不触发选中)
   · 每次改动即时预览(草稿 overlay),保存才写入 diagram;取消回滚「显示」开关
   · 「按层顺序自动连线」一键补满相邻层,增减行沿用上一条的终点/线型 */
let _connDraft = [];        // [{id?, from, to, style, label}] 工作副本
let _connVis0 = false;      // 打开面板时的 showConnections 原值(取消回滚)
let _connPick = null;       // 待点选:{i: 行下标, f: 'from'|'to'}
let _connEscH = null;       // 面板期 Esc 监听
let _connClickH = null;     // 面板期画布点选监听(捕获阶段)

function connLayerOf(id) {
  var ls = (diagram && diagram.layers) || [];
  for (var i = 0; i < ls.length; i++) if (ls[i].id === id) return ls[i];
  return null;
}
function connLayerIndex(id) {
  var ls = (diagram && diagram.layers) || [];
  for (var i = 0; i < ls.length; i++) if (ls[i].id === id) return i;
  return -1;
}
function connPickInner(c, f) {
  var l = connLayerOf(c[f]);
  if (!l) return '<span class="ce-ph">点此选择</span>';
  return '<span class="ce-dot" style="background:' + (l.bandColor || '#2379bd') + '"></span>' +
         '<span class="ce-nm">' + esc(l.name || '未命名层') + '</span>';
}
function connRowHtml(c, i) {
  var bad = (!c.from || !c.to || c.from === c.to);
  var pick = (_connPick && _connPick.i === i) ? _connPick.f : '';
  var sOpts = [['solid', '实线'], ['dashed', '虚线'], ['dotted', '点线']].map(function(p) {
    return '<option value="' + p[0] + '"' + ((c.style || 'solid') === p[0] ? ' selected' : '') + '>' + p[1] + '</option>';
  }).join('');
  /* 只允许相邻列的布局(flow)就地提示,而不是保存后再弹警告 */
  var warn = '';
  if (layoutCaps(diagram).connAdjacent && c.from && c.to && c.from !== c.to) {
    if (connLayerIndex(c.to) !== connLayerIndex(c.from) + 1) {
      warn = '「' + layoutName(diagram.layout) + '」只渲染相邻两列，这条不会出现在图上';
    }
  }
  var rowCls = 'ce-row' + (bad ? ' bad' : '') + (warn ? ' warn' : '');
  return '<div class="' + rowCls + '" data-i="' + i + '">' +
    '<div class="ce-line1">' +
      '<button type="button" class="ce-pick' + (pick === 'from' ? ' picking' : '') + '" data-f="from" data-i="' + i + '">'
        + (pick === 'from' && !c.from ? '<span class="ce-ph">点画布上的层…</span>' : connPickInner(c, 'from')) + '</button>' +
      '<span class="ce-arrow">\u2192</span>' +
      '<button type="button" class="ce-pick' + (pick === 'to' ? ' picking' : '') + '" data-f="to" data-i="' + i + '">'
        + (pick === 'to' && !c.to ? '<span class="ce-ph">点画布上的层…</span>' : connPickInner(c, 'to')) + '</button>' +
      '<button type="button" class="ce-del" data-i="' + i + '" title="删除这条">\u2715</button>' +
    '</div>' +
    '<div class="ce-line2">' +
      '<select class="ce-style" data-f="style" data-i="' + i + '">' + sOpts + '</select>' +
      '<input class="ce-label" data-f="label" data-i="' + i + '" type="text" value="' + esc(c.label || '') + '" placeholder="说明(可留空，显示在箭头旁)">' +
    '</div>' +
    (warn ? '<div class="ce-warn">' + warn + '</div>' : '') +
    '</div>';
}
function renderConnRows() {
  var wrap = document.getElementById('ceRows');
  if (!wrap) return;
  var layers = (diagram && diagram.layers) || [];
  if (layers.length < 2) {
    wrap.innerHTML = '<div class="ce-empty">至少需要 2 个层才能连线（当前 ' + layers.length + ' 个）。<br>先在左侧结构树里添加层。</div>';
    return;
  }
  wrap.innerHTML = _connDraft.length
    ? _connDraft.map(connRowHtml).join('')
    : '<div class="ce-empty">还没有连线。<br>点「按层顺序自动连线」一键铺满相邻层，或「＋ 添加一条」手动选。</div>';
}
function ceTip(msg) {
  var t = document.getElementById('ceTip');
  if (t) t.textContent = msg || '';
}
/* 在面板里开始建/补连线时自动打开「在画布上显示」。
   模板默认 showConnections:false，若不自动打开，保存后图上一条线都看不到（看起来像没生效）。
   只改内存并在保存时落盘；点「取消」仍按 _connVis0 回滚。 */
function connEnsureVisible() {
  if (!diagram || diagram.showConnections) return;
  if (!_connDraft.length) return;
  diagram.showConnections = true;
  var cb = document.querySelector('#connPanel [data-cmd="conn-vis"]');
  if (cb) cb.checked = true;
  updateConnBtn();
}
function syncConnBadges() {
  var bad = _connDraft.some(function(c) { return !c.from || !c.to || c.from === c.to; });
  var btn = document.getElementById('ceSave');
  if (btn) btn.disabled = bad;
  document.querySelectorAll('#connPanel .ce-row').forEach(function(row) {
    var c = _connDraft[parseInt(row.getAttribute('data-i'), 10)];
    var isBad = c && (!c.from || !c.to || c.from === c.to);
    row.classList.toggle('bad', !!isBad);
  });
  if (bad) ceTip('有未完成或指向自身的行（红框），修正后才能保存。');
}
/* 草稿 → 画布预览(不写 diagram,不落盘) */
function connPreview() {
  if (!diagram) return;
  /* 「在画布上显示」关掉时预览也要一起关,否则取消回滚看起来没生效 */
  var on = !!diagram.showConnections;
  var rows = on ? _connDraft.filter(function(c) { return c.from && c.to && c.from !== c.to; }) : [];
  if (layoutCaps(diagram).railPad) {
    /* 预览时的轨道数来自草稿:补足左边距,否则新增层对的竖轨会叠在层名色带上 */
    var stack = document.querySelector('#archCanvas .lay-stack');
    if (stack) {
      stack.style.paddingLeft = (on ? connRailPad(rows) : 30) + 'px';
    } else {
      var cv = canvasRef();
      if (cv) cv.style.paddingLeft = (on && rows.length) ? Math.max(18, connRailPad(rows) + 1) + 'px' : '';
    }
  }
  drawConnections({ conns: rows, force: true });
}
function connAddRow() {
  var ls = (diagram && diagram.layers) || [];
  var last = _connDraft[_connDraft.length - 1];
  /* 智能默认:起点接上一条的终点(画连续箭头时不用每次重选),终点取它的下一层 */
  var fromId = (last && last.to) || (ls[0] && ls[0].id) || '';
  var fi = connLayerIndex(fromId);
  var next = ls[fi + 1] || {};
  _connDraft.push({ from: fromId, to: next.id || '', style: (last && last.style) || 'solid', label: '' });
  _connPick = { i: _connDraft.length - 1, f: 'to' };
  connEnsureVisible();
  renderConnRows(); syncConnBadges(); connPreview();
  canvasRef().classList.add('conn-picking');
  ceTip('点画布上的层作为「终点」，或点行内「终点」按钮换起点。');
}
function connAutoFill() {
  var ls = (diagram && diagram.layers) || [];
  if (ls.length < 2) { ceTip('至少要有 2 个层才能自动连线。'); return; }
  var added = 0;
  for (var k = 0; k < ls.length - 1; k++) {
    var a = ls[k].id, b = ls[k + 1].id;
    var has = _connDraft.some(function(c) { return c.from === a && c.to === b; });
    if (!has) { _connDraft.push({ from: a, to: b, style: 'solid', label: '' }); added++; }
  }
  connEnsureVisible();
  renderConnRows(); syncConnBadges(); connPreview();
  ceTip(added ? '已补 ' + added + ' 条相邻连线，改说明或删掉不需要的即可。' : '相邻层之间都已经有连线了。');
}
function connPickStart(i, f) {
  var layers = (diagram && diagram.layers) || [];
  if (layers.length < 2) { ceTip('至少要有 2 个层才能连线。'); return; }
  if (_connPick && _connPick.i === i && _connPick.f === f) { connPickStop(); return; }  /* 再点一次取消 */
  _connPick = { i: i, f: f };
  renderConnRows();
  canvasRef().classList.add('conn-picking');
  ceTip('在画布上点一个层作为「' + (f === 'from' ? '起点' : '终点') + '」；再点同一按钮取消。');
}
function connPickStop() {
  _connPick = null;
  var cv = canvasRef();
  if (cv) cv.classList.remove('conn-picking');
  renderConnRows();
  ceTip('');
}
/* 画布点选:捕获阶段拦下,不触发画布的选中/属性面板 */
function connPickHandle(e) {
  if (!_connPick) return;
  var t = e.target;
  var sec = (t && t.closest) ? t.closest('#archCanvas section.layer') : null;
  if (!sec) return;   /* 点空白或面板内部不处理,保持点选态 */
  e.preventDefault();
  e.stopPropagation();
  var id = sec.getAttribute('data-id');
  var row = _connDraft[_connPick.i];
  if (!row) { connPickStop(); return; }
  var f = _connPick.f, i = _connPick.i;
  var fromId = f === 'from' ? id : row.from;
  var toId = f === 'to' ? id : row.to;
  /* 只允许相邻列的布局:点选时就拦下,不让人配出永不显示的线 */
  if (layoutCaps(diagram).connAdjacent && fromId && toId) {
    var fi = connLayerIndex(fromId), ti = connLayerIndex(toId);
    if (Math.abs(ti - fi) !== 1) {
      var a = connLayerOf(fromId), b = connLayerOf(toId);
      ceTip('「' + layoutName(diagram.layout) + '」只能连相邻两列：' + ((a && a.name) || '?') + ' 与 ' + ((b && b.name) || '?') + ' 不相邻。');
      return;
    }
  }
  row[f] = id;
  _connPick = null;
  var cv = canvasRef();
  if (cv) cv.classList.remove('conn-picking');
  /* 刚选完起点 → 自动接着选终点 */
  if (f === 'from' && (!row.to || row.to === row.from)) {
    _connPick = { i: i, f: 'to' };
    if (cv) cv.classList.add('conn-picking');
    renderConnRows(); syncConnBadges(); connPreview();
    ceTip('起点已选，再点一个层作为「终点」。');
    return;
  }
  renderConnRows(); syncConnBadges(); connPreview();
  ceTip('');
}
function connPanelHtml() {
  var adjacent = layoutCaps(diagram).connAdjacent;
  var lname = layoutName(diagram.layout);
  return '<div class="ce-head">' +
      '<span class="ce-title">层间连线</span>' +
      '<label class="ce-vis"><input type="checkbox" data-cmd="conn-vis"' + (diagram.showConnections ? ' checked' : '') + '> 在画布上显示</label>' +
      '<button type="button" class="ce-x" data-cmd="conn-close" title="关闭（等同取消）">\u2715</button>' +
    '</div>' +
    '<div class="ce-hint">' + (adjacent
      ? '「' + lname + '」：只能连<b>相邻两列</b>，箭头画在列间空隙里，说明显示在箭头上方。'
      : '「' + lname + '」：任意层对都能连，箭头从起点层左缘出发、经左侧竖轨指向终点层，说明显示在竖轨旁。') +
      '点「起点」或「终点」后，直接在画布上点对应的层。</div>' +
    '<div class="ce-list" id="ceRows"></div>' +
    '<div class="ce-tools">' +
      '<button type="button" class="ce-btn" data-cmd="conn-auto">按层顺序自动连线</button>' +
      '<button type="button" class="ce-btn" data-cmd="conn-add">＋ 添加一条</button>' +
    '</div>' +
    '<div class="ce-foot">' +
      '<span class="ce-tip" id="ceTip"></span>' +
      '<button type="button" class="ce-btn" data-cmd="conn-cancel">取消</button>' +
      '<button type="button" class="ce-btn primary" id="ceSave" data-cmd="conn-save">保存</button>' +
    '</div>';
}
function showConnPanel(prefillFrom) {
  if (!diagram) return;
  closeConnPanel(false);
  /* 收起工具栏下拉(closeMenus 是 bindEvents 内的局部函数,这里直接关) */
  document.querySelectorAll('.menu-drop.open').forEach(function(m) { m.classList.remove('open'); });
  _connDraft = (diagram.connections || []).map(function(c) {
    return { id: c.id, from: c.from, to: c.to, style: c.style || 'solid', label: c.label || '' };
  });
  /* 从层属性面板进来时,把该层预填为起点 */
  if (prefillFrom) _connDraft.push({ from: prefillFrom, to: '', style: 'solid', label: '' });
  _connVis0 = !!diagram.showConnections;
  _connPick = null;
  var el = document.createElement('div');
  el.id = 'connPanel';
  el.className = 'ce-panel';
  el.innerHTML = connPanelHtml();
  document.body.appendChild(el);
  /* 面板贴工具栏下沿(工具栏可折行),高度不超出视口 */
  var tb = document.getElementById('toolbar');
  if (tb) {
    var top = Math.ceil(tb.getBoundingClientRect().bottom) + 8;
    el.style.top = top + 'px';
    el.style.maxHeight = Math.max(220, window.innerHeight - top - 12) + 'px';
  }
  if (prefillFrom) connEnsureVisible();   /* 从层属性进来即视为开始建线 */
  renderConnRows();
  syncConnBadges();
  connPreview();
  /* ---- 面板内事件(委托) ---- */
  el.addEventListener('change', function(e) {
    var vis = e.target.closest('[data-cmd="conn-vis"]');
    if (vis) {
      diagram.showConnections = vis.checked;   /* 即时生效,面板关闭时可回滚 */
      persist(); render();
      if (_connPick) canvasRef().classList.add('conn-picking');
      connPreview();
      return;
    }
    var s = e.target.closest('select.ce-style');
    if (s) {
      var row = _connDraft[+s.getAttribute('data-i')];
      if (row) row.style = s.value;
      connPreview();
    }
  });
  /* 说明文字只改草稿 + 预览,不重建行(否则中文输入法组合会被打断) */
  el.addEventListener('input', function(e) {
    var inp = e.target.closest('input.ce-label');
    if (!inp) return;
    var row = _connDraft[+inp.getAttribute('data-i')];
    if (row) row.label = inp.value;
    connPreview();
  });
  el.addEventListener('click', function(e) {
    if (e.target.closest('[data-cmd="conn-close"]') || e.target.closest('[data-cmd="conn-cancel"]')) { closeConnPanel(true); return; }
    if (e.target.closest('[data-cmd="conn-save"]')) { saveConnPanel(); return; }
    if (e.target.closest('[data-cmd="conn-add"]')) { connAddRow(); return; }
    if (e.target.closest('[data-cmd="conn-auto"]')) { connAutoFill(); return; }
    var del = e.target.closest('.ce-del');
    if (del) {
      _connPick = null;
      var cv = canvasRef();
      if (cv) cv.classList.remove('conn-picking');
      _connDraft.splice(+del.getAttribute('data-i'), 1);
      renderConnRows(); ceTip(''); syncConnBadges(); connPreview();
      return;
    }
    var pk = e.target.closest('.ce-pick');
    if (pk) { connPickStart(+pk.getAttribute('data-i'), pk.getAttribute('data-f')); return; }
  });
  /* Esc = 取消(焦点可能不在面板上,挂 document 级) */
  _connEscH = function(e) {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    closeConnPanel(true);
  };
  document.addEventListener('keydown', _connEscH, true);
  _connClickH = function(e) { connPickHandle(e); };
  document.addEventListener('click', _connClickH, true);
}
/* rollback=true:丢弃草稿,并把「在画布上显示」恢复到打开面板时的状态 */
function closeConnPanel(rollback) {
  if (_connEscH) { document.removeEventListener('keydown', _connEscH, true); _connEscH = null; }
  if (_connClickH) { document.removeEventListener('click', _connClickH, true); _connClickH = null; }
  _connPick = null;
  var cv = canvasRef();
  if (cv) cv.classList.remove('conn-picking');
  var m = document.getElementById('connPanel');
  var had = !!m;
  if (m) m.remove();
  _connDraft = [];
  if (!diagram) return;
  if (rollback && diagram.showConnections !== _connVis0) {
    diagram.showConnections = _connVis0;
    persist();
  }
  /* 重画:去掉预览 overlay(+预览期临时加的左内边距),回到真实连线 */
  if (had) render();
  updateConnBtn();
}
function saveConnPanel() {
  var rows = _connDraft.filter(function(c) { return c.from && c.to && c.from !== c.to; });
  /* 兜底:图里原本没有连线、用户又是在关着「在画布上显示」的情况下录进来的,
     保存时自动打开显示,否则落盘了却一条线都看不见。已有关联线时尊重用户的显示开关。 */
  if (rows.length && !diagram.showConnections && !(diagram.connections || []).length) {
    diagram.showConnections = true;
  }
  pushUndo();
  diagram.connections = rows.map(function(c) {
    return { id: c.id || uid(), from: c.from, to: c.to, style: c.style || 'solid', label: c.label || '' };
  });
  /* closeConnPanel(false) 内部已经 render()(用刚写入的 connections) */
  closeConnPanel(false);
  persist();
  renderProps();
}

/* ================= SVG 导出（离线，替代 html2canvas，无任何网络依赖） ================= */
/* 以现有 DOM 渲染为布局引擎：测量元素坐标生成纯 SVG（不用 foreignObject，保证可栅格化） */
let _clipSeq = 0;

function buildSvgString() {
  const root = document.querySelector('#captureArea .arch .canvas');
  if (!root) throw new Error('画布未就绪');
  const R = root.getBoundingClientRect();
  const scale = R.width / (root.offsetWidth || 1);   // 还原 transform 缩放
  const W = Math.ceil(R.width / scale), H = Math.ceil(R.height / scale);
  const defs = [];                                   // clipPath 等可复用定义
  _clipSeq = 0;
  let body = collectSvg(root, R, scale, defs);
  /* 注入连线 SVG 片段(与 DOM overlay 同几何,所见即所得) */
  try { const cx = connSvgXml(); if (cx) body += cx; } catch (e) {}
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
    (defs.length ? '<defs>' + defs.join('') + '</defs>' : '') + body + '</svg>';
}

/* 计算样式 → SVG style 串（font-family 计算值含双引号，转单引号避免破坏属性语法） */
function svgTextStyle(st) {
  const fs = parseFloat(st.fontSize) || 13;
  const ls = (st.letterSpacing && st.letterSpacing !== 'normal') ? ';letter-spacing:' + st.letterSpacing : '';
  return ('font-size:' + fs + 'px;font-weight:' + st.fontWeight + ';font-family:' + st.fontFamily +
    ';fill:' + st.color + ls).replace(/"/g, "'");
}

/* 文本节点的视口包围盒（用于竖排整段绘制、判断是否只有一行） */
function textBoxOf(node) {
  const range = document.createRange();
  range.setStart(node, 0);
  range.setEnd(node, (node.nodeValue || '').length);
  const rects = range.getClientRects();
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  for (let i = 0; i < rects.length; i++) {
    const q = rects[i];
    if (q.width < 0.01 && q.height < 0.01) continue;
    if (q.left < l) l = q.left;
    if (q.top < t) t = q.top;
    if (q.right > r) r = q.right;
    if (q.bottom > b) b = q.bottom;
  }
  if (l === Infinity) return null;
  return { left: l, top: t, width: r - l, height: b - t };
}

/* 按「浏览器实际断行」把文本节点切成若干行：逐字测 client rect 后按行聚合。
   导出必须复用 DOM 的折行结果，否则长文本会被画成一整行压到相邻区块上。 */
function measureTextLines(node) {
  const raw = node.nodeValue || '';
  if (!raw.trim()) return [];
  const range = document.createRange();
  const lines = [];
  let off = 0;
  Array.from(raw).forEach(ch => {
    const start = off, end = off + ch.length;
    off = end;
    range.setStart(node, start);
    range.setEnd(node, end);
    const rects = range.getClientRects();
    if (!rects.length) {                       // 折行处的空白等没有几何信息 → 并入当前行
      if (lines.length) lines[lines.length - 1].text += ch;
      return;
    }
    const q = rects[rects.length - 1];
    const cy = (q.top + q.bottom) / 2;
    let ln = lines[lines.length - 1];
    if (!ln || Math.abs(cy - ln.baseCy) > 2.5) {   // 行中心变了 → 新的一行(2.5px 容差防中英混排基线抖动)
      ln = { text: '', left: q.left, top: q.top, bottom: q.bottom, baseCy: cy };
      lines.push(ln);
    }
    ln.text += ch;
    if (q.left < ln.left) ln.left = q.left;
    if (q.top < ln.top) ln.top = q.top;
    if (q.bottom > ln.bottom) ln.bottom = q.bottom;
  });
  return lines
    .map(ln => ({ text: ln.text.trim(), left: ln.left, top: ln.top, height: ln.bottom - ln.top }))
    .filter(ln => ln.text);
}

/* 元素「直接文本节点」→ SVG <text>（子元素文本由子元素自己绘制） */
function svgTextOf(el, rootRect, scale, st) {
  const nodes = [];
  for (const n of el.childNodes) { if (n.nodeType === 3 && n.nodeValue.trim()) nodes.push(n); }
  if (!nodes.length) return '';
  const css = svgTextStyle(st);
  const fs = parseFloat(st.fontSize) || 13;
  const vertical = /vertical/.test(st.writingMode);
  let out = '';
  nodes.forEach(n => {
    const box = textBoxOf(n);
    if (!box) return;
    const cx = (box.left + box.width / 2 - rootRect.left) / scale;
    const cy = (box.top + box.height / 2 - rootRect.top) / scale;
    /* 竖排（层名色带、体系说明条目）：整段按文字包围盒中心绘制，保留 writing-mode */
    if (vertical) {
      out += '<text x="' + cx.toFixed(1) + '" y="' + cy.toFixed(1) + '" text-anchor="middle"' +
        ' style="' + css + ';writing-mode:vertical-rl;text-orientation:mixed">' + esc(n.nodeValue.trim()) + '</text>';
      return;
    }
    /* 单行（绝大多数）：直接用包围盒，锚点取实际行首，居中/右对齐都准确 */
    if (box.height <= fs * 1.6) {
      out += '<text x="' + ((box.left - rootRect.left) / scale).toFixed(1) + '" y="' +
        (cy + fs * 0.35).toFixed(1) + '" text-anchor="start" style="' + css + '">' +
        esc(n.nodeValue.trim()) + '</text>';
      return;
    }
    /* 多行：逐行绘制（行首 x 由 DOM 决定，多行居中也对得上） */
    measureTextLines(n).forEach(ln => {
      const lx = (ln.left - rootRect.left) / scale;
      const sy = (ln.top + ln.height / 2 - rootRect.top) / scale + fs * 0.35;
      out += '<text x="' + lx.toFixed(1) + '" y="' + sy.toFixed(1) + '" text-anchor="start" style="' + css + '">' +
        esc(ln.text) + '</text>';
    });
  });
  return out;
}

function collectSvg(el, rootRect, scale, defs) {
  // 跳过 SVG 子树(如 conn-overlay):其内容由 connSvgXml 独立注入导出,
  // 否则递归会重复绘制 overlay 里的 text/rect
  if (!el || el.nodeType !== 1) return '';
  if (el.tagName.toLowerCase() === 'svg') return '';
  const st = getComputedStyle(el);
  if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return '';
  const r = el.getBoundingClientRect();
  const w = r.width / scale, h = r.height / scale;
  if (w < 0.5 || h < 0.5) return '';                    // 隐藏/空元素跳过（必须返回空串，undefined 会被拼进 SVG）
  const x = (r.left - rootRect.left) / scale;
  const y = (r.top - rootRect.top) / scale;
  let out = '';
  // 背景 / 边框矩形（虚线边框转 stroke-dasharray）
  const bg = st.backgroundColor;
  const bw = parseFloat(st.borderTopWidth) || 0;
  if (bg !== 'rgba(0, 0, 0, 0)' || bw > 0) {
    const rx = parseFloat(st.borderTopLeftRadius) || 0;
    const dash = st.borderTopStyle === 'dashed' ? ' stroke-dasharray="7 4"' : '';
    out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '"' +
      ' rx="' + rx + '" ry="' + rx + '" fill="' + (bg !== 'rgba(0, 0, 0, 0)' ? bg : 'none') + '"' +
      (bw > 0 ? ' stroke="' + st.borderTopColor + '" stroke-width="' + bw + '"' + dash : '') + '/>';
  }
  // 文本（按 DOM 实际断行） + 子元素
  let inner = svgTextOf(el, rootRect, scale, st);
  for (const c of el.children) inner += collectSvg(c, rootRect, scale, defs);
  // overflow 裁切：网页里内容超出容器会被裁掉，PNG/SVG 也必须裁，否则长文本会溢出到相邻区块
  if (inner && /hidden|clip|auto|scroll/.test(st.overflowX + ' ' + st.overflowY)) {
    const id = 'ck' + (++_clipSeq);
    defs.push('<clipPath id="' + id + '"><rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
      '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '"/></clipPath>');
    inner = '<g clip-path="url(#' + id + ')">' + inner + '</g>';
  }
  return out + inner;
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
  const capW = area.offsetWidth;    // 布局宽度(不受 transform 影响)
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
    '<div style="width:' + capW + 'px;max-width:100%;margin:0 auto">' + inner + '</div>\n' + script + '\n</body>\n</html>';
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

/* 模板自带配色:模板数据统一按「经典蓝」色阶书写,加载时按档位映射到目标色阶。
   只改内存(diagram.theme / 各色值),不落盘不渲染,由调用方决定后续动作。
   opts.skipVars:调用方自己把配色变量挂到局部元素上(开始页/模板库缩略图),不要动 :root。 */
const TEMPLATE_BASE_SCHEME = 'blue';
/* 纯函数版:只改传进来的那张图(层带/分组/模块/侧栏/图例的颜色档位 + theme),不碰全局状态与 :root。
   缩略图就用它 —— 不必把模板临时塞进 diagram,也就不会干扰用户当前那张图。 */
function schemeDiagram(d, key) {
  const target = COLOR_SCHEMES.find(s => s.id === key);
  if (!target || !d) return false;
  const base = COLOR_SCHEMES.find(s => s.id === TEMPLATE_BASE_SCHEME) || COLOR_SCHEMES[0];
  const map = c => {
    if (!c) return c;
    const s = String(c).toLowerCase();
    let i = base.colors.findIndex(x => String(x).toLowerCase() === s);
    if (i < 0) i = nearestRampIndex(c, base.colors);
    return i >= 0 ? target.colors[i] : c;
  };
  (d.layers || []).forEach(l => {
    if (l.bandColor) l.bandColor = map(l.bandColor);
    (l.groups || []).forEach(g => (g.blocks || []).forEach(b => { if (b.color) b.color = map(b.color); }));
  });
  (d.sidebar || []).forEach(s => { if (s.color) s.color = map(s.color); });
  (d.legend || []).forEach(x => { if (x.color) x.color = map(x.color); });
  d.theme = { id: target.id, custom: null, vars: Object.assign({}, target.vars) };
  return true;
}
function applyTemplateScheme(key, opts) {
  const target = COLOR_SCHEMES.find(s => s.id === key);
  if (!target || !diagram) return false;
  schemeDiagram(diagram, key);
  if (!(opts && opts.skipVars)) applyThemeVars(diagram.theme.vars);
  return true;
}
/* opts.useTemplateScheme:从启动面板/深链「创建新图」→ 用模板自带配色;
   不传(编辑器内切换模板)→ 保留当前配色(沿用 v0.2.1 行为) */
function loadTemplateByKey(key, opts) {
  const tpls = window.ARCH_TEMPLATES || {};
  if (!key || !tpls[key]) return;
  pushUndo();
  const migrated = migrateDiagram(JSON.parse(JSON.stringify(tpls[key])));
  if (!migrated || migrated.error) { alert(migrated ? migrated.error : '模板数据无效'); return; }
  const useTplScheme = !!(opts && opts.useTemplateScheme) && !!tpls[key].scheme;
  const prevTheme = diagram && diagram.theme;
  diagram = migrated;
  selectedId = null;
  if (useTplScheme) {
    applyTemplateScheme(tpls[key].scheme);
    persist(); render(); renderProps();
  } else if (prevTheme) {
    _undoSuppressed = true;
    applyScheme(prevTheme.custom
      ? { id: '__custom', custom: true, colors: prevTheme.custom, vars: prevTheme.vars }
      : COLOR_SCHEMES.find(s => s.id === prevTheme.id) || COLOR_SCHEMES[0]);
    _undoSuppressed = false;
  } else {
    persist(); render(); renderProps();
  }
}

/* ================= 配色方案 ================= */
/* 语义 token:分组/卡片/条目/文字,保证多层展示下主题贯穿(层带→层底→分组→卡→条目) */
function deriveHierTokens(colors) {
  const c = colors || [];
  const mid = c[2] || '#2379bd';
  const c1 = c[1] || mid;
  const c3 = c[3] || '#143c66';
  const c4 = c[4] || '#0e2a47';
  return {
    '--group-bg': tintColor(mid, 0.88),
    '--group-border': tintColor(c1, 0.62),
    '--group-ink': c3,
    '--card-bg': tintColor(mid, 0.78),
    '--card-border': tintColor(c1, 0.45),
    '--card-ink': c4,
    '--ink-muted': mixColor(c3, 0.42, '#8a9aaa')
  };
}
const COLOR_SCHEMES = [
  { id: 'blue', name: '经典蓝', colors: ['#2f80c2', '#2379bd', '#1a5c94', '#143c66', '#0e2a47', '#081c33'], vars: { '--blue': '#2379bd', '--blue2': '#2f80c2', '--dash': '#2c78c2', '--panel': '#c8ddef', '--sbar': '#183c63', '--sbar-border': '#2c78c2', '--group-bg': '#e8f1f9', '--group-border': '#b9d8f0', '--group-ink': '#183c63', '--card-bg': '#dbeaf7', '--card-border': '#8ebbdc', '--card-ink': '#1a5c94', '--ink-muted': '#5a7a9a' } },
  { id: 'green', name: '青绿', colors: ['#34d399', '#10b981', '#059669', '#047857', '#065f46', '#033d2e'], vars: { '--blue': '#059669', '--blue2': '#10b981', '--dash': '#10b981', '--panel': '#d1fae5', '--sbar': '#064e3b', '--sbar-border': '#10b981', '--group-bg': '#e7f8f1', '--group-border': '#a7e0c7', '--group-ink': '#064e3b', '--card-bg': '#d1fae5', '--card-border': '#6ee7b7', '--card-ink': '#065f46', '--ink-muted': '#4b7c6a' } },
  { id: 'violet', name: '紫罗兰', colors: ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'], vars: { '--blue': '#7c3aed', '--blue2': '#8b5cf6', '--dash': '#8b5cf6', '--panel': '#ede9fe', '--sbar': '#3b0764', '--sbar-border': '#8b5cf6', '--group-bg': '#eee5fd', '--group-border': '#cbb0f8', '--group-ink': '#3b0764', '--card-bg': '#ddd0fb', '--card-border': '#b495f9', '--card-ink': '#5b21b6', '--ink-muted': '#7c6aa8' } },
  { id: 'amber', name: '暖橙', colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#5c2708'], vars: { '--blue': '#d97706', '--blue2': '#f59e0b', '--dash': '#f59e0b', '--panel': '#fef3c7', '--sbar': '#78350f', '--sbar-border': '#f59e0b', '--group-bg': '#faefe1', '--group-border': '#e8b86d', '--group-ink': '#78350f', '--card-bg': '#f6ddc1', '--card-border': '#e0a860', '--card-ink': '#92400e', '--ink-muted': '#8f6d52' } },
  { id: 'forest', name: '墨绿', colors: ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'], vars: { '--blue': '#16a34a', '--blue2': '#22c55e', '--dash': '#4ade80', '--panel': '#dcfce7', '--sbar': '#14532d', '--sbar-border': '#22c55e', '--group-bg': '#e3f4e9', '--group-border': '#a7e8bf', '--group-ink': '#14532d', '--card-bg': '#ccebd7', '--card-border': '#85dfa6', '--card-ink': '#166534', '--ink-muted': '#4a7a5c' } },
  { id: 'slate', name: '灰蓝', colors: ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617'], vars: { '--blue': '#334155', '--blue2': '#475569', '--dash': '#94a3b8', '--panel': '#e2e8f0', '--sbar': '#0f172a', '--sbar-border': '#64748b', '--group-bg': '#eef1f5', '--group-border': '#b5bbc3', '--group-ink': '#0f172a', '--card-bg': '#dce1e8', '--card-border': '#9aa2ad', '--card-ink': '#1e293b', '--ink-muted': '#5c6b7a' } }
];
function currentScheme() {
  const t = (diagram && diagram.theme) || {};
  if (t.custom) return { id: '__custom', name: '自定义', custom: true, colors: t.custom, vars: t.vars };
  return COLOR_SCHEMES.find(s => s.id === t.id) || COLOR_SCHEMES[0];
}
function applyThemeVars(vars, el) {
  const root = (el || document.documentElement).style;
  Object.entries(vars || {}).forEach(([k, v]) => root.setProperty(k, v));
}
function clearThemeVars(el, vars) {
  const st = (el || document.documentElement).style;
  Object.keys(vars || {}).forEach(k => st.removeProperty(k));
}
function applyScheme(scheme) {
  if (!diagram) return;
  pushUndo();
  // 颜色替换:先按"当前方案色阶"反向定位索引(保证连续套用不同方案不卡色),
  // 再回退到预置色板;都不命中时用**最近色**映射到当前方案最接近的档位
  // (模板语义色/历史自定义色在套用方案时也统一跟随,符合"样式配色统一"定位)
  const cur = currentScheme();
  const replace = c => {
    const s = String(c || '').toLowerCase();
    let i = (cur.colors || []).findIndex(x => String(x).toLowerCase() === s);
    if (i < 0) i = BAND_COLORS.findIndex(b => b.color.toLowerCase() === s);
    if (i < 0) i = nearestRampIndex(c, cur.colors);
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
/* 在色阶中找与 hex RGB 距离最近的档位索引;无法解析时返回 -1 */
function nearestRampIndex(hex, ramp) {
  const a = hexToRgb(hex);
  if (!a || !Array.isArray(ramp) || !ramp.length) return -1;
  let best = -1, bd = Infinity;
  ramp.forEach((cc, j) => {
    const q = hexToRgb(cc);
    if (!q) return;
    const d = (a.r - q.r) * (a.r - q.r) + (a.g - q.g) * (a.g - q.g) + (a.b - q.b) * (a.b - q.b);
    if (d < bd) { bd = d; best = j; }
  });
  return best;
}
const SCH_LV_LABELS = ['亮', '次亮', '中', '次深', '深', '最深'];
function fillSchemeMenu() {
  const cur = currentScheme();
  const list = document.getElementById('schemeList');
  list.innerHTML = COLOR_SCHEMES.map(s =>
    '<button type="button" data-scheme="' + s.id + '"' + (s.id === cur.id ? ' class="sel"' : '') + '>' +
    '<span class="sch-dots">' + s.colors.map(c => '<i style="background:' + c + '"></i>').join('') + '</span>' +
    esc(s.name) + '</button>').join('');
  const row = document.getElementById('schemeCustomRow');
  row.innerHTML = cur.colors.map((c, i) =>
    '<span class="sch-lv-cell"><input type="color" data-scheme-i="' + i + '" value="' + esc(c) + '" title="第' + (i + 1) + '档">' +
    '<span class="sch-lv">' + (SCH_LV_LABELS[i] || '') + '</span></span>').join('');
}
function applyCustomScheme() {
  const colors = [...document.querySelectorAll('#schemeCustomRow input')].map(i => i.value);
  applyScheme({
    id: '__custom', custom: true, colors,
    vars: Object.assign({
      '--blue': colors[1] || '#2379bd', '--blue2': colors[0] || '#2f80c2', '--dash': colors[1] || '#2c78c2', '--panel': (colors[2] || '#143c66') + '40', '--sbar': colors[4] || '#143c66', '--sbar-border': colors[1] || '#2f80c2'
    }, deriveHierTokens(colors))
  });
}

/* ================= 事件绑定 ================= */
function bindEvents() {
  // 工具栏
  document.getElementById('btnStart').addEventListener('click', openStartPanel);
  // 启动面板:快速开始 + 模板格子(事件委托,格子是动态生成的)
  const sp = document.getElementById('startPanel');
  if (sp) {
    sp.addEventListener('click', e => {
      if (e.target === sp) { closeStartPanel(); return; }               // 点遮罩关闭
      if (e.target.closest('#spClose')) { closeStartPanel(); return; }
      if (e.target.closest('#spBlank') || e.target.closest('#spBlankTile')) {
        closeStartPanel(); startBlank(); return;
      }
      if (e.target.closest('#spTextGen')) { closeStartPanel(); showTextGenModal(); return; }
      if (e.target.closest('#spImport')) { closeStartPanel(); loadJsonFile(); return; }
      const tile = e.target.closest('[data-sp-tpl]');
      if (tile) {
        // 关闭面板时会先把画布还原成旧图,所以顺序必须是「先关、再加载新模板」,反过来新图会被还原覆盖
        const key = tile.getAttribute('data-sp-tpl');
        closeStartPanel();
        loadTemplateByKey(key, { useTemplateScheme: true });
      }
    });
  }
  // 模板库:搜索 / 板式 / 场景标签 / 选模板(事件委托,格子是动态生成的)
  const btnTplLib = document.getElementById('btnTplLib');
  if (btnTplLib) btnTplLib.addEventListener('click', openTplLib);
  const tl = document.getElementById('tplLib');
  if (tl) {
    tl.addEventListener('click', e => {
      if (e.target === tl || e.target.closest('#tlClose')) { closeTplLib(); return; }   // 点遮罩/关闭
      if (e.target.closest('#tlMore')) {                                               // 标签折叠/展开
        const list = document.getElementById('tlTags');
        const more = document.getElementById('tlMore');
        if (list) {
          const open = list.classList.toggle('open');
          if (more) more.textContent = open ? '收起标签' : '更多标签';
        }
        return;
      }
      const layBtn = e.target.closest('#tlSeg [data-lay]');
      if (layBtn) {
        tlFilter.lay = layBtn.getAttribute('data-lay');
        document.querySelectorAll('#tlSeg button').forEach(b => b.classList.toggle('on', b === layBtn));
        renderTplLib();
        return;
      }
      const tagBtn = e.target.closest('[data-tl-tag]');
      if (tagBtn) {
        const t = tagBtn.getAttribute('data-tl-tag');
        tlFilter.tag = tlFilter.tag === t ? '' : t;              // 再点一次取消该标签
        document.querySelectorAll('[data-tl-tag]').forEach(b => b.classList.toggle('on', b.getAttribute('data-tl-tag') === tlFilter.tag));
        renderTplLib();
        return;
      }
      const tile = e.target.closest('[data-tl-tpl]');
      if (tile) pickTemplateFromLib(tile.getAttribute('data-tl-tpl'));
    });
    const tlSearch = document.getElementById('tlSearch');
    if (tlSearch) tlSearch.addEventListener('input', e => { tlFilter.q = e.target.value; renderTplLib(); });
  }
  document.getElementById('btnAddLayer').addEventListener('click', () => {
    if (!diagram) diagram = newDiagram();
    pushUndo();
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
        const vr = validateDiagramFull(migrated);
        if (vr.warnings.length) console.warn('导入警告:', vr.warnings);
        pushUndo();
        diagram = migrated;
        selectedId = null;
        applyThemeVars(currentScheme().vars);   // 按导入图的配色恢复 CSS 变量，避免与旧方案混色
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
  // 右侧通栏宽度随条目数量自动调整(竖排条目,无需拖拽;旧数据 sidebarWidth 字段保留但不再参与布局)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const tlEl = document.getElementById('tplLib');
      if (tlEl && !tlEl.hidden) { closeTplLib(); return; }
      const sp = document.getElementById('startPanel');
      if (sp && !sp.hidden) { closeStartPanel(); return; }
    }
    if (e.key === 'Escape' && previewing) togglePreview();
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
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
      else if (cmd === 'text-gen') showTextGenModal();
      else if (cmd === 'save') saveToLocal();
      else if (cmd === 'import') loadJsonFile();
      else if (cmd === 'export-json') exportJson();
      else if (cmd === 'export-svg') exportSvg();
      else if (cmd === 'export-html') exportHtml();
      else if (cmd === 'export-drawio') exportDrawio();
      else if (cmd === 'preview') togglePreview();
      else if (cmd === 'fit') zoomFit();
      else if (cmd === 'zoom-100') applyZoom(100);
      else if (cmd === 'show-conn') {
        if (!diagram) return;
        pushUndo();
        diagram.showConnections = !diagram.showConnections;
        persist(); render(); renderProps(); updateConnBtn();
      }
      else if (cmd === 'edit-conn') { if (diagram) showConnPanel(); }
      else if (cmd === 'undo') undo();
      else if (cmd === 'redo') redo();
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
    const listPath = el.getAttribute('data-list');
    if (listPath) {
      const arr = v.split(/[,，、;；]+/).map(s => s.trim()).filter(Boolean);
      setPath(node, listPath, arr);
    } else {
      node[k] = v;
    }
    persist();
    render();
    highlightSel();
  });
  // checkbox 变更（如自动统计开关）
  document.getElementById('props').addEventListener('change', e => {
    const el = e.target.closest('input[type="checkbox"][data-k]');
    if (!el || !selectedId) return;
    const node = findNode(selectedId);
    if (!node) return;
    pushUndo();
    node[el.getAttribute('data-k')] = el.checked;
    persist(); render(); renderProps();
  });
  // 属性面板输入框聚焦时 pushUndo（一次，防抖）
  document.getElementById('props').addEventListener('focusin', e => {
    if (e.target.closest('[data-k]') && !_undoFocusPushed) {
      pushUndo();
      _undoFocusPushed = true;
    }
  });
  document.getElementById('props').addEventListener('focusout', () => {
    setTimeout(() => {
      if (!document.getElementById('props').contains(document.activeElement)) {
        _undoFocusPushed = false;
      }
    }, 0);
  });
  document.getElementById('props').addEventListener('click', e => {
    /* 层属性面板里的连线入口:以该层为起点打开连线面板(不依赖 selectedId 逻辑) */
    const openConn = e.target.closest('[data-open-conn]');
    if (openConn) { showConnPanel(openConn.getAttribute('data-open-conn')); return; }
    if (!selectedId) return;
    const node = findNode(selectedId);
    if (!node) return;
    // 竖条颜色色块选择
    const sw = e.target.closest('[data-color]');
    if (sw) {
      pushUndo();
      const field = sw.getAttribute('data-color-field');
      node[field] = sw.getAttribute('data-color');
      persist(); render(); highlightSel(); renderProps();
      return;
    }
    const delBtn = e.target.closest('[data-chip-del]');
    if (delBtn) {
      pushUndo();
      node.items.splice(parseInt(delBtn.getAttribute('data-chip-del'), 10), 1);
      persist(); render(); renderProps(); return;
    }
    const addBtn = e.target.closest('[data-chip-add]');
    if (addBtn) {
      const input = document.getElementById('chipInput');
      const v = input.value.trim();
      if (v) { pushUndo(); (node.items = node.items || []).push(v); input.value = ''; }
      persist(); render(); renderProps();
    }
  });
  document.getElementById('props').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'chipInput') {
      const node = findNode(selectedId);
      if (!node) return;
      const v = e.target.value.trim();
      if (v) { pushUndo(); (node.items = node.items || []).push(v); e.target.value = ''; }
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
  bindEvents();
  let hadSaved = false;   // 本地有没有存档:首访用来决定是否自动打开开始页
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      hadSaved = true;
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
  /* 深链:?tpl=<模板key> 以该模板「创建」新图(带模板自带配色,不落盘);
     ?preview=1 直接进预览态。供启动面板、模板对比页、书签直达使用。 */
  const qs = new URLSearchParams(location.search);
  const deepKey = qs.get('tpl');
  if (deepKey && (window.ARCH_TEMPLATES || {})[deepKey]) {
    const t = migrateDiagram(JSON.parse(JSON.stringify(window.ARCH_TEMPLATES[deepKey])));
    if (t && !t.error) {
      diagram = t;
      selectedId = null;
      if (window.ARCH_TEMPLATES[deepKey].scheme) applyTemplateScheme(window.ARCH_TEMPLATES[deepKey].scheme);
    }
  }
  // 恢复配色主题（CSS 变量随图持久化，刷新后保持一致）
  const th = diagram.theme && diagram.theme.vars;
  if (th) applyThemeVars(th);
  render();
  zoomFit();
  updateConnBtn();
  if (qs.get('preview') === '1') togglePreview();
  // 深链:?start=1 强制打开开始页(文档/书签里「从模板创建」的入口)
  if (qs.get('start') === '1') openStartPanel();
  // 首次访问(本地无存档、非深链)自动打开开始页:先讲清楚这工具怎么用,再选模板动手
  else if (!hadSaved && !deepKey) openStartPanel();
}
/* 导出 HTML 时把当前主题变量写进样式 */
function currentThemeCss() {
  const vars = (diagram && diagram.theme && diagram.theme.vars) || {};
  const entries = Object.entries(vars);
  if (!entries.length) return '';
  return ':root{' + entries.map(([k, v]) => k + ':' + v + ';').join('') + '}';
}
document.addEventListener('DOMContentLoaded', init);