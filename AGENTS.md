# Repository Guidelines

## Project Structure & Module Organization

This repository contains a frontend-only crochet design editor. The source specification is `research/crochet_design_editor_codex_spec.md`.

When implementation begins, use the structure described in the spec:

- `src/app/` for the React shell, layout, and UI.
- `src/editor/` for Excalidraw integration and scene adapters.
- `src/guides/`, `src/templates/`, `src/symbols/`, `src/groups/`, and `src/export/` for feature modules.
- `src/state/` for Zustand stores and `src/types/` for shared models.
- `public/templates/` for bundled template JSON and preview assets.

Keep feature code close to its domain. Do not mix Excalidraw adapter logic with app panels or export utilities.

## Build, Test, and Development Commands

Use the checked-in npm package files and these commands:

- `npm install` to install dependencies.
- `npm run dev` to start the local Vite development server.
- `npm run build` to produce the production build.
- `npm run preview` to serve the built app locally.
- `npm run test:e2e` for the Playwright regression suite.

Document command changes in `README.md` and keep this file updated.

## Coding Style & Naming Conventions

Use TypeScript with strict types. Prefer React function components and hooks. Name components in `PascalCase`, such as `CanvasShell.tsx`; name utilities and stores in `camelCase`, such as `exportArtboard.ts`.

Use 2-space indentation for TypeScript, TSX, CSS, and JSON. Keep app state in Zustand stores and shared data contracts in `src/types/`. Do not add backend code; the app is browser-only.

## Testing Guidelines

Add focused tests as implementation appears. Prefer colocated tests named `*.test.ts` or `*.test.tsx`. Prioritize project JSON save/load, artboard presets, guide transformations, group metadata, and export bounds calculations.

Run the full test suite before opening a pull request. For UI changes, manually verify the editor in a browser.

For any UI/layout change, do not report the work as done until it has been checked in Playwright headless and the resulting screenshot has been inspected. DOM assertions alone are not enough; verify the rendered layout visually with a Playwright screenshot.

## Commit & Pull Request Guidelines

This directory is not currently a Git repository, so no local convention can be inferred. Use concise, imperative commit messages, for example `Add artboard preset store`.

Pull requests should include a summary, testing notes, linked issues when available, and screenshots or recordings for visible UI changes. Call out deferred work or browser API limits.

## Agent-Specific Instructions

Follow the build spec in `research/` as the source of truth. Use Excalidraw as the drawing engine, not the full app UI. Keep guides, templates, and group metadata outside the Excalidraw scene and persist them in the project JSON wrapper.
