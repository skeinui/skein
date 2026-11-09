---
"@skeinui/ui": patch
"@skeinui/themes": patch
"@skeinui/cli": patch
---

A table can keep its header in view and scroll only its rows, filling the height of the page. `DataTable` takes `stickyHeader` (`Table` had it), `Card` takes `fill` and `Flex` takes `grow`, which pass a limited height down to the table. With a fixed header the table is in a `ScrollArea`: its scrollbar is the theme style's, starts below the header and stops at the bottom of the rows (the shadcn style's transparent header is opaque then). In the admin template `Page` takes `fill`, and `TableTools` has a toggle for the fixed header (`useFixedHeader` remembers the choice, fixed at first): the users page and the pages `skein new page --from` makes use them, so the page does not scroll, the table does.
