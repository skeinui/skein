---
"@skeinui/ui": patch
"@skeinui/themes": patch
"@skeinui/cli": patch
---

Six small things pages kept writing CSS for: `Text` / `Paragraph` `size` (`xs`, `sm`, `lg`); a `minWidth` on a `DataTable` column (the smallest width a title shrinks to); a `width` (`sm`, `md`, `lg`) on `SearchInput` and `InputGroup`; `scrollable` on `Segmented` (many options scroll sideways, the selected one stays in view); `hoursUntil` on `RelativeTime` (how long it counts in hours before days, for a deadline); an `xs` size of `Avatar`.

`BulkActionBar` ("3 selected", the actions on those rows and a button to clear the selection) shows while rows of a table are ticked, in the flow above the table (`placement="top"`) or floating at the bottom edge of the scrolling area (`placement="bottom"`); it has a stylesheet in every theme style.

`MessageThread` (a conversation between people: who wrote each message, its kind (the customer's, the agent's, an internal note), when, the text with its mentions in bold, the files) and `MessageComposer` (the box under it: a switch between the ways of writing, a box that takes mentions, a toolbar for what you add, a send button); both are compositions of existing components and need no stylesheet of their own.
