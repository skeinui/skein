import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/pages/login/api";

interface AuthState {
  token: string | null;
  /** Exchanged for a new `token` when the API answers 401 (lib/http.ts); the API may not issue one. */
  refreshToken: string | null;
  user: User | null;
  /** Where to go after signing in: the page that sent the user to the login page. */
  intendedPath: string | null;
  /** The session ended by itself (expired / revoked), not by signing out: the login page says so. */
  expired: boolean;
  setSession: (token: string, user: User, refreshToken?: string | null) => void;
  setUser: (user: User) => void;
  /** A new access token (and refresh token, when the API rotates it). */
  setToken: (token: string, refreshToken?: string | null) => void;
  setIntendedPath: (path: string | null) => void;
  /** The session is over without the user asking: back to the login page, which comes back to `intendedPath`. */
  expire: (intendedPath: string) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      intendedPath: null,
      expired: false,
      setSession: (token, user, refreshToken = null) =>
        set({ token, user, refreshToken, expired: false }),
      setUser: (user) => set({ user }),
      setToken: (token, refreshToken) =>
        set((s) => ({ token, refreshToken: refreshToken ?? s.refreshToken })),
      setIntendedPath: (intendedPath) => set({ intendedPath }),
      expire: (intendedPath) =>
        set({ token: null, refreshToken: null, user: null, intendedPath, expired: true }),
      reset: () => set({ token: null, refreshToken: null, user: null, expired: false }),
    }),
    { name: "{{storageKey}}-auth" },
  ),
);
