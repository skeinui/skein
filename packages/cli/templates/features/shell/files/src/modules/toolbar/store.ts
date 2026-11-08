import { create } from "zustand";
import { persist } from "zustand/middleware";
import { settings } from "@/settings";

interface ToolbarState {
  /** The tools shown in the header, in order: `settings.toolbar.header` until the user changes it in the preferences. */
  header: string[];
  setHeader: (ids: string[]) => void;
  reset: () => void;
}

/** What the user chose for the header toolbar (preferences drawer); kept in localStorage. */
export const useToolbarStore = create<ToolbarState>()(
  persist(
    (set) => ({
      header: settings.toolbar.header,
      setHeader: (header) => set({ header }),
      reset: () => set({ header: settings.toolbar.header }),
    }),
    {
      name: `${settings.storageKey}-toolbar`,
      // What storage holds is read with a check: a list of texts (the tools are checked against TOOLS where used)
      merge: (persisted, current) => {
        const header = (persisted as { header?: unknown } | null)?.header;
        return {
          ...current,
          header: Array.isArray(header)
            ? header.filter((id): id is string => typeof id === "string")
            : current.header,
        };
      },
    },
  ),
);
