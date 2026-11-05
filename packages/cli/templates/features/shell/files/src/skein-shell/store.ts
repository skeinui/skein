import type { AdminLayoutSettingsValue, PageTab } from "@skeinui/ui";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { settings } from "@/settings";

type Mode = "system" | "light" | "dark";

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
    { name: `${settings.storageKey}-preferences` },
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
      setTabs: (tabs) => set({ tabs }),
      refresh: (key) =>
        set((s) => ({ versions: { ...s.versions, [key]: (s.versions[key] ?? 0) + 1 } })),
    }),
    {
      name: `${settings.storageKey}-tabs`,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ tabs: s.tabs }),
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
