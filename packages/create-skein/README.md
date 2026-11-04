<p align="center"><img src="https://cdn.jsdelivr.net/npm/@skeinui/ui/dist/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# create-skein

**English** | [简体中文](README.zh-CN.md)

`npm create skein` creates a [Skein UI](https://github.com/skeinui/skein) project. It runs `skein create` from [`@skeinui/cli`](https://www.npmjs.com/package/@skeinui/cli).

```bash
# asks: name, template, theme style, mock, MCP, preview
npm create skein
# basic, theme style default
npm create skein my-app
npm create skein my-admin -- --template admin --theme antd
# pnpm / yarn / bun don't need the --
npm create skein my-admin -- --template admin --no-mock
npm create skein my-admin -- --template admin --mcp --preview
```

- `--template`: `basic` (Vite + React + one theme style) or `admin` (layout, menu, tabs, login, CRUD example, MSW mocks).
- `--theme`: `default`, `shadcn`, `heroui`, `antd`, or `none` for a blank theme style in `src/theme/` that you write yourself. Admin projects can later offer several for users to switch between: `npx skein theme add heroui skein`.
- `--<feature>` / `--no-<feature>`: add or leave out a feature (`router`, `query`, `i18n`, `mock`, `auth`, `shell`; for AI agents `mcp` and `preview`). What a feature requires comes with it.
- `--dry-run` lists what would be written.

The project comes with the `skein` command for what follows (`npx skein new page orders`, `npx skein check`…); see [`@skeinui/cli`](https://www.npmjs.com/package/@skeinui/cli) for all of it.

## License

MIT
