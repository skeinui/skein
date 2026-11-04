{{#if mock}}
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/api/{{ns}}", () => HttpResponse.json({ data: { hello: "{{title}}" } })),
];
{{/if}}
