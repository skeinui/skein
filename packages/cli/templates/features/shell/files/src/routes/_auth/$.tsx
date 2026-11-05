import { createFileRoute{{#if tenant}}, redirect{{/if}} } from "@tanstack/react-router";
{{#if tenant}}
import { enterTenant } from "@/modules/tenant-switcher/api";
{{/if}}
import { NotFoundPage } from "@/pages/not-found";

/** Any other address: the 404 page inside the layout (signed in, like every page under _auth). */
export const Route = createFileRoute("/_auth/$")({
{{#if tenant}}
  // A page's path without the tenant (/system/logs), or with one the user no longer has: under the current tenant
  async beforeLoad({ location }) {
    const first = decodeURIComponent(location.pathname.split("/")[1] ?? "");
    const href = await enterTenant(first, location.href);
    if (href) throw redirect({ href });
  },
{{/if}}
  component: NotFoundPage,
});
