<p align="center"><img src="https://cdn.jsdelivr.net/npm/@skeinui/ui/dist/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# create-skein

[English](README.md) | **简体中文**

`npm create skein` 用来创建 [Skein UI](https://github.com/skeinui/skein) 项目，实际执行的是 [`@skeinui/cli`](https://www.npmjs.com/package/@skeinui/cli) 的 `skein create`。

```bash
# 交互式：问项目名、模板、主题风格、mock、MCP、preview
npm create skein
# basic 模板，主题风格 default
npm create skein my-app
npm create skein my-admin -- --template admin --theme antd
# pnpm / yarn / bun 不需要 --
npm create skein my-admin -- --template admin --no-mock
npm create skein my-admin -- --template admin --mcp --preview
```

- `--template`：`basic`（Vite + React + 一个主题风格）或 `admin`（布局、菜单、标签页、登录、增删改查示例、MSW mock）。
- `--theme`：`default`、`shadcn`、`heroui`、`antd`，或者 `none`：在 `src/theme/` 生成空白主题风格，自己写。admin 项目之后还可以提供几套让用户切换：`npx skein theme add heroui skein`。
- `--<功能>` / `--no-<功能>`：加上或去掉某个功能（`router`、`query`、`i18n`、`mock`、`auth`、`shell`；给 AI 助手用的 `mcp` 和 `preview`）。功能依赖的其他功能会自动加上。
- `--dry-run`：只列出会写入哪些文件。

生成的项目自带 `skein` 命令，后续工作用它完成（`npx skein new page orders`、`npx skein check`……），全部用法见 [`@skeinui/cli`](https://www.npmjs.com/package/@skeinui/cli)。

## 许可证

MIT
