# ArchForm

**Turn diagram-drawing into form-filling.**

[English](README.md) | [简体中文](README.zh-CN.md)

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen)](#)
[![Platform](https://img.shields.io/badge/Platform-file%3A%2F%2F%20%7C%20Static-lightgrey)](#)

> ArchForm is a zero-dependency, fully-offline editor for **structured block diagrams** — the layered architecture diagrams that enterprise architects draw every day: overall, application, data, and technology architecture. Instead of dragging boxes across a free canvas, you edit a data tree (Diagram → Layer → Group → Block → Item) and the layout is generated for you — consistent, review-ready, and versionable.
>
> Layered architecture diagrams are **structured data**, not free-form canvases. Freehand drawing is out of scope — see our [design boundaries](docs/ROADMAP.md).

## Preview

| | |
|---|---|
| Overall Architecture · layered · default blue | Data Architecture · layered · green palette |
| ![Overall Architecture template](docs/images/preview.png) | ![Data Architecture template with green palette](docs/images/data-green.png) |
| Central-core layout · amber palette | Clean PNG export (standalone, current palette) |
| ![Central core layout with amber palette](docs/images/central-amber.png) | ![Standalone PNG export](docs/images/export-data.png) |

## Why not another canvas tool?

Layered architecture diagrams are roughly 90% nested structure — **Layer → Group → Block → Item** — not a free topology. Canvas tools (draw.io, Visio, ProcessOn) make you hand-align boxes, tune spacing, and unify styles, so most of your effort goes into *arranging* rather than *thinking*. ArchForm replaces that with **structured input → automatic layout → enforced style**, and keeps the diagram itself versionable, diffable, and reusable.

## Features

- **Structured input** — edit a four-level tree (Diagram → Layer → Group → Block → Item); a quick-add bar at the bottom of the tree types nodes with Enter / Tab / Shift+Tab, and a right-click context menu covers new / copy / paste / move up / move down / delete
- **Undo / redo** — 50-step history across every edit (structure, properties, color schemes, template loads), Ctrl+Z / Ctrl+Shift+Z
- **Automatic layout** — three paradigms over the same data, switchable without losing anything: *layered*, *central core*, and *cards grid*
- **Enforced style spec** — dashed panels, 2px corners, fixed type scale; six preset color schemes plus a custom six-shade palette, saved with the diagram (pillar bars included)
- **Built for architecture reviews** — a bottom legend bar and right-side pillar bars for cross-cutting concerns such as security, operations, and governance
- **Bulk input from text** — File → **From Text** turns indented text into a whole diagram with a live structure preview; no need to hand-drag boxes
- **Copy & paste structure** — deep-clone any layer / group / block (Ctrl+C / Ctrl+V); pasted copies keep the same shape with fresh IDs, inserted as a sibling or child depending on the target
- **Auto statistics** — each layer shows its group / block / item counts automatically (toggleable per layer)
- **Fully offline** — export vector **SVG**, high-resolution **PNG** (2×), or a standalone **HTML** file with embedded vector data; zero network requests, zero runtime dependencies, double-click `file://` to run
- **Versioned data** — every diagram carries a `schemaVersion` and is auto-migrated on load (`migrateDiagram`); JSON import/export plus `localStorage` autosave
- **Five built-in templates** — Generic Layered, Overall Architecture, Application Architecture, Data Architecture (data-warehouse layering), and Technology Architecture

## Quick Start

```bash
git clone https://github.com/Lincoln-cn/archform.git
cd archform
# no install, no server, no network — just open:
start index.html        # Windows
open index.html         # macOS / Linux
```

Works straight from `file://`.

### Deploy to GitHub Pages

The repository is GitHub Pages-ready — all asset references are relative:

1. Push the repository to GitHub, then go to **Settings → Pages** and publish from the `master` branch, root `/`.
2. Your online copy will be served at `https://<user>.github.io/archform/` (a `.nojekyll` file keeps the static hosting predictable).
3. Open it in any browser — same editor, no backend. Note that `localStorage` autosave is scoped per origin and path, so the online copy keeps a separate profile from your local files; use **Export JSON / Import JSON** to move diagrams between them.

No GitHub? Drop the folder on any static host or intranet share — `index.html` is the entry point.

## Templates

| Template | Layout | Use case |
|---|---|---|
| Generic Layered | layered | Generic layered reference (capability demo) |
| Overall Architecture | layered | User → Application → Platform → Data → Infrastructure, with security/ops pillars |
| Application Architecture | layered | Application systems and their functional modules |
| Data Architecture | layered | Source → ODS → DWD → DWS → ADS → Service layering by subject domain |
| Technology Architecture | layered | Access → Services → Middleware → Storage → Infrastructure |

Templates are plain data in `templates.js` — copy the JSON structure to add your own.

## Export

| Format | Description |
|---|---|
| **SVG** | Vector; scales losslessly and stays editable (File → Export SVG) |
| **PNG** | 2× high-resolution raster of the whole diagram with the current palette (toolbar: Export PNG) |
| **HTML** | Standalone file with full styles and embedded vector data; insert it into documents and download the PNG from inside |
| **JSON** | The diagram data itself — versioned, diffable, reusable across projects |

## Project Structure

```
.
├─ index.html           # Editor shell (inline style spec + page; double-click to run)
├─ editor-core.js       # State, node lookup, data versioning (migrateDiagram)
├─ editor-tree.js       # Structure tree: render, node ops, quick-add, copy/paste, context menu
├─ editor-render.js     # Render engine: layered / central / cards
├─ editor-ui.js         # Property panel, color schemes, export (SVG/PNG/HTML), zoom, events
├─ templates.js         # Built-in template library (plain data)
├─ docs/                # Public documentation (roadmap, usage guide)
└─ LICENSE              # Apache-2.0
```

## Documentation

- [docs/ROADMAP.md](docs/ROADMAP.md) — version roadmap, background on the pain points, and **design boundaries** (connection strategy, data compatibility promise)
- [docs/usage.md](docs/usage.md) — detailed usage guide (in Chinese)

## Contributing

- **Templates**: add plain JSON to `templates.js` and open a PR — no build step involved
- **Bugs and feature requests**: open an issue (say whether it is a template request or an editor bug)
- Roadmap decisions live in [docs/ROADMAP.md](docs/ROADMAP.md) — read it before starting bigger work

## License

[Apache-2.0](LICENSE) © 2026 ArchForm Contributors
