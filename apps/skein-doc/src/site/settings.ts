import { createContext, useContext } from "react";

export const THEME_STYLES = ["heroui", "antd", "default", "shadcn"] as const;
export const MODES = ["light", "dark"] as const;
export const THEME_COLORS = ["none", "purple", "green", "geekblue", "volcano", "contrast"] as const;
export const COMPACT = ["off", "on"] as const;
export const LANGS = ["en", "zh-CN"] as const;
/** The docs' code blocks: the site's own colours, or one of @skeinui/themes' code themes (`data-code-theme`). */
export const CODE_THEMES = [
  "site",
  "github",
  "one",
  "solarized",
  "catppuccin",
  "dracula",
  "nord",
  "monokai",
  "tokyo-night",
] as const;

export type ThemeStyle = (typeof THEME_STYLES)[number];
export type Mode = (typeof MODES)[number];
export type ThemeColor = (typeof THEME_COLORS)[number];
export type Compact = (typeof COMPACT)[number];
export type Lang = (typeof LANGS)[number];
export type CodeTheme = (typeof CODE_THEMES)[number];

/** Code themes' names in the customize drawer ("site" is a message: it is translated). */
export const CODE_THEME_NAMES: Record<Exclude<CodeTheme, "site">, string> = {
  github: "GitHub",
  one: "One",
  solarized: "Solarized",
  catppuccin: "Catppuccin",
  dracula: "Dracula",
  nord: "Nord",
  monokai: "Monokai",
  "tokyo-night": "Tokyo Night",
};

export const THEME_STYLE_INFO: Record<ThemeStyle, { name: string }> = {
  heroui: { name: "HeroUI v3" },
  antd: { name: "Ant Design 6" },
  default: { name: "Skein" },
  shadcn: { name: "shadcn/ui Nova" },
};

export const THEME_DOT: Record<ThemeColor, string> = {
  none: "linear-gradient(135deg, #a1a1aa, #52525b)",
  purple: "#7c3aed",
  green: "#22c55e",
  geekblue: "#2f54eb",
  volcano: "#fa541c",
  contrast: "linear-gradient(135deg, #1d4ed8 50%, #fff 50%)",
};

export interface Settings {
  themeStyle: ThemeStyle;
  mode: Mode;
  themeColor: ThemeColor;
  compact: Compact;
  /** UI language: the locale for ConfigProvider and the component texts use the locale packs shipped with `@skeinui/ui`. */
  lang: Lang;
  density: number;
  radius: number | null;
  codeTheme: CodeTheme;
  set: {
    themeStyle: (v: ThemeStyle) => void;
    mode: (v: Mode) => void;
    themeColor: (v: ThemeColor) => void;
    compact: (v: Compact) => void;
    lang: (v: Lang) => void;
    density: (v: number) => void;
    radius: (v: number | null) => void;
    codeTheme: (v: CodeTheme) => void;
    reset: () => void;
  };
}

export const SettingsContext = createContext<Settings | null>(null);

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("SettingsContext missing");
  return value;
}

/** Allows opening a combination directly with ?themeStyle=heroui&mode=dark&themeColor=purple, convenient for screenshots and sharing. */
export function fromQuery<T extends string>(key: string, options: readonly T[], fallback: T): T {
  const value = new URLSearchParams(window.location.search).get(key);
  return options.find((option) => option === value) ?? fallback;
}
