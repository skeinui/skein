---
"@skeinui/ui": patch
"@skeinui/themes": patch
"@skeinui/cli": patch
---

Two parts every list page and every conversation kept copying or styling by hand are components now. `TableTools` is the tools of a table, on the right of its toolbar: refresh (the refresh icon turns while it reloads), a fixed header, which columns to show and in which order, and export; each button appears when its props are given, and `useFixedHeader` keeps the user's choice of a fixed header. It was a module copied into every admin project (`src/modules/table-tools`): the template and `skein new page --from` import it from `@skeinui/ui` now, and the module and its styles are gone from new projects. `Callout` is a block of content set apart from the text around it, such as a message of a conversation (the customer's, the agent's, an internal note), a suggested reply or a quotation: `variant` (`outline`, `soft`, `dashed`) and `color` set the look.
