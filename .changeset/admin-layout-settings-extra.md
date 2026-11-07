---
"@skeinui/ui": patch
---

AdminLayoutSettings: `extra` / `onExtraChange` for the app's own settings. The sections an app adds as `children` can now be part of the panel's Export / Import: the values given as `extra` are exported under `extra` (and as a second constant in the code export), an import hands them back to `onExtraChange`. `serializeSettings`, `settingsToCode` take them as a second argument, `parseSettings` returns them.
