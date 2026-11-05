import antd from "@skeinui/themes/antd/index.css?url";
import skein from "@skeinui/themes/default/index.css?url";
import heroui from "@skeinui/themes/heroui/index.css?url";
import shadcn from "@skeinui/themes/shadcn/index.css?url";
import type { ThemeStyle } from "@/site/settings.ts";

/**
 * Each theme style is a stylesheet of its own (about 550 KB each, most of the site's CSS): a page loads only the one
 * it shows, the home page's theme cards each load theirs (ThemeIsland), switching loads the next one first.
 */
export const THEME_STYLE_CSS: Record<ThemeStyle, string> = { antd, default: skein, heroui, shadcn };

const ready = new Map<ThemeStyle, Promise<void>>();

/**
 * Puts the theme style's stylesheet in <head> (once) and resolves when it applies. The prerendered HTML already has
 * the page's (scripts/prerender.ts keeps the link), so that one resolves at once.
 */
export function loadThemeStyle(style: ThemeStyle): Promise<void> {
  let loading = ready.get(style);
  if (!loading) {
    const href = THEME_STYLE_CSS[style];
    let link = document.head.querySelector<HTMLLinkElement>(
      `link[data-skein-theme-css="${style}"]`,
    );
    loading =
      link?.sheet || link?.dataset.loaded !== undefined
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            if (!link) {
              link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = href;
              link.dataset.skeinThemeCss = style;
              document.head.append(link);
            }
            const done = () => {
              link!.dataset.loaded = "";
              resolve();
            };
            // A failed load still resolves: the page shows (unstyled) rather than never
            link.addEventListener("load", done, { once: true });
            link.addEventListener("error", done, { once: true });
          });
    ready.set(style, loading);
  }
  return loading;
}
