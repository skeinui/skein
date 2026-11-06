import type { ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";

/** One permission code, or a list of which any one is enough. */
type Code = string | readonly string[];

/**
 * Whether `permissions` (`user.permissions`) include `code`: exactly, or through `*` (everything) or `users:*`
 * (every action on users).
 */
function allows(permissions: readonly string[] | undefined, code: Code) {
  if (!permissions) return false;
  const codes = typeof code === "string" ? [code] : code;
  return codes.some((c) =>
    permissions.some(
      (p) => p === "*" || p === c || (p.endsWith(":*") && c.startsWith(p.slice(0, -1))),
    ),
  );
}

/** `can(code)`: whether the signed-in user may; re-renders when the permissions change. For `if`s and props (`disabled={!can("users:update")}`). */
export function useAccess() {
  const permissions = useAuthStore((s) => s.user?.permissions);
  return { can: (code: Code) => allows(permissions, code) };
}

/** The same outside React (a route's `beforeLoad`, a request callback). */
export const can = (code: Code) => allows(useAuthStore.getState().user?.permissions, code);

/** Thrown by `requireAccess`; `defaultErrorComponent` (router.ts) shows the 403 page for it. */
export class AccessDeniedError extends Error {
  constructor(code: Code) {
    super(`No permission: ${typeof code === "string" ? code : code.join(" / ")}`);
    this.name = "AccessDeniedError";
  }
}

/**
 * For a route's `beforeLoad`: the 403 page instead of the page when the user lacks the permission (a list: any
 * one of them). Like `Access`, this is the page's door in the browser; the API must check too.
 *
 * ```ts
 * export const Route = createFileRoute("/_auth/$tenant/users")({
 *   beforeLoad: () => requireAccess("users:read"),
 *   component: UsersPage,
 * });
 * ```
 */
export function requireAccess(code: Code) {
  if (!can(code)) throw new AccessDeniedError(code);
}

/**
 * Shows `children` only to a user who has the permission `code` (a list: any one of them); others get `fallback`
 * (nothing by default; e.g. the same button `disabled`). This only decides what is shown: the API must check
 * the permission too.
 *
 * ```tsx
 * <Access code="users:delete"><Button color="danger">Delete</Button></Access>
 * ```
 */
export function Access({
  code,
  fallback = null,
  children,
}: {
  code: Code;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return useAccess().can(code) ? children : fallback;
}
