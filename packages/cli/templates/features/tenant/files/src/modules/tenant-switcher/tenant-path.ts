import { pageTree } from "@/lib/page-meta";
import type { PageEntry } from "@/lib/page-meta";

/** The pages' paths without the tenant (`/dashboard`, `/system/logs`), groups left out. */
function pagePaths(entries: PageEntry[] = pageTree()): string[] {
  return entries.flatMap((entry) => [
    ...(entry.meta.isGroup ? [] : [entry.path]),
    ...pagePaths(entry.children),
  ]);
}

/** `/acme/users/42` → `/users/42`, when `acme` is one of `tenantIds`; any other path as it is. */
export function withoutTenant(path: string, tenantIds: readonly string[]) {
  const first = path.split("/")[1] ?? "";
  return tenantIds.includes(decodeURIComponent(first)) ? path.slice(first.length + 1) || "/" : path;
}

/** The page a path (without the tenant) is, or is under: `/users/42` → `/users`. */
export function pageOf(path: string) {
  return pagePaths()
    .filter((page) => path === page || path.startsWith(`${page}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/** Whether `segment` (the first of a path) starts the path of a page, e.g. `dashboard` or `system`. */
export const isPageSegment = (segment: string) =>
  pagePaths().some((page) => page.split("/")[1] === segment);
