import http from "@/lib/http";
import { fetchList, standardAdapter } from "@/lib/list-query";
import type { ListQuery } from "@/lib/list-query";

export const USER_ROLES = ["admin", "editor", "viewer"] as const;
export const USER_STATUSES = ["active", "disabled"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type UserInput = Omit<User, "id" | "createdAt">;

export interface Paged<T> {
  items: T[];
  total: number;
}

/** Query keys: invalidate `userKeys.all` after a change and every user list refetches. */
export const userKeys = {
  all: ["users"] as const,
  list: (query: ListQuery) => ["users", "list", query] as const,
  detail: (id: number) => ["users", "detail", id] as const,
};

/** The list takes the standard `ListQuery` (`POST /api/users/search`): swap the adapter for another backend's rules. */
export const fetchUsers = (query: ListQuery) =>
  fetchList<User>("/api/users", query, standardAdapter);
export const fetchUser = (id: number) => http.get<User>(`/api/users/${id}`);
export const createUser = (input: UserInput) => http.post<User>("/api/users", input);
export const updateUser = (id: number, input: UserInput) =>
  http.put<User>(`/api/users/${id}`, input);
export const deleteUser = (id: number) => http.delete<null>(`/api/users/${id}`);
