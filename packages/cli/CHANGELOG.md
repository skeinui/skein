# @skeinui/cli

## 0.1.0

### Minor Changes

- e5748cd: Admin template: lists are asked with one standard query. `src/lib/list-query` holds the `ListQuery` (page, sort, keyword, and a filter of conditions and nested all-of / any-of groups, with `eq`, `contains`, `in`, `between`, `gt`… as operators), the adapters that turn it into what a backend takes (`standardAdapter`: `POST …/search`; `flatAdapter`: `?status=paid&amount.gt=100`, which refuses what it can't say instead of dropping it) and `applyListQuery`, which the mocks use. The users page is a data table in one card: a keyword and the conditions as chips (`modules/query-builder`, a popover changes one, groups nest) and the table's tools (`modules/table-tools`: refresh, which columns to show and in which order, export the rows on screen as CSV). AGENTS.md and the page skill describe it.
- 4c2f1d3: The admin template's sign-in page is a `LoginLayout`: split (a cover and the form) by default, with a button in the toolbar to switch to centered or cover (kept in the browser); `skein create --login-layout centered|split|cover` sets the default (`settings.loginLayout`), and a project with only the auth feature gets a centered one. `skein new page --from` makes the same kind of list page as the users page: the keyword box (a `q` / `keyword` / `search` parameter) and the other parameters as conditions in the search bar, which offers only what the API takes (`paramAdapter` from the OpenAPI parameters: one condition per field, no `or`, no groups), and the table's tools (refresh, columns shown and their order, CSV of what is shown). A project made before the search bar and the table tools gets their files the first time such a page is generated.
- 4b221e0: New component LoginLayout: the page around a sign-in (or sign-up) form, in three looks for the same parts, `centered` (the form in a card in the middle), `split` (a cover on the left, the form on the right, the cover on wide screens only) and `cover` (the card over a full-page background, a soft glow or a `backgroundImage`). The brand, the title, a line under it, the form, other ways in (`providers` with `onProvider`, behind a divider), a footer, a toolbar and the split cover are slots; the brand is separate from the title so it doesn't change with the language. Every theme style draws it (`--ui-login-min-height` sets the page's height, the viewport's by default) and the theme coverage check requires `login-layout.css`.
- cb3e060: Sortable: a `variant` prop. `tile` (the default, as before) is a card per item; `list` is plain rows with no fill, border or gap, lit under the pointer or keyboard focus, with a faint drag handle: the look for a short list inside a popover or menu, such as which columns of a table to show and in which order. Every theme style draws it (`data-variant="list"`, now part of the theme coverage check).
- fc76a17: Admin template: users choose the header's tools in the preferences drawer. A "Toolbar" section lists every tool of `modules/toolbar/tools.tsx` with a switch and buttons to move the shown ones; the choice is kept in the browser (`modules/toolbar/store.ts`, read back with a check), "Reset to defaults" brings back `settings.toolbar.header`, and the drawer's Export / Import carries it (`AdminLayoutSettings` `extra`). `settings.toolbar.header` is now the default, not the only choice.

### Patch Changes

- 03f2cb7: Admin template: button-level permissions. The user has `permissions` (`orders:create`; `*` is everything, `orders:*` every action on orders); `<Access code>` and `useAccess()` in `src/modules/access` show only what they allow, `requireAccess(code)` in a route's `beforeLoad` gives the 403 page. The users page uses them; the mock has `admin` (everything), `viewer` (read only) and `guest` (nothing).
- 03f2cb7: Admin template: sessions and errors. A refused access token (401) is renewed with the refresh token (`POST /api/auth/refresh`) and the request sent again; when that fails the login page says the session expired and signing in comes back to the page. Failed requests are an `HttpError` with a message in the app's language (the API's own, asked with `Accept-Language`, else the status in words, `src/lib/errors/`; status 0 for no answer). A page that throws shows a "failed to load" page with a retry (`defaultErrorComponent`), also inside the keep-alive tabs; the mock answers in the language asked for.
- 432271b: Admin template: a profile answer that is not a user (index.html when the mock is not up) no longer replaces the signed-in user, and a user in storage that is not one is dropped: it crashed the avatar menu on every page, also after a reload.
- bdc99a8: `skein new page --from` pages: rows to tick (export the ticked rows as CSV, delete them together; an "Export" for the rows on screen), sortable headers when the list has sort parameters (`sortBy` + `order`, or `sort=-name`; the mock sorts too), and every action behind its permission (`orders:create`, `update`, `delete`; the route asks for `orders:read`) in a project with the access module. Sort parameters are no longer taken for search filters.
- 7be6619: Admin template: `http` treats an HTML answer to a data request as a failed request (404). The dev server answers any path nothing handles with `index.html` and status 200, so with the mock not started a query received a string instead of its data and the bell in the header crashed the whole page (`data.filter is not a function`); now the query fails like any other and the page stays up.
- 7326ddc: Admin template: the list code (`lib/list-query`, the query builder, the CSV export) turns values into text with `str`, so an object is JSON instead of `[object Object]` and a generated project has no `no-base-to-string` warnings.
- 5c6f923: LoginLayout: the `cover` slot of the split look is the middle of the cover (new `login-layout-cover-body`), under the brand and over the soft glow, which the layout now always draws; it used to replace all of it. The admin template's split sign-in page has a drawing and a tagline there (`pages/login/components/login-cover.tsx`).
- eb29efc: LoginLayout split: the cover has a drawing of its own (`login-layout-illustration`, its accents the primary color, floating, still with reduced motion) with the tagline `coverTitle` / `coverDescription` under it; `cover` replaces it, `cover={null}` leaves the middle empty. The admin template's sign-in page passes only the tagline now, and its own copy of the drawing is gone.
- c046927: LoginLayout's split cover: the glow is one soft diagonal band of the primary color over a tinted background (the corners' glow stays for the cover look), and the brand is larger. The admin template's cover has the drawing at a quarter of the width and the tagline in a larger, regular weight.
- f851bc1: `skein new page system\logs` (a path typed with backslashes, on Windows) makes `system/logs` instead of a `system-logs` page; a `skein check` message shows its path with `/` there too.
- cba12c8: Admin template: what the stores read back from browser storage is checked. The preferences (mode, layout settings), the open tabs, the session (token, refresh token, user, where to go after signing in) and the tenant keep what has the right shape and leave the rest to the defaults, so storage written by an older version, another tool or by hand can no longer break every page; the first paint's color mode in `index.html` is checked too. The path to go to after signing in has to be a path of the app.
- 7a8d05e: Admin template: a detail page's tab keeps its title after a reload while it is in the background (it showed its path until opened).
- 8845083: Admin template: closing a page tab no longer breaks the next navigation ("Converting circular structure to JSON"). The tab bar hands back the tabs with their icons (React elements), which were saved with the tabs as JSON; the stored tabs have no icons now (they are worked out from the menu at every render).
- 7326ddc: Admin template: the toolbar (search, notifications, language, mode) is on the right of the header by default (`toolbar: "header"` in the layout of `src/settings.ts`); users can still move it to the bottom of the menu in the preferences drawer. The library's own default is unchanged.
- 56c4b86: Admin template: two more built-in toolbar tools, on by default: "search" (a command palette of the menu's pages, ⌘K / Ctrl+K) and "notifications" (a bell with the unread count and the list, `src/modules/notifications/` with its API and mock). Requests send the app's language as `Accept-Language`, so the API can answer in it.

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
