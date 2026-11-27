---
"@skeinui/ui": patch
---

A double click on a `Splitter` bar puts the two panels next to it back to the sizes they started with (their `defaultSize`, within their min / max), and calls `onResize` / `onResizeEnd` as a drag does (with controlled `sizes` the parent gets the sizes from `onResize`).
