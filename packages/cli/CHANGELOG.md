# @skeinui/cli

## 0.1.3

### Patch Changes

- 9ee47d6: A table can keep its header in view and scroll only its rows, filling the height of the page. `DataTable` takes `stickyHeader` (`Table` had it), `Card` takes `fill` and `Flex` takes `grow`, which pass a limited height down to the table. With a fixed header the table is in a `ScrollArea`: its scrollbar is the theme style's, starts below the header and stops at the bottom of the rows (the shadcn style's transparent header is opaque then). In the admin template `Page` takes `fill`, and `TableTools` has a toggle for the fixed header (`useFixedHeader` remembers the choice, fixed at first): the users page and the pages `skein new page --from` makes use them, so the page does not scroll, the table does.
- 99ebfdd: MenuButton, RelativeTime, MentionText, StatisticCard and NotificationBell: five components extracted from the helpdesk example. The notification bell has one slot (`notification-bell`, its width) in every theme style.

  List: a `false` / `null` entry in `actions` (`cond && <Button />`) is skipped, so it leaves no empty cell and no divider.

- d3bba45: `QueryBuilder` is a component: the conditions of a list as chips on one line, a popover to change one, "Filter" to add a condition (rows of conditions and groups of them, all of / any of, as deep as needed). It edits the `filter` of a list request (`QueryCondition` / `QueryGroup`), offers only what the backend can do (`capabilities`), and has its styles in every theme style (`query-builder.css`). It was a module copied into every admin project (`src/modules/query-builder`): the users template and `skein new page --from` import it from `@skeinui/ui` now, and the module is gone from new projects.
- d3bba45: Six small things pages kept writing CSS for: `Text` / `Paragraph` `size` (`xs`, `sm`, `lg`); a `minWidth` on a `DataTable` column (the smallest width a title shrinks to); a `width` (`sm`, `md`, `lg`) on `SearchInput` and `InputGroup`; `scrollable` on `Segmented` (many options scroll sideways, the selected one stays in view); `hoursUntil` on `RelativeTime` (how long it counts in hours before days, for a deadline); an `xs` size of `Avatar`.

  `BulkActionBar` ("3 selected", the actions on those rows and a button to clear the selection) shows while rows of a table are ticked, in the flow above the table (`placement="top"`) or floating at the bottom edge of the scrolling area (`placement="bottom"`); it has a stylesheet in every theme style.

  `MessageThread` (a conversation between people: who wrote each message, its kind (the customer's, the agent's, an internal note), when, the text with its mentions in bold, the files) and `MessageComposer` (the box under it: a switch between the ways of writing, a box that takes mentions, a toolbar for what you add, a send button); both are compositions of existing components and need no stylesheet of their own.

  `TableToolbar` (the row above a table: the search box and the conditions on the left, the table's tools on the right, a "Reset" when something is set; it holds no state) and `EnumTag` (the value of a field with a fixed set of values as a Tag, its text and colour from one table per field instead of a component per field); neither needs a stylesheet.

  Three helpers for the pages of a generated project (`src/lib`): `useListQuery` (the page, size, sort, keyword and filter of a list as a `ListQuery`, with the props of `Pagination`), `useApiMutation` (`useMutation` with the error as a toast, a success message and the queries asked again) and `QueryBoundary` (a detail page's spinner, not found and data). The users template and the pages `skein new page --from` writes use them, so they are shorter; a project from before them gets the files with its next `new page`.

  `SavedViews`: the searches a person keeps under a name: a row to choose from (and remove) and a button that asks for a name; it stores nothing, `onSelect` / `onDelete` / `onSave` hand every change back (a promise from `onSave` keeps the dialog open until it is done). The popovers of `QueryBuilder` and `NotificationBell` have an accessible name now, and the bell's label is "Notifications, 2 unread" so the number on it is part of its name.

  `Page`, `PageHeader` and `PageFooter`: the frame of a page (the padding and spacing, `fill` for a table that scrolls its rows), its top (title, one line of description, actions on the right) and its bottom (the actions that finish it, `sticky` to stay in reach), laid out by the theme style so the pages of different apps are framed the same way. The `Page` of the admin template is built on them, and a project no longer carries `.page` rules of its own.

  Five more pieces pages wrote by hand: `DateText` / `formatDateText` (a date or moment as text in the app's language, a `<time>` with the exact moment; a dash when empty); `name` on `Avatar` (the initials as its fallback and the name as `alt`; `MessageThread` uses it); `label` and `description` on `Field` (the label and the description around the control without `Field.Label` and `Field.Description`); `exportCsv` on `TableTools` (the file's name, header and rows are given, the CSV is made and downloaded for you: quoted, UTF-8 with a byte order mark, formulas in cells made harmless) with `downloadCsv` and `toCsv` exported; and `ConfirmButton` (a Button that asks in a bubble before it acts, `color="danger"` makes the bubble danger too). None needs a stylesheet.

  `weekday` on `DateText` / `formatDateText` (the day of the week alone, for a column of days); `NumberText` / `formatNumberText` (a number as text in the app's language: a count, a percentage, money, a size; `format`, `precision`, `notation="compact"`, a `<data>` with the exact value, a dash when empty); and `loading` / `notFound` on `Page` (a spinner or your `Empty` takes the place of the content while a detail page's data loads or when it is not there, and the header and frame stay). None needs a stylesheet.

  `Page` scrolls inside its own frame (a `ScrollArea`, so the scrollbar is the theme style's) and the pane of a `KeepAlive` that holds a `Page` no longer scrolls itself; a `Table` is in a `ScrollArea` for its sideways scrolling too, not only with a fixed header. The table-tools icons are lighter. A new `page-content` slot holds the padding and the spacing: a project's own theme style needs it in `page.css` (`skein theme check` lists it).

  A `Table` without a fixed header passes a vertical wheel or swipe on to what holds it (the page scrolls), instead of the table's `ScrollArea` keeping it.

  `skein check` has a `pages` check: in an admin project, a page (`src/pages/<path>/index.tsx` or `detail.tsx`) that is not framed by `<Page>`, or has more than one primary button in its `actions`, is a warning with a hint (the sign-in and the fallback pages are left out).

  The Ant Design style in light mode: the text of success, warning and danger (soft tags, statistics, outline buttons) and the initials in an avatar had 1.8 to 3:1 against their background; they are darker now (about 5:1), the fills and borders stay Ant Design's.

  Three more pieces pages wrote by hand: `TextPair` (two lines that belong together: a name over its email, a subject over its preview; `extra` after the title, `strong`, `ellipsis`), `DueTag` (when something is due: the time left, a red "Overdue" tag after it, a dash when done, "Paused" when the clock is stopped; counts again every minute) and `back` on `PageHeader` / `Page` (the way back to the list, a small link above the title; a new `page-header-back` slot that a project's own theme style needs in `page-header.css`). `TextPair` and `DueTag` need no stylesheet.

  The Skein style's `Table` / `DataTable`: a quieter header (smaller, medium weight, a step lighter than the rows, round corners), roomier cells (12px at the sides, 44px rows), no divider between header columns except where a column can be dragged, and figures in right-aligned columns line up.

  The Ant Design style's `Table` / `DataTable`: an empty table shows Ant Design's "no data" picture (light and dark), a loading one a turning ring in place of it, and figures in right-aligned columns line up.

  The Ant Design style: the table header is a little lower (48px, was 55px) and a `Segmented` has more room (a small one: 24px items, 10px at the sides, was 20px and 7px; 4px between the selected option and the frame, was 2px).

  Table and pagination sizes in every theme style, so they look the same size together: rows are 40 / 44 / 48px in the Skein and Ant Design styles, 36 / 40 / 44px in shadcn/ui and 38 / 42 / 46px in HeroUI for `sm` / `md` / `lg` (headers are as high as a row, or 4px lower in Skein and 6px in HeroUI), a step of 4px between sizes; the controls of a `Pagination` are 28 / 32 / 36px in all four (the page size select follows its `size` now). A theme style no longer depends on the app's `box-sizing` reset for the height of a header, and a checkbox or a tag in a cell no longer makes its row taller than the theme says. The Skein table's header is quieter and its cells roomier; the Ant Design `Segmented` keeps its options 4px from the frame.

  The footer of the admin layout has no space above its text (the page above has its own padding at the bottom); a fixed footer keeps it.

  `useTableColumns(keys, label)` holds which columns a table shows and in which order: render its `shown`, spread its `tools` into `TableTools`. `TableToolbar` keeps the text typed in its search box itself when `keyword` is not passed (and "Reset" clears it). The CLI's projects get `createSavedViews(key)` (the store of a list's saved searches, for `SavedViews`) and `QueryBoundary` takes `empty` (an empty list) and an optional `notFound`; the generated pages use `useTableColumns`.

- e36226a: Four small things a list page and a detail page kept writing CSS for. `Text`, `Paragraph` and `Title` take `nowrap` (one line, for a date or an id) and `preserveWhitespace` (the line breaks of a text a person typed are kept, long words wrap); `Table.Cell`, `Table.Head` and the columns of `DataTable` take `nowrap`. `Grid` takes `aside` (`start` or `end`) and `asideWidth` (`sm`, `md`, `lg`): a main column and a side column of a fixed width that stack below 64rem. `DataTable` takes `activeKey`, the row whose details are open beside the table (highlighted, `aria-current`), and `onRowClick`, which makes the rows clickable (Enter and Space on a focused row too; a click on a link, a button, the tick box or a popover inside the row is not a click on the row); `Table.Row` has the matching `active` and `interactive`.

  `Field.Label` with `nativeLabel={false}` renders a `div` by itself (Base UI wants a non-`<label>` element then, and warned in the console for every label otherwise).

- 6883c9c: Two parts every list page and every conversation kept copying or styling by hand are components now. `TableTools` is the tools of a table, on the right of its toolbar: refresh (the refresh icon turns while it reloads), a fixed header, which columns to show and in which order, and export; each button appears when its props are given, and `useFixedHeader` keeps the user's choice of a fixed header. It was a module copied into every admin project (`src/modules/table-tools`): the template and `skein new page --from` import it from `@skeinui/ui` now, and the module and its styles are gone from new projects. `Callout` is a block of content set apart from the text around it, such as a message of a conversation (the customer's, the agent's, an internal note), a suggested reply or a quotation: `variant` (`outline`, `soft`, `dashed`) and `color` set the look.

## 0.1.2

### Patch Changes

- 3dcec1e: `Badge` is now what Ant Design calls a badge: a number or a dot hung on the corner of another element (`count`, `max`, `showZero`, `dot`, `placement`, `color`, `size`), or drawn on its own. The text label it used to be is `Tag`, which had the same props (`variant`, `color`, `size`, `radius`) and is the one to use for a status or a keyword. The notifications tool of the admin template hangs the unread count on the bell with it.
- 9482cff: The users page of the admin template and the pages `skein new page --from` makes use `DataTable`, `FormDialog` and `SearchInput`: the tables, the create / edit dialogs and the keyword boxes are shorter, and Enter that confirms a word of an input method no longer starts a search.

## 0.1.1

### Patch Changes

- 195132c: `skein new page --from`: the mock's sort turns values into text with `str` (from `lib/list-query`), so the generated page has no `no-base-to-string` warning.
- 1a7b64e: Projects with the `i18n` feature are made with i18next 27 and react-i18next 18 (they were 26 and 17).
- 1a7b64e: Projects with the `mock` feature pin msw to one version (3.0.4, no range) and carry the `public/mockServiceWorker.js` of that very version, so the worker is never older than the msw installed; a test keeps the feature's version equal to the catalog's.
- 5f43fbf: Admin template: `RouterLink` (`@/skein-shell`, `createLink(Link)`) is the router's `<Link>` drawn by the theme style's `Link`; the users table and the pages made by `skein new page --from` use it for the link to the detail page, so it is no longer a bare blue underlined `<a>`.

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
