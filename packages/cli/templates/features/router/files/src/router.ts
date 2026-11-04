import { createRouter } from "@tanstack/react-router";
{{#if query}}
import { queryClient } from "@/lib/query-client";
{{/if}}
// Generated from src/routes/ by the router plugin (dev / build) or `tsr generate`; don't edit it
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
{{#if query}}
  context: { queryClient },
{{/if}}
  defaultPendingMs: 200,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
