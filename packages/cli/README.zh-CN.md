<p align="center"><img src="https://cdn.jsdelivr.net/npm/@skeinui/ui/dist/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# @skeinui/cli

[English](README.md) | **简体中文**

`skein` 命令：创建 [Skein UI](https://github.com/skeinui/skein) 项目、添加页面、管理主题风格，并给 AI 编程助手一套反馈闭环（`docs`、`check`、`preview`、MCP）。

```bash
# 等同于 npx @skeinui/cli create my-app
npm create skein my-app
# 后台布局、登录、增删改查示例
skein create my-admin --template admin --theme antd
# 一个页面，连同路由和菜单项
skein new page orders
# 从 OpenAPI 资源生成能直接用的增删改查页面
skein new page orders --from openapi.yaml
# admin：多加一套用户可选的主题风格
skein theme add heroui
# props、可选值、示例
skein docs Button
# 代码里哪里有问题，附带提示
skein check
# 在 Chrome 里打开页面：报错、失败的请求、截图
skein preview /orders
# 模板、功能、主题风格
skein list
```

所有命令都支持 `--json`（机器可读，从不提问）。会写文件的命令支持 `--dry-run`，并且只有加 `--force` 才会覆盖已有文件。

## 创建项目

```bash
skein create [dir]
  [--template basic|admin]
  [--theme default|shadcn|heroui|antd|none]
  [--<feature>] [--no-<feature>]
```

不写目录时会依次询问项目名、模板、主题风格和可选功能。`--theme none` 会在 `src/theme/` 生成一套空白主题风格，由你自己来写。

| 模板    | 内容                                                                |
| ------- | ------------------------------------------------------------------- |
| `basic` | Vite + React + 一套主题风格                                         |
| `admin` | 布局、菜单、标签页、KeepAlive、偏好设置、登录、仪表盘、用户增删改查 |

| 功能      | 加上什么                                                         | 依赖                |
| --------- | ---------------------------------------------------------------- | ------------------- |
| `router`  | TanStack Router 文件路由（`src/routes/`）                        |                     |
| `query`   | TanStack Query 和一个 fetch 封装（`src/lib/http.ts`）            |                     |
| `i18n`    | i18next 中 / 英文，每个页面有自己的 `locales/`                   |                     |
| `mock`    | MSW，每个页面有自己的 `mocks/handlers.ts`                        |                     |
| `auth`    | 登录页、路由守卫、会话存储                                       | router, query, i18n |
| `shell`   | AdminLayout、菜单、标签页、KeepAlive、偏好设置抽屉               | auth, i18n          |
| `mcp`     | `.mcp.json`：把 skein 命令作为 MCP 工具                          |                     |
| `preview` | 给 `skein preview` 用的 `playwright-core`（用本机已装的 Chrome） |                     |

`admin` 会打开 `shell` 和 `mock`。`mcp` 和 `preview` 默认关闭，只有打开它们的项目才会安装对应的包。

admin 项目的结构：

```
src/
  routes/          薄薄一层路由文件，指向 pages/（_auth/ = 需要登录）
  pages/<name>/    index.tsx、_meta.ts（菜单）、api/、components/、locales/、mocks/
  modules/<name>/  不是页面的部分（用户菜单、偏好设置……）
  skein-shell/     接好路由的 AdminLayout
  settings.ts      应用名、首页路径、主题风格、布局、菜单权限
```

每个页面自己完成注册（路由靠文件，菜单靠 `_meta.ts`，mock 靠 `mocks/handlers.ts`），所以添加页面不会改动任何已有文件。

## 页面和模块

```bash
# 路由、菜单项、API 文件、翻译、mock
skein new page orders
# 嵌套：system/ 成为菜单分组
skein new page system/roles
# 列表 / 筛选 / 新建 / 编辑 / 删除，带类型和 mock
skein new page orders --from openapi.yaml
# src/modules/order-panel/
skein new module order-panel
```

`--from` 读取 OpenAPI 3 文档（JSON 或 YAML）里的一个资源；有多个资源时用 `--resource /orders` 指定。

## 主题风格

```bash
# 应用的主题风格
skein theme use heroui
# admin：多加几套用户可选的风格
skein theme add antd heroui
skein theme remove antd
# 在 src/theme/ 复制一套，作为自己的主题风格
skein theme init --name acme --from antd
# 检查是否覆盖了所有组件
skein theme check
```

basic 项目在 `src/skein.theme.ts` 里导入一套主题风格。admin 项目在 `src/settings.ts` 的 `themeStyles` 里列出可选的几套，用户在偏好设置抽屉里选中时才加载。

## 给 AI 编程助手

生成的项目带有 `AGENTS.md`、`CLAUDE.md` 和 skills（`.claude/skills/`），引导 AI 助手使用这套闭环：

| 命令                     | 提供什么                                                           |
| ------------------------ | ------------------------------------------------------------------ |
| `skein docs [Component]` | 组件用途、props 和可选值、数据类型、示例；`--search <关键词>`      |
| `skein check`            | 带提示的类型错误、缺失的翻译、硬编码的颜色、主题覆盖情况           |
| `skein preview <route>`  | 在 Chrome 里打开页面（自动登录），报告报错、失败的请求、白屏、截图 |
| `skein mcp`              | 以上全部，加上 `new page`、`theme`、`create`，作为 MCP 工具        |

## `.skein.json`

`skein create` 会写入 `.skein.json`（模板、主题风格、功能），其他命令都读它，请提交到仓库。没有这个文件的项目，可以用 `skein init` 根据现有文件生成。

## 许可证

MIT
