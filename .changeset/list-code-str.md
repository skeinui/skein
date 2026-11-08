---
"@skeinui/cli": patch
---

Admin template: the list code (`lib/list-query`, the query builder, the CSV export) turns values into text with `str`, so an object is JSON instead of `[object Object]` and a generated project has no `no-base-to-string` warnings.
