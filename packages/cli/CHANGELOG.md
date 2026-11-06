# @skeinui/cli

## 0.0.7

### Patch Changes

- f4c54f0: Admin projects: the preferences button is a floating button (bottom right) instead of an icon in the header / sidebar; the account menu shows the user's `avatar` when the profile has one, refreshes the profile (`/api/auth/profile`) so a session from before a change shows it, and its button is the avatar's size (`--user-avatar-size` in `styles/index.css`). With `--tenant`, the switcher is at least 2rem high in every theme style and its menu at least as wide as the switcher.
- 8d31ce8: Admin template: a configurable toolbar next to the account menu and on the sign-in page (`settings.toolbar`, tools in `src/modules/toolbar/`): built-in language (with flags) and light / dark tools, your own added by id; the account menu keeps only the user and sign out. Themes: AdminLayout's action icons are drawn like the side menu's (size, ~1.5px strokes, the row color at 80%, also in a Semi Dark / custom-colored sidebar); antd's header actions are 28px in its secondary text color, like Ant Design Pro.
- 2c0bf15: `skein check` finds the locale files, and tells pages' sources from their locales, on Windows too (backslash paths): the i18n checks were skipped there. Its issues come in the same order on every system.
- abd275a: `skein new page --from` writes a detail page when the OpenAPI document reads one item (`GET /orders/{id}`): `/orders/42` (under `$tenant/` with `--tenant`), linked from the table's name column, with a back-to-list button and a not-found state; its request, query key, translations and mock come with it. With `--tenant` the generated mocks give each tenant its own rows (listed, read, changed and created per tenant).
- 464f258: `new page --from` gives the CRUD page the `List` icon (was `Table2`).
- 7ebaf9e: Admin template: the mocked admin user has an avatar (the Skein UI GitHub avatar).
- 4291193: Generated projects turn on the Toaster's `richColors`: typed toasts are tinted in their color.
- 0fe557f: `skein create --tenant` (admin): every page is under its tenant (`/acme/orders`, routes in `routes/_auth/$tenant/`, where `skein new page` now writes them), with a tenant switcher next to the logo that goes to the same page of the tenant picked (a detail page's list) and moves the open tabs along. The tenant is set before a page loads and sent as `X-Tenant-Id` with every request; an address without a tenant gets the one used last; each tenant's pages have a query cache of their own; the mock gives each tenant its own users. Every admin project gets a user detail page (`/users/<id>`), the cache is cleared on sign-out, and the shell keys tabs and kept-alive pages by the matched route's path, so a navigation that is still loading no longer shows the previous page under the new tab.
- d6d3579: `skein new page` gives a menu group an icon (`Settings` for system / settings, `Folder` otherwise), and `new page` / `new module` list the files whose Chinese texts are English placeholders (the CLI can't translate). `skein check` warns about texts left untranslated: a zh.json value or a `_meta.ts` `label.zh` that is the same English as its en (abbreviations such as SKU / ID aside). The admin shell's tab bar takes its accessible name from the locale instead of a fixed "Pages".

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
