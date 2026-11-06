---
"@skeinui/cli": patch
---

`skein check` finds the locale files, and tells pages' sources from their locales, on Windows too (backslash paths): the i18n checks were skipped there.
