# @skeinui/cli

## 0.0.6

### Patch Changes

- 5426d3f: Projects made by `skein create` are on [Vite+](https://viteplus.dev/guide/): `vp dev` / `vp build` / `vp check` (Vite, Rolldown, Vitest, Oxlint, Oxfmt), `vite` aliased to its core, lint and format set up in `vite.config.ts`, and a git hook (`prepare: vp config`) running `vp check --fix` on the staged files. `npm run check` runs `skein check` then `vp check`, and a fresh project passes it as is. Files the CLI writes into a project later are formatted with its `vp fmt`; `skein theme add` / `remove` read `themeStyles` as a formatter leaves it; `skein preview` starts `vp dev` (`vite` for older projects) and stops the server it starts.

## 0.0.5

### Patch Changes

- c7b2962: Windows: commands that edit a project (`theme use` / `add` / `init --use`, `new page`, …) work on files with CRLF line endings and keep them; the paths `skein create`, `new`, `check` report (`--json`, MCP) use `/`; `skein create` copies `public/` as it is and renames `_gitignore` in every directory.

## 0.0.4

### Patch Changes

- 9ea5f6e: **Breaking:** the theme state on `<html>` is renamed: `data-theme-style` → `data-skein-theme`, `data-mode` → `data-skein-mode`, `data-theme-color` → `data-skein-color`, `data-theme-density` → `data-skein-density`. `ConfigProvider`'s props are unchanged. A theme style of your own (`src/theme/`) and the inline script in `index.html` need the new names; `skein check` points it out, and `skein theme use` rewrites the attribute in `index.html`.
- 8e71a8d: `@skeinui/themes/vite`: the `skeinThemes()` Vite plugin bundles only the stylesheets of the components a project imports from `@skeinui/ui` (`manifest.json` gains a `styles` map). Projects made by `skein create` use it; `skein theme use` / `theme add` add it to a project started with `--theme none` when they install `@skeinui/themes`.

## 0.0.3

### Patch Changes

- Admin template: detail pages, nested layouts and header buttons in the shell; "Powered by Skein UI" in the footer (`settings.poweredBy`); AGENTS.md names every MCP tool.
- Themes: the drawer body's scrollbar sits at the drawer's edge and its content's outlines are no longer clipped (heroui, default, shadcn).
- Components: props documented with JSDoc and `@default` (shown by `skein docs`); Mentions calls `onSearch` after rendering.
- Packages: keywords, homepage https://skeinui.com, shorter READMEs that fit npm's page.

## 0.0.2

### Patch Changes

- First public release: React components on Base UI, swappable theme styles, the skein CLI (create, pages, theme styles, docs, check, preview, MCP) and generative UI. `npm create skein` now runs `skein create`.
