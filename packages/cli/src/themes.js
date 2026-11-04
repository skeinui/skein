/** `none` writes a blank theme style into the project instead of installing one. */
export const THEMES = [
  { id: "default", label: "Skein brand" },
  { id: "shadcn", label: "shadcn/ui (Nova)" },
  { id: "heroui", label: "HeroUI v3" },
  { id: "antd", label: "Ant Design 6" },
  { id: "none", label: "blank theme style, write your own" },
];
export const DEFAULT_THEME = "default";

export const isTheme = (id) => THEMES.some((t) => t.id === id);
/** One package holds every built-in theme style; a project imports only the one it uses. */
export const THEMES_PACKAGE = "@skeinui/themes";
export const themeImportPath = (id) => `${THEMES_PACKAGE}/${id}/index.css`;
/** Where a blank theme style lives in a project. */
export const CUSTOM_THEME_DIR = "src/theme";
/** The name a theme style is shown under (the preferences drawer's theme style choice). */
export const themeLabel = (theme, themeStyle) =>
  theme === "none"
    ? themeStyle.replace(/(^|-)(\w)/g, (_, dash, c) => (dash ? " " : "") + c.toUpperCase())
    : theme === "default"
      ? "Skein"
      : (THEMES.find((t) => t.id === theme)?.label ?? theme);
