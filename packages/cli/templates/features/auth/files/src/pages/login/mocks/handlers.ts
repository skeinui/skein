{{#if mock}}
import { http, HttpResponse } from "msw";
import { localized } from "@/mocks/language";
import type { LoginInput, User } from "../api";

/**
 * The mock's accounts: admin may do everything, viewer only reads (no create / update / delete), guest has no
 * permission at all (pages that ask for one show the 403 page).
 */
const ACCOUNTS = [
  {
    password: "admin123",
    token: "mock-token",
    refreshToken: "mock-refresh-admin",
    user: {
      id: 1,
      username: "admin",
      name: "Admin",
      email: "admin@example.com",
      avatar: "https://avatars.githubusercontent.com/u/351424659",
      permissions: ["*"],
    } satisfies User,
  },
  {
    password: "viewer123",
    token: "mock-token-viewer",
    refreshToken: "mock-refresh-viewer",
    user: {
      id: 2,
      username: "viewer",
      name: "Viewer",
      email: "viewer@example.com",
      permissions: ["users:read"],
    } satisfies User,
  },
  {
    password: "guest123",
    token: "mock-token-guest",
    refreshToken: "mock-refresh-guest",
    user: {
      id: 3,
      username: "guest",
      name: "Guest",
      email: "guest@example.com",
      permissions: [],
    } satisfies User,
  },
];

/** The account a request's token belongs to. */
const accountOf = (request: Request) =>
  ACCOUNTS.find((a) => request.headers.get("Authorization") === `Bearer ${a.token}`);
const unauthorized = (request: Request) =>
  HttpResponse.json(
    { message: localized(request, { zh: "登录已失效", en: "Unauthorized" }) },
    { status: 401 },
  );

export const handlers = [
  http.post("*/api/auth/login", async ({ request }) => {
    const { username, password } = (await request.json()) as LoginInput;
    const account = ACCOUNTS.find((a) => a.user.username === username && a.password === password);
    if (!account) {
      return HttpResponse.json(
        {
          message: localized(request, { zh: "用户名或密码错误", en: "Wrong username or password" }),
        },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      data: { token: account.token, refreshToken: account.refreshToken, user: account.user },
    });
  }),
  // A new access token for a refresh token (the mock's tokens never expire; the e2e swaps one for a stale one)
  http.post("*/api/auth/refresh", async ({ request }) => {
    const { refreshToken } = (await request.json()) as { refreshToken?: string };
    const account = ACCOUNTS.find((a) => a.refreshToken === refreshToken);
    return account
      ? HttpResponse.json({ data: { token: account.token, refreshToken: account.refreshToken } })
      : unauthorized(request);
  }),
  http.post("*/api/auth/logout", () => HttpResponse.json({ data: null })),
  http.get("*/api/auth/profile", ({ request }) => {
    const account = accountOf(request);
    return account ? HttpResponse.json({ data: account.user }) : unauthorized(request);
  }),
  http.get("*/api/user/menus", ({ request }) =>
    accountOf(request)
      ? HttpResponse.json({ data: ["/dashboard", "/users"] })
      : unauthorized(request),
  ),
];
{{/if}}
