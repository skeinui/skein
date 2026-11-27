---
"@skeinui/ui": patch
"@skeinui/themes": patch
"@skeinui/cli": patch
---

`Splitter` takes `grip`: `always` (the default, as before) shows the grip in the middle of the drag bar, `hover` shows it only while the bar is pointed at, focused or dragged (the line stays), `none` draws no grip. The theme styles write the rules for the bars of the splitter itself, so a splitter nested in one that hides its grip keeps its own.
