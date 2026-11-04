<p align="center"><img src="https://cdn.jsdelivr.net/npm/@skeinui/ui/dist/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# @skeinui/ui

**English** | [简体中文](README.zh-CN.md)

100+ React components on [Base UI](https://base-ui.com), with swappable and customizable theme styles.

**Components own behaviour and structure; every visual lives in a theme style** ([@skeinui/themes](https://www.npmjs.com/package/@skeinui/themes)). Switching the theme style, the colour theme or dark mode only changes a few attributes on `<html>`: component code and behaviour stay the same.

## Install

```bash
npm install @skeinui/ui @skeinui/themes
```

Requires React 19. To start a whole project instead, run `npm create skein` ([create-skein](https://www.npmjs.com/package/create-skein)).

## Usage

```tsx
import "@skeinui/themes/default/index.css";
import { Button, ConfigProvider } from "@skeinui/ui";
import { zhCN } from "@skeinui/ui/locales/zh-CN"; // optional, English by default

export function App() {
  return (
    <ConfigProvider themeStyle="default" mode="system" {...zhCN}>
      <Button variant="soft" color="danger">
        Delete
      </Button>
    </ConfigProvider>
  );
}
```

`ConfigProvider` writes the theme state to `<html>` (`data-theme-style`, `data-mode`, `data-theme-color`, `data-theme-density`), so dialogs, popovers and selects rendered into `<body>` follow it. It also takes `themeOverrides` (colours, radius, density) and `locale` / `labels` for component text.

## Conventions

- **No `className` / `style`.** Looks come from props (`variant`, `color`, `size`) and the theme style. For a look of your own, customise or write a theme style instead.
- **Data-driven props.** Lists, menus, tables and forms take plain data (`items`, `columns`, `options`); `ReactNode` / `render` props are there when data isn't enough.
- **Consistent state props.** Values are `value` / `defaultValue` / `onValueChange`; anything that opens is `open` / `defaultOpen` / `onOpenChange`.
- **Overlays are one part.** `Dialog.Content`, `Popover.Content`, `Menu.Content`… wrap portal, positioner and popup.

## For AI coding agents

The package ships `manifest.json`: every component's props, allowed values, parts and examples. `npx skein docs Button` ([@skeinui/cli](https://www.npmjs.com/package/@skeinui/cli)) prints it as Markdown, and the CLI's MCP server serves it to agents.

## Developing

Source, tests and the documentation site are in the [Skein UI repository](https://github.com/skeinui/skein).

## License

MIT
