---
"@skeinui/cli": patch
"@skeinui/themes": patch
---

Admin template: a configurable toolbar next to the account menu and on the sign-in page (`settings.toolbar`, tools in `src/modules/toolbar/`): built-in language (with flags) and light / dark tools, your own added by id; the account menu keeps only the user and sign out. Themes: AdminLayout's action icons are drawn like the side menu's (size, ~1.5px strokes, the row color at 80%, also in a Semi Dark / custom-colored sidebar); antd's header actions are 28px in its secondary text color, like Ant Design Pro.
