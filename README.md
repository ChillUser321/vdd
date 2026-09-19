# Crochet Design Editor

Frontend-only crochet design editor built with Vite, React, TypeScript, Excalidraw, Zustand, and Tailwind CSS.

The editor supports tablet and desktop screens. Phones receive a larger-screen notice.

## Features

- Crochet stitch library and editable square, polar, radial, and custom SVG guides.
- Browser autosave with automatic restore on the same browser and device.
- Downloadable/importable `.crochet.json` project backups.
- Bundled starter templates and app-level object groups.
- Full-artboard and per-group PNG/SVG exports with optional guides and transparency.
- A custom canvas preset with editable pixel measurements.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

The app is browser-only and can be hosted from the generated `dist/` folder.

## End-to-End Smoke Test

```bash
npx playwright install chromium-headless-shell
npm run test:e2e
```

The tests run headless and cover desktop, tablet, phone gating, autosave, templates, groups, exports, symbols, and guides. Screenshots are written under `test-results/`.

## GitHub Pages

Pushes to `main` run the GitHub Pages deployment workflow. In the GitHub repo,
set Pages source to `GitHub Actions`, then open the published Pages URL.
