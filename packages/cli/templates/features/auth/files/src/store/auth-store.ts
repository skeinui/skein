import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/pages/login/api";

interface AuthState {
  token: string | null;
  user: User | null;
  /** Where to go after signing in: the page that sent the user to the login page. */
  intendedPath: string | null;
  setSession: (token: string, user: User) => void;
  setIntendedPath: (path: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      intendedPath: null,
      setSession: (token, user) => set({ token, user }),
      setIntendedPath: (intendedPath) => set({ intendedPath }),
      reset: () => set({ token: null, user: null }),
    }),
    { name: "{{storageKey}}-auth" },
  ),
);
