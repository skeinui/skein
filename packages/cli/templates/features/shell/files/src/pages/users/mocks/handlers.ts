{{#if mock}}
import { http, HttpResponse, delay } from "msw";
import type { UserInput } from "../api";
import { {{#if tenant}}tenantOf, {{/if}}users, {{#if tenant}}userTenants, {{/if}}usersOf } from "./users-data";

const notFound = () => HttpResponse.json({ message: "User not found" }, { status: 404 });

/** The index of a user the request may see{{#if tenant}} (another tenant's user is not found){{/if}}, else -1. */
const findIndex = (request: Request, id: unknown) => {
  const user = usersOf(request).find((u) => u.id === Number(id));
  return user ? users.indexOf(user) : -1;
};

export const handlers = [
  http.get("*/api/users", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const keyword = url.searchParams.get("keyword")?.toLowerCase();
    const status = url.searchParams.get("status");
    const matched = usersOf(request).filter(
      (u) =>
        (!keyword || u.name.toLowerCase().includes(keyword) || u.email.includes(keyword)) &&
        (!status || u.status === status),
    );
    const items = matched.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({ data: { items, total: matched.length } });
  }),
  http.get("*/api/users/:id", async ({ params, request }) => {
    await delay(200);
    const index = findIndex(request, params.id);
    return index < 0 ? notFound() : HttpResponse.json({ data: users[index] });
  }),
  http.post("*/api/users", async ({ request }) => {
    const input = (await request.json()) as UserInput;
    const user = {
      ...input,
      id: Math.max(0, ...users.map((u) => u.id)) + 1,
      createdAt: new Date().toISOString(),
    };
    users.unshift(user);
{{#if tenant}}
    userTenants.set(user.id, tenantOf(request));
{{/if}}
    return HttpResponse.json({ data: user }, { status: 201 });
  }),
  http.put("*/api/users/:id", async ({ params, request }) => {
    const index = findIndex(request, params.id);
    if (index < 0) return notFound();
    users[index] = { ...users[index], ...((await request.json()) as UserInput) };
    return HttpResponse.json({ data: users[index] });
  }),
  http.delete("*/api/users/:id", ({ params, request }) => {
    const index = findIndex(request, params.id);
    if (index < 0) return notFound();
    users.splice(index, 1);
    return HttpResponse.json({ data: null });
  }),
];
{{/if}}
