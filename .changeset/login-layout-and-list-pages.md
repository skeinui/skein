---
"@skeinui/cli": minor
---

The admin template's sign-in page is a `LoginLayout`: split (a cover and the form) by default, with a button in the toolbar to switch to centered or cover (kept in the browser); `skein create --login-layout centered|split|cover` sets the default (`settings.loginLayout`), and a project with only the auth feature gets a centered one. `skein new page --from` makes the same kind of list page as the users page: the keyword box (a `q` / `keyword` / `search` parameter) and the other parameters as conditions in the search bar, which offers only what the API takes (`paramAdapter` from the OpenAPI parameters: one condition per field, no `or`, no groups), and the table's tools (refresh, columns shown and their order, CSV of what is shown). A project made before the search bar and the table tools gets their files the first time such a page is generated.
