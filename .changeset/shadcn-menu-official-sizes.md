---
"@skeinui/themes": patch
---

shadcn: the side menu has the shadcn/ui sidebar's sizes everywhere, also in AdminLayout's default menu style: 32px rows, 28px sub-items and 4px between rows (were 36 / 32 / 2 inside AdminLayout, the standalone menu 2px apart). The modern style is unchanged.
