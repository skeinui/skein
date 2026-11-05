import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TenantState {
  /** The tenant the app works on; every request carries it (lib/http.ts, `X-Tenant-Id`). */
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenantId: null,
      setTenantId: (tenantId) => set({ tenantId }),
    }),
    { name: "{{storageKey}}-tenant" },
  ),
);
