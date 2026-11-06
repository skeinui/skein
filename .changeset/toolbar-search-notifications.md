---
"@skeinui/cli": patch
---

Admin template: two more built-in toolbar tools, on by default: "search" (a command palette of the menu's pages, ⌘K / Ctrl+K) and "notifications" (a bell with the unread count and the list, `src/modules/notifications/` with its API and mock). Requests send the app's language as `Accept-Language`, so the API can answer in it.
