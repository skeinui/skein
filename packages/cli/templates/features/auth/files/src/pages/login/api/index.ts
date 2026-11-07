import http from "@/lib/http";
import { isUser, useAuthStore } from "@/store/auth-store";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  /** Avatar image URL; the initial of the name is shown without it. */
  avatar?: string;
  /**
   * What the user may do, as `<resource>:<action>` codes (`users:create`); `*` is everything, `users:*` every
   * action on users. `<Access code>` and `useAccess()` (modules/access) check them.
   */
  permissions: string[];
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  /** Renews `token` when the API refuses it (lib/http.ts); leave it out when the API has none. */
  refreshToken?: string;
  user: User;
}

export const login = (input: LoginInput) => http.post<LoginResult>("/api/auth/login", input);
export const logout = () => http.post<null>("/api/auth/logout");
/** The signed-in user as the API has it now; also what the session keeps (so changed permissions apply without signing in again). */
export const fetchProfile = async () => {
  const user = await http.get<User>("/api/auth/profile");
  // Not the API's answer (index.html when the mock isn't up, an error page of a proxy): not a user to keep
  if (!isUser(user)) throw new Error("GET /api/auth/profile didn't answer with a user");
  useAuthStore.getState().setUser(user);
  return user;
};
/** Paths of the pages the user may open; used to filter the menu when `settings.menuPermission` is on. */
export const fetchUserMenus = () => http.get<string[]>("/api/user/menus");
