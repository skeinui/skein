import type { ComponentType } from "react";

/** `src/pages/<path>/_meta.ts`: how a page (or a group directory) appears in the menu. */
export interface PageMeta {
  /** A lucide-react icon (or any component taking `size`). */
  icon?: ComponentType<{ size?: number | string }>;
  label: { zh: string; en: string };
  /** Smaller comes first; pages without it come after, by path. */
  order?: number;
  /** A directory that only groups the pages under it (no page of its own). */
  isGroup?: true;
  /** Routable but not in the menu. */
  hidden?: boolean;
}

export interface PageEntry {
  /** The route path: the directory under src/pages, e.g. `/system/users`. */
  path: string;
  meta: PageMeta;
  children: PageEntry[];
}

const modules = import.meta.glob<{ meta: PageMeta }>("../pages/**/_meta.ts", { eager: true });

const byOrder = (a: PageEntry, b: PageEntry) =>
  (a.meta.order ?? Infinity) - (b.meta.order ?? Infinity) || a.path.localeCompare(b.path);

function sortTree(entries: PageEntry[]): PageEntry[] {
  return entries.sort(byOrder).map((e) => ({ ...e, children: sortTree(e.children) }));
}

/** Every page with a `_meta.ts`, nested by directory. Adding a page directory adds it here; nothing to register. */
export function pageTree(): PageEntry[] {
  const entries = Object.entries(modules).map(([file, mod]) => ({
    path: file.replace(/^\.\.\/pages/, "").replace(/\/_meta\.ts$/, ""),
    meta: mod.meta,
    children: [] as PageEntry[],
  }));
  const byPath = new Map(entries.map((e) => [e.path, e]));
  const roots: PageEntry[] = [];
  for (const entry of entries) {
    const parent = byPath.get(entry.path.slice(0, entry.path.lastIndexOf("/")));
    (parent ? parent.children : roots).push(entry);
  }
  return sortTree(roots);
}
