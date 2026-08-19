
"use strict";
/* ================= 状态 ================= */
let diagram = null;      // 当前图数据
let selectedId = null;   // 选中节点 id
const uid = () => Math.random().toString(36).slice(2, 9);
const LS_KEY = 'arch-editor-data';

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
