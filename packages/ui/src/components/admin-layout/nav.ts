import type { ReactNode } from "react";

/** One navigation item: a leaf (navigates on click) or a group with `children`. Same shape as `SideMenuItem` (but without group / divider). */
export interface AdminNavItem {
  /** Unique key; matched against AdminLayout's `activeKey` and passed to `onNavigate`. */
  key: string;
  /** Menu text. */
  label: ReactNode;
  /** Leading icon; when the sidebar collapses to a strip and in the column layout's icon column, only it remains. */
  icon?: ReactNode;
  /** When provided it renders as a link `<a>`; to handle navigation yourself (router), call `event.preventDefault()` in `onNavigate`. */
  href?: string;
  /** Tooltip text and accessible name when only the icon is shown; may be omitted when `label` is a string. */
  title?: string;
  disabled?: boolean;
  children?: readonly AdminNavItem[];
}

/** The whole path from the top level to `key` (including itself); returns null if not found. */
export function trailOf(
  items: readonly AdminNavItem[],
  key: string | null | undefined,
): AdminNavItem[] | null {
  if (key == null) return null;
  for (const item of items) {
    if (item.key === key) return [item];
    const below = item.children ? trailOf(item.children, key) : null;
    if (below) return [item, ...below];
  }
  return null;
}

/**
 * The item a path belongs to: the one whose key is the path, else the one whose key is its longest prefix on a
 * `/` boundary. So a detail page (`/users/42`) that isn't in the navigation lights up its list (`/users`), not
 * nothing; `/users-archive` doesn't match `/users`. Groups (items with children) only match exactly. Null when none.
 */
export function matchNav(
  items: readonly AdminNavItem[],
  path: string | null | undefined,
): AdminNavItem | null {
  if (path == null) return null;
  let exact: AdminNavItem | null = null;
  let prefix: AdminNavItem | null = null;
  const visit = (list: readonly AdminNavItem[]) => {
    for (const item of list) {
      if (item.key === path) exact ??= item;
      else if (
        !item.children &&
        path.startsWith(item.key.endsWith("/") ? item.key : `${item.key}/`) &&
        item.key.length > (prefix?.key.length ?? 0)
      )
        prefix = item;
      if (item.children) visit(item.children);
    }
  };
  visit(items);
  return exact ?? prefix;
}

/** Where to go when clicking an item with children: go down, always taking the first non-disabled child, until reaching a leaf. */
export function firstLeaf(item: AdminNavItem): AdminNavItem {
  const next = item.children?.find((c) => !c.disabled);
  return next ? firstLeaf(next) : item;
}

/**
 * Which top-level item the current item belongs to (in mix / column layouts, which top-level item is selected and whose children the menu below shows):
 * the first one on the current item's path; when the current item is not in the navigation, the first top-level item.
 */
export function activeTopOf(
  items: readonly AdminNavItem[],
  key: string | null | undefined,
): AdminNavItem | undefined {
  return trailOf(items, key)?.[0] ?? items[0];
}
