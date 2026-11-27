---
"@skeinui/ui": patch
"@skeinui/themes": patch
"@skeinui/cli": patch
---

`Grid aside="start"` puts the side column first, as the docs said: the main column is written first and the side column second whichever side it is on, but the styles gave the fixed width to the first child, so a main column written first got the narrow one. Now the second child goes to the first column (and below 64rem, where the two stack, both are back in the order they were written). `Grid` takes `grow` (the height the flex parent has left, like `Flex`'s), and with `aside` the one row is that tall and its columns can shrink and scroll. `Flex` takes `shrink` (`false` keeps its size when the flex parent is short of room: a bar above a list that scrolls). A code block (and the chat thread) is its own containing block now: the visually hidden status line of a code block was `position: absolute` with nothing to position it against, so inside a long conversation it sat outside the thread's scrolling and made the whole page scroll (a scrollbar and a blank stretch under the box).
