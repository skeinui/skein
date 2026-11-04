{{#if mock}}
import { http, HttpResponse } from "msw";
import type { LoginInput, User } from "../api";

const ADMIN: User = { id: 1, username: "admin", name: "Admin", email: "admin@example.com" };
const TOKEN = "mock-token";

const authorized = (request: Request) => request.headers.get("Authorization") === `Bearer ${TOKEN}`;
const unauthorized = () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 });

export const handlers = [
  http.post("*/api/auth/login", async ({ request }) => {
    const { username, password } = (await request.json()) as LoginInput;
    if (username !== "admin" || password !== "admin123") {
      return HttpResponse.json({ message: "用户名或密码错误 / Wrong username or password" }, { status: 400 });
    }
    return HttpResponse.json({ data: { token: TOKEN, user: ADMIN } });
  }),
  http.post("*/api/auth/logout", () => HttpResponse.json({ data: null })),
  http.get("*/api/auth/profile", ({ request }) =>
    authorized(request) ? HttpResponse.json({ data: ADMIN }) : unauthorized(),
  ),
  http.get("*/api/user/menus", ({ request }) =>
    authorized(request) ? HttpResponse.json({ data: ["/dashboard", "/users"] }) : unauthorized(),
  ),
];
{{/if}}
