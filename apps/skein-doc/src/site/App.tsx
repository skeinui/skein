import { ConfigProvider, en } from "@skeinui/ui";
import { zhCN } from "@skeinui/ui/locales/zh-CN";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Home } from "@/home/home.tsx";
import { findPage, loadMessages, type PageDef } from "@/registry.ts";
import {
  CommandPalette,
  CustomizeDrawer,
  Header,
  MobileNav,
  OriginBadge,
  PageFooter,
  Sidebar,
  Toc,
  Announcement,
} from "@/site/chrome.tsx";
import {
  LangContext,
  PageMessagesContext,
  pageLabel,
  siteText,
  splitPath,
  useSiteT,
  withLang,
  type Messages,
} from "@/site/i18n.tsx";
import { plain, setHead } from "@/site/head.ts";
import { NotFound } from "@/site/not-found.tsx";
import { NavContext, PgLink, type Nav } from "@/site/nav.tsx";
import {
  CODE_THEMES,
  COMPACT,
  MODES,
  THEME_STYLES,
  SettingsContext,
  THEME_COLORS,
  fromQuery,
  type CodeTheme,
  type Compact,
  type Lang,
  type Mode,
  type Settings,
  type ThemeStyle,
  type ThemeColor,
} from "@/site/settings.ts";

/** A page ready to show: its component and its texts in the current language, loaded together. */
export interface OpenPage {
  page: PageDef;
  lang: Lang;
  Component: ComponentType;
  messages: Messages;
}

/** `initial`: the page of the first URL, loaded before the first render (main.tsx), so it never shows empty. */
export function App({ initial = null }: { initial?: OpenPage | null }) {
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(() =>
    fromQuery("themeStyle", THEME_STYLES, "heroui"),
  );
  const [mode, setMode] = useState<Mode>(() => fromQuery("mode", MODES, "light"));
  const [themeColor, setThemeColor] = useState<ThemeColor>(() =>
    fromQuery("themeColor", THEME_COLORS, "none"),
  );
  const [compact, setCompact] = useState<Compact>(() => fromQuery("compact", COMPACT, "off"));
  const [codeTheme, setCodeTheme] = useState<CodeTheme>(() =>
    fromQuery("codeTheme", CODE_THEMES, "site"),
  );
  const [density, setDensity] = useState(1);
  const [radius, setRadius] = useState<number | null>(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  // The language is part of the URL: /button, /zh/button
  const { lang, path } = splitPath(pathname);
  const page = findPage(path);
  // A path with no page (the home page is "/"): the 404 page
  const notFound = !page && path !== "/";

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /** In-site navigation: doesn't reload the page, keeps query parameters such as ?themeStyle= */
  const go = useCallback((to: string, scroll = true) => {
    window.history.pushState(null, "", to + window.location.search);
    setPathname(to);
    if (scroll) window.scrollTo(0, 0);
  }, []);
  const nav: Nav = useMemo(
    () => ({
      navigate: (to) => go(withLang(to, lang)),
      href: (to) => withLang(to, lang) + window.location.search,
    }),
    [go, lang],
  );

  // The page's code and texts arrive together, so it never shows with missing texts; the content area waits for both
  const [open, setOpen] = useState<OpenPage | null>(initial);
  useEffect(() => {
    if (!page) return;
    let current = true;
    void Promise.all([page.load(), loadMessages(page, lang)]).then(([module, messages]) => {
      if (current) setOpen({ page, lang, Component: module.default, messages });
    });
    return () => {
      current = false;
    };
  }, [page, lang]);
  const shown = page && open?.page === page && open.lang === lang ? open : null;

  // Cmd+K / Ctrl+K opens search; when not in an input, pressing / also works
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? "");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Title, description (a page's lead), canonical and hreflang links, social card; a page's once its texts are in
  useEffect(() => {
    if (notFound)
      setHead({
        title: `${siteText(lang, "notFound.title")} · Skein UI`,
        description: siteText(lang, "notFound.text"),
        path,
        lang,
        noindex: true,
      });
    else if (!page)
      setHead({
        // "One component API. Every design language." / "一套组件 API。适配任何设计语言。" (no space in Chinese)
        title: `Skein UI · ${siteText(lang, "home.hero.title")}${lang === "zh-CN" ? "" : " "}${siteText(lang, "home.hero.subtitle")}`,
        description: plain(siteText(lang, "home.hero.lead")),
        path,
        lang,
      });
    else if (shown)
      setHead({
        title: `${pageLabel(page, lang)} · Skein UI`,
        description: plain(typeof shown.messages.lead === "string" ? shown.messages.lead : ""),
        path,
        lang,
      });
  }, [page, notFound, shown, path, lang]);

  // Theme style, mode, color theme, density and radius are all just attributes / variables on <html>
  // Use a layout effect: write the theme style attribute to <html> before the first paint, avoiding a one-frame flash of the default theme style
  useLayoutEffect(() => {
    const root = document.documentElement;
    // Turn off all transitions for the frame of the switch: components' color transitions have different durations and start points, and scrollbars (natively painted) change color instantly,
    // without this the page would fade block by block and the scrollbar would flicker.
    root.dataset.switching = "";
    const done = requestAnimationFrame(() =>
      requestAnimationFrame(() => delete root.dataset.switching),
    );
    root.dataset.themeStyle = themeStyle;
    root.dataset.mode = mode;
    // Color theme and density are each one attribute: data-theme-color / data-theme-density
    if (themeColor === "none") delete root.dataset.themeColor;
    else root.dataset.themeColor = themeColor;
    if (compact === "on") root.dataset.themeDensity = "compact";
    else delete root.dataset.themeDensity;
    // When the density slider hasn't moved (1), don't write an inline value, so the compact density's --ui-density can take effect
    if (density === 1) root.style.removeProperty("--ui-density");
    else root.style.setProperty("--ui-density", String(density));
    if (radius === null) root.style.removeProperty("--ui-radius");
    else root.style.setProperty("--ui-radius", `${radius}rem`);
    return () => cancelAnimationFrame(done);
  }, [themeStyle, mode, themeColor, compact, density, radius]);

  const settings: Settings = useMemo(
    () => ({
      themeStyle,
      mode,
      themeColor,
      compact,
      lang,
      density,
      radius,
      codeTheme,
      set: {
        themeStyle: setThemeStyle,
        mode: setMode,
        themeColor: setThemeColor,
        compact: setCompact,
        // The same page in the other language
        lang: (next) => go(withLang(path, next), false),
        density: setDensity,
        radius: setRadius,
        codeTheme: setCodeTheme,
        reset: () => {
          setThemeColor("none");
          setCompact("off");
          setDensity(1);
          setRadius(null);
          setCodeTheme("site");
        },
      },
    }),
    [themeStyle, mode, themeColor, compact, lang, density, radius, codeTheme, go, path],
  );
  const messages = lang === "zh-CN" ? zhCN : en;

  return (
    <SettingsContext.Provider value={settings}>
      <LangContext.Provider value={lang}>
        <ConfigProvider locale={messages.locale} labels={messages.labels}>
          <NavContext.Provider value={nav}>
            <PageMessagesContext.Provider value={shown?.messages ?? {}}>
              <div className="pg-page">
                <Announcement />
                <Header
                  onSearch={() => setPaletteOpen(true)}
                  onCustomize={() => setCustomizeOpen(true)}
                  onMenu={() => setNavOpen(true)}
                />

                {page ? (
                  <div className="pg-layout">
                    <aside className="pg-aside">
                      <Sidebar current={page.path} />
                    </aside>
                    <main className="pg-content" key={page.path}>
                      {shown ? <PageBody open={shown} /> : null}
                    </main>
                    <aside className="pg-aside pg-aside--toc">
                      {shown ? <Toc page={shown.page} /> : null}
                    </aside>
                  </div>
                ) : notFound ? (
                  <main className="pg-home-wrap">
                    <NotFound onSearch={() => setPaletteOpen(true)} />
                  </main>
                ) : (
                  <main className="pg-home-wrap">
                    <Home />
                  </main>
                )}

                <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
                <CustomizeDrawer open={customizeOpen} onOpenChange={setCustomizeOpen} />
                <MobileNav open={navOpen} onOpenChange={setNavOpen} current={page?.path ?? "/"} />
              </div>
            </PageMessagesContext.Provider>
          </NavContext.Provider>
        </ConfigProvider>
      </LangContext.Provider>
    </SettingsContext.Provider>
  );
}

function PageBody({ open: { page, Component } }: { open: OpenPage }) {
  const t = useSiteT();
  return (
    <>
      <nav className="pg-crumbs" aria-label={t("nav.breadcrumb")}>
        <PgLink to="/">{t(page.group === "guides" ? "nav.docs" : "nav.components")}</PgLink>
        <span>/</span>
        <span>{t(`groups.${page.group}`)}</span>
        {page.origin ? <OriginBadge origin={page.origin} /> : null}
      </nav>
      <Component />
      <PageFooter page={page} />
    </>
  );
}
