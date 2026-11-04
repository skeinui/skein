<p align="center"><img src="brand/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# Skein UI

[English](README.md) | **简体中文**

<p align="center">
  <a href="https://skeinui.com"><strong>文档</strong></a> ·
  <a href="https://skeinui.com/installation">快速开始</a> ·
  <a href="https://github.com/skeinui/skein/issues">问题反馈</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@skeinui/ui"><img src="https://img.shields.io/npm/v/@skeinui/ui?label=%40skeinui%2Fui" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" /></a>
  <a href="https://github.com/skeinui/skein/stargazers"><img src="https://img.shields.io/github/stars/skeinui/skein?style=social" alt="GitHub stars" /></a>
</p>

基于 Base UI 的 React 组件库，外观由可替换的主题风格决定；配套的 CLI 生成的项目，AI 编程助手也能写得好。

- **组件管行为，主题风格管外观。** 组件只写 `data-*` 属性，由主题风格（Skein、shadcn/ui、HeroUI、Ant Design 或你自己的）给它们上样式。同一份代码，换个主题风格就是另一种样子。
- **数据驱动、可序列化的 props。** 不收 `className` / `style`；变体就是取值；用 `items`、`fields`、`options` 代替手写结构。人写起来简单，模型生成也简单。
- **为 AI 助手设计。** 生成的项目自带 `AGENTS.md`、skills 和一套反馈闭环：`skein docs`（准确的 props）、`skein check`（类型、翻译、硬编码颜色）、`skein preview`（在 Chrome 里打开页面），也可以作为 MCP 工具提供。

## 快速开始

```bash
npm create skein my-app -- --template admin --theme antd
cd my-app && npm install && npm run dev
```

模板：`basic`、`admin`（布局、菜单、多标签页、登录、CRUD 示例）。全部命令和参数见 [`@skeinui/cli`](packages/cli/README.md)。

## 包

| 路径                    | 包                | 说明                                                                                            |
| ----------------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| `packages/ui`           | `@skeinui/ui`     | 组件库（[README](packages/ui/README.zh-CN.md)）                                                 |
| `packages/themes`       | `@skeinui/themes` | 主题风格 `default` / `shadcn` / `heroui` / `antd`，以及配色、密度、代码块主题                   |
| `packages/cli`          | `@skeinui/cli`    | `skein` 命令：创建项目、加页面、主题、文档、检查、预览、MCP（[README](packages/cli/README.md)） |
| `packages/create-skein` | `create-skein`    | `npm create skein`，调用 `skein create`                                                         |
| `packages/skeinui`      | `skeinui`         | `npx skeinui …`：`skein` 命令的别名                                                             |
| `apps/skein-doc`        | `skein-doc`       | 文档站：组件演示、`llms.txt`                                                                    |

项目只导入一套主题风格（`@skeinui/themes/antd/index.css`），打包时也只包含这一套。admin 项目可以在 `src/settings.ts` 里列出几套供用户切换，每套只在被选中时才加载。

## 开发

需要 Node.js >= 22.18 和 [Vite+](https://viteplus.dev)（`vp`）。

```bash
vp install            # 安装依赖
vp run skein-doc#dev  # 文档站，http://localhost:5175（或 pnpm dev）
vp check              # 格式化、lint、类型检查
vp run -r test        # 运行所有包的测试
vp run -r build       # 构建所有包
pnpm ready            # check + test + build，合并前跑一遍
pnpm clean            # 清理构建产物和生成的文件（--deps 连 node_modules 一起删）
```

- 在本仓库里试用 CLI：`node packages/cli/bin/skein.js create demo --template admin --local`（`--local` 让项目直接使用这里的 `@skeinui/*` 包；`demo/` 已被 git 忽略）。
- `packages/cli` 里的 `vp run e2e`：生成每个模板，安装依赖、构建，并在 Chrome 里操作这些应用。
- `packages/ui` 里（需要文档站在运行）：`vp run snapshot` 做视觉回归，`vp run a11y` 做 axe-core 无障碍扫描。改了组件的 props 或说明后，运行 `vp run manifest` 重新生成 `manifest.json`，`skein docs`、MCP 和 `llms.txt` 都读它。

## 参与贡献

Skein UI 是开源项目，开发过程完全公开，欢迎任何形式的参与。

- **点一个 Star。** 如果 Skein UI 对你有帮助，在 [GitHub](https://github.com/skeinui/skein) 上点一个 ⭐ 是最简单的支持方式：它能让更多开发者发现这个项目，也是对我们方向的肯定。
- **反馈问题与建议**：在 [Issues](https://github.com/skeinui/skein/issues) 中提交 bug 或功能需求。附上最小复现，或 [skeinui.com](https://skeinui.com) 上对应页面的链接，能帮助我们更快处理。
- **提交 Pull Request**：修复、新组件、新主题风格、文档改进都欢迎。开发环境见[开发](#开发)，提交前请运行 `pnpm ready`。
- **加入核心开发团队**：我们在寻找愿意长期参与组件 API、主题风格和 AI 编程工具链建设的伙伴。期待与你一起把 Skein UI 做好。

## 许可证

MIT
