# @skeinui/ui

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
