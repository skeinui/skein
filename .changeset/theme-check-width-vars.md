---
"@skeinui/cli": patch
---

`skein theme check` also asks a theme style for the width variables the field components write (`--ui-input-width`, `--ui-select-width`, …), so a style that ignores `width` / `minWidth` / `maxWidth` is reported.
