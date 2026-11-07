import { normalizeSettings } from "@skeinui/ui";
import type { AdminLayoutSettingsValue, PageTab } from "@skeinui/ui";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { settings } from "@/settings";

type Mode = "system" | "light" | "dark";

// What storage hands back is whatever was written there (an older version, another tool, a hand edit): each
// store reads it with `merge`, keeps what has the right shape and leaves the rest to the defaults
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isMode = (value: unknown): value is Mode =>
  value === "system" || value === "light" || value === "dark";
const isTab = (value: unknown): value is PageTab =>
  isObject(value) && typeof value.key === "string" && typeof value.title === "string";

interface PreferencesState {
  mode: Mode;
  layout: AdminLayoutSettingsValue;
  setMode: (mode: Mode) => void;
  setLayout: (layout: AdminLayoutSettingsValue) => void;
  reset: () => void;
}

/** Light / dark and the layout settings; kept in localStorage (index.html reads the mode before the first paint). */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      mode: settings.mode,
      layout: settings.layout,
      setMode: (mode) => set({ mode }),
      setLayout: (layout) => set({ layout }),
      reset: () => set({ mode: settings.mode, layout: settings.layout }),
    }),
    {
      name: `${settings.storageKey}-preferences`,
      merge: (persisted, current) => {
        const saved = isObject(persisted) ? persisted : {};
        return {
          ...current,
          mode: isMode(saved.mode) ? saved.mode : current.mode,
          // Read as settings again: a missing or wrong field is the default's
          layout: isObject(saved.layout) ? normalizeSettings(saved.layout) : current.layout,
        };
      },
    },
  ),
);

const HOME_TAB: PageTab = { key: settings.homePath, title: settings.homePath, pinned: true };

interface TabsState {
  tabs: readonly PageTab[];
  /** Bumped to remount a page (the tab bar's "refresh"). */
  versions: Record<string, number>;
  setTabs: (tabs: readonly PageTab[]) => void;
  refresh: (key: string) => void;
}

/** Open tabs; kept for the browser tab's session, so a reload keeps them. */
export const useTabsStore = create<TabsState>()(
  persist(
    (set) => ({
      tabs: [HOME_TAB],
      versions: {},
      // Without the icons: the tab bar hands back the tabs it was given, icons (React elements) included, and
      // they are worked out from the menu again at every render; tabs are saved as JSON, which an element breaks
      setTabs: (tabs) => set({ tabs: tabs.map((tab) => ({ ...tab, icon: undefined })) }),
      refresh: (key) =>
        set((s) => ({ versions: { ...s.versions, [key]: (s.versions[key] ?? 0) + 1 } })),
    }),
    {
      name: `${settings.storageKey}-tabs`,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ tabs: s.tabs }),
      merge: (persisted, current) => {
        const saved = isObject(persisted) ? persisted : {};
        return {
          ...current,
          tabs: Array.isArray(saved.tabs) ? saved.tabs.filter(isTab) : current.tabs,
        };
      },
    },
  ),
);

interface PageTitlesState {
  /** By path. */
  titles: Record<string, string>;
  setTitle: (path: string, title: string) => void;
}

/**
 * The titles pages give themselves (`<Page title>`). A page in the menu is named by its menu item; one that
 * isn't (a detail page such as /users/42) is named by this: its tab, and the end of its breadcrumb.
 */
export const usePageTitles = create<PageTitlesState>()((set) => ({
  titles: {},
  setTitle: (path, title) =>
    set((s) => (s.titles[path] === title ? s : { titles: { ...s.titles, [path]: title } })),
}));
