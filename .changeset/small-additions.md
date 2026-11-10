---
"@skeinui/ui": patch
"@skeinui/themes": patch
"@skeinui/cli": patch
---

Six small things pages kept writing CSS for: `Text` / `Paragraph` `size` (`xs`, `sm`, `lg`); a `minWidth` on a `DataTable` column (the smallest width a title shrinks to); a `width` (`sm`, `md`, `lg`) on `SearchInput` and `InputGroup`; `scrollable` on `Segmented` (many options scroll sideways, the selected one stays in view); `hoursUntil` on `RelativeTime` (how long it counts in hours before days, for a deadline); an `xs` size of `Avatar`.

`BulkActionBar` ("3 selected", the actions on those rows and a button to clear the selection) shows while rows of a table are ticked, in the flow above the table (`placement="top"`) or floating at the bottom edge of the scrolling area (`placement="bottom"`); it has a stylesheet in every theme style.

`MessageThread` (a conversation between people: who wrote each message, its kind (the customer's, the agent's, an internal note), when, the text with its mentions in bold, the files) and `MessageComposer` (the box under it: a switch between the ways of writing, a box that takes mentions, a toolbar for what you add, a send button); both are compositions of existing components and need no stylesheet of their own.

`TableToolbar` (the row above a table: the search box and the conditions on the left, the table's tools on the right, a "Reset" when something is set; it holds no state) and `EnumTag` (the value of a field with a fixed set of values as a Tag, its text and colour from one table per field instead of a component per field); neither needs a stylesheet.

Three helpers for the pages of a generated project (`src/lib`): `useListQuery` (the page, size, sort, keyword and filter of a list as a `ListQuery`, with the props of `Pagination`), `useApiMutation` (`useMutation` with the error as a toast, a success message and the queries asked again) and `QueryBoundary` (a detail page's spinner, not found and data). The users template and the pages `skein new page --from` writes use them, so they are shorter; a project from before them gets the files with its next `new page`.

`SavedViews`: the searches a person keeps under a name: a row to choose from (and remove) and a button that asks for a name; it stores nothing, `onSelect` / `onDelete` / `onSave` hand every change back (a promise from `onSave` keeps the dialog open until it is done). The popovers of `QueryBuilder` and `NotificationBell` have an accessible name now, and the bell's label is "Notifications, 2 unread" so the number on it is part of its name.

`PageHeader`: the top of a page (title, one line of description, actions on the right), laid out by the theme style so the pages of different apps start the same way. The `Page` of the admin template is built on it.
