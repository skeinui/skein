---
name: skein-page
description: Add or change a page of this app — route, menu entry, API calls, translations and mocks. Use when the user asks for a new screen, a list / CRUD page, a detail page, or a new menu item.
---

# Adding a page

{{#if router}}
1. Generate it: `npx skein new page <path>` (`orders`, `system/roles`…). Never create the files by hand: the command writes the route{{#if shell}}, the menu entry{{/if}}{{#if i18n}}, translations{{/if}}{{#if query}}, the API file{{/if}}{{#if mock}} and a mock{{/if}}, and changes nothing that already exists.
{{#if shell}}
   **If the API is described by an OpenAPI document**, generate a working CRUD page instead: `npx skein new page orders --from api.yaml` (add `--resource /orders` when the name doesn't match a path). It writes typed requests, filters, the table, the create / edit dialog, translations{{#if mock}} and mocks{{/if}}, and a detail page linked from the table when the document has `GET /orders/{id}`; then adjust labels and columns.
1. Menu: edit `src/pages/<path>/_meta.ts` — `label: { zh, en }`, `icon` (a lucide-react icon; the generated page has `File`, a group `Folder`), `order`. `hidden: true` keeps a routable page out of the menu.
{{/if}}
{{#if query}}
1. API: in `src/pages/<path>/api/index.ts` write typed request functions with `http` from `@/lib/http` and a `keys` object for query keys. In the page use `useQuery({ queryKey, queryFn })`; after a change, `useMutation` then `queryClient.invalidateQueries({ queryKey: keys.all })`.
{{/if}}
{{#if mock}}
1. Mock: the same endpoints in `src/pages/<path>/mocks/handlers.ts` with msw (`http.get("*/api/…", () => HttpResponse.json({ data }))`). Wrap responses in `{ data }`; `http` unwraps it.
{{/if}}
{{#if i18n}}
1. Text: every string in `locales/messages/zh.json` **and** `en.json` with the same keys; `const { t } = use<Page>Translation()`; `t("key")`, `t("key", { name })` for values. The generated texts are English in both files (and in `_meta.ts`'s `label.zh`): translate the Chinese ones; `npm run check` warns about any left.
{{/if}}
{{#if shell}}
1. Layout: `<Page title={t("title")} description={…} actions={<Button color="primary">…</Button>}>` from `@/skein-shell`, then `Card`s. A list page (filters, table, pagination, create / edit dialog, delete confirmation) — copy `src/pages/users/` and adapt it. Buttons only some users may use (create, edit, delete) go in `<Access code="orders:create">` from `@/modules/access`; see AGENTS.md, "Who may do what".
{{/if}}
1. `npm run check` until it reports no errors.
{{#if preview}}
1. `npx skein preview /<path>` until it reports ✓, and look at the screenshot: the data shows, nothing overflows.
{{/if}}
{{else}}
This app has no router. Add one by recreating the project with `--router`, or render the new screen from `src/App.tsx`.
{{/if}}
