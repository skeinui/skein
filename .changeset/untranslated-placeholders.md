---
"@skeinui/cli": patch
---

`skein new page` gives a menu group an icon (`Settings` for system / settings, `Folder` otherwise), and `new page` / `new module` list the files whose Chinese texts are English placeholders (the CLI can't translate). `skein check` warns about texts left untranslated: a zh.json value or a `_meta.ts` `label.zh` that is the same English as its en (abbreviations such as SKU / ID aside). The admin shell's tab bar takes its accessible name from the locale instead of a fixed "Pages".
