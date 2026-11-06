---
"@skeinui/cli": patch
---

Admin projects: the preferences button is a floating button (bottom right) instead of an icon in the header / sidebar; the account menu shows the user's `avatar` when the profile has one, refreshes the profile (`/api/auth/profile`) so a session from before a change shows it, and its button is the avatar's size (`--user-avatar-size` in `styles/index.css`). With `--tenant`, the switcher is at least 2rem high in every theme style and its menu at least as wide as the switcher.
