---
"@skeinui/cli": patch
---

Admin template: closing a page tab no longer breaks the next navigation ("Converting circular structure to JSON"). The tab bar hands back the tabs with their icons (React elements), which were saved with the tabs as JSON; the stored tabs have no icons now (they are worked out from the menu at every render).
