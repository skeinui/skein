import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Filter } from "@/lib/list-query";
import { settings } from "@/settings";

/** What a search asks for, as parts of a `ListQuery`. */
export interface SavedSearch {
  keyword?: string;
  filter?: Filter;
}

/** A search kept under a name: what the keyword box and the filter chips held when it was saved. */
export interface SavedView extends SavedSearch {
  id: string;
  name: string;
}

interface ViewsState {
  views: SavedView[];
  add: (name: string, search: SavedSearch) => void;
  remove: (id: string) => void;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isView = (value: unknown): value is SavedView =>
  isObject(value) && typeof value.id === "string" && typeof value.name === "string";

/**
 * The searches of one list page kept in this browser under `key`, for `SavedViews` (`@skeinui/ui`): `const useOrderViews = createSavedViews("orders")`
 * at the top of the page's module, then `useOrderViews((s) => s.views)`, `.add(name, search)` and `.remove(id)`. They are read back with a check, so an
 * older or hand-edited value is not trusted.
 */
export const createSavedViews = (key: string) =>
  create<ViewsState>()(
    persist(
      (set) => ({
        views: [],
        add: (name, search) =>
          set((s) => ({
            views: [
              ...s.views,
              {
                id: `view-${Date.now().toString(36)}`,
                name,
                ...(search.keyword ? { keyword: search.keyword } : {}),
                ...(search.filter ? { filter: search.filter } : {}),
              },
            ],
          })),
        remove: (id) => set((s) => ({ views: s.views.filter((v) => v.id !== id) })),
      }),
      {
        name: `${settings.storageKey}-${key}`,
        partialize: (s) => ({ views: s.views }),
        merge: (persisted, current) => {
          const saved = isObject(persisted) ? persisted : {};
          return {
            ...current,
            views: Array.isArray(saved.views) ? saved.views.filter(isView) : current.views,
          };
        },
      },
    ),
  );
