import { ConfigProvider, en } from "@skeinui/ui";
import { zhCN } from "@skeinui/ui/locales/zh-CN";
import { useLayoutEffect, useMemo, useState } from "react";
import { ShellDemo } from "@/pages/layout/admin-layout/index.tsx";
import { LANGS, MODES, SettingsContext, fromQuery, initialThemeStyle } from "@/site/settings.ts";
import { loadThemeStyle } from "@/site/theme-styles.ts";
import type { Lang, Mode, Settings, ThemeStyle } from "@/site/settings.ts";

/**
 * The full AdminLayout page (`/__admin-layout`): fills the whole window, without the docs site's header and sidebar.
 * The gear in the top right opens the settings panel (layout, presets, colors, radius, density); theme style, light / dark and language use address bar parameters:
 * `?themeStyle=antd&mode=dark&lang=zh-CN`.
 */
export function AdminLayoutFull() {
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(initialThemeStyle);
  const [mode, setMode] = useState<Mode>(() => fromQuery("mode", MODES, "light"));
  const [lang, setLang] = useState<Lang>(() => fromQuery("lang", LANGS, "en"));

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.skeinTheme = themeStyle;
    root.dataset.skeinMode = mode;
    document.body.style.cssText =
      "margin:0;background:var(--ui-bg);color:var(--ui-fg);font-family:var(--ui-font-family)";
  }, [themeStyle, mode]);

  const settings: Settings = useMemo(
    () => ({
      themeStyle,
      mode,
      themeColor: "none",
      compact: "off",
      lang,
      density: 1,
      radius: null,
      codeTheme: "site",
      set: {
        themeStyle: (next) => void loadThemeStyle(next).then(() => setThemeStyle(next)),
        mode: setMode,
        themeColor: () => {},
        compact: () => {},
        lang: setLang,
        density: () => {},
        radius: () => {},
        codeTheme: () => {},
        reset: () => {},
      },
    }),
    [themeStyle, mode, lang],
  );
  const messages = lang === "zh-CN" ? zhCN : en;

  return (
    <SettingsContext.Provider value={settings}>
      <ConfigProvider locale={messages.locale} labels={messages.labels}>
        <ShellDemo customizable switcher={false} fullscreen />
      </ConfigProvider>
    </SettingsContext.Provider>
  );
}
