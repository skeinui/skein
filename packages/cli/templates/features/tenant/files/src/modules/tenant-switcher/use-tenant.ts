import { useQuery } from "@tanstack/react-query";
import { usePagePath } from "@/skein-shell";
import { useTenantStore } from "@/store/tenant-store";
import { fetchTenants, tenantKeys } from "./api";

/**
 * The tenant in the address (/acme/orders → acme), from the page's path (usePagePath) so it changes in the same
 * render as the page and its tab; on a page outside /<tenant>/ (not found) the one used last.
 */
export function useTenant() {
  const first = decodeURIComponent(usePagePath().split("/")[1] ?? "");
  const storedId = useTenantStore((s) => s.tenantId);
  const { data: tenants = [] } = useQuery({ queryKey: tenantKeys.all, queryFn: fetchTenants });
  const inAddress = tenants.some((tenant) => tenant.id === first);
  return { tenantId: inAddress ? first : storedId, inAddress, tenants };
}
