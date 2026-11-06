---
"@skeinui/cli": patch
---

`skein new page system\logs` (a path typed with backslashes, on Windows) makes `system/logs` instead of a `system-logs` page; a `skein check` message shows its path with `/` there too.
