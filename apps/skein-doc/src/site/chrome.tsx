import { Button, Dialog, Drawer, Segmented, Slider, Switch } from "@skeinui/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckIcon,
  GitHubIcon,
  MoonIcon,
  SearchIcon,
  SlidersIcon,
  SunIcon,
  MenuIcon,
} from "@/doc/icons.tsx";
import { SkinIcon } from "@/site/skin-icons.tsx";
import { PgLink, useNavigate } from "@/site/nav.tsx";
import { pageLabel, useLang, usePageT, useSiteT } from "@/site/i18n.tsx";
import { GUIDES, PAGE_GROUPS, PAGES, type PageDef, type PageOrigin } from "@/registry.ts";
import { GITHUB_API, GITHUB_URL, NPM_URL, VERSION } from "@/site/links.ts";
import {
  CODE_THEMES,
  CODE_THEME_NAMES,
  LANGS,
  MODES,
  THEME_STYLES,
  THEME_STYLE_INFO,
  THEME_COLORS,
  THEME_DOT,
  useSettings,
  type CodeTheme,
  type Lang,
  type Mode,
  type ThemeStyle,
  type ThemeColor,
} from "@/site/settings.ts";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/* ------------------------------------------------------------------ Top bar */

export function Header({
  onSearch,
  onCustomize,
  onMenu,
}: {
  onSearch: () => void;
  onCustomize: () => void;
  onMenu: () => void;
}) {
  const s = useSettings();
  const t = useSiteT();
  return (
    <header className="pg-header">
      <div className="pg-header-inner">
        <button
          type="button"
          className="pg-icon-btn pg-menu-btn"
          aria-label={t("header.menu")}
          onClick={onMenu}
        >
          <MenuIcon />
        </button>
        <PgLink to="/" className="pg-brand" aria-label={t("header.home")}>
          <img src="/favicon.svg" alt="" width="26" height="26" />
          <span className="pg-brand-name">Skein UI</span>
        </PgLink>
        <a
          className="pg-brand-tag"
          href={NPM_URL}
          target="_blank"
          rel="noreferrer"
          title="@skeinui/ui"
        >
          v{VERSION}
        </a>

        <button type="button" className="pg-search" onClick={onSearch}>
          <SearchIcon />
          <span>{t("search.placeholder")}</span>
          <kbd className="pg-kbd">{isMac ? "⌘" : "Ctrl"}</kbd>
          <kbd className="pg-kbd">K</kbd>
        </button>

        <div className="pg-header-actions">
          <button type="button" className="pg-pill" onClick={onCustomize}>
            <SlidersIcon />
            <span className="pg-pill-text">
              {s.themeStyle}
              <i>/</i>
              {s.mode}
            </span>
          </button>
          <GitHubLink />
          <button
            type="button"
            className="pg-icon-btn pg-lang-btn"
            aria-label={t("header.switchLang")}
            title={t("header.switchLang")}
            onClick={() => s.set.lang(s.lang === "zh-CN" ? "en" : "zh-CN")}
          >
            {s.lang === "zh-CN" ? "中文" : "EN"}
          </button>
          <button
            type="button"
            className="pg-icon-btn"
            aria-label={t(s.mode === "dark" ? "header.toLight" : "header.toDark")}
            onClick={() => s.set.mode(s.mode === "dark" ? "light" : "dark")}
          >
            {s.mode === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- Sidebar */

const STARS_KEY = "skein-doc:github-stars";

/** The repository's star count: read from GitHub's API once a session (kept in sessionStorage); null until it comes, or if it doesn't. */
function useGitHubStars() {
  const [stars, setStars] = useState<number | null>(() => {
    try {
      const saved = sessionStorage.getItem(STARS_KEY);
      return saved === null ? null : Number(saved);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (stars !== null) return;
    let current = true;
    fetch(GITHUB_API)
      .then((response) => (response.ok ? response.json() : null))
      .then((repo: { stargazers_count?: number } | null) => {
        const count = repo?.stargazers_count;
        if (!current || typeof count !== "number") return;
        setStars(count);
        try {
          sessionStorage.setItem(STARS_KEY, String(count));
        } catch {
          // storage blocked: read again next time
        }
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [stars]);
  return stars;
}

/** The repository, with its star count (hidden on narrow screens, and when GitHub's API doesn't answer). */
function GitHubLink() {
  const t = useSiteT();
  const lang = useLang();
  const stars = useGitHubStars();
  return (
    <a
      className="pg-icon-btn pg-github"
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={t("header.github")}
      title={t("header.github")}
    >
      <GitHubIcon />
      {stars === null ? null : (
        <span className="pg-github-stars">
          {new Intl.NumberFormat(lang, { notation: "compact" }).format(stars)}
        </span>
      )}
    </a>
  );
}

export function Sidebar({ current, onNavigate }: { current: string; onNavigate?: () => void }) {
  const t = useSiteT();
  const [filter, setFilter] = useState("");
  const nav = useRef<HTMLElement>(null);
  const q = filter.trim().toLowerCase();
  const lang = useLang();
  const guides = GUIDES.filter((p) => !q || pageLabel(p, lang).toLowerCase().includes(q));

  // Scroll the current page into the sidebar's visible range
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }, [current]);

  return (
    <nav ref={nav} className="pg-sidebar" aria-label={t("nav.components")}>
      <div className="pg-sidebar-filter">
        <SearchIcon />
        <input
          type="text"
          value={filter}
          placeholder={t("sidebar.filter")}
          aria-label={t("sidebar.filterLabel")}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {guides.length > 0 ? (
        <div className="pg-nav-group">
          <div className="pg-nav-title">
            <span>{t("groups.guides")}</span>
          </div>
          {guides.map((p) => (
            <PgLink
              key={p.path}
              to={p.path}
              className="pg-nav-link"
              aria-current={p.path === current ? "page" : undefined}
              onNavigate={onNavigate}
            >
              {pageLabel(p, lang)}
            </PgLink>
          ))}
        </div>
      ) : null}
      {PAGE_GROUPS.map((group, gi) => {
        const items = PAGES.filter(
          (p) => p.group === group && (!q || p.label.toLowerCase().includes(q)),
        );
        if (items.length === 0) return null;
        return (
          <div key={group} className="pg-nav-group">
            <div className="pg-nav-title">
              <span className="pg-nav-index">{String(gi + 1).padStart(2, "0")}</span>
              <span>{t(`groups.${group}`)}</span>
              <span className="pg-nav-count">{items.length}</span>
            </div>
            {items.map((p) => (
              <PgLink
                key={p.path}
                to={p.path}
                className="pg-nav-link"
                aria-current={p.path === current ? "page" : undefined}
                onNavigate={onNavigate}
              >
                {p.label}
                {p.origin === "Original" ? (
                  <span className="pg-nav-dot" title={t("origin.Original")} />
                ) : null}
              </PgLink>
            ))}
          </div>
        );
      })}
      {q && guides.length === 0 && !PAGES.some((p) => p.label.toLowerCase().includes(q)) ? (
        <p className="pg-nav-empty">{t("sidebar.empty", { q: filter })}</p>
      ) : null}
    </nav>
  );
}

/* ------------------------------------------------------- Right table of contents + scroll sync */

/** Component source marker: Base UI means the behavior comes from Base UI, Original means written or composed by ourselves. */
export function OriginBadge({ origin }: { origin: PageOrigin }) {
  const t = useSiteT();
  return (
    <span
      className="pg-origin"
      data-origin={origin === "Original" ? "original" : "base-ui"}
      title={t(`origin.${origin}Note`)}
    >
      {t(`origin.${origin}`)}
    </span>
  );
}

const SHARED_TOC_GROUPS = ["examples", "beyond", "reference", "guide"];

export function Toc({ page }: { page: PageDef }) {
  const t = useSiteT();
  const pt = usePageT();
  const ids = useMemo(() => page.toc.flatMap((g) => g.items), [page]);
  // The shared groups are the site's; a page's own groups are its `toc.<group>` messages
  const groupLabel = (group: string) =>
    SHARED_TOC_GROUPS.includes(group)
      ? t(`toc.${group}`)
      : pt.has(`toc.${group}`)
        ? pt(`toc.${group}`)
        : group;
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    setActive(ids[0] ?? null);
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id);
          else seen.delete(e.target.id);
        }
        // Take the foremost visible heading on the page
        const first = ids.find((id) => seen.has(id));
        if (first) setActive(first);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);

  return (
    <nav className="pg-toc" aria-label={t("toc.title")}>
      <span className="pg-toc-title">{t("toc.title")}</span>
      {page.toc.map((group) => (
        <div key={group.group} className="pg-toc-group">
          <span className="pg-toc-group-label">{groupLabel(group.group)}</span>
          {group.items.map((id) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>
              {pt(`${id}.title`)}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------ Footer: previous / next page */

export function PageFooter({ page }: { page: PageDef }) {
  const t = useSiteT();
  const lang = useLang();
  // The guides, then the components: one sequence, so the last guide leads to the first component
  const all = [...GUIDES, ...PAGES];
  const i = all.indexOf(page);
  const prev = all[i - 1];
  const next = all[i + 1];
  return (
    <footer className="pg-pager">
      {prev ? (
        <PgLink to={prev.path} className="pg-pager-link pg-pager-prev">
          <span className="pg-pager-dir">← {t("pager.previous")}</span>
          <span className="pg-pager-name">{pageLabel(prev, lang)}</span>
        </PgLink>
      ) : (
        <span />
      )}
      {next ? (
        <PgLink to={next.path} className="pg-pager-link pg-pager-next">
          <span className="pg-pager-dir">{t("pager.next")} →</span>
          <span className="pg-pager-name">{pageLabel(next, lang)}</span>
        </PgLink>
      ) : null}
    </footer>
  );
}

/* --------------------------------------------------------------- Command palette */

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const t = useSiteT();
  const lang = useLang();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const list = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const all = [
    { path: "/", label: t("nav.overview"), group: t("nav.home") },
    ...[...GUIDES, ...PAGES].map((p) => ({
      ...p,
      label: pageLabel(p, lang),
      group: t(`groups.${p.group}`),
    })),
  ];
  const results = q
    ? all.filter((p) => p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q))
    : all;

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);
  useEffect(() => {
    list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [index, query]);

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content size="md" closeButton={false} data-palette="">
        <Dialog.Title data-pg-sr="">{t("search.title")}</Dialog.Title>
        <div className="pg-palette-input">
          <SearchIcon />
          <input
            autoFocus
            type="text"
            value={query}
            placeholder={t("search.placeholder")}
            aria-label={t("search.title")}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && results[index]) {
                e.preventDefault();
                go(results[index].path);
              }
            }}
          />
          <kbd className="pg-kbd">Esc</kbd>
        </div>
        <div ref={list} className="pg-palette-list" role="listbox">
          {results.length === 0 ? (
            <p className="pg-palette-empty">{t("search.empty", { q: query })}</p>
          ) : (
            results.map((p, i) => (
              <button
                key={p.path}
                type="button"
                role="option"
                aria-selected={i === index}
                data-active={i === index}
                className="pg-palette-item"
                onMouseMove={() => setIndex(i)}
                onClick={() => go(p.path)}
              >
                <span>{p.label}</span>
                <span className="pg-palette-group">
                  {"origin" in p && p.origin ? <OriginBadge origin={p.origin} /> : null} {p.group}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="pg-palette-foot">
          <span>
            <kbd className="pg-kbd">↑</kbd>
            <kbd className="pg-kbd">↓</kbd> {t("search.move")}
          </span>
          <span>
            <kbd className="pg-kbd">↵</kbd> {t("search.open")}
          </span>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

/* -------------------------------------------------- Appearance panel (theme style / mode / color theme...) */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pg-panel-section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

export function CustomizeDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const s = useSettings();
  const t = useSiteT();
  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="right">
      <Drawer.Content size="md">
        <Drawer.Title>{t("customize.title")}</Drawer.Title>
        <Drawer.Description>{t("customize.description")}</Drawer.Description>
        <Drawer.Body>
          <div className="pg-panel">
            <Section title={t("customize.themeStyle")}>
              <div
                className="pg-skin-list"
                role="radiogroup"
                aria-label={t("customize.themeStyle")}
              >
                {THEME_STYLES.map((k: ThemeStyle) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={s.themeStyle === k}
                    className="pg-skin-option"
                    title={t(`themeStyles.${k}`)}
                    onClick={() => s.set.themeStyle(k)}
                  >
                    <SkinIcon themeStyle={k} />
                    <strong className="pg-skin-name">{THEME_STYLE_INFO[k].name}</strong>
                    <span className="pg-skin-check" aria-hidden="true">
                      <CheckIcon />
                    </span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title={t("customize.mode")}>
              <Segmented
                aria-label={t("customize.mode")}
                fullWidth
                value={s.mode}
                onValueChange={(v) => s.set.mode(v as Mode)}
                options={MODES.map((m) => ({
                  value: m,
                  label: t(`customize.${m}`),
                  icon: m === "light" ? <SunIcon /> : <MoonIcon />,
                }))}
              />
            </Section>

            <Section title={t("customize.language")}>
              <Segmented
                aria-label={t("customize.language")}
                fullWidth
                value={s.lang}
                onValueChange={(v) => s.set.lang(v as Lang)}
                options={LANGS.map((l) => ({
                  value: l,
                  label: l === "en" ? "English" : "简体中文",
                }))}
              />
            </Section>

            <Section title={t("customize.palette")}>
              <div className="pg-theme-list" role="radiogroup" aria-label={t("customize.palette")}>
                {THEME_COLORS.map((t: ThemeColor) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={s.themeColor === t}
                    className="pg-theme-option"
                    onClick={() => s.set.themeColor(t)}
                  >
                    <span className="pg-theme-dot" style={{ background: THEME_DOT[t] }} />
                    <span className="pg-theme-name">{t}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title={t("customize.codeTheme")}>
              <div
                className="pg-theme-list"
                role="radiogroup"
                aria-label={t("customize.codeTheme")}
              >
                {CODE_THEMES.map((c: CodeTheme) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={s.codeTheme === c}
                    className="pg-theme-option"
                    onClick={() => s.set.codeTheme(c)}
                  >
                    <span
                      className="pg-theme-dot pg-code-dot"
                      data-code-theme={c === "site" ? undefined : c}
                    />
                    <span className="pg-theme-name">
                      {c === "site" ? t("customize.codeThemeSite") : CODE_THEME_NAMES[c]}
                    </span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title={t("customize.shape")}>
              <div className="pg-panel-card">
                <Switch
                  checked={s.compact === "on"}
                  onCheckedChange={(c) => s.set.compact(c ? "on" : "off")}
                >
                  {t("customize.compact")}
                </Switch>
                <Slider
                  label={t("customize.density")}
                  showValue
                  min={0.8}
                  max={1.3}
                  step={0.05}
                  value={s.density}
                  onValueChange={(v) => s.set.density(Array.isArray(v) ? v[0] : (v as number))}
                />
                <Slider
                  label={t(s.radius === null ? "customize.radiusDefault" : "customize.radius")}
                  showValue
                  min={0}
                  max={1.5}
                  step={0.125}
                  value={s.radius ?? 0.5}
                  onValueChange={(v) => s.set.radius(Array.isArray(v) ? v[0] : (v as number))}
                />
              </div>
            </Section>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="ghost" onClick={() => s.set.reset()}>
            {t("customize.reset")}
          </Button>
          <Drawer.Close render={<Button />}>{t("customize.done")}</Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

export function MobileNav({
  open,
  onOpenChange,
  current,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: string;
}) {
  const t = useSiteT();
  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="left">
      <Drawer.Content size="sm">
        <Drawer.Title>{t("nav.components")}</Drawer.Title>
        <Drawer.Body>
          <Sidebar current={current} onNavigate={() => onOpenChange(false)} />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  );
}
