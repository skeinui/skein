# @skeinui/ui

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
