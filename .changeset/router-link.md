---
"@skeinui/cli": patch
---

Admin template: `RouterLink` (`@/skein-shell`, `createLink(Link)`) is the router's `<Link>` drawn by the theme style's `Link`; the users table and the pages made by `skein new page --from` use it for the link to the detail page, so it is no longer a bare blue underlined `<a>`.
