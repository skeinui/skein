import type { ComponentType } from "react";
import type { Messages } from "@/site/i18n.tsx";
import type { Lang } from "@/site/settings.ts";

/**
 * Component origin: Base UI = behavior comes from the same-named Base UI component; Original = Base UI doesn't have it,
 * we wrote the interaction ourselves or composed it from existing components (behavior and accessibility have to be maintained by us).
 */
export type PageOrigin = "Base UI" | "Original";

/**
 * A page's `meta.ts`: what the navigation needs before the page itself is loaded. The page lives next to it in
 * `index.tsx` (its default export), its texts in `locales/en.json` / `zh.json`.
 */
export interface PageMeta {
  /** The component's name; not translated. */
  label: string;
  origin: PageOrigin;
  /**
   * The @skeinui/ui components this page documents, when that isn't just the one named like its directory
   * (`radio-group` documents Radio and RadioGroup). packages/ui/scripts/manifest.ts reads it.
   */
  components?: string[];
  /**
   * The right-hand table of contents. A group is a key of the site's `toc.*` messages (examples, beyond,
   * reference); an item is an example id, labelled by the page's `<id>.title` message.
   */
  toc: { group: string; items: string[] }[];
}

/** Sidebar groups, in order: `pages/<group>/<page>/`. Their names are in the site's locales (`groups.<id>`). */
export const PAGE_GROUPS = [
  "buttons",
  "forms",
  "overlays",
  "navigation",
  "display",
  "layout",
  "feedback",
  "data",
  "ai-chat",
] as const;
export type PageGroup = (typeof PAGE_GROUPS)[number];

/**
 * A guide's `meta.ts` (`guides/<slug>/`): the docs that aren't about one component (installation, theming, the
 * CLI…). Its sidebar label is the site's `guides.<slug>` message.
 */
export interface GuideMeta {
  /** Place in the sidebar's first group. */
  order: number;
  toc: PageMeta["toc"];
}

export interface PageDef extends Omit<PageMeta, "origin"> {
  /** `/button`: the same for every language (the Chinese site adds `/zh` in front). */
  path: string;
  group: PageGroup | "guides";
  /** Components only; a guide has none. */
  origin?: PageOrigin;
  load: () => Promise<{ default: ComponentType }>;
}

const metas = import.meta.glob<PageMeta>("./pages/*/*/meta.ts", { eager: true, import: "default" });
// Each page is its own chunk, loaded when it is opened
const components = import.meta.glob<{ default: ComponentType }>("./pages/*/*/index.tsx");

/** Sorted first by group order, then by name: the sidebar and previous / next page both use this order. */
export const PAGES: (PageDef & { origin: PageOrigin })[] = Object.entries(metas)
  .map(([file, meta]) => {
    const [, , group, slug] = file.split("/");
    return {
      ...meta,
      path: `/${slug}`,
      group: group as PageGroup,
      load: components[file.replace(/meta\.ts$/, "index.tsx")]!,
    };
  })
  .sort(
    (a, b) =>
      PAGE_GROUPS.indexOf(a.group as PageGroup) - PAGE_GROUPS.indexOf(b.group as PageGroup) ||
      a.label.localeCompare(b.label),
  );

const guideMetas = import.meta.glob<GuideMeta>("./guides/*/meta.ts", {
  eager: true,
  import: "default",
});
const guideComponents = import.meta.glob<{ default: ComponentType }>("./guides/*/index.tsx");

/** The sidebar's first group, before the components; not counted among them. */
export const GUIDES: PageDef[] = Object.entries(guideMetas)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([file, meta]) => {
    const [, , slug] = file.split("/");
    return {
      label: slug,
      toc: meta.toc,
      path: `/${slug}`,
      group: "guides",
      load: guideComponents[file.replace(/meta\.ts$/, "index.tsx")]!,
    };
  });

const locales = import.meta.glob<Messages>(
  ["./pages/*/*/locales/*.json", "./guides/*/locales/*.json"],
  { import: "default" },
);

/** The page's texts in `lang` (`locales/en.json` / `zh.json`, loaded with the page). */
export function loadMessages(page: PageDef, lang: Lang): Promise<Messages> {
  const dir =
    page.group === "guides" ? `./guides${page.path}` : `./pages/${page.group}${page.path}`;
  return (
    locales[`${dir}/locales/${lang === "zh-CN" ? "zh" : "en"}.json`]?.() ?? Promise.resolve({})
  );
}

export function findPage(path: string) {
  return [...GUIDES, ...PAGES].find((page) => page.path === path) ?? null;
}
