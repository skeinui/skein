import type { ReactNode } from "react";

export interface PageTab {
  /** Unique identifier, usually the page's path. */
  key: string;
  /** Tab text; also used in the close button's label and screen-reader announcements. */
  title: string;
  /** Optional icon shown before the title. */
  icon?: ReactNode;
  /** Pinned: placed first, cannot be closed, and can only be reordered among pinned tabs (e.g. home). */
  pinned?: boolean;
  /** Whether it can be closed, default yes; pinned tabs cannot be closed. */
  closable?: boolean;
}

/** Whether a tab can be closed. */
export const isClosable = (tab: PageTab) => !tab.pinned && tab.closable !== false;

export type CloseScope = "self" | "others" | "left" | "right" | "all";

/** Compute which tabs to close by scope (non-closable ones are excluded). `key` is the tab that was right-clicked. */
export function keysToClose(tabs: readonly PageTab[], scope: CloseScope, key: string): string[] {
  const at = tabs.findIndex((t) => t.key === key);
  if (at < 0) return [];
  return tabs
    .filter((t, i) => {
      if (!isClosable(t)) return false;
      switch (scope) {
        case "self":
          return i === at;
        case "others":
          return i !== at;
        case "left":
          return i < at;
        case "right":
          return i > at;
        case "all":
          return true;
      }
    })
    .map((t) => t.key);
}

/**
 * Close a batch of tabs, returning the new tabs and the new current item. When the current item is closed, switch to the next one at the original position (or the previous if none);
 * if none was closed, return unchanged.
 */
export function closeTabs(
  tabs: readonly PageTab[],
  keys: readonly string[],
  activeKey: string,
): { tabs: readonly PageTab[]; activeKey: string } {
  const gone = new Set(keys.filter((k) => tabs.some((t) => t.key === k && isClosable(t))));
  if (gone.size === 0) return { tabs, activeKey };
  const next = tabs.filter((t) => !gone.has(t.key));
  if (!gone.has(activeKey)) return { tabs: next, activeKey };
  const at = tabs.findIndex((t) => t.key === activeKey);
  const after = tabs.slice(at + 1).find((t) => !gone.has(t.key));
  const before = tabs
    .slice(0, at)
    .reverse()
    .find((t) => !gone.has(t.key));
  return { tabs: next, activeKey: (after ?? before)?.key ?? "" };
}

/** How many pinned tabs there are (they are always placed first). */
const pinnedCount = (tabs: readonly PageTab[]) => tabs.filter((t) => t.pinned).length;

/**
 * Move a tab to position `index` (0-based). A pinned tab can only change position within the pinned area, and a normal tab only after the pinned area:
 * the position is clamped into the respective area. If unchanged, return the original array.
 */
export function moveTab(tabs: readonly PageTab[], key: string, index: number): readonly PageTab[] {
  const from = tabs.findIndex((t) => t.key === key);
  if (from < 0) return tabs;
  const tab = tabs[from];
  const pins = pinnedCount(tabs);
  const rest = tabs.filter((t) => t.key !== key);
  const lo = tab.pinned ? 0 : pinnedCount(rest);
  const hi = tab.pinned ? pins - 1 : rest.length;
  const at = Math.min(Math.max(index, lo), Math.max(hi, lo));
  if (at === from) return tabs;
  return [...rest.slice(0, at), tab, ...rest.slice(at)];
}

/** Pin / unpin: after pinning it goes to the end of the pinned area, after unpinning it goes to the front of the normal tabs. */
export function pinTab(tabs: readonly PageTab[], key: string, pinned: boolean): readonly PageTab[] {
  const tab = tabs.find((t) => t.key === key);
  if (!tab || Boolean(tab.pinned) === pinned) return tabs;
  const rest = tabs.filter((t) => t.key !== key);
  const pins = rest.filter((t) => t.pinned).length;
  const next = { ...tab, pinned: pinned || undefined };
  return [...rest.slice(0, pins), next, ...rest.slice(pins)];
}

/** Open a tab: if it already exists return unchanged, otherwise add it at the end (the end of the normal tabs). */
export function openTab(tabs: readonly PageTab[], tab: PageTab): readonly PageTab[] {
  if (tabs.some((t) => t.key === tab.key)) return tabs;
  return [...tabs, tab];
}
