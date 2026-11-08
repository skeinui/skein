---
"@skeinui/cli": patch
---

`skein new page --from`: the mock's sort turns values into text with `str` (from `lib/list-query`), so the generated page has no `no-base-to-string` warning.
