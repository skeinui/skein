<p align="center"><img src="brand/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# Skein UI

**English** | [简体中文](README.zh-CN.md)

<p align="center">
  <a href="https://skeinui.com"><strong>Documentation</strong></a> ·
  <a href="https://skeinui.com/installation">Get started</a> ·
  <a href="https://github.com/skeinui/skein/issues">Issues</a>
</p>

<div align="center">
  <a href="https://www.npmjs.com/package/@skeinui/ui"><img src="https://img.shields.io/npm/v/@skeinui/ui?label=%40skeinui%2Fui" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" /></a>
  <a href="https://github.com/skeinui/skein/stargazers"><img src="https://img.shields.io/github/stars/skeinui/skein?style=social" alt="GitHub stars" /></a>

[![M8ven Score](https://m8ven.ai/badge/mcp/skeinui-skein-twu2xj?v=a8b24bb2a31a22e75ef112650342d5c6)](https://m8ven.ai/mcp/skeinui-skein-twu2xj?s=readme)

</div>

React components built on Base UI, with swappable theme styles, and a CLI that sets up projects AI coding agents work well in.

- **Components own behaviour, theme styles own the look.** Components only write `data-*` attributes; a theme style (Skein, shadcn/ui, HeroUI, Ant Design, or your own) styles them. The same code looks like any of them.
- **Data-driven and serializable props.** No `className` / `style`; variants are values; `items`, `fields`, `options` instead of markup. Easy to write for people and for models.
- **Built for AI agents.** Generated projects carry `AGENTS.md`, skills and a feedback loop: `skein docs` (exact props), `skein check` (types, translations, hard-coded colors), `skein preview` (opens the page in Chrome), and optionally the same as MCP tools.

## Quick start

```bash
npm create skein my-app -- --template admin --theme antd
cd my-app && npm install && npm run dev
```

Templates: `basic`, `admin` (layout, menu, tabs, login, CRUD example). See [`@skeinui/cli`](packages/cli/README.md) for every command and option.

## Packages

| Path                    | Package           | Description                                                                                                  |
| ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `packages/ui`           | `@skeinui/ui`     | The component library ([README](packages/ui/README.md))                                                      |
| `packages/themes`       | `@skeinui/themes` | Theme styles `default` / `shadcn` / `heroui` / `antd`, colour themes, densities, code-block themes           |
| `packages/cli`          | `@skeinui/cli`    | The `skein` command: create, add pages, themes, docs, check, preview, MCP ([README](packages/cli/README.md)) |
| `packages/create-skein` | `create-skein`    | `npm create skein`, which runs `skein create`                                                                |
| `packages/skeinui`      | `skeinui`         | `npx skeinui …`: an alias of the `skein` command                                                             |
| `apps/skein-doc`        | `skein-doc`       | Documentation site: component demos, `llms.txt`                                                              |

A project imports one theme style (`@skeinui/themes/antd/index.css`) and only that one is bundled. Admin projects can list several in `src/settings.ts` for users to switch between; each is loaded only when picked.

## Development

Requires Node.js >= 22.18 and [Vite+](https://viteplus.dev) (`vp`).

```bash
vp install            # install dependencies
vp run skein-doc#dev  # documentation site on http://localhost:5175 (or pnpm dev)
vp check              # format, lint and type check
vp run -r test        # run the tests of every package
vp run -r build       # build every package
pnpm ready            # check + test + build, before merging
pnpm clean            # remove build output and generated files (--deps: node_modules too)
```

- Try the CLI on this checkout: `node packages/cli/bin/skein.js create demo --template admin --local` (`--local` links the `@skeinui/*` packages here; `demo/` is gitignored).
- `vp run e2e` in `packages/cli`: generates every template, installs, builds and drives the apps in Chrome.
- In `packages/ui` (with the documentation site running): `vp run snapshot` for visual regression and `vp run a11y` for the axe-core accessibility scan. After changing a component's props or docs, `vp run manifest` regenerates `manifest.json`, which `skein docs`, MCP and `llms.txt` read.

## Contributing

Skein UI is open source and developed in the open. Contributions of every size are welcome.

- **Star the repository.** If Skein UI is useful to you, a ⭐ on [GitHub](https://github.com/skeinui/skein) is the simplest way to support it: it helps other developers discover the project and tells us the direction is worth pursuing.
- **Report bugs and suggest features** in [Issues](https://github.com/skeinui/skein/issues). A minimal reproduction, or a link to the relevant page on [skeinui.com](https://skeinui.com), helps us respond quickly.
- **Open a pull request.** Fixes, components, theme styles and documentation are all welcome. See [Development](#development) for the setup, and run `pnpm ready` before submitting.
- **Join the core team.** We are looking for people who want to help shape the component API, the theme styles and the tooling for AI coding agents over the long term. We would love to work with you.

## License

MIT
