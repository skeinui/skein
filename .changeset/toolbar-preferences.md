---
"@skeinui/cli": minor
---

Admin template: users choose the header's tools in the preferences drawer. A "Toolbar" section lists every tool of `modules/toolbar/tools.tsx` with a switch and buttons to move the shown ones; the choice is kept in the browser (`modules/toolbar/store.ts`, read back with a check), "Reset to defaults" brings back `settings.toolbar.header`, and the drawer's Export / Import carries it (`AdminLayoutSettings` `extra`). `settings.toolbar.header` is now the default, not the only choice.
