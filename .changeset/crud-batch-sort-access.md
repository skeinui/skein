---
"@skeinui/cli": patch
---

`skein new page --from` pages: rows to tick (export the ticked rows as CSV, delete them together; an "Export" for the rows on screen), sortable headers when the list has sort parameters (`sortBy` + `order`, or `sort=-name`; the mock sorts too), and every action behind its permission (`orders:create`, `update`, `delete`; the route asks for `orders:read`) in a project with the access module. Sort parameters are no longer taken for search filters.
