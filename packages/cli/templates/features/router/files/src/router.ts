import { createRouter } from "@tanstack/react-router";
{{#if query}}
import { queryClient } from "@/lib/query-client";
{{/if}}
{{#if shell}}
import { ErrorPage } from "@/pages/error";
{{/if}}
// Generated from src/routes/ by the router plugin (dev / build) or `tsr generate`; don't edit it
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
{{#if query}}
  context: { queryClient },
{{/if}}
  defaultPendingMs: 200,
{{#if shell}}
  // A page that throws (or `requireAccess` saying no): the 403 page, or "failed to load" with a retry
  defaultErrorComponent: ErrorPage,
{{/if}}
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
