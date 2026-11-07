---
"@skeinui/cli": patch
---

Admin template: what the stores read back from browser storage is checked. The preferences (mode, layout settings), the open tabs, the session (token, refresh token, user, where to go after signing in) and the tenant keep what has the right shape and leave the rest to the defaults, so storage written by an older version, another tool or by hand can no longer break every page; the first paint's color mode in `index.html` is checked too. The path to go to after signing in has to be a path of the app.
