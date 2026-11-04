// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Sidebar, SideMenu, useSidebar } from "../src/index.ts";
import type { SidebarProps, SidebarProviderProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.unstubAllGlobals();
});

function setMobile(mobile: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: mobile && query.includes("max-width"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

function Probe() {
  const s = useSidebar();
  return createElement(
    "output",
    { "data-probe": "" },
    `${s.state}|${s.open}|${s.isMobile}|${s.openMobile}`,
  );
}

function App(props: { provider?: SidebarProviderProps; sidebar?: SidebarProps }) {
  return createElement(
    Sidebar.Provider,
    props.provider,
    createElement(
      Sidebar,
      props.sidebar,
      createElement(Sidebar.Header, null, "Header"),
      createElement(
        Sidebar.Content,
        null,
        createElement(SideMenu, {
          "aria-label": "Main",
          items: [
            { key: "home", label: "Home", icon: createElement("i", null, "H") },
            { key: "docs", label: "Docs", icon: createElement("i", null, "D") },
          ],
        }),
      ),
      createElement(Sidebar.Footer, null, "Footer"),
      createElement(Sidebar.Rail),
    ),
    createElement(
      Sidebar.Inset,
      null,
      createElement(Sidebar.Trigger),
      createElement(Probe),
      "Main content",
    ),
  );
}

async function mount(props: Parameters<typeof App>[0] = {}) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(createElement(App, props)));
  return host;
}
const q = (s: string) => host!.querySelector<HTMLElement>(s);
const probe = () => q("[data-probe]")!.textContent;
const click = (el: Element) => act(async () => (el as HTMLElement).click());

describe("<Sidebar />", () => {
  test("SSR has no class / style; structure: wrapper > sidebar (gap + panel) + main content", () => {
    const html = ssr(createElement(App));
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    for (const slot of [
      "sidebar-provider",
      "sidebar-gap",
      "sidebar-container",
      "sidebar-inner",
      "sidebar-header",
      "sidebar-content",
      "sidebar-footer",
      "sidebar-inset",
      "sidebar-trigger",
      "sidebar-rail",
    ]) {
      expect(html, slot).toContain(`data-slot="${slot}"`);
    }
  });

  test("defaults: expanded, left, sidebar variant, offcanvas; the panel is a named aside", async () => {
    await mount();
    const sidebar = q('[data-slot="sidebar"]')!;
    expect(sidebar.dataset.state).toBe("expanded");
    expect(sidebar.dataset.variant).toBe("sidebar");
    expect(sidebar.dataset.side).toBe("left");
    expect(sidebar.hasAttribute("data-collapsible")).toBe(false);
    const inner = q('[data-slot="sidebar-inner"]')!;
    expect(inner.tagName).toBe("ASIDE");
    expect(inner.getAttribute("aria-label")).toBe("Sidebar");
    expect(q('[data-slot="sidebar-provider"]')!.dataset.width).toBe("md");
  });

  test("variant / side / collapsible / width / theme become data attributes", async () => {
    await mount({
      provider: { width: "lg" },
      sidebar: { variant: "floating", side: "right", collapsible: "icon", theme: "dark" },
    });
    const sidebar = q('[data-slot="sidebar"]')!;
    expect(sidebar.dataset.variant).toBe("floating");
    expect(sidebar.dataset.side).toBe("right");
    expect(q('[data-slot="sidebar-inner"]')!.dataset.theme).toBe("dark");
    expect(q('[data-slot="sidebar-provider"]')!.dataset.width).toBe("lg");
  });

  test("Trigger toggles: aria-expanded, state; a collapsed offcanvas panel is inert, a collapsed icon sidebar collapses SideMenu", async () => {
    await mount();
    const trigger = q('[data-slot="sidebar-trigger"]')!;
    expect(trigger.getAttribute("aria-label")).toBe("Toggle sidebar");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(q('[data-slot="sidebar"]')!.dataset.collapsible).toBe("offcanvas");
    expect(q('[data-slot="sidebar-container"]')!.hasAttribute("inert")).toBe(true);
    expect(probe()).toBe("collapsed|false|false|false");
    await click(trigger);
    expect(q('[data-slot="sidebar-container"]')!.hasAttribute("inert")).toBe(false);
  });

  test("collapsible=icon: collapsing turns the menu into an icon rail (panel not inert), expanding restores it", async () => {
    await mount({ provider: { defaultOpen: false }, sidebar: { collapsible: "icon" } });
    expect(q('[data-slot="sidebar"]')!.dataset.collapsible).toBe("icon");
    expect(q('[data-slot="sidebar-container"]')!.hasAttribute("inert")).toBe(false);
    expect(q('[data-slot="sidemenu"]')!.hasAttribute("data-collapsed")).toBe(true);
    await click(q('[data-slot="sidebar-trigger"]')!);
    expect(q('[data-slot="sidemenu"]')!.hasAttribute("data-collapsed")).toBe(false);
  });

  test("collapsible=none: no gap or container, can't collapse", async () => {
    await mount({ sidebar: { collapsible: "none" } });
    expect(q('[data-slot="sidebar-gap"]')).toBeNull();
    expect(q('[data-slot="sidebar-container"]')).toBeNull();
    expect(q('[data-slot="sidebar"]')!.dataset.collapsible).toBe("none");
    await click(q('[data-slot="sidebar-trigger"]')!);
    expect(q('[data-slot="sidebar"]')!.dataset.state).toBe("expanded");
  });

  test("controlled: open decides, onOpenChange gets the new value", async () => {
    const onOpenChange = vi.fn();
    await mount({ provider: { open: true, onOpenChange } });
    await click(q('[data-slot="sidebar-trigger"]')!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(q('[data-slot="sidebar"]')!.dataset.state).toBe("expanded");
  });

  test("Ctrl / ⌘ + B toggles; the key can be changed or disabled", async () => {
    await mount();
    const press = (key: string, init: KeyboardEventInit = { ctrlKey: true }) =>
      act(async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key, cancelable: true, ...init }));
      });
    await press("b");
    expect(probe()).toBe("collapsed|false|false|false");
    await press("b", { metaKey: true });
    expect(probe()).toBe("expanded|true|false|false");
    await press("b", {});
    expect(probe()).toBe("expanded|true|false|false");
    await act(async () => root!.render(createElement(App, { provider: { shortcut: "k" } })));
    await press("b");
    expect(probe()).toBe("expanded|true|false|false");
    await press("k");
    expect(probe()).toBe("collapsed|false|false|false");
    await act(async () => root!.render(createElement(App, { provider: { shortcut: false } })));
    await press("k");
    expect(probe()).toBe("collapsed|false|false|false");
  });

  test("clicking Rail toggles, named Toggle sidebar by default, not in the Tab order", async () => {
    await mount();
    const rail = q('[data-slot="sidebar-rail"]')!;
    expect(rail.getAttribute("aria-label")).toBe("Toggle sidebar");
    expect(rail.getAttribute("tabindex")).toBe("-1");
    await click(rail);
    expect(q('[data-slot="sidebar"]')!.dataset.state).toBe("collapsed");
  });

  test("narrow screens (< md): the sidebar becomes a drawer toggled by Trigger; the desktop state is unchanged", async () => {
    setMobile(true);
    await mount();
    expect(probe()).toBe("expanded|true|true|false");
    expect(q('[data-slot="sidebar"]')).toBeNull();
    const trigger = q('[data-slot="sidebar-trigger"]')!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await click(trigger);
    expect(probe()).toBe("expanded|true|true|true");
    const drawer = document.querySelector<HTMLElement>('[data-slot="drawer"]')!;
    expect(drawer).not.toBeNull();
    expect(drawer.getAttribute("aria-label")).toBe("Sidebar");
    const inner = drawer.querySelector<HTMLElement>('[data-slot="sidebar-inner"]')!;
    expect(inner.hasAttribute("data-mobile")).toBe(true);
    expect(inner.querySelector('[data-slot="sidemenu"]')?.hasAttribute("data-collapsed")).toBe(
      false,
    );
  });

  test("Sidebar.Label is a span with a slot, no class / style, its text stays in the DOM (only visually hidden when collapsed)", async () => {
    const html = ssr(
      createElement(
        Sidebar.Provider,
        { defaultOpen: false },
        createElement(
          Sidebar,
          { collapsible: "icon" },
          createElement(Sidebar.Header, null, createElement(Sidebar.Label, null, "Skein")),
        ),
      ),
    );
    expect(html).toContain('<span data-slot="sidebar-label">Skein</span>');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("useSidebar throws outside the Provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => ssr(createElement(Probe))).toThrow(/Sidebar.Provider/);
    spy.mockRestore();
  });
});
