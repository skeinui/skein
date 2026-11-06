---
"@skeinui/cli": patch
---

Admin template: button-level permissions. The user has `permissions` (`orders:create`; `*` is everything, `orders:*` every action on orders); `<Access code>` and `useAccess()` in `src/modules/access` show only what they allow, `requireAccess(code)` in a route's `beforeLoad` gives the 403 page. The users page uses them; the mock has `admin` (everything), `viewer` (read only) and `guest` (nothing).
