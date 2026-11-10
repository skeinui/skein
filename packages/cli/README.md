<p align="center"><img src="https://cdn.jsdelivr.net/npm/@skeinui/ui/dist/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# @skeinui/cli

**English** | [简体中文](README.zh-CN.md)

The `skein` command: create [Skein UI](https://github.com/skeinui/skein) projects, add pages, manage theme styles, and give AI coding agents a feedback loop (`docs`, `check`, `preview`, MCP).

```bash
# same as npx @skeinui/cli create my-app
npm create skein my-app
# admin layout, login, CRUD example
skein create my-admin --template admin --theme antd
# a page, its route and its menu entry
skein new page orders
# a working CRUD page from an OpenAPI resource
skein new page orders --from openapi.yaml
# admin: one more theme style users can pick
skein theme add heroui
# props, allowed values, examples
skein docs Button
# what is wrong in the code, with hints
skein check
# open the page in Chrome: errors, failed requests, screenshot
skein preview /orders
# templates, features, theme styles
skein list
```

Every command takes `--json` (machine-readable, never asks). Commands that write take `--dry-run` and only overwrite files with `--force`.

## Creating a project

```bash
skein create [dir]
  [--template basic|admin]
  [--theme default|shadcn|heroui|antd|none]
  [--<feature>] [--no-<feature>]
```

Without a directory it asks for the name, template, theme style and optional features. `--theme none` starts a blank theme style of your own in `src/theme/`.

| Template | What you get                                                             |
| -------- | ------------------------------------------------------------------------ |
| `basic`  | React on Vite+ (`vp`) + one theme style                                  |
| `admin`  | Layout, menu, tabs, KeepAlive, preferences, login, dashboard, users CRUD |

| Feature   | What it adds                                                       | Requires            |
| --------- | ------------------------------------------------------------------ | ------------------- |
| `router`  | TanStack Router file routes (`src/routes/`)                        |                     |
| `query`   | TanStack Query and a fetch wrapper (`src/lib/http.ts`)             |                     |
| `i18n`    | i18next zh / en, each page with its own `locales/`                 |                     |
| `mock`    | MSW, each page with its own `mocks/handlers.ts`                    |                     |
| `auth`    | Login page, route guard, session store                             | router, query, i18n |
| `shell`   | AdminLayout, menu, tabs, KeepAlive, preferences drawer             | auth, i18n          |
| `mcp`     | `.mcp.json`: the skein commands as MCP tools                       |                     |
| `preview` | `playwright-core` for `skein preview` (uses your installed Chrome) |                     |

`admin` turns on `shell` and `mock`. `mcp` and `preview` are off by default; their packages are installed only in projects that turn them on.

An admin project looks like this:

```
src/
  routes/          thin route files pointing at pages/ (_auth/ = signed in)
  pages/<name>/    index.tsx, _meta.ts (menu), api/, components/, locales/, mocks/
  modules/<name>/  parts that aren't pages (user menu, preferences…)
  skein-shell/     AdminLayout wired to the router
  settings.ts      app name, home path, theme styles, layout, menu permission
```

Each page registers itself (route by file, menu by `_meta.ts`, mocks by `mocks/handlers.ts`), so adding a page never edits an existing file.

## Pages and modules

```bash
# route, menu entry, API file, translations, mock
skein new page orders
# nested: system/ becomes a menu group
skein new page system/roles
# list / filter / create / edit / delete, typed, with mocks
skein new page orders --from openapi.yaml
# src/modules/order-panel/
skein new module order-panel
```

`--from` reads one resource of an OpenAPI 3 document (JSON or YAML); pick it with `--resource /orders` when there are several.

## Theme styles

```bash
# the app's theme style
skein theme use heroui
# admin: more styles users can pick
skein theme add antd heroui
skein theme remove antd
# a theme style of your own in src/theme/, from a copy
skein theme init --name acme --from antd
# does it cover every component
skein theme check
```

A basic project imports one theme style in `src/skein.theme.ts`. An admin project lists them in `themeStyles` of `src/settings.ts`; each loads only when picked in the preferences drawer. `vite.config.ts` uses `skeinThemes()` from `@skeinui/themes/vite`, so only the stylesheets of the components the app imports are bundled; a project started with `--theme none` gets it from `theme use` / `theme add`, which install `@skeinui/themes`.

## For AI coding agents

Generated projects come with `AGENTS.md`, `CLAUDE.md` and skills (`.claude/skills/`) that point agents at this loop:

| Command                  | What it gives                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `skein docs [Component]` | What a component is for, its props and allowed values, data types, examples; `--search <words>`      |
| `skein check`            | Type errors with hints, missing translations, hard-coded colors, theme coverage, the frame of a page |
| `skein preview <route>`  | Opens the page in Chrome (signed in) and reports errors, failed requests, a blank page, a screenshot |
| `skein mcp`              | All of the above, plus `new page`, `theme` and `create`, as MCP tools                                |

## `.skein.json`

`skein create` writes `.skein.json` (template, theme style, features), and the other commands read it; keep it committed. For a project without one, `skein init` writes it from the files it finds.

## License

MIT
