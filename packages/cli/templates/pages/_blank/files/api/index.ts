{{#if query}}
import http from "@/lib/http";

export const {{camel}}Keys = {
  all: ["{{ns}}"] as const,
};

export const fetch{{Name}} = () => http.get<unknown>("/api/{{ns}}");
{{/if}}
