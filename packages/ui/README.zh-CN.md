<p align="center"><img src="https://cdn.jsdelivr.net/npm/@skeinui/ui/dist/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# @skeinui/ui

[English](README.md) | **简体中文**

基于 [Base UI](https://base-ui.com) 的 100 多个 React 组件，主题风格可切换、可自定义。

**组件只管行为和结构，所有外观都在主题风格里**（[@skeinui/themes](https://www.npmjs.com/package/@skeinui/themes)）。换主题风格、换色彩主题、切暗色，都只是改 `<html>` 上的几个属性，组件代码和功能都不变。

## 安装

```bash
npm install @skeinui/ui @skeinui/themes
```

需要 React 19。想直接起一个完整项目，用 `npm create skein`（[create-skein](https://www.npmjs.com/package/create-skein)）。

## 使用

```tsx
import "@skeinui/themes/default/index.css";
import { Button, ConfigProvider } from "@skeinui/ui";
import { zhCN } from "@skeinui/ui/locales/zh-CN"; // 可选，默认英文

export function App() {
  return (
    <ConfigProvider themeStyle="default" mode="system" {...zhCN}>
      <Button variant="soft" color="danger">
        删除
      </Button>
    </ConfigProvider>
  );
}
```

`ConfigProvider` 把主题状态写到 `<html>` 上（`data-theme-style`、`data-mode`、`data-theme-color`、`data-theme-density`），这样渲染到 `<body>` 的对话框、弹出层、下拉选择也会跟着变。它还接受 `themeOverrides`（颜色、圆角、密度），以及组件文字用的 `locale` / `labels`。

## 约定

- **没有 `className` / `style`。** 外观由 props（`variant`、`color`、`size`）和主题风格决定。想要自己的外观，就定制或者自己写一套主题风格。
- **数据驱动的 props。** 列表、菜单、表格、表单直接传数据（`items`、`columns`、`options`）；数据不够用时，再用 `ReactNode` / `render`。
- **统一的状态 props。** 值用 `value` / `defaultValue` / `onValueChange`；能打开的用 `open` / `defaultOpen` / `onOpenChange`。
- **浮层只有一个部件。** `Dialog.Content`、`Popover.Content`、`Menu.Content`……已经包好了 Portal、定位和弹出层。

## 给 AI 编程助手

包里带有 `manifest.json`：每个组件的 props、可选值、部件和示例。`npx skein docs Button`（[@skeinui/cli](https://www.npmjs.com/package/@skeinui/cli)）把它输出成 Markdown，CLI 的 MCP 服务也用它回答 AI 助手。

## 开发

源码、测试和文档站都在 [Skein UI 仓库](https://github.com/skeinui/skein)。

## 许可证

MIT
