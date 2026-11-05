---
"@skeinui/cli": patch
---

`skein create --tenant` (admin): every page is under its tenant (`/acme/orders`, routes in `routes/_auth/$tenant/`, where `skein new page` now writes them), with a tenant switcher next to the logo that goes to the same page of the tenant picked (a detail page's list) and moves the open tabs along. The tenant is set before a page loads and sent as `X-Tenant-Id` with every request; an address without a tenant gets the one used last; each tenant's pages have a query cache of their own; the mock gives each tenant its own users. Every admin project gets a user detail page (`/users/<id>`), the cache is cleared on sign-out, and the shell keys tabs and kept-alive pages by the matched route's path, so a navigation that is still loading no longer shows the previous page under the new tab.
