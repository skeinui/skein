---
"@skeinui/cli": patch
---

`skein new page --from` writes a detail page when the OpenAPI document reads one item (`GET /orders/{id}`): `/orders/42` (under `$tenant/` with `--tenant`), linked from the table's name column, with a back-to-list button and a not-found state; its request, query key, translations and mock come with it. With `--tenant` the generated mocks give each tenant its own rows (listed, read, changed and created per tenant).
