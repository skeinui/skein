import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { applyThemeVars, themeVars } from "../admin-layout/theme.ts";
import type { AdminLayoutTheme } from "../admin-layout/theme.ts";
import { ConfigContext } from "./context.ts";
import type { ConfigLabels } from "./context.ts";

export interface ConfigProviderProps {
  /** Theme style (shape, density baseline, fonts, component look), written to `<html data-skein-theme>`. */
  themeStyle?: string;
  /** Light / dark, written to `<html data-skein-mode>`; "system" follows the OS and updates when the OS switches. */
  mode?: "light" | "dark" | "system";
  /** Color theme (colors only, both light and dark sets), written to `<html data-skein-color>`; multiple can be passed, joined with spaces. */
  themeColor?: string | string[];
  /** Density (e.g. "compact"), written to `<html data-skein-density>`; if omitted, it is the theme style's own density. */
  themeDensity?: string;
  /**
   * Per-item overrides on top of theme style / color theme / density: colors, three border radius levels (`radiusSm / radius / radiusLg`, rem), density multiplier, and
   * the same data as `settings.themeOverrides` of `AdminLayout` (this is what the settings panel exports). Written to inline CSS variables on `<html>`
   * (overlays follow too), restored on unmount or change; colors are recomputed when switching light / dark mode.
   */
  themeOverrides?: AdminLayoutTheme;
  /** Default locale for date components (BCP 47, e.g. "zh-CN"); a `locale` passed by the component itself takes precedence. */
  locale?: string;
  /** Text of the components, replaced as a whole when changing language; `labels` passed by the component itself takes precedence. Pass a stable reference, do not create the object inline in render. */
  labels?: ConfigLabels;
  children?: ReactNode;
}

type Attr = "skeinTheme" | "skeinMode" | "skeinColor" | "skeinDensity";

/** Write the value to a data-* attribute on <html>, restoring the previous one on unmount or value change. Overlays render inside a Portal, so the attribute must be on <html>. */
function useRootAttribute(name: Attr, value: string | undefined) {
  useEffect(() => {
    if (value === undefined) return;
    const root = document.documentElement;
    const before = root.dataset[name];
    root.dataset[name] = value;
    return () => {
      if (before === undefined) delete root.dataset[name];
      else root.dataset[name] = before;
    };
  }, [name, value]);
}

function useResolvedMode(mode: ConfigProviderProps["mode"]): "light" | "dark" | undefined {
  const query = "(prefers-color-scheme: dark)";
  const read = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;
  const dark = useSystemDark(mode === "system", read);
  if (mode === undefined) return undefined;
  if (mode === "system") return dark ? "dark" : "light";
  return mode;
}

function useSystemDark(enabled: boolean, read: () => boolean) {
  const [dark, setDark] = useState(read);
  useEffect(() => {
    if (!enabled || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setDark(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [enabled]);
  return dark;
}

/**
 * App-wide settings provider, placed once at the app root: picks the theme style, light / dark mode, color theme and
 * density, and supplies the default locale and UI text to every component inside.
 * Pass `themeStyle` (e.g. "antd"), `mode` ("light" / "dark" / "system"), `themeColor`, `themeDensity`, per-item
 * `themeOverrides` (colors, radii, density), `locale` (BCP 47) for date components and `labels` (a stable object) to
 * translate component text; a component's own `locale` / `labels` win. Omitted settings are left untouched, and changing
 * one does not remount the subtree.
 *
 * Theme style: settings are written to `<html>` as `data-skein-theme` / `data-skein-mode` / `data-skein-color` /
 * `data-skein-density` (on `<html>` so portalled overlays follow), `themeOverrides` as inline CSS variables on `<html>`;
 * previous values are restored on unmount or change.
 */
export function ConfigProvider({
  themeStyle,
  mode,
  themeColor,
  themeDensity,
  themeOverrides,
  locale,
  labels,
  children,
}: ConfigProviderProps) {
  useRootAttribute("skeinTheme", themeStyle);
  const resolvedMode = useResolvedMode(mode);
  useRootAttribute("skeinMode", resolvedMode);
  useRootAttribute(
    "skeinColor",
    Array.isArray(themeColor) ? themeColor.join(" ") || undefined : themeColor,
  );
  useRootAttribute("skeinDensity", themeDensity);
  const overridesKey = themeOverrides ? JSON.stringify(themeOverrides) : "";
  useEffect(() => {
    if (!themeOverrides) return;
    return applyThemeVars(
      document.documentElement,
      themeVars(
        themeOverrides,
        resolvedMode ?? (document.documentElement.dataset.skeinMode === "dark" ? "dark" : "light"),
      ),
    );
    // themeOverrides is compared by content (overridesKey), so a caller creating the object inline on every render does not cause repeated writes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overridesKey, resolvedMode]);
  const value = useMemo(() => ({ locale, labels }), [locale, labels]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}
