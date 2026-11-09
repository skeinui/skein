---
"@skeinui/ui": patch
---

New components `DataTable`, `FormDrawer` and `FormDialog`. `DataTable` is a table from data (`columns`, `rows`) with loading and empty states, an optional checkbox column, sorting, and an actions column whose buttons can ask for confirmation first (`actions` is a function returning the actions of a row, falsy entries skipped, so a permission reads naturally). `FormDrawer` and `FormDialog` are a `Form` in a drawer or a dialog, with Cancel and Save in the footer. `Form` takes an `id` and `actions={false}`, so a button elsewhere can submit it with `form={id}`.
