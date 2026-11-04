# {{title}}

A React app built with [Skein UI](https://github.com/skeinui/skein){{#if shell}}: an admin app (layout, menu, tabs, login){{/if}}. Read this before changing code.

## Commands

- `npm run dev`: start the app{{#if mock}} (the API is mocked by MSW, see `.env.development`){{/if}}{{#if auth}}; sign in with admin / admin123{{/if}}.
- `npm run check`: **run after every change.** Type errors, missing translations, hard-coded colors and theme coverage, each with a hint on the Skein way to fix it. Repeat until it reports no errors. `npm run build` must pass too.
{{#if preview}}
- `npx skein preview <route>`: **after changing a page, open it.** It starts the dev server, opens the route in Chrome{{#if auth}} (signed in){{/if}} and lists exceptions, console errors, failed requests and a blank page, then saves a screenshot (path in the output) to look at. Fix what it reports until it says ✓; `--json` for the details.
{{/if}}
- `npx skein docs <Component>`: props (with the allowed values), parts and examples of a Skein component. `npx skein docs --search <words>` finds one. Look a component up instead of guessing its props.
{{#if router}}
- `npx skein new page <path>`: add a page, e.g. `orders` or `system/roles`. It writes the route{{#if shell}}, the menu entry{{/if}}{{#if i18n}}, the translations{{/if}}{{#if query}}, the API file{{/if}}{{#if mock}} and a mock{{/if}}. Don't create page files by hand.
{{/if}}
{{#if shell}}
- `npx skein new page <path> --from <openapi.yaml> [--resource /orders]`: when there is an API description, a complete list / filter / create / edit / delete page with typed requests{{#if mock}} and mocks{{/if}}, from one resource of an OpenAPI 3 document. Prefer it to writing a CRUD page by hand.
{{/if}}
- `npx skein new module <name>`: a part that isn't a page, in `src/modules/<name>/`.
{{#if shell}}
- `npx skein theme use <default|shadcn|heroui|antd>`: the default theme style. `npx skein theme add antd heroui skein` lets users switch between several in the preferences drawer (`themeStyles` in `src/settings.ts`; each is loaded only when picked), `theme remove` takes one out.
{{else}}
- `npx skein theme use <default|shadcn|heroui|antd>`: switch the theme style.
{{/if}}

Every `skein` command takes `--json` for machine-readable output and `--dry-run` to only list what it would write.
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
  modules/<name>/       parts that aren't pages (user menu, preferences…), same layout as a page
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
```

{{#if router}}
## Adding a page

1. `npx skein new page orders`{{#if shell}}; it shows up in the menu right away{{/if}}.
{{#if query}}
2. Write the requests in `src/pages/orders/api/index.ts` with `http` and export query keys; use them with `useQuery` / `useMutation` in the page.
{{/if}}
{{#if mock}}
3. Mock the same endpoints in `src/pages/orders/mocks/handlers.ts` (`http.get("*/api/orders", …)` from msw).
{{/if}}
{{#if i18n}}
4. Put every text in `locales/messages/zh.json` and `en.json` (same keys in both) and use `t("key")`.
{{/if}}
{{#if shell}}
5. Wrap the page in `<Page title description actions>` from `@/skein-shell`. For a list with filters, a table, pagination and a create / edit dialog, copy the structure of `src/pages/users/`.
6. Set the menu label, icon (lucide-react) and order in `_meta.ts`.

A layout route under `routes/_auth/` that wraps a set of pages (e.g. `$tenant.tsx` around `$tenant.orders.tsx`) renders `<PageOutlet />` from `@/skein-shell` where its pages go, not `<Outlet />`: the shell keeps pages alive in tabs and hands each layout its own page.
{{/if}}

{{/if}}
## When you are done

`npm run check` reports no errors and `npm run build` passes.
