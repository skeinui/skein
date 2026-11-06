import type { AdminLayoutSettingsValue } from "@skeinui/ui";
import { DEFAULT_ADMIN_LAYOUT_SETTINGS } from "@skeinui/ui";

interface ThemeStyleEntry {
  /** Name in the preferences drawer. */
  label: string;
  /** Imports the theme style's CSS (a dynamic import, so each one is a separate file). */
  load: () => Promise<unknown>;
}

const layout: AdminLayoutSettingsValue = {
  ...DEFAULT_ADMIN_LAYOUT_SETTINGS,
  layout: "side",
  showTabs: true,
  tabVariant: "chrome",
};

/** App defaults. Users can change the layout and the mode in the preferences drawer; that is kept per browser. */
export const settings = {
  appName: "{{title}}",
  /** Prefix of localStorage keys (preferences, session, language). */
  storageKey: "{{storageKey}}",
  /** Where "/" and a fresh sign-in go. */
  homePath: "/dashboard",
  /** Default light / dark. */
  mode: "system" as "system" | "light" | "dark",
  /**
   * Theme styles the user can pick in the preferences drawer (listing more than one shows the choice). Each one is
   * its own CSS file, downloaded only when it is used. `npx skein theme add <name…>` / `theme remove` edit this list.
   */
  themeStyles: {
{{themeStyleEntry}}
  } as Record<string, ThemeStyleEntry>,
  /** The theme style used until the user picks another; `npx skein theme use <name>` sets it. */
  themeStyle: "{{themeStyle}}",
  /** Default layout, menu style, tabs…; see AdminLayoutSettings. */
  layout,
  /**
   * The menu lists every page with a _meta.ts. Turn this on to also ask the API which of them the user
   * may open (`GET /api/user/menus` → paths) and show only those.
   */
  menuPermission: false,
  /**
   * Toolbar tools by id, in order: built in are "search" (the pages, ⌘K), "notifications" (a bell with the
   * unread count), "language" (the app's languages) and "mode" (light / dark / system); add your own in
   * src/modules/toolbar/tools.tsx and list its id here.
   */
  toolbar: {
    /** Next to the account menu. */
    header: ["search", "notifications", "language", "mode"],
    /** On the sign-in page, top right. */
    login: ["language", "mode"],
  } as Record<"header" | "login", string[]>,
  footer: `© ${new Date().getFullYear()} {{title}}`,
  /** Adds "Powered by Skein UI" to the footer. Set it to false once you have a Skein UI license (https://skeinui.com). */
  poweredBy: true,
};
