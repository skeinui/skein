# @skeinui/themes

## 0.0.8

### Patch Changes

- b11eac3: heroui: form fields can be told from the surface they sit on. In dark mode the field background is `#27272a` (it was the same `#18181b` as a card, so a field on a card was invisible); in light mode the field shadow ends in a 1px 10% black ring (a white field on a white card had only a faint shadow).
- 7efb78a: shadcn: the side menu has the shadcn/ui sidebar's sizes everywhere, also in AdminLayout's default menu style: 32px rows, 28px sub-items and 4px between rows (were 36 / 32 / 2 inside AdminLayout, the standalone menu 2px apart). The modern style is unchanged.
- 887ae77: shadcn and heroui: idle page tabs' text is a step darker (the muted color mixed with 15% of the text color), above 4.5:1 on the chrome bar's tinted background too (was 4.44 / 4.47).
- 385b8d4: Toast: closer to Sonner. `closeButton` on the `Toaster` or a toast shows or hides the close button (default: shown); `icon` on a toast and `icons` on the `Toaster` replace the type icons (a default toast can have one too); `toast.custom((id) => …)` puts content of your own in a toast, the frame and close button staying. The room kept for the close button is only reserved when there is one. (Sonner's `expand` is `layout="list"`.)
- Updated dependencies [ecf3350]
- Updated dependencies [385b8d4]
  - @skeinui/ui@0.0.8

## 0.0.7

### Patch Changes

- cf79031: AdminLayout's header inside the content area (the sidebar layout) is 3rem (48px) high instead of 2.5rem, a step above the 40px tab bar under it; the sidebar's logo row follows it. Card tabs in the tab bar have room above and below (40px, like the chrome tabs) instead of touching the header's divider and the content.
- 8d31ce8: Admin template: a configurable toolbar next to the account menu and on the sign-in page (`settings.toolbar`, tools in `src/modules/toolbar/`): built-in language (with flags) and light / dark tools, your own added by id; the account menu keeps only the user and sign out. Themes: AdminLayout's action icons are drawn like the side menu's (size, ~1.5px strokes, the row color at 80%, also in a Semi Dark / custom-colored sidebar); antd's header actions are 28px in its secondary text color, like Ant Design Pro.
- 8fdc56d: antd: a checked menu checkbox item has a light primary background and primary text, like the selected item of a selectable Ant Design Dropdown.
- 8fdc56d: antd: with Semi Dark on (and no custom sidebar color) the side menu items are white at 0.65 like the default dark sidebar, Ant Design's dark menu (were 0.78).
- 475d6d9: Card tabs in AdminLayout's tab bar start 1rem in, under the header's content, instead of against the sidebar.
- 8fdc56d: Menu checkbox items in default, heroui and antd put the check mark at the end of the row (as shadcn), 14px like the menu icons (was a 10px check at the start, which pushed the icon and label out of line with plain items).
- 8fdc56d: PageTabs: the active tab's title is a step bolder (500, like the selected side menu item) and pinned tabs are no longer bold (they outweighed the active tab; no close button marks them); tab icons are drawn about 1.5px wide like the side menu's. antd's idle tabs use Ant Design's secondary text (0.65; 0.45 was under 4.5:1).
- 8fdc56d: Side menu: the modern style's rows are 40px (was 42) and 4px apart (was 2) in every theme style, on the 4px grid with the 40px tab bar; antd's modern radius is Ant Design's 8px (was 6), its level-two items are 40px like level-one ones (Ant Design), and its submenu arrow sits 16px from the right (was 34).
- 8d31ce8: AdminLayout: the sidebar trigger in a header inside the content area sits closer to the edge, its icon on the header's 1rem line over the first tab's icon (was 7px further in).
- 22aea0d: Side menu icons match their label: in default, shadcn and heroui a row is a step lighter than the text, icon and label alike (80%), and takes the full color when selected, hovered or holding the selected page; antd icons take Ant Design's item color with the label. Line icons are drawn about 1.5px wide, the weight of the 14px label (was 1.33px).
- 475d6d9: AdminLayout's tab bar is 40px whatever the tab style (card, chrome, line) and theme style: the tabs get 0.25rem above them, as chrome tabs had, so switching styles no longer moves the content up or down.
- fbdd89e: Toast: `richColors` on `Toaster` (every typed toast) or on one toast (`toast.success("Saved", { richColors: true })`) tints info / success / warning / danger toasts in their color, like Sonner's rich colors: background, border and text in default and heroui (from their tokens) and shadcn (Sonner's own rich colors, shadcn/ui's toast being Sonner); antd follows its Alert (soft background, colored border and icon, text in the text color). Styled through `data-rich-colors`.
- Updated dependencies [a7b0d6e]
- Updated dependencies [fbdd89e]
- Updated dependencies [a7b0d6e]
  - @skeinui/ui@0.0.7

## 0.0.6

### Patch Changes

- @skeinui/ui@0.0.6

## 0.0.5

### Patch Changes

- @skeinui/ui@0.0.5

## 0.0.4

### Patch Changes

- 9ea5f6e: **Breaking:** the theme state on `<html>` is renamed: `data-theme-style` → `data-skein-theme`, `data-mode` → `data-skein-mode`, `data-theme-color` → `data-skein-color`, `data-theme-density` → `data-skein-density`. `ConfigProvider`'s props are unchanged. A theme style of your own (`src/theme/`) and the inline script in `index.html` need the new names; `skein check` points it out, and `skein theme use` rewrites the attribute in `index.html`.
- 8e71a8d: `@skeinui/themes/vite`: the `skeinThemes()` Vite plugin bundles only the stylesheets of the components a project imports from `@skeinui/ui` (`manifest.json` gains a `styles` map). Projects made by `skein create` use it; `skein theme use` / `theme add` add it to a project started with `--theme none` when they install `@skeinui/themes`.
- Updated dependencies [9ea5f6e]
- Updated dependencies [8e71a8d]
  - @skeinui/ui@0.0.4

## 0.0.3

### Patch Changes

- Admin template: detail pages, nested layouts and header buttons in the shell; "Powered by Skein UI" in the footer (`settings.poweredBy`); AGENTS.md names every MCP tool.
- Themes: the drawer body's scrollbar sits at the drawer's edge and its content's outlines are no longer clipped (heroui, default, shadcn).
- Components: props documented with JSDoc and `@default` (shown by `skein docs`); Mentions calls `onSearch` after rendering.
- Packages: keywords, homepage https://skeinui.com, shorter READMEs that fit npm's page.
- Updated dependencies
- @skeinui/ui@0.0.3

## 0.0.2

### Patch Changes

- First public release: React components on Base UI, swappable theme styles, the skein CLI (create, pages, theme styles, docs, check, preview, MCP) and generative UI. `npm create skein` now runs `skein create`.
- Updated dependencies
  - @skeinui/ui@0.0.2
