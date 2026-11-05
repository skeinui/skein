{{#if mock}}
import type { User } from "../api";

const NAMES = [
  "Alice Chen",
  "Bob Li",
  "Carol Wang",
  "David Zhang",
  "Eve Liu",
  "Frank Yang",
  "Grace Zhao",
  "Henry Wu",
  "Ivy Zhou",
  "Jack Xu",
  "Kate Sun",
  "Leo Ma",
  "Mia Hu",
  "Nick Guo",
  "Olivia He",
  "Paul Lin",
  "Queenie Luo",
  "Ryan Zheng",
  "Sara Liang",
  "Tom Song",
  "Uma Xie",
  "Victor Tang",
  "Wendy Han",
  "Xavier Feng",
];

/** In-memory users, shared by the users and dashboard mocks; changes last until the page reloads. */
export const users: User[] = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  email: `${name.split(" ")[0].toLowerCase()}@example.com`,
  role: i === 0 ? "admin" : i % 3 === 0 ? "editor" : "viewer",
  status: i % 5 === 4 ? "disabled" : "active",
  createdAt: new Date(Date.UTC(2026, 0, 1 + i * 9)).toISOString(),
}));
{{#if tenant}}

const TENANT_IDS = ["acme", "globex", "initech"];

/** Each tenant has users of its own: which tenant a user belongs to (round-robin over the mock tenants). */
export const userTenants = new Map(
  users.map((u) => [u.id, TENANT_IDS[(u.id - 1) % TENANT_IDS.length]]),
);

/** The tenant a request is for (lib/http.ts sends it). */
export const tenantOf = (request: Request) => request.headers.get("X-Tenant-Id") ?? "";

/** The users of the request's tenant. */
export const usersOf = (request: Request) =>
  users.filter((u) => userTenants.get(u.id) === tenantOf(request));
{{else}}

/** The users a request may see: all of them. */
export const usersOf = (_request: Request) => users;
{{/if}}
{{/if}}
