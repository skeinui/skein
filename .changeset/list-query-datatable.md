---
"@skeinui/cli": minor
---

Admin template: lists are asked with one standard query. `src/lib/list-query` holds the `ListQuery` (page, sort, keyword, and a filter of conditions and nested all-of / any-of groups, with `eq`, `contains`, `in`, `between`, `gt`… as operators), the adapters that turn it into what a backend takes (`standardAdapter`: `POST …/search`; `flatAdapter`: `?status=paid&amount.gt=100`, which refuses what it can't say instead of dropping it) and `applyListQuery`, which the mocks use. The users page is a data table in one card: a keyword and the conditions as chips (`modules/query-builder`, a popover changes one, groups nest) and the table's tools (`modules/table-tools`: refresh, which columns to show and in which order, export the rows on screen as CSV). AGENTS.md and the page skill describe it.
