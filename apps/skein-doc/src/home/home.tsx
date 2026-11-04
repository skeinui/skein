import { Button, Checkbox, Input, Progress, Switch, Tag } from "@skeinui/ui";
import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { OriginBadge } from "@/site/chrome.tsx";
import { ArrowIcon } from "@/doc/icons.tsx";
import { rich, useSiteT } from "@/site/i18n.tsx";
import { PgLink, useNavigate } from "@/site/nav.tsx";
import { PAGE_GROUPS, PAGES } from "@/registry.ts";
import { GITHUB_URL, LICENSE_URL, NPM_URL } from "@/site/links.ts";
import { THEME_STYLES, THEME_STYLE_INFO, useSettings, type ThemeStyle } from "@/site/settings.ts";

/** Demo content inside the card, in the card's own theme style (ThemeIsland). */
function SkinCardContent() {
  return (
    <div className="pg-skincard-body">
      <Input aria-label="email" placeholder="you@example.com" fullWidth />
      <div className="pg-skincard-row">
        <Button>Continue</Button>
        <Button variant="outline">Cancel</Button>
      </div>
      <div className="pg-skincard-row">
        <Checkbox defaultChecked>Remember me</Checkbox>
      </div>
      <div className="pg-skincard-row">
        <Switch defaultChecked>Notifications</Switch>
      </div>
      <div className="pg-skincard-row">
        <Tag color="primary">react</Tag>
        <Tag color="success" variant="outline">
          stable
        </Tag>
        <Tag color="warning" variant="solid">
          beta
        </Tag>
      </div>
      <Progress value={64} aria-label="demo" />
    </div>
  );
}

/**
 * The theme cards of the prerendered HTML (scripts/prerender.ts), taken before React replaces the page: their shadow
 * roots have their stylesheet applied already. ThemeIsland reuses them; a new one would show unstyled until its
 * stylesheet loads.
 */
const prerendered = new Map(
  [...document.querySelectorAll<HTMLElement>("[data-island]")].map((el) => [el.dataset.island, el]),
);

/**
 * Content in a theme style of its own, whatever the site's is. A wrapper with `data-theme-style` isn't enough: theme
 * selectors are descendant selectors (`[data-theme-style="x"] [data-slot=…]`), so the <html>'s theme style matches the
 * content too, with the same specificity, and the stylesheet order decides. A shadow root keeps the outer rules out:
 * it gets the page's own stylesheets (the same cached files; in dev, copies of Vite's <style> tags, so a CSS edit shows
 * in the cards after a reload) and a container carrying the theme style and mode.
 * The root is serializable, so the prerendered HTML has the content, styled, before any script.
 */
function ThemeIsland({
  themeStyle,
  mode,
  children,
}: {
  themeStyle: ThemeStyle;
  mode: string;
  children: ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    let island = prerendered.get(themeStyle);
    prerendered.delete(themeStyle);
    let container: HTMLElement;
    if (island?.shadowRoot?.lastElementChild instanceof HTMLElement) {
      // The static content goes; React's (the same) fills the container in this commit, before the next paint
      container = island.shadowRoot.lastElementChild;
      container.replaceChildren();
    } else {
      island = document.createElement("div");
      island.dataset.island = themeStyle;
      const shadow = island.attachShadow({ mode: "open", serializable: true });
      const sheets = [...document.head.querySelectorAll('link[rel="stylesheet"], style')].map(
        (n) => n.cloneNode(true) as HTMLElement,
      );
      container = document.createElement("div");
      container.style.height = "100%";
      // Hidden until its stylesheet files are in, so it never shows unstyled
      const links = sheets.filter((n): n is HTMLLinkElement => n instanceof HTMLLinkElement);
      let pending = links.length;
      if (pending) container.style.visibility = "hidden";
      for (const link of links) {
        const done = () => {
          if (--pending === 0) container.style.visibility = "";
        };
        link.addEventListener("load", done, { once: true });
        link.addEventListener("error", done, { once: true });
      }
      shadow.replaceChildren(...sheets, container);
    }
    host.current!.append(island);
    setMount(container);
    return () => island.remove();
  }, [themeStyle]);
  return (
    <div ref={host} className="pg-skincard-island">
      {mount
        ? createPortal(
            <div className="pg-skincard-theme" data-theme-style={themeStyle} data-mode={mode}>
              {children}
            </div>,
            mount,
          )
        : null}
    </div>
  );
}

function SkinCard({ themeStyle }: { themeStyle: ThemeStyle }) {
  const s = useSettings();
  const t = useSiteT();
  const active = s.themeStyle === themeStyle;
  return (
    <div className="pg-skincard" data-active={active}>
      <div className="pg-skincard-head">
        <div>
          <strong>{THEME_STYLE_INFO[themeStyle].name}</strong>
          <span>{`data-theme-style="${themeStyle}"`}</span>
        </div>
        <button
          type="button"
          className="pg-skincard-use"
          onClick={() => s.set.themeStyle(themeStyle)}
        >
          {t(active ? "home.lab.inUse" : "home.lab.use")}
        </button>
      </div>
      <ThemeIsland themeStyle={themeStyle} mode={s.mode}>
        <SkinCardContent />
      </ThemeIsland>
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const s = useSettings();
  const t = useSiteT();
  const [group, setGroup] = useState<string>("all");
  const shown = PAGES.filter((p) => group === "all" || p.group === group);

  return (
    <div className="pg-home">
      <section className="pg-hero">
        <div className="pg-hero-copy">
          <p className="pg-eyebrow">
            <span>Base UI</span>
            <i>×</i>
            <span>{t("home.hero.styles")}</span>
            <i>×</i>
            <span>{t("home.hero.themes")}</span>
          </p>
          <h1>
            {t("home.hero.title")}
            <br />
            <em>{t("home.hero.subtitle")}</em>
          </h1>
          <p className="pg-hero-lead">{rich(t("home.hero.lead"))}</p>
          <div className="pg-hero-cta">
            <Button size="lg" endContent={<ArrowIcon />} onClick={() => navigate("/installation")}>
              {t("home.hero.start")}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/button")}>
              {t("home.hero.browse")}
            </Button>
          </div>
        </div>
        <dl className="pg-stats">
          <div>
            <dt>{t("home.stats.components")}</dt>
            <dd>{PAGES.length}</dd>
            <p className="pg-stats-note">
              <span>
                {PAGES.filter((p) => p.origin === "Base UI").length} {t("origin.Base UI")}
              </span>
              <span>
                {PAGES.filter((p) => p.origin === "Skein").length} {t("origin.Skein")}
              </span>
            </p>
          </div>
          <div>
            <dt>{t("home.stats.styles")}</dt>
            <dd>{THEME_STYLES.length}</dd>
          </div>
          <div>
            <dt>{t("home.stats.colors")}</dt>
            <dd>5</dd>
          </div>
          <div>
            <dt>{t("home.stats.modes")}</dt>
            <dd>2</dd>
          </div>
        </dl>
      </section>

      <section className="pg-home-section">
        <header className="pg-section-head">
          <p className="pg-eyebrow pg-eyebrow--plain">{t("home.lab.eyebrow")}</p>
          <h2>{t("home.lab.title")}</h2>
          <p>{rich(t("home.lab.lead"))}</p>
        </header>
        <div className="pg-skinlab">
          {THEME_STYLES.map((k) => (
            <SkinCard key={k} themeStyle={k} />
          ))}
        </div>
      </section>

      <section className="pg-home-section">
        <header className="pg-section-head">
          <p className="pg-eyebrow pg-eyebrow--plain">{t("home.principles.eyebrow")}</p>
          <h2>{t("home.principles.title")}</h2>
        </header>
        <div className="pg-principles">
          {(["behaviour", "style", "palette"] as const).map((key, i) => (
            <article key={key}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{t(`home.principles.${key}.title`)}</h3>
              <p>{rich(t(`home.principles.${key}.body`))}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pg-home-section">
        <header className="pg-section-head">
          <p className="pg-eyebrow pg-eyebrow--plain">{t("home.index.eyebrow")}</p>
          <h2>{t("home.index.title")}</h2>
        </header>
        <div className="pg-chips" role="tablist" aria-label={t("home.index.filter")}>
          {["all", ...PAGE_GROUPS].map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={group === g}
              onClick={() => setGroup(g)}
            >
              {t(`groups.${g}`)}
              <span>{g === "all" ? PAGES.length : PAGES.filter((p) => p.group === g).length}</span>
            </button>
          ))}
        </div>
        <div className="pg-index">
          {shown.map((p, i) => (
            <PgLink key={p.path} to={p.path} className="pg-index-card">
              <span className="pg-index-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="pg-index-name">{p.label}</span>
              <span className="pg-index-group">
                <OriginBadge origin={p.origin} /> {t(`groups.${p.group}`)}
              </span>
            </PgLink>
          ))}
        </div>
      </section>

      <footer className="pg-home-foot">
        <span>
          {t("home.foot.current")} <b>{s.themeStyle}</b> · <b>{s.mode}</b>
          {s.themeColor !== "none" ? (
            <>
              {" "}
              · <b>{s.themeColor}</b>
            </>
          ) : null}
        </span>
        <span>
          <a href={LICENSE_URL} target="_blank" rel="noreferrer">
            {t("home.foot.license")}
          </a>{" "}
          · {t("home.foot.copyright")} ·{" "}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>{" "}
          ·{" "}
          <a href={NPM_URL} target="_blank" rel="noreferrer">
            npm
          </a>{" "}
          · {t("home.foot.built")}
        </span>
      </footer>
    </div>
  );
}
