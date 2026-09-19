# Project Context

## Current Status

- Violet Drizzle Designer is now a Vite React TypeScript app.
- The app is browser-only and uses Excalidraw as the drawing engine.
- Main specification: `research/crochet_design_editor_codex_spec.md`.
- Repository guidance: `AGENTS.md`.
- GitHub remote: `https://github.com/ngudles69/vdd`.
- Latest pushed implementation commit: `041dddf Render artboard as overlay`.

## Implemented

- Vite, React, TypeScript, Tailwind CSS, Zustand, Excalidraw, and Playwright are installed.
- App shell exists with a top bar, left toolbar, central Excalidraw workspace, and right properties panel.
- The app branding is `Violet Drizzle Designer`.
- Artboard presets are available from the top bar, including A4 portrait, A4 landscape, square, TikTok 9:16, and custom-style preset data.
- The artboard is rendered as a non-editable overlay instead of an Excalidraw scene element.
- The Excalidraw canvas remains unlimited around the artboard, so tools and objects are not cramped into the artboard bounds.
- Selecting TikTok 9:16 centers and fits the artboard in the available workspace.
- Symbols open from the left toolbar as a Canva-style left drawer.
- A crochet symbol library is ported into the app and rendered as selectable element tiles.
- Clicking a symbol inserts it into Excalidraw as an independent object.
- Inserted symbols are not children of the artboard, are not grouped with it, and have no `frameId`.
- Scene layering model is started:
  - Artboard: non-scene overlay at the bottom.
  - Guides/grids: future metadata-driven layer above the artboard.
  - Objects such as symbols and text: Excalidraw scene elements above guides/grids.
- Projects autosave in the browser and can be imported/exported as `.crochet.json` files.
- PNG and SVG static export is available for full artboards and groups.
- Templates and app-level group management are available.
- Phones show a larger-screen gate; tablets and desktops load the editor.
- GitHub Pages deployment uses GitHub Actions from `.github/workflows/deploy.yml`.

## Verification

- `npm run build` passes.
- `npm run test:e2e` passes with Playwright headless.
- Playwright screenshots have been inspected for:
  - Empty editor shell.
  - TikTok 9:16 artboard fit.
  - Symbol library drawer.
  - Symbol insertion and independent dragging.

## Commands

- `npm install` installs dependencies.
- `npm run dev` starts the local Vite development server.
- `npm run build` creates the production build.
- `npm run preview` serves the production build locally.
- `npm run test:e2e` runs Playwright tests.

## Deferred

- Define the full feature list before adding more implementation.
- Turn the full feature list into milestones and implementation phases.
- Decide the project data model for saves, including artboard, guides, grids, objects, symbols, groups, and export settings.
- Animated exports are intentionally excluded unless a future instructional use case requires motion.
- Continue bundle-size optimization and dependency security updates as compatible Excalidraw releases become available.
- Keep UI/layout work covered by Playwright headless tests plus screenshot inspection before marking it done.
