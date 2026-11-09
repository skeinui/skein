---
"@skeinui/ui": patch
"@skeinui/themes": patch
"@skeinui/cli": patch
---

`Badge` is now what Ant Design calls a badge: a number or a dot hung on the corner of another element (`count`, `max`, `showZero`, `dot`, `placement`, `color`, `size`), or drawn on its own. The text label it used to be is `Tag`, which had the same props (`variant`, `color`, `size`, `radius`) and is the one to use for a status or a keyword. The notifications tool of the admin template hangs the unread count on the bell with it.
