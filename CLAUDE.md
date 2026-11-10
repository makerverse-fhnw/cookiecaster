# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CookieCaster 3.0 is a client-side React application for designing 3D-printable cookie cutters. Users draw shapes on an SVG canvas using a graph-based editor with quadratic Bézier curves, then export designs as binary STL files for 3D printing. No backend — all persistence uses localStorage/sessionStorage.

Live: https://makerverse-fhnw.github.io/cookiecaster/

## Commands

```bash
yarn dev              # Start Vite dev server
yarn build            # Production build (output: dist/)
yarn lint             # ESLint (flat config, ignores test/, docs/, coverage/)
yarn test             # Run all Jest tests (requires --experimental-vm-modules)
yarn coverage         # Run tests with coverage report

# Run a single test file:
node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js test/graph/Graph.test.js

# Run tests matching a pattern:
node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --testPathPattern="modes"
```

Package manager: **Yarn 4.9.1** (do not use npm). Tests require Node's `--experimental-vm-modules` flag for ESM support.

## Architecture

### Layered Structure

```
src/
├── entities/          # Domain models (no React, no DOM)
├── business-logic/    # Core logic, handlers, modes, services
│   ├── services/      # ServiceContainer + ServicesProvider (React context)
│   ├── handlers/      # SvgHandler, SelectionHandler, Controller
│   ├── modes/         # Drawing modes (state pattern)
│   └── graph-operations/  # Validation, Analysis
├── ui/                # React components and pages
│   ├── components/    # Shared components (Navbar, Layout)
│   └── pages/         # Page dirs, each with components/ and hooks/ subfolders
├── utils/             # Import/export utilities
├── templates/         # Preset design JSON files
└── translations/      # i18n (de.json, en.json via react-intl)
```

### Key Architectural Patterns

**Service Container** (`src/business-logic/services/`):
- `ServiceContainer.js` — factory function `createServices()` wires up all core objects (Graph, SvgHandler, SelectionHandler, Controller, Modes) with lazy cross-references to resolve circular dependencies.
- `ServicesProvider.jsx` — React context provider. Access services in components via `useServices()` hook.

**State Pattern for Drawing Modes** (`src/business-logic/modes/`):
- `AbstractMode` defines the interface: `enable()`, `disable()`, `onMouseDown()`, `onMouseMove()`, `onMouseUp()`, `onEscape()`.
- Four concrete modes: `ModeDraw`, `ModeMove`, `ModeRotate`, `ModeSelect`.
- The `Controller` manages mode switching via `setModes()`.

**Graph as Core Data Structure** (`src/entities/graph/`):
- `Graph` holds `Map<id, Node>` and `Map<id, Edge>` with adjacency tracking.
- `Edge` stores a quadratic Bézier control point (`q`).
- `Graph.toJSON()`/`fromJSON()` for serialization; `fromSvg()` for SVG path parsing.
- `Validation.js` and `Analysis.js` in `graph-operations/` provide shape validation and printability analysis.

**SVG-DOM Bridge** (`src/business-logic/handlers/`):
- `SvgHandler` manages SVG element creation/removal using D3.js, keeping DOM in sync with the Graph model.
- `SelectionHandler` manages visual selection state.
- `Controller` orchestrates handlers and delegates mouse events to the active mode.

### UI Structure

- Each page in `ui/pages/` has its own directory with a main component, a `components/` subfolder, and a `hooks/` subfolder.
- Shared components (Navbar, Layout) go in `ui/components/`.
- Routing defined in `App.jsx` — when adding a new page, register its route there and optionally link it from the navbar.

### Routing

Hash-based routing via `react-router-dom` (`HashRouter`) for GitHub Pages compatibility. Routes in `App.jsx`:
- `/` — Home, `/start` — Drawing editor, `/export` — STL export, `/gallery` — Saved designs, `/ueber` — About, `/about` — Imprint.

### Storage

- **localStorage** key `"drawings"` — array of `{id, name, graphJSON, svgPath, saved, timestamp}`. `saved: true` = persistent, `saved: false` = temporary autosave.
- **sessionStorage** key `"selectedDrawingId"` — passes drawing selection from Gallery to Start page.

### File Formats

- `.cc3` — custom JSON format for full project state, handled by `FileImport.js` and `FileExport.js`.
- `.stl` — binary STL export for 3D printing via `ExportToBinarySTL.js`.

## Tech Stack

- React 19, Vite 7 (base path: `/cookiecaster/`), D3.js 7, React Bootstrap, react-intl, react-router-dom
- Jest 30 with ESM (`--experimental-vm-modules`), jsdom environment
- ESLint 9 flat config — `no-unused-vars` allows uppercase-prefixed and underscore-prefixed identifiers
- Default locale is German (`de`), with English (`en`) support
- All components are functional (no class components)

## Conventions

- **Branches**: `feature/*`, `fix/*`, `docs/*`, `chore/*` — branch from `main`.
- **Commits**: short summary line, optional description, reference issues with `refs #123`.
- **Testing**: minimum 80% code coverage required. PRs without tests or that drop coverage below 80% will be declined. Tests live in `test/` mirroring `src/` structure.
- **Forking workflow**: contributors fork, create a branch, then PR back to `main`.

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `checks.yml` — PR checks: build, test, lint (Node 24)
- `coverage.yml` — Coverage reporting on push to main
- `release_auto.yml` — Automatic patch releases (currently disabled)
- `release_manual.yml` — Manual release trigger; version updated in both `package.json` and `VERSION.md`
