---
"@skeinui/themes": patch
"@skeinui/ui": patch
"@skeinui/cli": patch
---

`@skeinui/themes/vite`: the `skeinThemes()` Vite plugin bundles only the stylesheets of the components a project imports from `@skeinui/ui` (`manifest.json` gains a `styles` map). Projects made by `skein create` use it.
