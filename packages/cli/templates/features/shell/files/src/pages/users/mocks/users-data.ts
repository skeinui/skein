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
{{/if}}
