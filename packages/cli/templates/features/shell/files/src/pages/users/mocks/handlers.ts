{{#if mock}}
import { http, HttpResponse, delay } from "msw";
import type { UserInput } from "../api";
import { users } from "./users-data";

const notFound = () => HttpResponse.json({ message: "User not found" }, { status: 404 });

export const handlers = [
  http.get("*/api/users", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const keyword = url.searchParams.get("keyword")?.toLowerCase();
    const status = url.searchParams.get("status");
    const matched = users.filter(
      (u) =>
        (!keyword || u.name.toLowerCase().includes(keyword) || u.email.includes(keyword)) &&
        (!status || u.status === status),
    );
    const items = matched.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({ data: { items, total: matched.length } });
  }),
  http.post("*/api/users", async ({ request }) => {
    const input = (await request.json()) as UserInput;
    const user = {
      ...input,
      id: Math.max(0, ...users.map((u) => u.id)) + 1,
      createdAt: new Date().toISOString(),
    };
    users.unshift(user);
    return HttpResponse.json({ data: user }, { status: 201 });
  }),
  http.put("*/api/users/:id", async ({ params, request }) => {
    const index = users.findIndex((u) => u.id === Number(params.id));
    if (index < 0) return notFound();
    users[index] = { ...users[index], ...((await request.json()) as UserInput) };
    return HttpResponse.json({ data: users[index] });
  }),
  http.delete("*/api/users/:id", ({ params }) => {
    const index = users.findIndex((u) => u.id === Number(params.id));
    if (index < 0) return notFound();
    users.splice(index, 1);
    return HttpResponse.json({ data: null });
  }),
];
{{/if}}
