# @skeinui/ui

## 0.1.3

### Patch Changes

- 9ee47d6: A table can keep its header in view and scroll only its rows, filling the height of the page. `DataTable` takes `stickyHeader` (`Table` had it), `Card` takes `fill` and `Flex` takes `grow`, which pass a limited height down to the table. With a fixed header the table is in a `ScrollArea`: its scrollbar is the theme style's, starts below the header and stops at the bottom of the rows (the shadcn style's transparent header is opaque then). In the admin template `Page` takes `fill`, and `TableTools` has a toggle for the fixed header (`useFixedHeader` remembers the choice, fixed at first): the users page and the pages `skein new page --from` makes use them, so the page does not scroll, the table does.
- 35fe45c: `Form` (and `FormDrawer` / `FormDialog`) show their validation messages in the language of the `ConfigProvider` (`labels.form.required`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `email`, `url`; English and Chinese are in), they were always English unless `messages` was passed. A text of only spaces no longer satisfies `required`.
- 99ebfdd: MenuButton, RelativeTime, MentionText, StatisticCard and NotificationBell: five components extracted from the helpdesk example. The notification bell has one slot (`notification-bell`, its width) in every theme style.

  List: a `false` / `null` entry in `actions` (`cond && <Button />`) is skipped, so it leaves no empty cell and no divider.

- d3bba45: `QueryBuilder` is a component: the conditions of a list as chips on one line, a popover to change one, "Filter" to add a condition (rows of conditions and groups of them, all of / any of, as deep as needed). It edits the `filter` of a list request (`QueryCondition` / `QueryGroup`), offers only what the backend can do (`capabilities`), and has its styles in every theme style (`query-builder.css`). It was a module copied into every admin project (`src/modules/query-builder`): the users template and `skein new page --from` import it from `@skeinui/ui` now, and the module is gone from new projects.
- d3bba45: Six small things pages kept writing CSS for: `Text` / `Paragraph` `size` (`xs`, `sm`, `lg`); a `minWidth` on a `DataTable` column (the smallest width a title shrinks to); a `width` (`sm`, `md`, `lg`) on `SearchInput` and `InputGroup`; `scrollable` on `Segmented` (many options scroll sideways, the selected one stays in view); `hoursUntil` on `RelativeTime` (how long it counts in hours before days, for a deadline); an `xs` size of `Avatar`.

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

  The Ant Design style's `Table` / `DataTable`: an empty table shows Ant Design's "no data" picture (light and dark), a loading one a turning ring in place of it, and figures in right-aligned columns line up.

  The Ant Design style: the table header is a little lower (48px, was 55px) and a `Segmented` has more room (a small one: 24px items, 10px at the sides, was 20px and 7px; 4px between the selected option and the frame, was 2px).

  Table and pagination sizes in every theme style, so they look the same size together: rows are 40 / 44 / 48px in the Skein and Ant Design styles, 36 / 40 / 44px in shadcn/ui and 38 / 42 / 46px in HeroUI for `sm` / `md` / `lg` (headers are as high as a row, or 4px lower in Skein and 6px in HeroUI), a step of 4px between sizes; the controls of a `Pagination` are 28 / 32 / 36px in all four (the page size select follows its `size` now). A theme style no longer depends on the app's `box-sizing` reset for the height of a header, and a checkbox or a tag in a cell no longer makes its row taller than the theme says. The Skein table's header is quieter and its cells roomier; the Ant Design `Segmented` keeps its options 4px from the frame.

  The footer of the admin layout has no space above its text (the page above has its own padding at the bottom); a fixed footer keeps it.

  `useTableColumns(keys, label)` holds which columns a table shows and in which order: render its `shown`, spread its `tools` into `TableTools`. `TableToolbar` keeps the text typed in its search box itself when `keyword` is not passed (and "Reset" clears it). The CLI's projects get `createSavedViews(key)` (the store of a list's saved searches, for `SavedViews`) and `QueryBoundary` takes `empty` (an empty list) and an optional `notFound`; the generated pages use `useTableColumns`.

- e36226a: Four small things a list page and a detail page kept writing CSS for. `Text`, `Paragraph` and `Title` take `nowrap` (one line, for a date or an id) and `preserveWhitespace` (the line breaks of a text a person typed are kept, long words wrap); `Table.Cell`, `Table.Head` and the columns of `DataTable` take `nowrap`. `Grid` takes `aside` (`start` or `end`) and `asideWidth` (`sm`, `md`, `lg`): a main column and a side column of a fixed width that stack below 64rem. `DataTable` takes `activeKey`, the row whose details are open beside the table (highlighted, `aria-current`), and `onRowClick`, which makes the rows clickable (Enter and Space on a focused row too; a click on a link, a button, the tick box or a popover inside the row is not a click on the row); `Table.Row` has the matching `active` and `interactive`.

  `Field.Label` with `nativeLabel={false}` renders a `div` by itself (Base UI wants a non-`<label>` element then, and warned in the console for every label otherwise).

- 6883c9c: Two parts every list page and every conversation kept copying or styling by hand are components now. `TableTools` is the tools of a table, on the right of its toolbar: refresh (the refresh icon turns while it reloads), a fixed header, which columns to show and in which order, and export; each button appears when its props are given, and `useFixedHeader` keeps the user's choice of a fixed header. It was a module copied into every admin project (`src/modules/table-tools`): the template and `skein new page --from` import it from `@skeinui/ui` now, and the module and its styles are gone from new projects. `Callout` is a block of content set apart from the text around it, such as a message of a conversation (the customer's, the agent's, an internal note), a suggested reply or a quotation: `variant` (`outline`, `soft`, `dashed`) and `color` set the look.

## 0.1.2

### Patch Changes

- 3dcec1e: `Badge` is now what Ant Design calls a badge: a number or a dot hung on the corner of another element (`count`, `max`, `showZero`, `dot`, `placement`, `color`, `size`), or drawn on its own. The text label it used to be is `Tag`, which had the same props (`variant`, `color`, `size`, `radius`) and is the one to use for a status or a keyword. The notifications tool of the admin template hangs the unread count on the bell with it.
- 099fa5e: New components `DataTable`, `FormDrawer` and `FormDialog`. `DataTable` is a table from data (`columns`, `rows`) with loading and empty states, an optional checkbox column, sorting, and an actions column whose buttons can ask for confirmation first (`actions` is a function returning the actions of a row, falsy entries skipped, so a permission reads naturally). `FormDrawer` and `FormDialog` are a `Form` in a drawer or a dialog, with Cancel and Save in the footer. `Form` takes an `id` and `actions={false}`, so a button elsewhere can submit it with `form={id}`.

## 0.1.1

No changes in this release.

## 0.1.0

### Minor Changes

- eb29efc: LoginLayout split: the cover has a drawing of its own (`login-layout-illustration`, its accents the primary color, floating, still with reduced motion) with the tagline `coverTitle` / `coverDescription` under it; `cover` replaces it, `cover={null}` leaves the middle empty. The admin template's sign-in page passes only the tagline now, and its own copy of the drawing is gone.
- 4b221e0: New component LoginLayout: the page around a sign-in (or sign-up) form, in three looks for the same parts, `centered` (the form in a card in the middle), `split` (a cover on the left, the form on the right, the cover on wide screens only) and `cover` (the card over a full-page background, a soft glow or a `backgroundImage`). The brand, the title, a line under it, the form, other ways in (`providers` with `onProvider`, behind a divider), a footer, a toolbar and the split cover are slots; the brand is separate from the title so it doesn't change with the language. Every theme style draws it (`--ui-login-min-height` sets the page's height, the viewport's by default) and the theme coverage check requires `login-layout.css`.
- cb3e060: Sortable: a `variant` prop. `tile` (the default, as before) is a card per item; `list` is plain rows with no fill, border or gap, lit under the pointer or keyboard focus, with a faint drag handle: the look for a short list inside a popover or menu, such as which columns of a table to show and in which order. Every theme style draws it (`data-variant="list"`, now part of the theme coverage check).

### Patch Changes

- ecf3350: AdminLayoutSettings: `extra` / `onExtraChange` for the app's own settings. The sections an app adds as `children` can now be part of the panel's Export / Import: the values given as `extra` are exported under `extra` (and as a second constant in the code export), an import hands them back to `onExtraChange`. `serializeSettings`, `settingsToCode` take them as a second argument, `parseSettings` returns them.
- 5c6f923: LoginLayout: the `cover` slot of the split look is the middle of the cover (new `login-layout-cover-body`), under the brand and over the soft glow, which the layout now always draws; it used to replace all of it. The admin template's split sign-in page has a drawing and a tagline there (`pages/login/components/login-cover.tsx`).
- f971ebc: LoginLayout split: the footer is at the bottom of the form's side, centered, and the form is centered in the space above it, as in the original console; the other looks keep it under the form.
- 385b8d4: Toast: closer to Sonner. `closeButton` on the `Toaster` or a toast shows or hides the close button (default: shown); `icon` on a toast and `icons` on the `Toaster` replace the type icons (a default toast can have one too); `toast.custom((id) => …)` puts content of your own in a toast, the frame and close button staying. The room kept for the close button is only reserved when there is one. (Sonner's `expand` is `layout="list"`.)

## 0.0.7

### Patch Changes

- a7b0d6e: SideMenu (and AdminLayout's menu): with a controlled `selectedKey` the selected item's submenus now start open, as documented, and open when the selection moves into closed ones (selected from a tab or a link, or items that arrive later); a submenu the user closes stays closed while the selection stays. Controlled `openKeys` are left alone.
- fbdd89e: Toast: `richColors` on `Toaster` (every typed toast) or on one toast (`toast.success("Saved", { richColors: true })`) tints info / success / warning / danger toasts in their color, like Sonner's rich colors: background, border and text in default and heroui (from their tokens) and shadcn (Sonner's own rich colors, shadcn/ui's toast being Sonner); antd follows its Alert (soft background, colored border and icon, text in the text color). Styled through `data-rich-colors`.
- a7b0d6e: Toaster: the region holding toasts is named from the locale (`common.notifications`: "Notifications" / "通知") instead of Base UI's fixed English "Notifications".

## 0.0.6

No changes in this release.

## 0.0.5

No changes in this release.

## 0.0.4

### Patch Changes

- 9ea5f6e: **Breaking:** the theme state on `<html>` is renamed: `data-theme-style` → `data-skein-theme`, `data-mode` → `data-skein-mode`, `data-theme-color` → `data-skein-color`, `data-theme-density` → `data-skein-density`. `ConfigProvider`'s props are unchanged. A theme style of your own (`src/theme/`) and the inline script in `index.html` need the new names; `skein check` points it out, and `skein theme use` rewrites the attribute in `index.html`.
- 8e71a8d: `@skeinui/themes/vite`: the `skeinThemes()` Vite plugin bundles only the stylesheets of the components a project imports from `@skeinui/ui` (`manifest.json` gains a `styles` map). Projects made by `skein create` use it; `skein theme use` / `theme add` add it to a project started with `--theme none` when they install `@skeinui/themes`.

## 0.0.3

### Patch Changes

- Admin template: detail pages, nested layouts and header buttons in the shell; "Powered by Skein UI" in the footer (`settings.poweredBy`); AGENTS.md names every MCP tool.
- Themes: the drawer body's scrollbar sits at the drawer's edge and its content's outlines are no longer clipped (heroui, default, shadcn).
- Components: props documented with JSDoc and `@default` (shown by `skein docs`); Mentions calls `onSearch` after rendering.
- Packages: keywords, homepage https://skeinui.com, shorter READMEs that fit npm's page.

## 0.0.2

### Patch Changes

- First public release: React components on Base UI, swappable theme styles, the skein CLI (create, pages, theme styles, docs, check, preview, MCP) and generative UI. `npm create skein` now runs `skein create`.
