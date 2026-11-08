---
"@skeinui/cli": patch
---

Projects with the `mock` feature pin msw to one version (3.0.4, no range) and carry the `public/mockServiceWorker.js` of that very version, so the worker is never older than the msw installed; a test keeps the feature's version equal to the catalog's.
