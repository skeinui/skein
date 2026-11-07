---
"@skeinui/cli": patch
---

Admin template: `http` treats an HTML answer to a data request as a failed request (404). The dev server answers any path nothing handles with `index.html` and status 200, so with the mock not started a query received a string instead of its data and the bell in the header crashed the whole page (`data.filter is not a function`); now the query fails like any other and the page stays up.
