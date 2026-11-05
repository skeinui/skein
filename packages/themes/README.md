<p align="center"><img src="https://cdn.jsdelivr.net/npm/@skeinui/ui/dist/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# @skeinui/themes

**English** | [简体中文](README.zh-CN.md)

Every visual of [@skeinui/ui](https://www.npmjs.com/package/@skeinui/ui): the components only write `data-*` attributes, and these CSS files style them. Import only what you use; nothing else ends up in the bundle.

```bash
npm install @skeinui/ui @skeinui/themes
```

```ts
import "@skeinui/themes/antd/index.css"; // one theme style (or several, each scoped by data-theme-style)
import "@skeinui/themes/color/purple.css"; // optional: colour theme
import "@skeinui/themes/density/compact.css"; // optional: density
import "@skeinui/themes/code/index.css"; // optional: code-block themes
```

```html
<html
  data-theme-style="antd"
  data-mode="dark"
  data-theme-color="purple"
  data-theme-density="compact"
></html>
```

`<ConfigProvider themeStyle mode themeColor themeDensity>` from `@skeinui/ui` sets these attributes. They belong on `<html>` because dialogs, popovers and selects render into `<body>`.

| Path                  | What                                                                                                        | Attribute                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `<style>/index.css`   | Theme style: `default` (Skein brand), `shadcn`, `heroui` (HeroUI v3), `antd` (Ant Design 6), light and dark | `data-theme-style`                          |
| `color/<name>.css`    | Colour theme on top of any style: `purple`, `green`, `geekblue`, `volcano`, `contrast` (WCAG AA)            | `data-theme-color`                          |
| `density/compact.css` | Smaller controls                                                                                            | `data-theme-density`                        |
| `code/index.css`      | Code-block themes: `github`, `one`, `solarized`, `catppuccin`, `dracula`, `nord`, `monokai`, `tokyo-night`  | `<CodeBlock theme>`, `<DiffView codeTheme>` |

Colour themes can be combined, e.g. `data-theme-color="purple contrast"`.

## Vite: only the CSS you use

A theme style's `index.css` styles every component. With Vite, `skeinThemes` keeps only the stylesheets of the components your `src/` imports from `@skeinui/ui` (and of those they render):

```ts
// vite.config.ts
import { skeinThemes } from "@skeinui/themes/vite";

export default defineConfig({ plugins: [react(), skeinThemes()] });
```

Options: `include` (directories scanned for imports, default `["src"]`), `themes` (directories of theme styles of your own to prune too, e.g. `["src/theme"]`). `import * as` of the whole package keeps everything.

## Customising

- A few values (colours, radius, density): `<ConfigProvider themeOverrides>`.
- A theme style of your own: `npx skein theme init --name acme --from shadcn` copies one into `src/theme/`, and `npx skein theme check` lists what it doesn't cover yet ([@skeinui/cli](https://www.npmjs.com/package/@skeinui/cli)).

## License

MIT
