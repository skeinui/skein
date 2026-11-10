# {{title}}

A React app built with [Skein UI](https://github.com/skeinui/skein){{#if shell}}: an admin app (layout, menu, tabs, login){{/if}}. Read this before changing code.

## Commands

- `npm run dev`: start the app{{#if mock}} (the API is mocked by MSW, see `.env.development`){{/if}}{{#if auth}}; sign in with admin / admin123{{/if}}.
- `npm run check`: **run after every change.** First `skein check` (type errors, missing translations, hard-coded colors, theme coverage and the frame of each page (`<Page>`, one primary action), each with a hint on the Skein way to fix it), then `vp check` (format, lint, types). `npx vp check --fix` formats and fixes what it can. Repeat until it reports no errors. `npm run build` must pass too.
{{#if preview}}
- `npx skein preview <route>`: **after changing a page, open it.** It starts the dev server, opens the route in Chrome{{#if auth}} (signed in){{/if}} and lists exceptions, console errors, failed requests and a blank page, then saves a screenshot (path in the output) to look at. Fix what it reports until it says ✓; `--json` for the details.
{{/if}}
- `npx skein docs <Component>`: props (with the allowed values), parts and examples of a Skein component. `npx skein docs --search <words>` finds one. Look a component up instead of guessing its props.
- Show a value with its component, not by hand: a date is `<DateText value dateStyle timeStyle>` (`weekday` for a day of the week; `formatDateText` for a string), a number, percentage or amount of money `<NumberText value format="percent" | "currency" precision>` (`formatNumberText`), "5 minutes ago" `<RelativeTime>`. They follow the app's language, so never write `Intl.DateTimeFormat` / `Math.round(x * 100)` and `%` in a page. A button that asks first is `<ConfirmButton question onConfirm>`, a labelled control `<Field label description>`, a person's initials `<Avatar name>`.
{{#if router}}
- `npx skein new page <path>`: add a page, e.g. `orders` or `system/roles`. It writes the route{{#if shell}}, the menu entry{{/if}}{{#if i18n}}, the translations{{/if}}{{#if query}}, the API file{{/if}}{{#if mock}} and a mock{{/if}}. Don't create page files by hand.
{{/if}}
{{#if shell}}
- `npx skein new page <path> --from <openapi.yaml> [--resource /orders]`: when there is an API description, a complete list / search / sort / create / edit / delete page (a keyword box when the API has a `q` / `keyword` / `search` parameter, the other parameters as conditions in the search bar, which offers only what the API takes; refresh, columns and CSV in the table's tools) with typed requests{{#if mock}} and mocks{{/if}}, from one resource of an OpenAPI 3 document, with rows to tick (export them as CSV, delete them together), sortable headers when the list has `sortBy` + `order` (or `sort=-name`) parameters, each action behind its `<resource>:create|update|delete|read` permission (`orders:create`…), plus a detail page (`/orders/42`{{#if tenant}}, under the tenant{{/if}}) when the document reads one item (`GET /orders/{id}`). Prefer it to writing a CRUD page by hand.
{{/if}}
- `npx skein new module <name>`: a part that isn't a page, in `src/modules/<name>/`.
{{#if shell}}
- `npx skein theme use <default|shadcn|heroui|antd>`: the default theme style. `npx skein theme add antd heroui skein` lets users switch between several in the preferences drawer (`themeStyles` in `src/settings.ts`; each is loaded only when picked), `theme remove` takes one out.
{{else}}
- `npx skein theme use <default|shadcn|heroui|antd>`: switch the theme style.
{{/if}}

Every `skein` command takes `--json` for machine-readable output and `--dry-run` to only list what it would write.

The toolchain is [Vite+](https://viteplus.dev/guide/) (`vp`): `vp dev`, `vp build`, `vp check`, `vp test` (Vite, Rolldown, Vitest, Oxlint, Oxfmt), set up in `vite.config.ts`. Import its APIs from `vite-plus` (`defineConfig`) and `vite-plus/test` (`describe`, `expect`…), not from `vite` or `vitest`: lint reports those. A git hook runs `vp check --fix` on the staged files before each commit.
{{#if mcp}}

The same commands are MCP tools (`.mcp.json` starts `npx skein mcp`); use them when your client has MCP:

- `skein_docs`, `skein_list`: look up components, templates and theme styles
- `skein_check`{{#if preview}}, `skein_preview`{{/if}}: check your work after a change
- `skein_new_page`, `skein_new_module`: add pages and modules
- `skein_theme_use`, `skein_theme_add`, `skein_theme_init`: theme styles
- `skein_create_project`: a new project
{{/if}}

## Skein rules

- Components take **no `className` / `style`**: every visual comes from the theme style ({{#if shell}}`themeStyles` in `src/settings.ts`{{else}}`src/skein.theme.ts`{{/if}}). Lay out with `Flex`, `Grid`, `Row` / `Col`, or wrap a component in your own element.
- Variants are values: `variant`, `color`, `size`, `radius`. Only the values `skein docs` lists exist.
- Controlled values use `value` / `onValueChange`; open state uses `open` / `onOpenChange`.
- Prefer data props (`options`, `items`, `fields`) over building markup: e.g. `<Form fields={[…]} />`, `<Select options={[…]} />`.
- In your own CSS, colors come from tokens: `var(--ui-fg)`, `var(--ui-c-primary)`, `var(--ui-border)`… never hex values, so they follow the theme style and dark mode.
- `ConfigProvider` (in `src/providers.tsx`) puts the theme on `<html>`; keep it at the root.

## Layout

```
src/
  main.tsx, App.tsx, providers.tsx
{{#if shell}}
{{else}}
  skein.theme.ts        the theme style (import + name); `skein theme use` rewrites it
{{/if}}
{{#if customTheme}}
  theme/                this app's own theme style: tokens.css, dark.css, one file per component
{{/if}}
{{#if router}}
  routes/               TanStack Router file routes, thin: each points at a page{{#if auth}}; routes/_auth/ needs a session{{/if}}
{{/if}}
  pages/<name>/         one directory per page:
    index.tsx           the page component
{{#if shell}}
    _meta.ts            its menu entry: icon, { zh, en } label, order (a directory with only _meta.ts is a menu group)
{{/if}}
{{#if query}}
    api/index.ts        request functions + query keys (TanStack Query)
{{/if}}
    components/         parts used only by this page
{{#if i18n}}
    locales/            messages/zh.json + en.json, used through use<Page>Translation()
{{/if}}
{{#if mock}}
    mocks/handlers.ts   MSW handlers for this page's API (picked up automatically)
{{/if}}
{{#if shell}}
  modules/<name>/       parts that aren't pages (user menu, toolbar, preferences…), same layout as a page
  skein-shell/          AdminLayout wired to the router: menu, tabs, KeepAlive, Page frame
  settings.ts           app defaults: name, home path, theme styles (themeStyles / themeStyle), default layout, menuPermission
{{/if}}
{{#if query}}
  lib/http.ts           fetch wrapper: http.get / post / put / delete; `{ data }` responses are unwrapped
{{/if}}
{{#if i18n}}
  lib/i18n.ts           i18next, zh (default) and en
{{/if}}
{{#if auth}}
  store/auth-store.ts   the session (zustand, persisted)
{{/if}}
{{#if tenant}}
  store/tenant-store.ts the tenant in use (the address's; persisted for paths without one); requests send it as X-Tenant-Id
{{/if}}
```

{{#if router}}
## Adding a page

1. `npx skein new page orders`{{#if shell}}; it shows up in the menu right away{{/if}}.
{{#if query}}
1. Write the requests in `src/pages/orders/api/index.ts` with `http` and export query keys; use them with `useQuery` / `useMutation` in the page.
{{/if}}
{{#if mock}}
1. Mock the same endpoints in `src/pages/orders/mocks/handlers.ts` (`http.get("*/api/orders", …)` from msw).
{{/if}}
{{#if i18n}}
1. Put every text in `locales/messages/zh.json` and `en.json` (same keys in both) and use `t("key")`. `new page` (and `--from`) writes the English name as a placeholder in zh.json and in `_meta.ts`'s `label.zh`: write the Chinese (`npm run check` warns about what is left).
{{/if}}
{{#if shell}}
1. Wrap the page in `<Page title description actions>` from `@/skein-shell`: it is the `Page` of `@skeinui/ui` plus the tab title (the theme style lays out the padding, the header with the title, description and actions, the content and the footer, so every page is framed the same way; `fill` for a table that scrolls its rows). What finishes a page (Cancel, Save) goes in `footer={<PageFooter sticky>…</PageFooter>}`. The main action of the page is one primary `Button` in `actions`, not in the toolbar of a table. A detail page whose data is loading or missing keeps its frame: `<Page loading={query.isPending} notFound={query.error ? <Empty title={t("notFound")} /> : undefined}>`. For a list with filters, a table, pagination and a create / edit dialog, copy the structure of `src/pages/users/`. A detail page goes under its list's path (`/users/42`: `src/pages/users/detail.tsx`, route `users_.$id.tsx`, `_` so it isn't nested in the list's route), so the menu, the breadcrumb{{#if tenant}} and switching tenants{{/if}} know which list it belongs to.
1. Set the menu label, icon (lucide-react) and order in `_meta.ts`.

{{#if tenant}}
Every page is under its tenant: `/acme/orders`, route files in `routes/_auth/$tenant/` (`new page` puts them there), menu paths and `_meta.ts` without the tenant. `routes/_auth/$tenant.tsx` makes the address's tenant the current one before the page loads, and `src/lib/http.ts` sends it as `X-Tenant-Id` with every request: the API answers for that tenant, so don't pass it to requests by hand. A path without a tenant (`/orders`) gets the one used last. The switcher (`src/modules/tenant-switcher/`, next to the logo) lists `GET /api/tenants` (`[{ id, name }]`{{#if mock}}, mocked{{/if}}) and goes to the same page of the tenant picked (on a detail page, its list); open tabs follow. Links between pages include the tenant (`<RouterLink from="/$tenant/users" to="/$tenant/users/$id">`, `RouterLink` from `@/skein-shell`: the router's `Link` drawn by the theme style's). Each tenant's pages use a query cache of their own (`src/modules/tenant-switcher/query-clients.ts`), so query keys don't need the tenant.

{{/if}}
A layout route under `routes/_auth/` that wraps a set of pages (e.g. `$tenant.tsx` around `$tenant.orders.tsx`) renders `<PageOutlet />` from `@/skein-shell` where its pages go, not `<Outlet />`: the shell keeps pages alive in tabs and hands each layout its own page.

Lists and search: a list page asks its API with a `ListQuery` (`@/lib/list-query`): `{ page, pageSize, sort?, keyword?, filter? }`, where `filter` is a condition `{ field, op, value }` (`op`: `eq`, `ne`, `contains`, `startsWith`, `endsWith`, `in`, `gt`, `gte`, `lt`, `lte`, `between`, `blank`, `notBlank`) or a group `{ logic: "and" | "or", items: [...] }` of them, as deep as needed. The page never builds backend parameters: a `QueryAdapter` turns the query into the request one backend takes: `standardAdapter` (`POST <path>/search` with the query as the body, what `src/pages/users/` uses), `flatAdapter()` (`?status=paid&amount.gt=100&sort=-amount`; it can't say `or` or nested groups and throws `UnsupportedQueryError` instead of dropping them) or one you write (a `toRequest` function and the `capabilities` of the backend) for an API with rules of its own. `fetchList(path, query, adapter)` sends it; `applyListQuery(rows, query, { keywordFields })` runs a query over rows, which is what a mock does. The row above a table is `TableToolbar` (from `@skeinui/ui`): a search box (`keyword`, `onSearch`), the conditions as chips (`fields`, `filter`, `onFilterChange`: `QueryBuilder`, with a popover to change one and "Filter" to add a condition, rows of conditions and groups of them; `fields` are `text`, `number`, `date`, `enum`, `boolean`, each with its operators), a "Reset" (`onReset`), and the table's tools on the right (`tools`); the box keeps the typed text itself unless you pass `keyword`. The table's tools on the right of the toolbar are `TableTools` (from `@skeinui/ui`): refresh, a fixed header (the table keeps its header in view and only the rows scroll: `Page fill`, `Card fill`, `Flex grow` and `DataTable stickyHeader`, with `useFixedHeader` to remember the user's choice), which columns to show and in which order (`useTableColumns(keys, label)` holds it: render `cols.shown`, spread `cols.tools` into `TableTools`), and export the rows on screen as CSV (`exportCsv` of `TableTools` gives the file's name, header and rows and the CSV is made for you; `downloadCsv` / `toCsv` from `@skeinui/ui` for a button of your own). Copy `src/pages/users/` for a list page. Four helpers in `@/lib` keep a page short: `useListQuery()` holds the `ListQuery` of a list (`list.query` to ask with, `list.search(...)` for a new keyword / filter, `list.sort(...)`, and `<Pagination variant="pages" {...list.pagination(total)} />`); `useApiMutation({ mutationFn, invalidate: [keys.all], success: (data, vars) => "…" })` is `useMutation` with the error shown as a toast, a success toast, and the lists asked again (your `onSuccess` still runs, to close a dialog); `<QueryBoundary query={query} notFound={…} empty={…}>{(data) => …}</QueryBoundary>` is a spinner / not found / empty list / data (a detail page, or a card's list); `createSavedViews("orders")` makes the store of a list's saved searches for `SavedViews` (`views`, `add(name, search)`, `remove(id)`, kept in the browser).

Who may do what: the API gives the signed-in user `permissions` (`GET /api/auth/profile`, also in the sign-in response): `<resource>:<action>` codes such as `orders:create`; `*` is everything, `orders:*` every action on orders. Wrap what only some users may use in `<Access code="orders:delete">…</Access>` (`fallback` for what others see instead) or ask `const { can } = useAccess()` (`@/modules/access`, `can("orders:update")`); both only decide what is shown, the API must check the permission too. Name the codes like `src/pages/users/` does (`users:create`, `users:update`, `users:delete`).{{#if mock}} The mock's `admin` may do everything, `viewer` / `viewer123` only reads, `guest` / `guest123` has no permission at all.{{/if}} A page's door is `beforeLoad: () => requireAccess("orders:read")` in its route (`@/modules/access`): a user without it gets the 403 page; a page that throws gets a "failed to load" page with a retry (`defaultErrorComponent`, `src/router.ts`).

Requests and sessions: `src/lib/http.ts` sends the token and the app's language (`Accept-Language`: the API answers in it). An access token the API refuses (401) is renewed with the refresh token (`POST /api/auth/refresh` → `{ token, refreshToken? }`{{#if mock}}, mocked{{/if}}) and the request is sent again; when that fails the session ends: the login page says it expired and signing in comes back to the page. A failed request is an `HttpError` (`status` 0: no answer): its `message` is the API's own, else the status in words (`src/lib/errors/`), so `toast.danger(error.message)` is enough.{{#if mock}} A mock answers in the language asked for with `localized(request, { zh, en })` from `@/mocks/language`.{{/if}}
{{/if}}

{{/if}}
## When you are done

`npm run check` reports no errors and `npm run build` passes.
