import http from "@/lib/http";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  /** Avatar image URL; the initial of the name is shown without it. */
  avatar?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export const login = (input: LoginInput) => http.post<LoginResult>("/api/auth/login", input);
export const logout = () => http.post<null>("/api/auth/logout");
export const fetchProfile = () => http.get<User>("/api/auth/profile");
/** Paths of the pages the user may open; used to filter the menu when `settings.menuPermission` is on. */
export const fetchUserMenus = () => http.get<string[]>("/api/user/menus");
