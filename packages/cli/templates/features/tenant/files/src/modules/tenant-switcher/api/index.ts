import http from "@/lib/http";
import { queryClient } from "@/lib/query-client";
import { useTenantStore } from "@/store/tenant-store";
import { isPageSegment } from "../tenant-path";

export interface Tenant {
  id: string;
  name: string;
}

export const tenantKeys = { all: ["tenants"] as const };

/** The tenants the signed-in user may work on. */
export const fetchTenants = () => http.get<Tenant[]>("/api/tenants");

/**
 * Before a page under /<tenant>/ loads (routes/_auth/$tenant.tsx, and `$.tsx` for an address no route has): makes
 * `tenant` the current one, so the page's requests carry it. When it isn't one of the user's tenants, returns where to go instead: `/dashboard` (no
 * tenant yet) → `/acme/dashboard`, `/oldco/orders` (a tenant the user no longer has) → `/acme/orders`, with
 * the tenant used last, else the first.
 */
export async function enterTenant(tenant: string, href: string) {
  const tenants = await queryClient.ensureQueryData({
    queryKey: tenantKeys.all,
    queryFn: fetchTenants,
  });
  const { tenantId, setTenantId } = useTenantStore.getState();
  if (tenants.some((t) => t.id === tenant)) {
    if (tenant !== tenantId) setTenantId(tenant);
    return undefined;
  }
  const fallback = tenants.some((t) => t.id === tenantId) ? tenantId : tenants[0]?.id;
  if (!fallback) return undefined;
  // A page's path gets the tenant in front; a tenant the user no longer has is replaced
  const path = isPageSegment(tenant) ? href : href.replace(/^\/[^/?#]*/, "");
  return `/${fallback}${path}`;
}
