---
name: skein-theme
description: Change how the app looks — switch the theme style, change colors / radius / density, dark mode, or write a theme style of its own. Use for any request about colors, look and feel, branding or theming.
---

# Theming

Skein components have no styles of their own: a **theme style** gives them their whole look, through `data-*` attributes and `--ui-*` tokens. {{#if shell}}The ones this app offers are listed in `themeStyles` in `src/settings.ts` (users switch between them in the preferences drawer; `themeStyle` is the default).{{else}}The current one is imported in `src/skein.theme.ts`.{{/if}}

- **Another built-in look**: `npx skein theme use <default|shadcn|heroui|antd>`. All of them are in `@skeinui/themes`, so it is just an import change (only the imported one is bundled).
{{#if shell}}
- **Let users choose the look**: `npx skein theme add antd heroui skein` adds theme styles to `themeStyles` in `src/settings.ts`; the preferences drawer then offers them (each is a separate CSS file, downloaded only when picked). `npx skein theme remove <name>` takes one out. Don't import theme CSS anywhere else.
{{/if}}
{{#if shell}}
- **Colors, radius, density, layout at runtime**: the preferences drawer (gear button) — it is `AdminLayoutSettings`, values kept per browser. Defaults are in `src/settings.ts` (`layout.themeOverrides`).
{{/if}}
- **Dark mode**: tokens switch with `data-skein-mode="dark"` on `<html>` (ConfigProvider's `mode`). Never hard-code colors, or they won't switch.
- **Brand colors on top of a theme style**: override tokens in your CSS, e.g. `[data-skein-theme] { --ui-c-primary: …; --ui-c-primary-fg: …; }` (and the same under `[data-skein-mode="dark"]`). `npx skein docs ConfigProvider` and the theme style's `tokens.css` list the tokens.
{{#if customTheme}}
- **This app's own theme style** is in `src/theme/`: `tokens.css` (light values), `dark.css`, one file per component. Every selector starts with `[data-skein-theme="{{themeStyle}}"]`. `npm run check` lists every token and selector still missing; fill them until it passes.
{{else}}
- **A look of your own (brand theme)**: `npx skein theme init --name <brand> --from <closest built-in> --use`. It copies that theme style into `src/theme/` renamed to `<brand>` and switches the app to it, so it works and passes `npm run check` from the start. Then change the tokens in `src/theme/tokens.css` (light) and `dark.css` (dark): `--ui-c-primary` / `-fg` / `-soft` / `-text` and the other colors, `--ui-radius`, `--ui-font-family`, `--ui-density`. Touch component files only for shape changes, and only with tokens. Pick `--from` by feel: shadcn (neutral, crisp), heroui (soft, rounded), antd (dense, enterprise), default (Skein).
- **Starting from nothing**: `npx skein theme init --name <name> --use` writes a blank one instead (every required token and selector listed); fill it until `npm run check` passes.
{{/if}}
