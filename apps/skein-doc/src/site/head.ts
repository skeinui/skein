import { withLang } from "@/site/i18n.tsx";
import { SITE_URL } from "@/site/links.ts";
import type { Lang } from "@/site/settings.ts";

/** A message's inline markup (`code`, **bold**, <kbd>, [text](/path)) as plain text, for meta descriptions. */
export function plain(text: string) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<\/?kbd>/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function tag(selector: string, create: () => HTMLElement) {
  return document.head.querySelector<HTMLElement>(selector) ?? document.head.appendChild(create());
}

function meta(attr: "name" | "property", key: string, content: string) {
  const el = tag(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute(attr, key);
    return m;
  });
  el.setAttribute("content", content);
}

function link(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  const el = tag(selector, () => {
    const l = document.createElement("link");
    l.rel = rel;
    if (hreflang) l.hreflang = hreflang;
    return l;
  });
  el.setAttribute("href", href);
}

/**
 * What search engines and link previews read: title, description, the canonical address, the page in the other
 * language (hreflang), and the Open Graph / Twitter card. Written on every page change; the prerendered HTML
 * (scripts/prerender.ts) carries the same tags.
 */
export function setHead({
  title,
  description,
  path,
  lang,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  lang: Lang;
  /** A page that isn't one (the 404 page): kept out of search results, with no canonical or other-language links. */
  noindex?: boolean;
}) {
  const url = SITE_URL + withLang(path, lang);
  document.title = title;
  document.documentElement.lang = lang;
  meta("name", "description", description);
  if (noindex) {
    meta("name", "robots", "noindex");
    for (const el of document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"]'))
      el.remove();
  } else {
    document.head.querySelector('meta[name="robots"]')?.remove();
    link("canonical", url);
    link("alternate", SITE_URL + withLang(path, "en"), "en");
    link("alternate", SITE_URL + withLang(path, "zh-CN"), "zh-CN");
    link("alternate", SITE_URL + withLang(path, "en"), "x-default");
  }
  meta("property", "og:type", "website");
  meta("property", "og:site_name", "Skein UI");
  meta("property", "og:title", title);
  meta("property", "og:description", description);
  meta("property", "og:url", url);
  meta("property", "og:image", `${SITE_URL}/og.png`);
  meta("property", "og:locale", lang === "zh-CN" ? "zh_CN" : "en_US");
  meta("name", "twitter:card", "summary_large_image");
  meta("name", "twitter:title", title);
  meta("name", "twitter:description", description);
  meta("name", "twitter:image", `${SITE_URL}/og.png`);
}
