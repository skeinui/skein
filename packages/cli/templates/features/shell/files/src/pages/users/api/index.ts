import http from "@/lib/http";

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

export interface UserQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: UserStatus;
}

export interface Paged<T> {
  items: T[];
  total: number;
}

/** Query keys: invalidate `userKeys.all` after a change and every user list refetches. */
export const userKeys = {
  all: ["users"] as const,
  list: (query: UserQuery) => ["users", "list", query] as const,
};

export const fetchUsers = (query: UserQuery) =>
  http.get<Paged<User>>("/api/users", { params: { ...query } });
export const createUser = (input: UserInput) => http.post<User>("/api/users", input);
export const updateUser = (id: number, input: UserInput) =>
  http.put<User>(`/api/users/${id}`, input);
export const deleteUser = (id: number) => http.delete<null>(`/api/users/${id}`);
