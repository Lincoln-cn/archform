# ArchForm · 架构表单

**Turn diagram-drawing into form-filling.**

[English](README.md) | [简体中文](README.zh-CN.md)

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen)](#)
[![Platform](https://img.shields.io/badge/Platform-file%3A%2F%2F%20%7C%20Static-lightgrey)](#)

> ArchForm is a zero-dependency, fully-offline web tool for **structured block diagrams** — the layered architecture diagrams (总体架构 / 应用架构 / 数据架构 / 技术架构) that enterprise architects draw every day. Instead of dragging boxes on a free canvas, you edit a data tree (Diagram → Layer → Group → Block → Item) and the layout is generated for you — consistent, review-ready, and versionable.
>
> Layered architecture diagrams are **structured data**, not free-form canvases. Free-curve drawing scenarios are out of scope — see our [design boundaries](docs/ROADMAP.md).

## Preview

| | |
|---|---|
| Overall Architecture · layered · default blue | Data Architecture · layered · green palette |
| ![Overall Architecture template](docs/images/preview.png) | ![Data Architecture template with green palette](docs/images/data-green.png) |
| Central-core layout · amber palette | Clean PNG export (standalone, current palette) |
| ![Central core layout with amber palette](docs/images/central-amber.png) | ![Standalone PNG export](docs/images/export-data.png) |

## Why not another canvas tool?

Layered architecture diagrams are ~90% a nested structure — **Layer → Group → Block → Item** — not a free topology. Canvas tools (draw.io / Visio / ProcessOn) force you to hand-align boxes, tune spacing, and unify styles, spending effort on *arranging* instead of *thinking*. ArchForm solves this with **structured input → auto layout → normalized style**, and keeps the diagram itself versionable, diffable, and reusable.

## Features

- **Structured input** — edit a 4-level tree (Diagram → Layer → Group → Block → Item) with inline properties; click any block on the canvas to edit it
- **Auto layout** — 3 paradigms on the same data, switchable without data loss: *layered* (多层横向), *central core* (中央核心), *cards grid* (卡片网格)
- **Normalized style spec** — dashed panels, 2px radius, fixed type scale; 6 preset color schemes + custom 6-shade palette, saved with the diagram (including the right-side pillar bars)
- **Extras that matter in reviews** — bottom legend bar and right-side pillar bars (体系通栏) for cross-cutting concerns (security, operations, governance)
- **Fully offline** — export vector **SVG**, high-res **PNG** (2×), or a standalone **HTML** (with embedded vector data); zero network requests, zero runtime dependencies; `file://` double-click to run
- **Versioned data** — every diagram carries `schemaVersion`, auto-migrated on load (`migrateDiagram`); JSON import/export and `localStorage` autosave
- **5 built-in templates** — Generic Layered, Overall Architecture, Application Architecture, Data Architecture (data-warehouse layering), Technology Architecture

## Quick Start

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

## Templates

| Template | Layout | Use case |
|---|---|---|
| 通用分层架构 Generic Layered | layered | Generic layered reference (capability demo) |
| 系统总体架构图 Overall Architecture | layered | User → Application → Platform → Data → Infrastructure, with security/ops pillars |
| 应用架构图 Application Architecture | layered | Application systems and their functional modules |
| 数据架构图 Data Architecture | layered | Source → ODS → DWD → DWS → ADS → Service layering by subject domain |
| 技术架构图 Technology Architecture | layered | Access → Services → Middleware → Storage → Infrastructure |

Templates are plain data in `templates.js` — add your own by copying the JSON structure.

## Export

| Format | Description |
|---|---|
| **SVG** | Vector, losslessly scalable, further editable (File → 导出SVG) |
| **PNG** | 2× high-resolution raster of the whole diagram, current palette (toolbar 导出PNG) |
| **HTML** | Standalone file with full styles + embedded vector data; can be inserted into docs, PNG still downloadable inside |
| **JSON** | The diagram data itself — versioned, diffable, reusable across projects |

## Project Structure

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

## Documentation

- [docs/ROADMAP.md](docs/ROADMAP.md) — version roadmap, pain-point background, **design boundaries** (connection strategy, data compatibility promise)
- [docs/usage.md](docs/usage.md) — detailed usage guide (中文使用指南)

## Contributing

- **Templates**: add plain JSON to `templates.js` and open a PR — no build step involved
- **Bugs / feature requests**: open an issue (template request or editor bug)
- Roadmap decisions live in [docs/ROADMAP.md](docs/ROADMAP.md) — read it before starting bigger work

## License

[Apache-2.0](LICENSE) © 2026 ArchForm Contributors
