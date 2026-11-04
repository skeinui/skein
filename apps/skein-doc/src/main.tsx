import "@fontsource-variable/geist";
// Color themes, densities and code themes are small and loaded at once (scoped by data-* attributes, switching only
// changes attributes); the theme styles are a stylesheet each, loaded when shown (site/theme-styles.ts)
import "@skeinui/themes/color/purple.css";
import "@skeinui/themes/color/green.css";
import "@skeinui/themes/color/geekblue.css";
import "@skeinui/themes/color/volcano.css";
import "@skeinui/themes/color/contrast.css";
import "@skeinui/themes/code/index.css";
import "@skeinui/themes/density/compact.css";
import "@/site/site.css";
import { StrictMode } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App, type OpenPage } from "@/site/App.tsx";
import { splitPath } from "@/site/i18n.tsx";
import { findPage, loadMessages } from "@/registry.ts";
import { initialThemeStyle } from "@/site/settings.ts";
import { loadThemeStyle } from "@/site/theme-styles.ts";

/**
 * The first URL's page, code and texts, before React mounts: the prerendered HTML (scripts/prerender.ts) stays on
 * screen until then and is replaced by the same content, with no empty frame in between.
 */
async function firstPage(): Promise<OpenPage | null> {
  const { lang, path } = splitPath(window.location.pathname);
  const page = findPage(path);
  if (!page) return null;
  const [module, messages] = await Promise.all([page.load(), loadMessages(page, lang)]);
  return { page, lang, Component: module.default, messages };
}

// The admin layout frame is a page of its own (opened in an iframe or by the test scripts): loaded only on its path
const view: Promise<ReactNode> =
  window.location.pathname === "/__admin-layout"
    ? import("@/frames/admin-layout.tsx").then(({ AdminLayoutFull }) => <AdminLayoutFull />)
    : firstPage().then((initial) => <App initial={initial} />);

// The first theme style's stylesheet is in before the first render (in the prerendered HTML it is already)
void Promise.all([view, loadThemeStyle(initialThemeStyle())]).then(([node]) =>
  createRoot(document.getElementById("root")!).render(<StrictMode>{node}</StrictMode>),
);
