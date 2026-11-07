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
    {
      name: "{{storageKey}}-tenant",
      // What storage holds is read with a check: a tenant is a text
      merge: (persisted, current) => {
        const id = (persisted as { tenantId?: unknown } | null)?.tenantId;
        return { ...current, tenantId: typeof id === "string" && id !== "" ? id : null };
      },
    },
  ),
);
