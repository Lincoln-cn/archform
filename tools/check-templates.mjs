#!/usr/bin/env node
/* 模板数据校验（零依赖，node tools/check-templates.mjs）
 *
 * 校验两件事:
 *   1. 结构正确性 —— 能被编辑器安全加载(必填字段、id 唯一、层级类型)
 *   2. 设计规范   —— 启动面板/模板仓库需要的元信息(desc/tags/scheme)与粒度上限
 *
 * 退出码:有 ERROR → 1;只有 WARN → 0。WARN 用于"尚未改造的老模板",不阻塞。
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMES = ['blue', 'green', 'violet', 'amber', 'forest', 'slate'];
const LIMITS = { layerMin: 3, layerMax: 6, groupsPerLayerMax: 4, blocksPerGroupMax: 6, itemsPerBlockMax: 8, descMax: 40 };

const errors = [];
const warns = [];
const notes = [];
const err = (k, m) => errors.push(`[${k}] ${m}`);
const warn = (k, m) => warns.push(`[${k}] ${m}`);

const src = fs.readFileSync(path.join(ROOT, 'templates.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(src, sandbox);
const T = sandbox.window.ARCH_TEMPLATES || {};
const keys = Object.keys(T);
if (!keys.length) err('templates.js', '没有解析到任何模板(window.ARCH_TEMPLATES 为空)');

const blockNames = new Map();
const rows = [];

for (const key of keys) {
  const t = T[key];
  /* ---- 1. 结构 ---- */
  if (!t || typeof t !== 'object') { err(key, '模板不是对象'); continue; }
  if (!t.id) err(key, '缺 id');
  if (t.schemaVersion == null) err(key, '缺 schemaVersion');
  if (typeof t.title !== 'string' || !t.title.trim()) err(key, '缺 title');
  if (t.layout !== 'layered' && t.layout !== 'flow') err(key, `layout 必须是 layered/flow，实际 ${t.layout}`);
  if (!Array.isArray(t.layers) || !t.layers.length) { err(key, 'layers 必须是非空数组'); continue; }
  if (t.sidebar != null && !Array.isArray(t.sidebar)) err(key, 'sidebar 必须是数组');
  if (t.legend != null && !Array.isArray(t.legend)) err(key, 'legend 必须是数组');
  if (t.connections != null && !Array.isArray(t.connections)) err(key, 'connections 必须是数组');

  const ids = new Set();
  const dupIds = [];
  const takeId = (node, where) => {
    if (!node || !node.id) { err(key, `${where} 缺 id`); return; }
    if (ids.has(node.id)) dupIds.push(node.id); else ids.add(node.id);
  };

  let groups = 0, blocks = 0, items = 0;
  (t.layers || []).forEach((l, li) => {
    const where = `layer[${li}]「${l && l.name ? l.name : '?'}」`;
    takeId(l, where);
    if (typeof l.name !== 'string' || !l.name.trim()) err(key, `${where} 缺 name`);
    if (!Array.isArray(l.groups) || !l.groups.length) { err(key, `${where} 没有分组`); return; }
    if (l.groups.length > LIMITS.groupsPerLayerMax) warn(key, `${where} 有 ${l.groups.length} 个分组(建议 ≤${LIMITS.groupsPerLayerMax})`);
    l.groups.forEach((g, gi) => {
      groups++;
      const gw = `${where}.group[${gi}]「${g && g.title ? g.title : '?'}」`;
      takeId(g, gw);
      if (typeof g.title !== 'string' || !g.title.trim()) err(key, `${gw} 缺 title`);
      if (!Array.isArray(g.blocks) || !g.blocks.length) { err(key, `${gw} 没有模块`); return; }
      if (g.blocks.length > LIMITS.blocksPerGroupMax) warn(key, `${gw} 有 ${g.blocks.length} 个模块(建议 ≤${LIMITS.blocksPerGroupMax})`);
      g.blocks.forEach((b, bi) => {
        blocks++;
        const bw = `${gw}.block[${bi}]「${b && b.title ? b.title : '?'}」`;
        takeId(b, bw);
        if (typeof b.title !== 'string' || !b.title.trim()) err(key, `${bw} 缺 title`);
        if (!Array.isArray(b.items)) { err(key, `${bw} items 必须是数组`); return; }
        if (b.items.length > LIMITS.itemsPerBlockMax) warn(key, `${bw} 有 ${b.items.length} 个条目(建议 ≤${LIMITS.itemsPerBlockMax})`);
        items += b.items.length;
        const nm = String(b.title || '').trim();
        if (nm) blockNames.set(nm, (blockNames.get(nm) || new Set()).add(key));
      });
    });
  });
  if (dupIds.length) err(key, '重复 id: ' + [...new Set(dupIds)].join(', '));
  (t.legend || []).forEach((x, i) => takeId(x, `legend[${i}]`));
  (t.sidebar || []).forEach((x, i) => {
    takeId(x, `sidebar[${i}]`);
    if (!Array.isArray(x.items)) err(key, `sidebar[${i}] 缺 items 数组`);
  });
  (t.connections || []).forEach((c, i) => {
    if (!c || !c.from || !c.to) err(key, `connections[${i}] 缺 from/to`);
    else if (!ids.has(c.from) || !ids.has(c.to)) err(key, `connections[${i}] 指向不存在的层`);
  });

  const layerCount = (t.layers || []).length;
  if (layerCount < LIMITS.layerMin) warn(key, `只有 ${layerCount} 层(分层图建议 ≥${LIMITS.layerMin} 层)`);
  if (layerCount > LIMITS.layerMax) warn(key, `有 ${layerCount} 层(建议 ≤${LIMITS.layerMax} 层,再多读图就费劲)`);

  /* ---- 2. 元信息(启动面板要用) ---- */
  const hasDesc = typeof t.desc === 'string' && t.desc.trim().length > 0;
  if (!hasDesc) warn(key, '缺 desc(启动面板的一句话场景说明)');
  else if ([...t.desc].length > LIMITS.descMax) err(key, `desc 超过 ${LIMITS.descMax} 字(现在 ${[...t.desc].length} 字)`);
  if (!Array.isArray(t.tags) || t.tags.length < 2 || t.tags.length > 3) warn(key, 'tags 需要 2~3 个场景标签');
  const sc = t.scheme;
  if (sc == null) warn(key, '缺 scheme(模板自带配色)');
  else if (typeof sc !== 'string' || !SCHEMES.includes(sc)) err(key, `scheme 必须是 ${SCHEMES.join('/')}，实际 ${JSON.stringify(sc)}`);
  if (t.theme != null) err(key, '不要用 theme 字段(会和 diagram.theme 混淆),模板配色请用 scheme');

  rows.push({ key, title: t.title, layout: t.layout, layers: layerCount, groups, blocks, items,
    scheme: sc || '—', desc: hasDesc ? 'yes' : '—' });
}

/* ---- 3. 内容重复度(只提示,不判错) ---- */
const shared = [...blockNames.entries()].filter(([, s]) => s.size >= 3)
  .sort((a, b) => b[1].size - a[1].size)
  .map(([n, s]) => `${n}(${s.size}: ${[...s].slice(0, 3).join('/')}${s.size > 3 ? '/…' : ''})`);
if (shared.length) notes.push('跨模板重复的模块名(≥3 个模板): ' + shared.slice(0, 8).join(', '));

/* ---- 输出 ---- */
const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - [...String(s)].length * 2 + String(s).length));
console.log('key'.padEnd(12) + 'layout'.padEnd(9) + 'L/G/B/I'.padEnd(14) + 'scheme'.padEnd(9) + 'desc   title');
console.log('-'.repeat(78));
for (const r of rows) {
  console.log(
    r.key.padEnd(12) + String(r.layout).padEnd(9) +
    `${r.layers}/${r.groups}/${r.blocks}/${r.items}`.padEnd(14) +
    String(r.scheme).padEnd(9) + String(r.desc).padEnd(7) + r.title);
}
console.log('-'.repeat(78));
console.log(`模板 ${keys.length} 个 · ERROR ${errors.length} · WARN ${warns.length}`);

const group = (arr, title, out) => {
  if (!arr.length) return;
  out.push('', title);
  arr.forEach(x => out.push('  ' + x));
};
const out = [];
group(errors, 'ERROR(必须修):', out);
group(warns, 'WARN(建议修):', out);
group(notes, 'NOTE:', out);
if (out.length) console.log(out.join('\n'));
if (!errors.length && !warns.length) console.log('\n全部通过 ✔');
process.exit(errors.length ? 1 : 0);
