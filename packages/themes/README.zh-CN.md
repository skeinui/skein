<p align="center"><img src="https://cdn.jsdelivr.net/npm/@skeinui/ui/dist/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# @skeinui/themes

[English](README.md) | **简体中文**

[@skeinui/ui](https://www.npmjs.com/package/@skeinui/ui) 的全部视觉：组件只写 `data-*` 属性，这些 CSS 负责给它们上样式。只导入用到的，其余的不会进打包产物。

```bash
npm install @skeinui/ui @skeinui/themes
```

```ts
import "@skeinui/themes/antd/index.css"; // 一套主题风格（也可以导入多套，各自按 data-theme-style 隔离）
import "@skeinui/themes/color/purple.css"; // 可选：色彩主题
import "@skeinui/themes/density/compact.css"; // 可选：密度
import "@skeinui/themes/code/index.css"; // 可选：代码块主题
```

```html
<html
  data-theme-style="antd"
  data-mode="dark"
  data-theme-color="purple"
  data-theme-density="compact"
></html>
```

`@skeinui/ui` 的 `<ConfigProvider themeStyle mode themeColor themeDensity>` 会设置这些属性。它们要放在 `<html>` 上，因为对话框、弹出层、下拉选择会渲染到 `<body>`。

| 路径                  | 内容                                                                                                     | 属性                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `<style>/index.css`   | 主题风格：`default`（Skein 品牌）、`shadcn`、`heroui`（HeroUI v3）、`antd`（Ant Design 6），含亮色和暗色 | `data-theme-style`                          |
| `color/<name>.css`    | 色彩主题，可叠加在任意风格上：`purple`、`green`、`geekblue`、`volcano`、`contrast`（WCAG AA）            | `data-theme-color`                          |
| `density/compact.css` | 更紧凑的控件                                                                                             | `data-theme-density`                        |
| `code/index.css`      | 代码块主题：`github`、`one`、`solarized`、`catppuccin`、`dracula`、`nord`、`monokai`、`tokyo-night`      | `<CodeBlock theme>`、`<DiffView codeTheme>` |

色彩主题可以组合，例如 `data-theme-color="purple contrast"`。

## Vite：只打包用到的 CSS

主题风格的 `index.css` 包含所有组件的样式。用 Vite 时，`skeinThemes` 只保留 `src/` 里从 `@skeinui/ui` 导入的组件（及其内部渲染的组件）的样式表：

```ts
// vite.config.ts
import { skeinThemes } from "@skeinui/themes/vite";

export default defineConfig({ plugins: [react(), skeinThemes()] });
```

选项：`include`（扫描导入的目录，默认 `["src"]`），`themes`（同样要裁剪的自有主题风格目录，如 `["src/theme"]`）。用 `import * as` 导入整个包时保留全部。

## 自定义

- 只改几个值（颜色、圆角、密度）：`<ConfigProvider themeOverrides>`。
- 写一套自己的主题风格：`npx skein theme init --name acme --from shadcn` 把一套复制到 `src/theme/`，`npx skein theme check` 列出还没覆盖的部分（[@skeinui/cli](https://www.npmjs.com/package/@skeinui/cli)）。

## 许可证

MIT
