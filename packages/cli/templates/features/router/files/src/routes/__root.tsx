{{#if query}}
import type { QueryClient } from "@tanstack/react-query";
{{/if}}
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

{{#if query}}
export interface RouterContext {
  queryClient: QueryClient;
}

{{/if}}
export const Route = createRootRouteWithContext<{{#if query}}RouterContext{{else}}object{{/if}}>()({
  component: Outlet,
});
