---
"@skeinui/ui": patch
"@skeinui/themes": patch
"@skeinui/cli": patch
---

`QueryBuilder` is a component: the conditions of a list as chips on one line, a popover to change one, "Filter" to add a condition (rows of conditions and groups of them, all of / any of, as deep as needed). It edits the `filter` of a list request (`QueryCondition` / `QueryGroup`), offers only what the backend can do (`capabilities`), and has its styles in every theme style (`query-builder.css`). It was a module copied into every admin project (`src/modules/query-builder`): the users template and `skein new page --from` import it from `@skeinui/ui` now, and the module is gone from new projects.
