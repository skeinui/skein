---
"@skeinui/ui": patch
"@skeinui/themes": patch
"@skeinui/cli": patch
---

Four small things a list page and a detail page kept writing CSS for. `Text`, `Paragraph` and `Title` take `nowrap` (one line, for a date or an id) and `preserveWhitespace` (the line breaks of a text a person typed are kept, long words wrap); `Table.Cell`, `Table.Head` and the columns of `DataTable` take `nowrap`. `Grid` takes `aside` (`start` or `end`) and `asideWidth` (`sm`, `md`, `lg`): a main column and a side column of a fixed width that stack below 64rem. `DataTable` takes `activeKey`, the row whose details are open beside the table (highlighted, `aria-current`), and `onRowClick`, which makes the rows clickable (Enter and Space on a focused row too; a click on a link, a button, the tick box or a popover inside the row is not a click on the row); `Table.Row` has the matching `active` and `interactive`.

`Field.Label` with `nativeLabel={false}` renders a `div` by itself (Base UI wants a non-`<label>` element then, and warned in the console for every label otherwise).
