import { KeepAlive } from "@skeinui/ui";
import type { AnyRoute } from "@tanstack/react-router";
import { Outlet, useChildMatches, useRouter, useRouterState } from "@tanstack/react-router";
import { createContext, useContext } from "react";
import type { ComponentType, ReactNode } from "react";

/**
 * The path of the page the router has matched. Like `useLocation().pathname`, but it changes with the matched
 * routes: while a navigation loads (beforeLoad), the location is already the new one but the matches are still
 * the previous page's, and the tab key, the page shown and what is derived from the path must change together.
 */
export function usePagePath() {
  return useRouterState({ select: (s) => s.matches.at(-1)?.pathname ?? s.location.pathname });
}

/** What a layout route between the shell and the page renders where its children go (see PageOutlet). */
const Inner = createContext<ReactNode>(null);

/**
 * The `<Outlet />` of a layout route under the shell (e.g. routes/_auth/$tenant.tsx, whose pages are
 * routes/_auth/$tenant.*.tsx): it renders the page kept for this tab, not the router's current one.
 */
export function PageOutlet() {
  return useContext(Inner) ?? <Outlet />;
}

/**
 * KeepAlive for routes: pages that are open in a tab stay mounted (hidden), so their state survives
 * switching tabs. It renders the matched route components itself, the layouts around the page included, not
 * <Outlet />: a kept <Outlet /> would follow the router and show the new page (that is why vite.config.ts
 * turns code splitting off). Layout routes on the way render <PageOutlet /> for the page.
 */
export function KeepAliveOutlet({
  keepKeys,
  versions,
}: {
  keepKeys: readonly string[];
  versions: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePagePath();
  const routes = router.routesById as unknown as Record<string, AnyRoute>;
  // Outermost first; routes without a component of their own (e.g. pathless ones) are skipped
  const chain = useChildMatches()
    .map((match) => routes[match.routeId]?.options.component as ComponentType | undefined)
    .filter((component): component is ComponentType => Boolean(component));
  const page = chain.reduceRight<ReactNode>(
    (inner, Component) =>
      inner === null ? (
        <Component />
      ) : (
        <Inner.Provider value={inner}>
          <Component />
        </Inner.Provider>
      ),
    null,
  );
  return (
    <KeepAlive activeKey={pathname} keepKeys={keepKeys} versions={versions} transition="fade">
      {/* No child match: not found, rendered by the layout route's notFoundComponent */}
      {page ?? <Outlet />}
    </KeepAlive>
  );
}
