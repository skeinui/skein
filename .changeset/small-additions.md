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

`Page`, `PageHeader` and `PageFooter`: the frame of a page (the padding and spacing, `fill` for a table that scrolls its rows), its top (title, one line of description, actions on the right) and its bottom (the actions that finish it, `sticky` to stay in reach), laid out by the theme style so the pages of different apps are framed the same way. The `Page` of the admin template is built on them, and a project no longer carries `.page` rules of its own.

Five more pieces pages wrote by hand: `DateText` / `formatDateText` (a date or moment as text in the app's language, a `<time>` with the exact moment; a dash when empty); `name` on `Avatar` (the initials as its fallback and the name as `alt`; `MessageThread` uses it); `label` and `description` on `Field` (the label and the description around the control without `Field.Label` and `Field.Description`); `exportCsv` on `TableTools` (the file's name, header and rows are given, the CSV is made and downloaded for you: quoted, UTF-8 with a byte order mark, formulas in cells made harmless) with `downloadCsv` and `toCsv` exported; and `ConfirmButton` (a Button that asks in a bubble before it acts, `color="danger"` makes the bubble danger too). None needs a stylesheet.

`weekday` on `DateText` / `formatDateText` (the day of the week alone, for a column of days); `NumberText` / `formatNumberText` (a number as text in the app's language: a count, a percentage, money, a size; `format`, `precision`, `notation="compact"`, a `<data>` with the exact value, a dash when empty); and `loading` / `notFound` on `Page` (a spinner or your `Empty` takes the place of the content while a detail page's data loads or when it is not there, and the header and frame stay). None needs a stylesheet.

`Page` scrolls inside its own frame (a `ScrollArea`, so the scrollbar is the theme style's) and the pane of a `KeepAlive` that holds a `Page` no longer scrolls itself; a `Table` is in a `ScrollArea` for its sideways scrolling too, not only with a fixed header. The table-tools icons are lighter. A new `page-content` slot holds the padding and the spacing: a project's own theme style needs it in `page.css` (`skein theme check` lists it).

A `Table` without a fixed header passes a vertical wheel or swipe on to what holds it (the page scrolls), instead of the table's `ScrollArea` keeping it.

`skein check` has a `pages` check: in an admin project, a page (`src/pages/<path>/index.tsx` or `detail.tsx`) that is not framed by `<Page>`, or has more than one primary button in its `actions`, is a warning with a hint (the sign-in and the fallback pages are left out).

The Ant Design style in light mode: the text of success, warning and danger (soft tags, statistics, outline buttons) and the initials in an avatar had 1.8 to 3:1 against their background; they are darker now (about 5:1), the fills and borders stay Ant Design's.

Three more pieces pages wrote by hand: `TextPair` (two lines that belong together: a name over its email, a subject over its preview; `extra` after the title, `strong`, `ellipsis`), `DueTag` (when something is due: the time left, a red "Overdue" tag after it, a dash when done, "Paused" when the clock is stopped; counts again every minute) and `back` on `PageHeader` / `Page` (the way back to the list, a small link above the title; a new `page-header-back` slot that a project's own theme style needs in `page-header.css`). `TextPair` and `DueTag` need no stylesheet.

The Skein style's `Table` / `DataTable`: a quieter header (smaller, medium weight, a step lighter than the rows, round corners), roomier cells (12px at the sides, 44px rows), no divider between header columns except where a column can be dragged, and figures in right-aligned columns line up.
