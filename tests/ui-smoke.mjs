/* UI 冒烟测试(启动面板 + 模板加载 + 配色 + 新建空图 + 首访自动打开)
 * 零依赖:直接用 Chrome 的 DevTools 协议(CDP)驱动 headless 浏览器。
 * 本地:node tests/ui-smoke.mjs          指定浏览器:CHROME_BIN=D:\...\chrome.exe node tests/ui-smoke.mjs
 * CI  :GitHub Actions 的 ubuntu-latest 自带 google-chrome,直接跑。
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CANDIDATES = [
  process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);
const CHROME = CANDIDATES.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });

const PAGE = pathToFileURL(path.resolve('index.html')).href;
const PORT = 9300 + Math.floor(Math.random() * 400);
const PROFILE = path.join(os.tmpdir(), 'archform-ui-smoke-' + process.pid);

const ok = [], fail = [];
const check = (name, cond, extra) => (cond ? ok : fail).push(name + (extra === undefined ? '' : ' → ' + JSON.stringify(extra)));

if (!CHROME) {
  console.log('找不到 Chrome,跳过 UI 冒烟测试(设置 CHROME_BIN 指到浏览器可执行文件)');
  process.exit(0);
}

const args = [
  '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--disable-extensions',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + PROFILE,
  '--window-size=1600,1000',
  'about:blank'
];
if (process.platform === 'linux') args.unshift('--no-sandbox', '--disable-dev-shm-usage');

const chrome = spawn(CHROME, args, { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();
const pageErrors = [];
function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, { res, rej });
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error('CDP 超时: ' + method)); } }, 20000);
  });
}
async function evalJs(body) {
  const r = await send('Runtime.evaluate', { expression: '(function(){' + body + '})()', returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    const e = r.exceptionDetails.exception;
    throw new Error('页面 JS 异常: ' + ((e && e.description) || r.exceptionDetails.text));
  }
  return r.result.value;
}
async function connect() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
      const page = list.find(t => t.type === 'page');
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('WebSocket 连接失败')); });
        ws.onmessage = ev => {
          const m = JSON.parse(ev.data);
          if (m.id && pending.has(m.id)) {
            const p = pending.get(m.id); pending.delete(m.id);
            m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
          }
          if (m.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
          if (m.method === 'Runtime.exceptionThrown') {
            const d = m.params.exceptionDetails;
            pageErrors.push((d.exception && (d.exception.description || d.exception.value)) || d.text || '未知异常');
          }
          if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
            pageErrors.push('console.error: ' + m.params.args.map(a => a.value || a.description || a.type).join(' '));
          }
        };
        return;
      }
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('无法连接 Chrome 调试端口 ' + PORT);
}

const goto = async (url, ms = 2000) => { await send('Page.navigate', { url }); await sleep(ms); };

try {
  await connect();
  await send('Page.enable');
  await send('Runtime.enable');

  // 1) ?start=1 打开开始页,12 个模板格子,缩略图实时渲染出来
  await goto(PAGE + '?start=1', 2500);
  check('开始页打开', await evalJs('return document.getElementById("startPanel").hidden === false;'));
  check('模板格子 12 个', (await evalJs('return document.querySelectorAll("[data-sp-tpl]").length;')) === 12);
  await sleep(2500);
  check('缩略图全部生成', (await evalJs('return document.querySelectorAll(".sp-shot").length;')) === 12);
  check('空白图格子存在', await evalJs('return !!document.getElementById("spBlankTile");'));
  // 缩略图配色各自固化:早期版本每个模板都改 :root,已生成的缩略图会跟着轮换变色,最后全变蓝
  const thumbVars = await evalJs(`return {
    inline: [...document.querySelectorAll('.sp-shot')].every(s => !!s.style.getPropertyValue('--blue')),
    blues: [...new Set([...document.querySelectorAll('.sp-shot')].map(s => getComputedStyle(s).getPropertyValue('--blue').trim()))],
    rootBlue: getComputedStyle(document.documentElement).getPropertyValue('--blue').trim()
  };`);
  check('缩略图各自固化配色变量', thumbVars.inline, thumbVars.inline);
  check('缩略图配色互不相同(>=5 种)', thumbVars.blues.length >= 5, thumbVars.blues);
  check('生成缩略图不污染页面 :root 配色', thumbVars.rootBlue === '#2379bd', thumbVars.rootBlue);

  // 2) 点「数据架构图」:加载模板 + 套用模板自带 violet 配色 + 面板关闭
  await evalJs('document.querySelector("[data-sp-tpl=\\"data\\"]").click(); return 1;');
  await sleep(800);
  const afterPick = await evalJs('return {hidden: document.getElementById("startPanel").hidden, title: diagram.title, layers: diagram.layers.length, theme: diagram.theme && diagram.theme.id};');
  check('点模板后面板关闭', afterPick.hidden === true, afterPick.hidden);
  check('加载的是数据架构图', afterPick.title === '数据架构图', afterPick.title);
  check('层数 6', afterPick.layers === 6, afterPick.layers);
  check('套用 violet 配色', afterPick.theme === 'violet', afterPick.theme);

  // 3) 工具栏「开始」重开:缩略图不污染当前图
  await evalJs('document.getElementById("btnStart").click(); return 1;');
  await sleep(2000);
  const reopened = await evalJs('return {hidden: document.getElementById("startPanel").hidden, shots: document.querySelectorAll(".sp-shot").length, title: diagram.title};');
  check('工具栏「开始」可重开', reopened.hidden === false, reopened.hidden);
  check('重开后缩略图继续生成', reopened.shots > 0, reopened.shots);
  check('缩略图不污染当前图', reopened.title === '数据架构图', reopened.title);

  // 4) Esc 关闭不丢图
  await evalJs('document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true})); return 1;');
  await sleep(500);
  check('Esc 关闭面板', await evalJs('return document.getElementById("startPanel").hidden === true;'));
  check('Esc 关闭不丢当前图', (await evalJs('return diagram.title;')) === '数据架构图');

  // 5) 新建空白图(confirm 由 CDP 自动接受)
  await evalJs('document.getElementById("btnStart").click(); return 1;');
  await sleep(700);
  await evalJs('document.getElementById("spBlank").click(); return 1;');
  await sleep(700);
  const blank = await evalJs('return {hidden: document.getElementById("startPanel").hidden, layers: diagram.layers.length, title: diagram.title};');
  check('空白图:面板关闭', blank.hidden === true, blank.hidden);
  check('空白图:0 层', blank.layers === 0, blank.layers);
  check('空白图:标题重置', blank.title === '未命名架构图', blank.title);

  // 6) 首访自动打开,有存档再访不打扰
  await evalJs('localStorage.clear(); return 1;');
  await goto(PAGE, 2500);
  check('首访自动打开开始页', await evalJs('return document.getElementById("startPanel").hidden === false;'));
  await evalJs('document.getElementById("spClose").click(); return 1;');
  await sleep(400);
  await evalJs('document.getElementById("btnAddLayer").click(); return 1;');
  await sleep(600);
  await goto(PAGE, 2000);
  check('有存档再访不弹面板', (await evalJs('return document.getElementById("startPanel").hidden;')) === true);

  // 7) 模板库:搜索 / 板式筛选 / 场景标签 / 选模板 / Esc
  await evalJs('document.getElementById("btnTplLib").click(); return 1;');
  await sleep(1200);
  check('模板库打开', await evalJs('return document.getElementById("tplLib").hidden === false;'));
  check('模板库格子 12 个', (await evalJs('return document.querySelectorAll("[data-tl-tpl]").length;')) === 12);
  check('场景标签渲染', (await evalJs('return document.querySelectorAll("[data-tl-tag]").length;')) >= 10);
  await sleep(2500);
  check('模板库缩略图全部生成', (await evalJs('return document.querySelectorAll("#tlGrid .sp-shot").length;')) === 12);
  await evalJs('var s=document.getElementById("tlSearch"); s.value="安全"; s.dispatchEvent(new Event("input",{bubbles:true})); return 1;');
  await sleep(400);
  const searched = await evalJs('return {n: document.querySelectorAll("[data-tl-tpl]").length, txt: document.getElementById("tlCount").textContent};');
  check('搜索「安全」筛出 2 个(安全架构 + 总体的说明里带"安全")', searched.n === 2, searched);
  check('计数显示 2 / 12', searched.txt === '2 / 12', searched.txt);
  await evalJs('var s=document.getElementById("tlSearch"); s.value=""; s.dispatchEvent(new Event("input",{bubbles:true})); return 1;');
  await sleep(300);
  await evalJs('document.querySelector("#tlSeg [data-lay=\\"flow\\"]").click(); return 1;');
  await sleep(400);
  check('板式筛选:横向流向 3 个', (await evalJs('return document.querySelectorAll("[data-tl-tpl]").length;')) === 3);
  await evalJs('document.querySelector("#tlSeg [data-lay=\\"all\\"]").click(); return 1;');
  await sleep(300);
  await evalJs('document.querySelector("[data-tl-tag=\\"数仓\\"]").click(); return 1;');
  await sleep(400);
  check('标签筛选:数仓 1 个', (await evalJs('return document.querySelectorAll("[data-tl-tpl]").length;')) === 1);
  await evalJs('document.querySelector("[data-tl-tag=\\"数仓\\"]").click(); return 1;');   // 再点一次取消
  await sleep(400);
  check('再点标签取消筛选', (await evalJs('return document.querySelectorAll("[data-tl-tpl]").length;')) === 12);
  await evalJs('document.querySelector("[data-tl-tpl=\\"security\\"]").click(); return 1;');
  await sleep(1000);
  const libPick = await evalJs('return {hidden: document.getElementById("tplLib").hidden, title: diagram.title, theme: diagram.theme && diagram.theme.id};');
  check('模板库选模板后关闭', libPick.hidden === true, libPick.hidden);
  check('模板库加载安全架构', String(libPick.title).indexOf('安全架构') === 0, libPick.title);
  check('模板库套用 amber 配色', libPick.theme === 'amber', libPick.theme);
  await evalJs('document.getElementById("btnTplLib").click(); return 1;');
  await sleep(600);
  await evalJs('document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true})); return 1;');
  await sleep(400);
  check('Esc 关闭模板库', await evalJs('return document.getElementById("tplLib").hidden === true;'));

  // 8) 整个流程里不应有未捕获异常 / console.error
  check('页面无未捕获异常', pageErrors.length === 0, pageErrors.slice(0, 3));
} catch (e) {
  fail.push('异常: ' + e.message);
} finally {
  try { ws && ws.close(); } catch (e) {}
  try { chrome.kill(); } catch (e) {}
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {}
}

console.log(`UI 冒烟测试 · 通过 ${ok.length} 项`);
ok.forEach(x => console.log('  ✔ ' + x));
if (fail.length) {
  console.log(`失败 ${fail.length} 项:`);
  fail.forEach(x => console.log('  ✘ ' + x));
  process.exitCode = 1;
} else {
  console.log('全部通过 ✔');
}
