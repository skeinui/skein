---
"@skeinui/ui": patch
"@skeinui/themes": patch
"@skeinui/cli": patch
---

MenuButton, RelativeTime, MentionText, StatisticCard and NotificationBell: five components extracted from the helpdesk example. The notification bell has one slot (`notification-bell`, its width) in every theme style.

List: a `false` / `null` entry in `actions` (`cond && <Button />`) is skipped, so it leaves no empty cell and no divider.
