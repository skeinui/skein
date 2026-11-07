---
"@skeinui/cli": patch
---

Admin template: a profile answer that is not a user (index.html when the mock is not up) no longer replaces the signed-in user, and a user in storage that is not one is dropped: it crashed the avatar menu on every page, also after a reload.
