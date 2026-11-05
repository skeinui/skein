{{#if mock}}
import { http, HttpResponse } from "msw";
import type { Tenant } from "../api";

const TENANTS: Tenant[] = [
  { id: "acme", name: "Acme Inc." },
  { id: "globex", name: "Globex" },
  { id: "initech", name: "Initech" },
];

export const handlers = [http.get("*/api/tenants", () => HttpResponse.json({ data: TENANTS }))];
{{/if}}
