import type { BreadcrumbIcons, BreadcrumbSeparatorStyle } from "../breadcrumb/index.ts";
import type { PageTabsVariant } from "../page-tabs/index.ts";
import type { AdminLayoutMode, AdminLayoutToolbar } from "./admin-layout.tsx";
import type { AdminLayoutColors, AdminLayoutTheme } from "./theme.ts";

/** The full settings edited by the settings panel: arrangement (the layout items) plus appearance (theme). AdminLayout's props are taken directly from it. */
export interface AdminLayoutSettingsValue {
  layout: AdminLayoutMode;
  menuVariant: "default" | "modern";
  /** Whether to show the page tabs bar (open pages) above the content. */
  showTabs: boolean;
  tabVariant: PageTabsVariant;
  /** Custom layer: overrides colors / radius / density one by one on top of the theme style and color theme. */
  themeOverrides: AdminLayoutTheme;
  /**
   * Semi Dark: when the page is in light mode, the navigation areas (sidebar, both columns of the column layout, header) are forced dark. `auto` follows the theme style (antd has a dark sidebar by default, others light),
   * `on` dark, `off` light. Has no effect when the sidebar color is customized or the page itself is in dark mode. Unset equals `auto`.
   */
  semiDark?: "auto" | "on" | "off";
  /**
   * In the boxed layout, when the sidebar color is customized, whether the header and outer frame also use it (default yes, all three in one color). `false`: the header and frame keep the theme style's own base color.
   * Only affects boxed; in other layouts the header is part of the page and does not follow the sidebar.
   */
  headerFollowsSidebar?: boolean;
  /** Position of the toolbar (user, messages, light/dark toggle...) in the side layout (`side`): `sidebar` at the bottom of the sidebar (no header), `header` on the right of the header above the content area. Unset equals `sidebar`. */
  toolbar?: AdminLayoutToolbar;
  /** Whether to show the breadcrumb in the header (only meaningful for apps that pass `breadcrumb`). `false` hides it; unset means shown. */
  showBreadcrumb?: boolean;
  /** Breadcrumb icons in the header: `all` shows every item's (those with an icon), `first` keeps only the first, `none` shows none. Unset equals `all`. */
  breadcrumbIcons?: BreadcrumbIcons;
  /** Breadcrumb separator: `chevron` small arrow, `slash` slash. Unset equals `chevron`. */
  breadcrumbSeparator?: BreadcrumbSeparatorStyle;
  /**
   * Theme style id (`ConfigProvider`'s `themeStyle`). The library does not own `<html>` and does not know which styles the app imported:
   * the panel's "Theme style" section is fed by the app via `themeStyles`; once selected, pass it to `ConfigProvider themeStyle` to take effect. Unset means styles are not managed.
   */
  themeStyle?: string;
}

export const DEFAULT_ADMIN_LAYOUT_SETTINGS: AdminLayoutSettingsValue = {
  layout: "side",
  menuVariant: "modern",
  showTabs: true,
  tabVariant: "chrome",
  themeOverrides: {},
};

/** Preset: the part of the settings to override (`themeOverrides` is replaced entirely; colors not written return to the theme style's original values). */
export interface AdminLayoutPreset {
  /** Unique id; also the key for the built-in name in `labels.presets` and the argument of `onDeletePreset`. */
  id: string;
  /** Display name; built-in presets' names come from the language pack (`labels.presets[id]`), presets you add use this. */
  label?: string;
  /** The settings applied when the preset is chosen; keys not given keep their current value, except `themeOverrides`, which is always replaced. */
  settings: Partial<AdminLayoutSettingsValue>;
}

/** Color theme (theme-color): a set of colors (may be just a primary color, or include secondary, background, sidebar color...). Can be combined freely with theme styles. */
export interface AdminLayoutThemeColor {
  /** Unique id; also the key for the built-in name in `labels.themeColors`. */
  id: string;
  /** Display name; built-in ones come from the language pack (`labels.themeColors[id]`). */
  label?: string;
  /** Without colors it means "follow the theme style" (clears all custom colors). */
  colors?: AdminLayoutColors;
  /** Items that override `colors` in dark mode (see `AdminLayoutTheme.dark`). */
  dark?: AdminLayoutColors;
}

export const ADMIN_LAYOUT_THEME_COLORS: readonly AdminLayoutThemeColor[] = [
  { id: "default" },
  { id: "blue", colors: { primary: "#2563eb" } },
  { id: "geekblue", colors: { primary: "#2f54eb" } },
  { id: "purple", colors: { primary: "#7c3aed" } },
  { id: "rose", colors: { primary: "#e11d48" } },
  { id: "volcano", colors: { primary: "#fa541c", secondary: "#faad14" } },
  { id: "amber", colors: { primary: "#d97706" } },
  { id: "green", colors: { primary: "#16a34a", secondary: "#0d9488" } },
  { id: "teal", colors: { primary: "#0d9488" } },
  { id: "ocean", colors: { primary: "#1677ff", sidebar: "#001529" } },
  { id: "forest", colors: { primary: "#16a34a", surface: "#f4faf5", sidebar: "#14532d" } },
  {
    id: "midnight",
    colors: { primary: "#8b5cf6", background: "#0f1117", surface: "#161922", sidebar: "#0b0d12" },
  },
  /**
   * Nexus: taken from the daisyUI Nexus admin template (nexus.daisyui.com), its light / dark pair: gray-white background, white panels, and dark mode is a bluish dark gray,
   * with one primary value each for light and dark (brightened in dark). The base colors of light and dark are not derived from the same color, so the dark set is written in `dark`.
   */
  {
    id: "nexus",
    colors: {
      primary: "#167bff",
      secondary: "#9c5de8",
      success: "#0bbf58",
      warning: "#f5a524",
      danger: "#f31260",
      background: "#fafbfc",
      foreground: "#1e2328",
      surface: "#ffffff",
    },
    dark: {
      primary: "#378dff",
      secondary: "#b071ff",
      background: "#121416",
      foreground: "#f0f4f8",
      surface: "#181c20",
    },
  },
];

/** Applies a color theme: colors are replaced entirely (items not written return to the theme style's original values); layout, radius and density are untouched. */
export function applyThemeColor(
  value: AdminLayoutSettingsValue,
  color: AdminLayoutThemeColor,
): AdminLayoutSettingsValue {
  return {
    ...value,
    themeOverrides: {
      ...value.themeOverrides,
      colors: color.colors ? { ...color.colors } : undefined,
      dark: color.dark ? { ...color.dark } : undefined,
    },
  };
}

export const matchesThemeColor = (value: AdminLayoutSettingsValue, color: AdminLayoutThemeColor) =>
  sameColors(value.themeOverrides.colors, color.colors) &&
  sameColors(value.themeOverrides.dark, color.dark);

/** Applies a preset onto the current settings. */
export function applyPreset(
  value: AdminLayoutSettingsValue,
  preset: AdminLayoutPreset,
): AdminLayoutSettingsValue {
  return { ...value, ...preset.settings, themeOverrides: preset.settings.themeOverrides ?? {} };
}

const sameColors = (a: AdminLayoutColors = {}, b: AdminLayoutColors = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof AdminLayoutColors>;
  for (const key of keys)
    if ((a[key] ?? "").toLowerCase() !== (b[key] ?? "").toLowerCase()) return false;
  return true;
};

/** Whether the current settings exactly equal this preset (every item the preset writes is the same, colors identical). */
export function matchesPreset(value: AdminLayoutSettingsValue, preset: AdminLayoutPreset) {
  const s = preset.settings;
  if (s.layout !== undefined && s.layout !== value.layout) return false;
  if (s.menuVariant !== undefined && s.menuVariant !== value.menuVariant) return false;
  if (s.tabVariant !== undefined && s.tabVariant !== value.tabVariant) return false;
  if (s.showTabs !== undefined && s.showTabs !== value.showTabs) return false;
  if (s.themeStyle !== undefined && s.themeStyle !== value.themeStyle) return false;
  return sameColors(value.themeOverrides.colors, s.themeOverrides?.colors);
}

/** Saves the current settings as a preset (the user's own "My HeroUI": some theme style + the layout, colors, radius and density they adjusted). */
export function presetFrom(
  value: AdminLayoutSettingsValue,
  id: string,
  label: string,
): AdminLayoutPreset {
  return { id, label, settings: structuredClone(value) };
}

const LAYOUTS = ["side", "top", "mix", "column", "boxed"] as const;
const TOOLBARS = ["sidebar", "header"] as const;
const TAB_VARIANTS = ["card", "chrome", "line"] as const;
const BREADCRUMB_ICONS = ["all", "first", "none"] as const;
const BREADCRUMB_SEPARATORS = ["chevron", "slash"] as const;
const COLOR_KEYS = [
  "primary",
  "secondary",
  "success",
  "warning",
  "danger",
  "background",
  "foreground",
  "surface",
  "field",
  "sidebar",
] as const;
const HEX = /^#[0-9a-f]{6}$/i;

/** Version of the export file: lets old files be recognized if fields change later. */
export const ADMIN_LAYOUT_SETTINGS_VERSION = 1;

/**
 * Normalizes arbitrary data (JSON read back, localStorage...) into valid settings: unknown fields are dropped, invalid values are filled with defaults,
 * colors accept only `#rrggbb`, radius / density are clamped to range. Always returns usable settings.
 */
export function normalizeSettings(
  input: unknown,
  base: AdminLayoutSettingsValue = DEFAULT_ADMIN_LAYOUT_SETTINGS,
): AdminLayoutSettingsValue {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(v as T) ? (v as T) : fallback;
  // Old export files called it theme / skin; still accepted when read back
  const overridesRaw = raw.themeOverrides ?? raw.theme;
  const themeRaw = (overridesRaw && typeof overridesRaw === "object" ? overridesRaw : {}) as Record<
    string,
    unknown
  >;
  const colorsRaw = (
    themeRaw.colors && typeof themeRaw.colors === "object" ? themeRaw.colors : {}
  ) as Record<string, unknown>;
  const colors: AdminLayoutColors = {};
  for (const key of COLOR_KEYS) {
    const v = colorsRaw[key];
    if (typeof v === "string" && HEX.test(v)) colors[key] = v.toLowerCase();
  }
  const darkRaw = (
    themeRaw.dark && typeof themeRaw.dark === "object" ? themeRaw.dark : {}
  ) as Record<string, unknown>;
  const dark: AdminLayoutColors = {};
  for (const key of COLOR_KEYS) {
    const v = darkRaw[key];
    if (typeof v === "string" && HEX.test(v)) dark[key] = v.toLowerCase();
  }
  const num = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined;
  const themeOverrides: AdminLayoutTheme = {};
  if (Object.keys(colors).length > 0) themeOverrides.colors = colors;
  if (Object.keys(dark).length > 0) themeOverrides.dark = dark;
  const radius = num(themeRaw.radius, 0, 2);
  if (radius !== undefined) themeOverrides.radius = radius;
  const radiusSm = num(themeRaw.radiusSm, 0, 2);
  if (radiusSm !== undefined) themeOverrides.radiusSm = radiusSm;
  const radiusLg = num(themeRaw.radiusLg, 0, 3);
  if (radiusLg !== undefined) themeOverrides.radiusLg = radiusLg;
  const density = num(themeRaw.density, 0.8, 1.3);
  if (density !== undefined) themeOverrides.density = density;
  // Earlier, "side + header" was a separate layout side-header: converted to side + toolbar: header when read back
  const legacySideHeader = raw.layout === "side-header";
  const value: AdminLayoutSettingsValue = {
    layout: legacySideHeader ? "side" : pick(raw.layout, LAYOUTS, base.layout),
    menuVariant: pick(raw.menuVariant, ["default", "modern"] as const, base.menuVariant),
    showTabs: typeof raw.showTabs === "boolean" ? raw.showTabs : base.showTabs,
    tabVariant: pick(raw.tabVariant, TAB_VARIANTS, base.tabVariant),
    themeOverrides,
  };
  if (raw.semiDark === "on" || raw.semiDark === "off") value.semiDark = raw.semiDark;
  if (raw.headerFollowsSidebar === false) value.headerFollowsSidebar = false;
  const toolbar = pick(raw.toolbar, TOOLBARS, legacySideHeader ? "header" : "sidebar");
  if (toolbar !== "sidebar") value.toolbar = toolbar;
  if (raw.showBreadcrumb === false) value.showBreadcrumb = false;
  const crumbIcons = pick(raw.breadcrumbIcons, BREADCRUMB_ICONS, "all");
  if (crumbIcons !== "all") value.breadcrumbIcons = crumbIcons;
  const crumbSeparator = pick(raw.breadcrumbSeparator, BREADCRUMB_SEPARATORS, "chevron");
  if (crumbSeparator !== "chevron") value.breadcrumbSeparator = crumbSeparator;
  const style = raw.themeStyle ?? raw.skin;
  if (typeof style === "string" && style) value.themeStyle = style;
  return value;
}

/**
 * The app's own settings that go along with the layout ones in an export (what the sections it adds to the panel
 * change): JSON values by name. The library doesn't read them; it only carries them out and back in.
 */
export type AdminLayoutSettingsExtra = Record<string, unknown>;

const hasExtra = (extra?: AdminLayoutSettingsExtra): extra is AdminLayoutSettingsExtra =>
  Boolean(extra) && Object.keys(extra as object).length > 0;

/**
 * Exports as JSON text (with a version number, two-space indent, convenient to commit to a repo). The app's own
 * settings, when it has some (`extra`), are under `extra`.
 */
export function serializeSettings(
  value: AdminLayoutSettingsValue,
  extra?: AdminLayoutSettingsExtra,
): string {
  return JSON.stringify(
    {
      version: ADMIN_LAYOUT_SETTINGS_VERSION,
      ...normalizeSettings(value),
      ...(hasExtra(extra) ? { extra } : {}),
    },
    null,
    2,
  );
}

/**
 * Reads back exported text: an error if it is not JSON or not an object at all; otherwise normalized by
 * `normalizeSettings` (invalid fields return to defaults). The app's own settings (`extra`) come back as they
 * were exported, when there are some: checking them is the app's job.
 */
export function parseSettings(
  text: string,
):
  | { ok: true; value: AdminLayoutSettingsValue; extra?: AdminLayoutSettingsExtra }
  | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON" };
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    return { ok: false, error: "Expected a JSON object" };
  const extra = (data as { extra?: unknown }).extra;
  const plain = extra && typeof extra === "object" && !Array.isArray(extra);
  return {
    ok: true,
    value: normalizeSettings(data),
    ...(plain ? { extra: extra as AdminLayoutSettingsExtra } : {}),
  };
}

/**
 * Exports as usage that can be pasted straight into code: the `settings` prop of `AdminLayout` alone applies layout / menu style / colors / radius / density;
 * the theme style is CSS imported by the app itself, passed to `ConfigProvider themeStyle`.
 */
export function settingsToCode(
  value: AdminLayoutSettingsValue,
  extra?: AdminLayoutSettingsExtra,
): string {
  const s = normalizeSettings(value);
  const json = JSON.stringify(
    {
      layout: s.layout,
      menuVariant: s.menuVariant,
      showTabs: s.showTabs,
      tabVariant: s.tabVariant,
      themeOverrides: s.themeOverrides,
      ...(s.headerFollowsSidebar === false ? { headerFollowsSidebar: false } : {}),
      ...(s.toolbar ? { toolbar: s.toolbar } : {}),
      ...(s.showBreadcrumb === false ? { showBreadcrumb: false } : {}),
      ...(s.breadcrumbIcons ? { breadcrumbIcons: s.breadcrumbIcons } : {}),
      ...(s.breadcrumbSeparator ? { breadcrumbSeparator: s.breadcrumbSeparator } : {}),
    },
    null,
    2,
  );
  const lines = [
    "// admin-layout.settings.ts",
    'import type { AdminLayoutSettingsValue } from "@skeinui/ui";',
    "",
    `export const adminLayoutSettings: AdminLayoutSettingsValue = ${json};`,
    "",
    ...(hasExtra(extra)
      ? [
          "// The app's own settings, which the library only carries along:",
          `export const adminLayoutExtra = ${JSON.stringify(extra, null, 2)};`,
          "",
        ]
      : []),
  ];
  const hasOverrides = Object.keys(s.themeOverrides).length > 0;
  lines.push(
    "// Usage:",
    "// <AdminLayout settings={adminLayoutSettings} items={items} … />",
    "// tabVariant is for your <PageTabs variant={adminLayoutSettings.tabVariant} />",
  );
  if (s.themeStyle || hasOverrides) {
    // Pages outside AdminLayout, such as a login page, need the same look too: pass the same themeOverrides to ConfigProvider
    const props = [
      s.themeStyle ? `themeStyle="${s.themeStyle}"` : "",
      hasOverrides ? "themeOverrides={adminLayoutSettings.themeOverrides}" : "",
    ].filter(Boolean);
    lines.push(
      "",
      "// At the app root, so pages outside AdminLayout (such as the login page) get the same colors / radius / density:",
      `// <ConfigProvider ${props.join(" ")}>`,
    );
  }
  return lines.join("\n");
}
