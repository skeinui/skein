import { QueryClientProvider } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { enterTenant } from "@/modules/tenant-switcher/api";
import { tenantQueryClient } from "@/modules/tenant-switcher/query-clients";
import { PageOutlet, usePagePath } from "@/skein-shell";

/** Every page is under /<tenant>/: the tenant comes from the address, and every request carries it (lib/http.ts). */
export const Route = createFileRoute("/_auth/$tenant")({
  async beforeLoad({ params, location }) {
    const href = await enterTenant(params.tenant, location.href);
    if (href) throw redirect({ href });
  },
  component: TenantLayout,
});

/**
 * Around each page (one per open tab): the page's queries go to its tenant's cache. The tenant is the one the
 * page opened with, kept when the address moves on to another tenant (a kept-alive page still on screen).
 */
function TenantLayout() {
  const tenant = decodeURIComponent(usePagePath().split("/")[1] ?? "");
  const [own] = useState(tenant);
  return (
    <QueryClientProvider client={tenantQueryClient(own)}>
      <PageOutlet />
    </QueryClientProvider>
  );
}
