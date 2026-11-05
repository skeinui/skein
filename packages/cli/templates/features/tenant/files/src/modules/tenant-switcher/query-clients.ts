import { QueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth-store";

const clients = new Map<string, QueryClient>();

/**
 * One tenant's query cache, with the app's defaults. Each page under /<tenant>/ uses its tenant's
 * (routes/_auth/$tenant.tsx): the same key (["users", …]) is a separate query in each tenant, and a page of the
 * previous tenant still on screen while switching keeps its data instead of refetching it for the new tenant.
 */
export function tenantQueryClient(tenant: string) {
  let client = clients.get(tenant);
  if (!client) {
    client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
    clients.set(tenant, client);
  }
  return client;
}

// Signing out: what was loaded belongs to that user
useAuthStore.subscribe((state) => {
  if (state.token) return;
  for (const client of clients.values()) client.clear();
  clients.clear();
});
