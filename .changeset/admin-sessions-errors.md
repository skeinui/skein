---
"@skeinui/cli": patch
---

Admin template: sessions and errors. A refused access token (401) is renewed with the refresh token (`POST /api/auth/refresh`) and the request sent again; when that fails the login page says the session expired and signing in comes back to the page. Failed requests are an `HttpError` with a message in the app's language (the API's own, asked with `Accept-Language`, else the status in words, `src/lib/errors/`; status 0 for no answer). A page that throws shows a "failed to load" page with a retry (`defaultErrorComponent`), also inside the keep-alive tabs; the mock answers in the language asked for.
