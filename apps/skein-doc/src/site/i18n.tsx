import { createContext, Fragment, useContext } from "react";
import type { ReactNode } from "react";
import type { PageDef } from "@/registry.ts";
import { PgLink } from "@/site/nav.tsx";
import type { Lang } from "@/site/settings.ts";
import en from "@/site/locales/en.json";
import zh from "@/site/locales/zh.json";

export interface Messages {
  [key: string]: string | Messages;
}

/** The URL says the language: `/button` is English, `/zh/button` Chinese. */
const ZH_PREFIX = "/zh";

export function splitPath(pathname: string): { lang: Lang; path: string } {
  if (pathname === ZH_PREFIX || pathname.startsWith(`${ZH_PREFIX}/`))
    return { lang: "zh-CN", path: pathname.slice(ZH_PREFIX.length) || "/" };
  return { lang: "en", path: pathname };
}

export function withLang(path: string, lang: Lang) {
  if (lang === "en") return path;
  return path === "/" ? ZH_PREFIX : ZH_PREFIX + path;
}

/** `a.b.c` in nested messages; undefined when missing or not a string. */
function lookup(messages: Messages, key: string): string | undefined {
  let value: string | Messages | undefined = messages;
  for (const part of key.split(".")) {
    if (typeof value !== "object") return undefined;
    value = value[part];
  }
  return typeof value === "string" ? value : undefined;
}

/** `{name}` placeholders. */
function fill(text: string, vars?: Record<string, string | number>) {
  return vars ? text.replace(/\{(\w+)\}/g, (all, name) => String(vars[name] ?? all)) : text;
}

/**
 * The inline markup messages may use: `code`, **bold**, <kbd>Enter</kbd> (Base UI's prop descriptions use it) and
 * [text](/button) (an in-site link, kept in the current language) or [text](https://…). Anything else is plain text.
 */
export function rich(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|<kbd>[^<]+<\/kbd>|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1)
      return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <b key={i}>{part.slice(2, -2)}</b>;
    if (part.startsWith("<kbd>")) return <kbd key={i}>{part.slice(5, -6)}</kbd>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, to] = link;
      return to.startsWith("/") ? (
        <PgLink key={i} to={to}>
          {label}
        </PgLink>
      ) : (
        <a key={i} href={to} target="_blank" rel="noreferrer">
          {label}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export const LangContext = createContext<Lang>("en");
export const useLang = () => useContext(LangContext);

const SITE: Record<Lang, Messages> = { en, "zh-CN": zh };

/** A site message outside the React tree (the document head, set from App). */
export function siteText(lang: Lang, key: string) {
  return lookup(SITE[lang], key) ?? lookup(SITE.en, key) ?? key;
}

/** A page's name: a component's is its own (not translated), a guide's is the site's `guides.<slug>` message. */
export function pageLabel(page: PageDef, lang: Lang) {
  if (page.group !== "guides") return page.label;
  const key = `guides.${page.label}`;
  return lookup(SITE[lang], key) ?? lookup(SITE.en, key) ?? page.label;
}

/** The site's own texts (`site/locales/*.json`): navigation, home page, the parts every docs page shares. */
export function useSiteT() {
  const lang = useLang();
  return (key: string, vars?: Record<string, string | number>) =>
    fill(lookup(SITE[lang], key) ?? lookup(SITE.en, key) ?? key, vars);
}

/** The open page's texts (`pages/<group>/<page>/locales/*.json`), loaded with the page. */
export const PageMessagesContext = createContext<Messages>({});

export function usePageT() {
  const messages = useContext(PageMessagesContext);
  const t = (key: string, vars?: Record<string, string | number>) =>
    fill(lookup(messages, key) ?? key, vars);
  return Object.assign(t, {
    has: (key: string) => lookup(messages, key) !== undefined,
    rich: (key: string, vars?: Record<string, string | number>) => rich(t(key, vars)),
  });
}
