# ArchForm · 架构表单

**把画框图变成填表单 — Turn diagram-drawing into form-filling.**

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen)](#)
[![Platform](https://img.shields.io/badge/Platform-file%3A%2F%2F%20%7C%20Static-lightgrey)](#)

> **中文** · ArchForm 是一个零依赖、完全离线的**结构化框图**编辑器:分层架构图(总体架构 / 应用架构 / 数据架构 / 技术架构)通过编辑数据树自动排版,而不是在画布上手工拉框。分层架构图是**结构化数据**,不是自由画布——自由曲线绘制场景不在范围内(见 [设计边界](docs/ROADMAP.md))。
>
> **English** · ArchForm is a zero-dependency, fully-offline web tool for **structured block diagrams** — the layered architecture diagrams that enterprise architects draw every day. Instead of dragging boxes on a free canvas, you edit a data tree (Diagram → Layer → Group → Block → Item) and the layout is generated for you. Layered diagrams are **structured data**, not free-form canvases — free-curve drawing is out of scope (see [design boundaries](docs/ROADMAP.md)).

## Preview / 预览

| | |
|---|---|
| Overall Architecture · layered · default blue / 总体架构 · 分层 · 经典蓝 | Data Architecture · layered · green / 数据架构 · 分层 · 青绿 |
| ![Overall Architecture template](docs/images/preview.png) | ![Data Architecture template with green palette](docs/images/data-green.png) |
| Central-core layout · amber / 中央核心板式 · 暖橙 | Clean PNG export / 纯净 PNG 导出 |
| ![Central core layout with amber palette](docs/images/central-amber.png) | ![Standalone PNG export](docs/images/export-data.png) |

---

## English

### Why not another canvas tool?

Layered architecture diagrams are ~90% a nested structure — **Layer → Group → Block → Item** — not a free topology. Canvas tools (draw.io / Visio / ProcessOn) force you to hand-align boxes, tune spacing, and unify styles, spending effort on *arranging* instead of *thinking*. ArchForm solves this with **structured input → auto layout → normalized style**, and keeps the diagram itself versionable, diffable, and reusable.

### Features

- **Structured input** — edit a 4-level tree (Diagram → Layer → Group → Block → Item) with inline properties; click any block on the canvas to edit it
- **Auto layout** — 3 paradigms on the same data, switchable without data loss: *layered* (多层横向), *central core* (中央核心), *cards grid* (卡片网格)
- **Normalized style spec** — dashed panels, 2px radius, fixed type scale; 6 preset color schemes + custom 6-shade palette, saved with the diagram (including the right-side pillar bars)
- **Extras that matter in reviews** — bottom legend bar and right-side pillar bars (体系通栏) for cross-cutting concerns (security, operations, governance)
- **Fully offline** — export vector **SVG**, high-res **PNG** (2×), or a standalone **HTML** (with embedded vector data); zero network requests, zero runtime dependencies; `file://` double-click to run
- **Versioned data** — every diagram carries `schemaVersion`, auto-migrated on load (`migrateDiagram`); JSON import/export and `localStorage` autosave
- **5 built-in templates** — Generic Layered, Overall Architecture, Application Architecture, Data Architecture (data-warehouse layering), Technology Architecture

### Quick Start

```bash
git clone https://github.com/Lincoln-cn/archform.git
cd archform
# no install, no server, no network — just open:
start index.html        # Windows
open index.html         # macOS / Linux
```

Works from `file://` directly.

### Deploy to GitHub Pages (online use)

The repo is GitHub Pages-ready — all asset references are relative:

1. Push the repo to GitHub, then go to **Settings → Pages** and set the source to `master` branch (root, `/`).
2. Your online copy will be served at `https://<user>.github.io/archform/` (`.nojekyll` is included to keep the static hosting predictable).
3. Open it in any browser — same editor, no backend. Note: `localStorage` autosave is scoped per origin + path, so a browser profile on the online copy is separate from your local files (use **导出JSON / 导入JSON** to move diagrams between them).

To share it with a team without GitHub, drop the folder on any static host or intranet share — `index.html` is the entry.

### Templates

| Template | Layout | Use case |
|---|---|---|
| 通用分层架构 Generic Layered | layered | Generic layered reference (capability demo) |
| 系统总体架构图 Overall Architecture | layered | User → Application → Platform → Data → Infrastructure, with security/ops pillars |
| 应用架构图 Application Architecture | layered | Application systems and their functional modules |
| 数据架构图 Data Architecture | layered | Source → ODS → DWD → DWS → ADS → Service layering by subject domain |
| 技术架构图 Technology Architecture | layered | Access → Services → Middleware → Storage → Infrastructure |

Templates are plain data in `templates.js` — add your own by copying the JSON structure.

### Export

| Format | Description |
|---|---|
| **SVG** | Vector, losslessly scalable, further editable (File → 导出SVG) |
| **PNG** | 2× high-resolution raster of the whole diagram, current palette (toolbar 导出PNG) |
| **HTML** | Standalone file with full styles + embedded vector data; can be inserted into docs, PNG still downloadable inside |
| **JSON** | The diagram data itself — versioned, diffable, reusable across projects |

### Project Structure

```
.
├─ index.html           # Editor shell (inline style spec + page; double-click to run)
├─ editor-core.js       # State, node lookup, data versioning (migrateDiagram)
├─ editor-render.js     # Render engine: layered / central / cards
├─ editor-ui.js         # Tree, property panel, color schemes, export (SVG/PNG/HTML), zoom
├─ templates.js         # Built-in template library (plain data)
├─ docs/                # Public documentation (roadmap, usage guide)
└─ LICENSE              # Apache-2.0
```

### Documentation

- [docs/ROADMAP.md](docs/ROADMAP.md) — version roadmap, pain-point background, **design boundaries** (connection strategy, data compatibility promise)
- [docs/usage.md](docs/usage.md) — detailed usage guide (中文使用指南)

### Contributing

- **Templates**: add plain JSON to `templates.js` and open a PR — no build step involved
- **Bugs / feature requests**: open an issue (template request or editor bug)
- Roadmap decisions live in [docs/ROADMAP.md](docs/ROADMAP.md) — read it before starting bigger work

### License

[Apache-2.0](LICENSE) © 2026 ArchForm Contributors

---

## 中文

### 为什么不是又一个画布工具?

分层架构图 90% 是"层 → 分组 → 模块 → 条目"的嵌套结构,不是自由拓扑。画布工具(draw.io / Visio / ProcessOn)强迫你手工拉框、对齐、调间距——精力花在"摆"而不是"想"。ArchForm 用**结构化输入 → 自动排版 → 规范固化**解决这个问题,并让架构图数据可 diff、可版本管理、可复用。

### 特性

- **结构化输入**:编辑四级结构树(图 → 层 → 分组 → 模块 → 条目),画布上点击任意模块即可编辑
- **自动排版**:同一份内容在 3 种板式间切换,数据不丢失——多层横向、中央核心、卡片网格
- **规范固化**:虚线面板、圆角 2px、字号层级;6 套预置配色 + 自定义六档色阶,随图保存(含右侧通栏竖条)
- **评审友好的辅助区**:底部图例通栏、右侧体系通栏(安全/运维/治理等贯穿性体系)
- **完全离线**:导出矢量 **SVG**、高清 **PNG**(2 倍)、独立 **HTML**(内嵌矢量数据);零网络请求、零运行时依赖,`file://` 双击即用
- **数据版本化**:图数据带 `schemaVersion`,加载时自动迁移(`migrateDiagram`);JSON 导入导出 + localStorage 自动保存
- **5 个内置模板**:通用分层 / 总体架构 / 应用架构 / 数据架构(数仓分层)/ 技术架构

### 快速开始

```bash
git clone https://github.com/Lincoln-cn/archform.git
cd archform
# 无需安装、无需服务器、无需网络,直接打开:
start index.html        # Windows
open index.html         # macOS / Linux
```

支持 `file://` 直接打开。

### 部署到 GitHub Pages 在线使用

仓库已为 GitHub Pages 就绪(所有资源引用均为相对路径):

1. 推送仓库到 GitHub 后,进入 **Settings → Pages**,将发布源设为 `master` 分支(根目录 `/`)。
2. 在线版本地址为 `https://<user>.github.io/archform/`(已含 `.nojekyll`,静态托管行为可控)。
3. 任意浏览器打开即可使用,无需后端。注意:`localStorage` 自动保存按"访问地址 + 浏览器"隔离,在线副本与本机文件互不相通——跨环境迁移图用「导出JSON / 导入JSON」。

不想用 GitHub 时,把整个目录丢到任意静态站点或内网共享即可,`index.html` 是入口。

### 模板

| 模板 | 板式 | 适用场景 |
|---|---|---|
| 通用分层架构 | 多层横向 | 通用分层参考(能力上限演示) |
| 系统总体架构图 | 多层横向 | 用户 → 应用 → 平台 → 数据 → 基础设施,安全/运维贯穿 |
| 应用架构图 | 多层横向 | 应用系统及其功能模块划分 |
| 数据架构图 | 多层横向 | 数据源 → ODS → DWD → DWS → ADS → 数据服务,按主题域 |
| 技术架构图 | 多层横向 | 接入 → 服务 → 中间件 → 存储 → 基础设施 |

模板是 `templates.js` 里的纯数据——复制 JSON 结构即可新增自己的模板。

### 导出

| 格式 | 说明 |
|---|---|
| **SVG** | 矢量图,无损缩放,可继续编辑(文件 → 导出SVG) |
| **PNG** | 整图 2 倍高清位图,含当前配色(工具栏 导出PNG) |
| **HTML** | 独立文件,含完整样式与内嵌矢量数据;可插入文档,内部仍可下载 PNG |
| **JSON** | 图数据本身——可版本管理、可 diff、可跨项目复用 |

### 目录结构

```
.
├─ index.html           # 编辑器骨架(内联样式规范 + 页面;双击即用)
├─ editor-core.js       # 状态、节点查找、数据版本化(migrateDiagram)
├─ editor-render.js     # 渲染引擎:多层横向 / 中央核心 / 卡片网格
├─ editor-ui.js         # 结构树、属性面板、配色、导出(SVG/PNG/HTML)、缩放
├─ templates.js         # 内置模板库(纯数据)
├─ docs/                # 对外文档(版本规划、使用指南)
└─ LICENSE              # Apache-2.0
```

### 文档

- [docs/ROADMAP.md](docs/ROADMAP.md) — 版本规划、痛点背景、**设计边界**(连线策略、数据兼容承诺)
- [docs/usage.md](docs/usage.md) — 详细使用指南(中文)

### 贡献

- **模板**:在 `templates.js` 中加纯 JSON 数据,直接提 PR——无构建步骤
- **Bug / 需求**:提 issue(注明是模板请求还是编辑器问题)
- 较大改动前请先阅读 [docs/ROADMAP.md](docs/ROADMAP.md) 中的版本规划与设计边界

### 许可

[Apache-2.0](LICENSE) © 2026 ArchForm Contributors
