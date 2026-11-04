import { parseHex } from "../color-picker/color.ts";

/** Customizable colors. All `#rrggbb`; those not given use the theme style's / theme's own values. */
export interface AdminLayoutColors {
  /** Primary color: buttons, selected items, links, focus. Hover / pressed / outline are derived from it by the theme style. */
  primary?: string;
  /** Secondary color. */
  secondary?: string;
  /** Status color for success (alerts, badges, tags with `color="success"`). */
  success?: string;
  /** Status color for warnings. */
  warning?: string;
  /** Status color for errors and destructive actions. */
  danger?: string;
  /** Page background. When a dark color is chosen, text, outline and neutral colors switch to light tones accordingly. */
  background?: string;
  /** Text color: when not given, white or dark ink is chosen by the background's lightness; when given it is used, and secondary text, outline and neutral colors are all mixed from it and the background. */
  foreground?: string;
  /**
   * Panel color: the base of containers such as cards, tables, code blocks, and of **overlays** (popover, dialog, dropdown menu); also the base of the sidebar (when no sidebar color is customized) and
   * the boxed frame (when no sidebar color is customized). When unset, overlays follow the theme style; when the background is dark and no panel color is set, overlays automatically take the background lightened a bit.
   */
  surface?: string;
  /** Input background: when unset it follows the page background (changes with it), when set it is used on its own. */
  field?: string;
  /** Sidebar background (in the column layout, the primary icon column and the level-2 menu column); text uses the contrast color, and a dark background puts the sidebar in dark mode (menu text turns light). The top layout has no sidebar and is unaffected. */
  sidebar?: string;
}

export interface AdminLayoutTheme {
  /** Color overrides (`#rrggbb`) used in light mode, and in dark mode for items `dark` does not override. */
  colors?: AdminLayoutColors;
  /**
   * Items that override `colors` in dark mode (used when the light and dark palettes are not derived from the same color: e.g. in dark the primary is brightened and the background is a different gray set).
   * Merged into `colors` only when the page is in dark mode; items not written keep `colors`.
   */
  dark?: AdminLayoutColors;
  /**
   * Three radius steps (rem). `radiusSm`: small things such as tags, checkboxes, kbd; `radius`: the md step, controls such as inputs, buttons, menu items, dropdowns;
   * `radiusLg`: large blocks such as cards, dialogs, drawers. If any of them is written, sm / md / lg and the radius roles the components read use this set directly,
   * no longer going through the theme style's own conversion, so the same number means the same thing in any theme style (but heroui's pill controls stay pills, that is their form).
   * When only some are written, the missing ones are derived from md: sm = md × 0.5, lg = md × 1.5. When none is written, the theme style is used as is.
   */
  radius?: number;
  /** Small radius step (rem): tags, checkboxes, kbd. See `radius`. */
  radiusSm?: number;
  /** Large radius step (rem): cards, dialogs, drawers. See `radius`. */
  radiusLg?: number;
  /**
   * Density multiplier (1 = default, 0.8 compact, 1.3 loose): control height and width (horizontal padding, spacing, width of square controls) all scale with it.
   * Only effective for components that read `--ui-density` / `--ui-height-*` (theme styles are adding this one by one).
   */
  density?: number;
}

export type ColorMode = "light" | "dark";

/** Value (rem) when the md step is not written; when only some steps are written, the missing sm / lg are derived from md using these two multipliers. */
export const DEFAULT_RADIUS = 0.5;
const FALLBACK_SM = 0.5;
const FALLBACK_LG = 1.5;

const rem = (n: number) => `${Math.round(n * 1000) / 1000}rem`;

type RGB = [number, number, number];

const toRgb = (hex: string): RGB | null => {
  const c = parseHex(hex);
  return c ? [c.r, c.g, c.b] : null;
};

const toHexString = ([r, g, b]: RGB) =>
  `#${[r, g, b]
    .map((n) =>
      Math.round(Math.min(255, Math.max(0, n)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/** Mixes `a` and `b` proportionally: t = 0 is a, t = 1 is b. */
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** WCAG relative luminance. */
export function luminance([r, g, b]: RGB) {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Contrast ratio of two colors (1–21). */
export function contrast(a: RGB, b: RGB) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
const INK: RGB = [15, 23, 42];
const SNOW: RGB = [248, 250, 252];
/** Approximate page base color in dark mode, used to ensure the text color is readable on it. */
const DARK_BG: RGB = [13, 17, 23];

/** Text color on a semantic color block (primary, status colors): white first (use white when contrast ratio ≥ 3; white text on brand colors is the convention), switch to dark ink only when it is too light (yellow...). */
function onColor(base: RGB): RGB {
  return contrast(base, WHITE) >= 3 ? WHITE : INK;
}

/** Text color on a whole base color (page background, sidebar): white or dark ink, whichever has the higher contrast ratio. */
function onSurface(base: RGB): RGB {
  return contrast(base, WHITE) >= contrast(base, INK) ? WHITE : INK;
}

/** The version used as text: at least 4.5 contrast ratio on `bg`; if not enough, step toward black (light) / white (dark). */
function asText(base: RGB, bg: RGB, mode: ColorMode): RGB {
  let color = base;
  for (let i = 0; i < 20 && contrast(color, bg) < 4.5; i++) {
    color = mix(color, mode === "dark" ? WHITE : BLACK, 0.08);
  }
  return color;
}

/** The four tokens derived from one semantic color (hover / pressed / outline are re-derived by the theme style on `[data-theme]`). */
function family(name: string, hex: string, mode: ColorMode): Record<string, string> {
  const base = toRgb(hex);
  if (!base) return {};
  const soft = mode === "dark" ? mix(base, BLACK, 0.72) : mix(base, WHITE, 0.88);
  return {
    [`--ui-c-${name}`]: toHexString(base),
    [`--ui-c-${name}-fg`]: toHexString(onColor(base)),
    [`--ui-c-${name}-soft`]: toHexString(soft),
    [`--ui-c-${name}-text`]: toHexString(asText(base, mode === "dark" ? DARK_BG : WHITE, mode)),
  };
}

/**
 * Computes the custom theme into a set of CSS variables (keys are variable names). Light / dark derivations differ (whether soft is a light or dark base,
 * which way the text color leans), so it needs to be told the current mode. Items not given do not appear in the result, and the theme style's original values are untouched.
 */
export function themeVars(theme: AdminLayoutTheme, mode: ColorMode): Record<string, string> {
  const vars: Record<string, string> = {};
  const colors = { ...theme.colors, ...(mode === "dark" ? theme.dark : undefined) };
  for (const name of ["primary", "secondary", "success", "warning", "danger"] as const) {
    const hex = colors[name];
    if (hex) Object.assign(vars, family(name, hex, mode));
  }
  if (colors.primary && toRgb(colors.primary)) vars["--ui-ring"] = colors.primary;

  const bg = colors.background ? toRgb(colors.background) : null;
  if (bg && colors.background) {
    const given = colors.foreground ? toRgb(colors.foreground) : null;
    const fg = given ?? (onSurface(bg) === WHITE ? SNOW : INK);
    vars["--ui-bg"] = toHexString(bg);
    vars["--ui-field-bg"] = toHexString(bg);
    // Dark background with no panel color given: overlays cannot stay white, so take the background lightened by 6%
    if (onSurface(bg) === WHITE && !colors.surface) {
      vars["--ui-overlay-bg"] = toHexString(mix(bg, WHITE, 0.06));
    }
    vars["--ui-fg"] = toHexString(fg);
    vars["--ui-fg-muted"] = toHexString(mix(fg, bg, 0.38));
    vars["--ui-border"] = toHexString(mix(bg, fg, 0.14));
    vars["--ui-field-border"] = toHexString(mix(bg, fg, 0.14));
    vars["--ui-c-neutral"] = toHexString(mix(bg, fg, 0.12));
    vars["--ui-c-neutral-fg"] = toHexString(fg);
    vars["--ui-c-neutral-soft"] = toHexString(mix(bg, fg, 0.06));
    vars["--ui-c-neutral-text"] = toHexString(mix(fg, bg, 0.2));
  }
  if (!bg && colors.foreground && toRgb(colors.foreground)) {
    vars["--ui-fg"] = toHexString(toRgb(colors.foreground)!);
  }
  if (colors.surface && toRgb(colors.surface)) {
    vars["--ui-surface"] = toHexString(toRgb(colors.surface)!);
    vars["--ui-overlay-bg"] = toHexString(toRgb(colors.surface)!);
  }
  // The default theme style's "container fill" token: it must also change when the background / panel color is customized (it is computed on <html> and inherited, so changing --ui-bg locally does not move it)
  const containerHex =
    colors.surface && toRgb(colors.surface)
      ? toHexString(toRgb(colors.surface)!)
      : bg && onSurface(bg) === WHITE
        ? toHexString(bg)
        : null;
  if (containerHex) vars["--ui-container"] = containerHex;
  if (colors.field && toRgb(colors.field)) {
    vars["--ui-field-bg"] = toHexString(toRgb(colors.field)!);
  }
  const sidebar = colors.sidebar ? toRgb(colors.sidebar) : null;
  if (sidebar) {
    vars["--al-sidebar"] = toHexString(sidebar);
    vars["--al-sidebar-fg"] = toHexString(onSurface(sidebar) === WHITE ? SNOW : INK);
  }

  if (theme.radius !== undefined || theme.radiusSm !== undefined || theme.radiusLg !== undefined) {
    const md = theme.radius ?? DEFAULT_RADIUS;
    const sm = theme.radiusSm ?? md * FALLBACK_SM;
    const lg = theme.radiusLg ?? md * FALLBACK_LG;
    vars["--ui-radius"] = rem(md);
    vars["--ui-radius-sm"] = rem(sm);
    vars["--ui-radius-md"] = rem(md);
    vars["--ui-radius-lg"] = rem(lg);
    // Components read these roles: point them straight at the three steps, overriding each theme style's own algorithm (heroui's multipliers).
    // --ui-r-control is not written: in most styles it already equals the md step (follows on its own); in heroui it is a pill, which is its form and should not be changed by the radius setting
    vars["--ui-r-small"] = rem(sm);
    vars["--ui-r-item"] = rem(md);
    vars["--ui-r-block"] = rem(lg);
    vars["--ui-r-surface"] = rem(lg);
  }
  if (theme.density !== undefined) vars["--ui-density"] = String(theme.density);
  return vars;
}

/** Which text palette the sidebar should use: dark base is dark, light base is light; returns undefined when no sidebar color is customized (the theme style decides). */
export function sidebarTheme(theme: AdminLayoutTheme): "light" | "dark" | undefined {
  const rgb = theme.colors?.sidebar ? toRgb(theme.colors.sidebar) : null;
  if (!rgb) return undefined;
  return onSurface(rgb) === WHITE ? "dark" : "light";
}

/** Writes the variables onto the element and returns a restore function (removes only what it wrote; inline values originally on the element are restored too). */
export function applyThemeVars(el: HTMLElement, vars: Record<string, string>): () => void {
  const before = new Map<string, string>();
  for (const [key, value] of Object.entries(vars)) {
    before.set(key, el.style.getPropertyValue(key));
    el.style.setProperty(key, value);
  }
  return () => {
    for (const [key, value] of before) {
      if (value) el.style.setProperty(key, value);
      else el.style.removeProperty(key);
    }
  };
}
