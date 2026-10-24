/* 静态接线检查:JS 里 getElementById('x') 引用的 id,必须在 index.html 里存在
   (运行期动态创建的节点走 ALLOW 白名单)。
   零依赖,CI 与本地都跑:node tools/check-html.mjs */
import fs from 'node:fs';

const HTML = 'index.html';
const JS_FILES = ['editor-core.js', 'editor-tree.js', 'editor-render.js', 'editor-conn.js', 'editor-ui.js'];
// 运行期由 JS 自己 createElement / innerHTML 出来的 id(不在 index.html 里)
const ALLOW = new Set([
  'treeCtxMenu',                                            // 树右键菜单
  'textGenModal', 'tgInput', 'tgPreview', 'tgCancel', 'tgGen', // 从文本生成图弹窗
  'connPanel', 'ceRows', 'ceTip', 'ceSave',                 // 层间连线面板
  'qaInput', 'qaIco', 'qaNow',                              // 结构树快捷录入
  'archCanvas',                                             // render() 现画的画布
  'downloadPng',                                            // 导出 PNG 的临时 <a>
  'chipInput'                                               // 属性面板条目输入框
]);

const html = fs.readFileSync(HTML, 'utf8');
const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

const problems = [];
let total = 0;
for (const f of JS_FILES) {
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const id = m[1];
      total++;
      if (htmlIds.has(id) || ALLOW.has(id)) continue;
      problems.push(`${f}:${i + 1} 引用了 index.html 里不存在的 id "${id}"`);
    }
  });
}

// 反向:HTML 里声明了 id,但脚本里连字符串都没出现过 —— 只提示,不算错误(可能只给 CSS 用)
const allSrc = JS_FILES.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const mentioned = id => {
  const q = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(['"\`])#?${q}\\1|#${q}(?![\\w-])`).test(allSrc);
};
const orphan = [...htmlIds].filter(id => !mentioned(id) && !/^menu-|^file|^zoom/.test(id));

console.log(`检查 ${total} 处 getElementById · index.html 声明 ${htmlIds.size} 个 id`);
if (orphan.length) console.log('提示(HTML 有、脚本里完全没提到,可能只给 CSS/无障碍用):', orphan.join(', '));
if (problems.length) {
  console.log('错误:');
  problems.forEach(p => console.log('  ✘ ' + p));
  process.exitCode = 1;
} else {
  console.log('接线检查通过 ✔');
}
