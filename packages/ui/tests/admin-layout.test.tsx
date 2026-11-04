// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { AdminLayout, ConfigProvider } from "../src/index.ts";
import type { AdminLayoutProps, AdminNavItem } from "../src/index.ts";
import { zhCN } from "../src/locales/zh-CN.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
});

const ITEMS: AdminNavItem[] = [
  { key: "/home", label: "Home", icon: createElement("i", { id: "ico-home" }) },
  {
    key: "tenants",
    label: "Tenants",
    children: [
      { key: "/tenants/list", label: "Tenant list", href: "/tenants/list" },
      { key: "/tenants/settings", label: "Settings" },
    ],
  },
  { key: "apps", label: "Apps", children: [{ key: "/apps/list", label: "App list" }] },
];

async function mount(props: Partial<AdminLayoutProps> = {}, pack?: boolean) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const el = createElement(
    AdminLayout,
    {
      items: ITEMS,
      activeKey: "/home",
      logo: "Brand",
      context: "Switcher",
      actions: "UserMenu",
      tabs: createElement("div", { id: "tabs" }, "tabs"),
      footer: "Footer",
      ...props,
    },
    createElement("div", { id: "page" }, "page"),
  );
  await act(async () => root!.render(pack ? createElement(ConfigProvider, { ...zhCN }, el) : el));
}

const q = (s: string, from: ParentNode = document) => from.querySelector<HTMLElement>(s);
const qa = (s: string, from: ParentNode = document) => [...from.querySelectorAll<HTMLElement>(s)];
const text = (el: Element | null) => el?.textContent ?? "";
const click = (el: Element) =>
  act(
    async () => void el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
  );
const layoutEl = () => q('[data-slot="admin-layout"]')!;
const navItems = () => qa('[data-slot="admin-layout-nav-item"]');
const railItems = () => qa('[data-slot="admin-layout-rail-item"]');
const item = (els: HTMLElement[], label: string) => els.find((e) => text(e).includes(label))!;

describe("<AdminLayout /> common", () => {
  test("data-layout follows layout, side by default; other props pass through", async () => {
    await mount({ id: "x" } as never);
    expect(layoutEl().dataset.layout).toBe("side");
    expect(q("#x")).toBe(layoutEl());
  });

  test("content, tabs and footer are in the main area, in the order tab bar -> content -> footer", async () => {
    await mount({ layout: "top" });
    const body = q('[data-slot="admin-layout-body"]')!;
    expect([...body.children].map((c) => c.getAttribute("data-slot"))).toEqual([
      "admin-layout-bar",
      "admin-layout-content",
      "admin-layout-footer",
    ]);
    expect(q("#tabs", body)).not.toBeNull();
    expect(q("#page", q('[data-slot="admin-layout-content"]')!)).not.toBeNull();
  });

  test("no tabs / footer means no such area (top bar); footerFixed sets data-fixed", async () => {
    await mount({ layout: "top", tabs: undefined, footer: undefined });
    expect(q('[data-slot="admin-layout-bar"]')).toBeNull();
    expect(q('[data-slot="admin-layout-footer"]')).toBeNull();
    await act(async () => root?.unmount());
    host!.remove();
    await mount({ layout: "top", footerFixed: true });
    expect(q('[data-slot="admin-layout-footer"]')!.hasAttribute("data-fixed")).toBe(true);
  });
});

describe("<AdminLayout /> side", () => {
  test("no header: logo / context at the top of the sidebar, actions at its bottom, navigation is a SideMenu", async () => {
    await mount({ layout: "side" });
    expect(q('[data-slot="admin-layout-header"]')).toBeNull();
    const side = q('[data-slot="sidebar"]')!;
    expect(text(q('[data-slot="sidebar-header"] [data-slot="admin-layout-logo"]', side))).toBe(
      "Brand",
    );
    expect(text(q('[data-slot="sidebar-header"] [data-slot="admin-layout-context"]', side))).toBe(
      "Switcher",
    );
    expect(text(q('[data-slot="sidebar-footer"] [data-slot="admin-layout-actions"]', side))).toBe(
      "UserMenu",
    );
    expect(text(side)).toContain("Home");
    expect(text(side)).toContain("Tenants");
  });

  test("clicking a leaf -> onNavigate(key, item, event); the current item is selected", async () => {
    const onNavigate = vi.fn();
    await mount({ layout: "side", onNavigate });
    const home = qa('[data-slot="sidemenu-link"]').find((e) => text(e).includes("Home"))!;
    expect(home.getAttribute("aria-current") ?? home.hasAttribute("data-selected")).toBeTruthy();
    await click(home);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0][0]).toBe("/home");
    expect(onNavigate.mock.calls[0][1].label).toBe("Home");
  });

  test("logoMark: the sidebar has a mark slot (shown by the theme style when collapsed to a rail, hiding the name and context); absent when not given", async () => {
    await mount({ layout: "side", logo: "Acme", logoMark: "A", context: "ctx" });
    expect(
      q('[data-slot="sidebar-header"] [data-slot="admin-layout-logo-mark"]')!.textContent,
    ).toBe("A");
    expect(q('[data-slot="admin-layout-logo"]')!.textContent).toBe("Acme");
  });

  test("no mark slot without logoMark", async () => {
    await mount({ layout: "side", logo: "Acme" });
    expect(q('[data-slot="admin-layout-logo-mark"]')).toBeNull();
  });

  test("controlled collapsed: the sidebar follows; defaultCollapsed is uncontrolled", async () => {
    await mount({ layout: "side", collapsed: true });
    expect(q('[data-slot="sidebar"]')!.dataset.state).toBe("collapsed");
    expect(layoutEl().hasAttribute("data-collapsed")).toBe(true);
    await act(async () => root?.unmount());
    host!.remove();
    await mount({ layout: "side", defaultCollapsed: true });
    expect(q('[data-slot="sidebar"]')!.dataset.state).toBe("collapsed");
  });

  test("the sidebar toggle fires onCollapsedChange (so does Ctrl + B)", async () => {
    const onCollapsedChange = vi.fn();
    await mount({ layout: "side", collapsed: false, onCollapsedChange });
    await click(q('[data-slot="admin-layout-sidebar-trigger"] button')!);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
  });
});

describe("<AdminLayout /> top", () => {
  test("header from left to right: menu button, logo, context, top navigation, breadcrumb, actions", async () => {
    await mount({ layout: "top", breadcrumb: "Crumbs" });
    const header = q('[data-slot="admin-layout-header"]')!;
    expect([...header.children].map((c) => c.getAttribute("data-slot"))).toEqual([
      "admin-layout-menu-button",
      "admin-layout-logo",
      "admin-layout-context",
      "admin-layout-nav",
      "admin-layout-breadcrumb",
      "admin-layout-actions",
    ]);
    expect(q('[data-slot="sidebar"]')).toBeNull();
    expect(q('[data-slot="admin-layout-nav"]')!.getAttribute("aria-label")).toBe("Main navigation");
  });

  test("top navigation: leaves are buttons (links when they have href), the current top item is data-active, with icon and text", async () => {
    await mount({ layout: "top", activeKey: "/tenants/list" });
    expect(navItems().map((e) => e.hasAttribute("data-active"))).toEqual([false, true, false]);
    const home = item(navItems(), "Home");
    expect(home.tagName).toBe("BUTTON");
    expect(q("#ico-home", home)).not.toBeNull();
  });

  test("clicking a top item without children -> onNavigate; items with href render links and can preventDefault", async () => {
    const onNavigate = vi.fn((_k: string, _i: AdminNavItem, e: { preventDefault: () => void }) =>
      e.preventDefault(),
    );
    await mount({
      layout: "top",
      items: [{ key: "/docs", label: "Docs", href: "/docs" }],
      activeKey: null,
      onNavigate,
    });
    const link = navItems()[0];
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/docs");
    await click(link);
    expect(onNavigate.mock.calls[0][0]).toBe("/docs");
  });

  test("top items with children are dropdown triggers", async () => {
    await mount({ layout: "top" });
    const tenants = item(navItems(), "Tenants");
    expect(tenants.getAttribute("aria-haspopup")).toBe("menu");
    expect(q('[data-slot="admin-layout-nav-chevron"]', tenants)).not.toBeNull();
  });
});

describe("<AdminLayout /> top dropdown", () => {
  test("clicking a top item with children opens a dropdown, picking a child -> onNavigate; children with href are links", async () => {
    const onNavigate = vi.fn();
    await mount({ layout: "top", onNavigate });
    await click(item(navItems(), "Tenants"));
    const menu = qa('[data-slot="menu-item"]');
    expect(menu.map(text)).toEqual(["Tenant list", "Settings"]);
    expect(menu[0].tagName).toBe("A");
    expect(menu[0].getAttribute("href")).toBe("/tenants/list");
    await click(menu[1]);
    expect(onNavigate.mock.calls[0][0]).toBe("/tenants/settings");
  });
});

describe("<AdminLayout /> mix", () => {
  test("link-style top navigation: clicking a top item with children goes straight to its first leaf", async () => {
    const onNavigate = vi.fn();
    await mount({ layout: "mix", onNavigate });
    await click(item(navItems(), "Tenants"));
    expect(onNavigate.mock.calls[0][0]).toBe("/tenants/list");
    expect(onNavigate.mock.calls[0][1].href).toBe("/tenants/list");
  });

  test("the sidebar holds only the selected top item's children; no sidebar when it has none", async () => {
    await mount({ layout: "mix", activeKey: "/tenants/settings" });
    const side = q('[data-slot="sidebar"]')!;
    expect(text(side)).toContain("Tenant list");
    expect(text(side)).toContain("Settings");
    expect(text(side)).not.toContain("App list");
    expect(q('[data-slot="sidebar-header"]', side)).toBeNull();
    await act(async () => root?.unmount());
    host!.remove();
    await mount({ layout: "mix", activeKey: "/home" });
    expect(q('[data-slot="sidebar"]')).toBeNull();
  });
});

describe("<AdminLayout /> column", () => {
  test("icon rail: the current top item is data-active; clicking it goes to the first leaf and expands the collapsed submenu", async () => {
    const onNavigate = vi.fn();
    const onCollapsedChange = vi.fn();
    await mount({
      layout: "column",
      activeKey: "/tenants/list",
      collapsed: true,
      onNavigate,
      onCollapsedChange,
    });
    expect(q('[data-slot="admin-layout-rail"]')!.getAttribute("aria-label")).toBe(
      "Main navigation",
    );
    expect(railItems().map((e) => e.hasAttribute("data-active"))).toEqual([false, true, false]);
    await click(item(railItems(), "Apps"));
    expect(onNavigate.mock.calls[0][0]).toBe("/apps/list");
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  test("the submenu column shows the selected top item's children; the edge button collapses / expands it (aria-expanded, inert)", async () => {
    const onCollapsedChange = vi.fn();
    await mount({ layout: "column", activeKey: "/tenants/list", onCollapsedChange });
    const sub = q('[data-slot="admin-layout-subnav"]')!;
    expect(text(sub)).toContain("Tenant list");
    expect(text(sub)).not.toContain("App list");
    const toggle = q('[data-slot="admin-layout-subnav-toggle"]')!;
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Collapse sub navigation");
    await click(toggle);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
  });

  test("collapsed, the submenu column is data-collapsed and inert, the button name becomes Expand; top items without children have no submenu", async () => {
    await mount({ layout: "column", activeKey: "/tenants/list", collapsed: true });
    const sub = q('[data-slot="admin-layout-subnav"]')!;
    expect(sub.hasAttribute("data-collapsed")).toBe(true);
    expect(sub.hasAttribute("inert")).toBe(true);
    expect(q('[data-slot="admin-layout-subnav-toggle"]')!.getAttribute("aria-label")).toBe(
      "Expand sub navigation",
    );
    await act(async () => root?.unmount());
    host!.remove();
    await mount({ layout: "column", activeKey: "/home" });
    expect(q('[data-slot="admin-layout-subnav"]')).toBeNull();
    expect(q('[data-slot="admin-layout-subnav-toggle"]')).toBeNull();
  });
});

describe("<AdminLayout /> side toolbar position / breadcrumb", () => {
  const crumb = () => createElement("i", { id: "crumb" });
  const acts = () => createElement("i", { id: "acts" });

  test("toolbar=header: the header is in the content area, breadcrumb on the left, actions on the right; logo, context and navigation in the sidebar, no actions at its bottom", async () => {
    await mount({ layout: "side", toolbar: "header", breadcrumb: crumb(), actions: acts() });
    const inset = q('[data-slot="sidebar-inset"]')!;
    const header = q('[data-slot="admin-layout-header"]', inset)!;
    expect(header).not.toBeNull();
    expect(layoutEl().hasAttribute("data-header-inset")).toBe(true);
    expect(q("#crumb", q('[data-slot="admin-layout-breadcrumb"]', header)!)).not.toBeNull();
    expect(q("#acts", q('[data-slot="admin-layout-actions"]', header)!)).not.toBeNull();
    // The header comes before the tab row / content
    expect(inset.firstElementChild).toBe(header);
    // The logo and context are only in the sidebar
    expect(q('[data-slot="admin-layout-logo"]', header)).toBeNull();
    expect(q('[data-slot="admin-layout-context"]', header)).toBeNull();
    const sidebar = q('[data-slot="sidebar"]')!;
    expect(text(q('[data-slot="admin-layout-logo"]', sidebar))).toBe("Brand");
    expect(text(q('[data-slot="admin-layout-context"]', sidebar))).toBe("Switcher");
    expect(q('[data-slot="admin-layout-actions"]', sidebar)).toBeNull();
    expect(q('[data-slot="sidebar-footer"]')).toBeNull();
  });

  test("default (toolbar at the sidebar bottom) without a breadcrumb: no header, actions at the sidebar bottom (as the old side)", async () => {
    await mount({ layout: "side", actions: acts() });
    expect(q('[data-slot="admin-layout-header"]')).toBeNull();
    expect(layoutEl().hasAttribute("data-header-inset")).toBe(false);
    expect(q("#acts", q('[data-slot="sidebar-footer"]')!)).not.toBeNull();
  });

  test("toolbar at the sidebar bottom with a breadcrumb: a header with just the breadcrumb, actions still at the sidebar bottom", async () => {
    await mount({ layout: "side", breadcrumb: crumb(), actions: acts() });
    const header = q('[data-slot="admin-layout-header"]')!;
    expect(q("#crumb", header)).not.toBeNull();
    expect(q('[data-slot="admin-layout-actions"]', header)).toBeNull();
    expect(q("#acts", q('[data-slot="sidebar-footer"]')!)).not.toBeNull();
    expect(layoutEl().hasAttribute("data-header-inset")).toBe(true);
  });

  test("settings.toolbar / settings.showBreadcrumb take effect; the toolbar prop wins over settings", async () => {
    await mount({
      settings: { layout: "side", toolbar: "header" },
      breadcrumb: crumb(),
      actions: acts(),
    });
    expect(q("#acts", q('[data-slot="admin-layout-header"]')!)).not.toBeNull();
    await act(async () => root?.unmount());
    host?.remove();
    await mount({
      settings: { layout: "side", toolbar: "header" },
      toolbar: "sidebar",
      breadcrumb: crumb(),
      actions: acts(),
    });
    expect(q("#acts", q('[data-slot="sidebar-footer"]')!)).not.toBeNull();
    await act(async () => root?.unmount());
    host?.remove();
    // showBreadcrumb=false: the breadcrumb isn't rendered; with the toolbar at the bottom of the sidebar there is no header either
    await mount({
      settings: { layout: "side", showBreadcrumb: false },
      breadcrumb: crumb(),
      actions: acts(),
    });
    expect(q("#crumb")).toBeNull();
    expect(q('[data-slot="admin-layout-header"]')).toBeNull();
  });

  test("on narrow screens the sidebar opener is in the header; not in the tab bar", async () => {
    await mount({ layout: "side", toolbar: "header" });
    const header = q('[data-slot="admin-layout-header"]')!;
    expect(q('[data-slot="admin-layout-sidebar-trigger"]', header)).not.toBeNull();
    expect(
      q('[data-slot="admin-layout-bar"] [data-slot="admin-layout-sidebar-trigger"]'),
    ).toBeNull();
  });

  test("on narrow screens the logo sits at the top next to the sidebar opener: in the header if there is one, otherwise in the tab bar", async () => {
    await mount({ layout: "side", toolbar: "header", logo: <b id="lg">L</b> });
    expect(
      q('[data-slot="admin-layout-header"] [data-slot="admin-layout-mobile-logo"] #lg'),
    ).not.toBeNull();
    expect(q('[data-slot="admin-layout-bar"] [data-slot="admin-layout-mobile-logo"]')).toBeNull();
    await act(async () => root?.unmount());
    host?.remove();
    await mount({ layout: "side", logo: <b id="lg">L</b> });
    expect(
      q('[data-slot="admin-layout-bar"] [data-slot="admin-layout-mobile-logo"] #lg'),
    ).not.toBeNull();
    await act(async () => root?.unmount());
    host?.remove();
    // In other layouts the logo is already in the header, no duplicate
    await mount({ layout: "top", logo: <b id="lg">L</b> });
    expect(q('[data-slot="admin-layout-mobile-logo"]')).toBeNull();
  });

  test("without a header the button stays in the tab bar; has a Rail; no top navigation", async () => {
    await mount({ layout: "side" });
    expect(
      q('[data-slot="admin-layout-bar"] [data-slot="admin-layout-sidebar-trigger"]'),
    ).not.toBeNull();
    expect(q('[data-slot="sidebar-rail"]')).not.toBeNull();
    expect(q('[data-slot="admin-layout-menu-button"]')).toBeNull();
    expect(q('[data-slot="admin-layout-nav"]')).toBeNull();
  });

  test("toolbar only affects side: other layouts keep actions in the header", async () => {
    await mount({ layout: "top", toolbar: "sidebar", actions: acts() });
    expect(q("#acts", q('[data-slot="admin-layout-header"]')!)).not.toBeNull();
  });

  test("maximized: the header (breadcrumb header included) is hidden, no data-header-inset", async () => {
    await mount({ layout: "side", toolbar: "header", maximized: true, breadcrumb: crumb() });
    expect(q('[data-slot="admin-layout-header"]')).toBeNull();
    expect(layoutEl().hasAttribute("data-header-inset")).toBe(false);
  });
});

describe("<AdminLayout /> boxed", () => {
  test("the header holds logo / actions; the sidebar has the inset look; a background can go behind the content card", async () => {
    await mount({ layout: "boxed", background: createElement("i", { id: "bg" }) });
    const header = q('[data-slot="admin-layout-header"]')!;
    expect(text(q('[data-slot="admin-layout-logo"]', header))).toBe("Brand");
    expect(q('[data-slot="sidebar"]')!.dataset.variant).toBe("inset");
    // No logo in the sidebar (it is in the header)
    expect(q('[data-slot="sidebar-header"]')).toBeNull();
    expect(q("#bg", q('[data-slot="admin-layout-background"]')!)).not.toBeNull();
  });
});

describe("<AdminLayout /> maximized", () => {
  test.each(["side", "top", "mix", "column", "boxed"] as const)(
    "%s: hides header, sidebar and navigation, leaving tabs, content and footer",
    async (layout) => {
      await mount({ layout, maximized: true, activeKey: "/tenants/list" });
      expect(layoutEl().hasAttribute("data-maximized")).toBe(true);
      expect(q('[data-slot="admin-layout-header"]')).toBeNull();
      expect(q('[data-slot="sidebar"]')).toBeNull();
      expect(q('[data-slot="admin-layout-rail"]')).toBeNull();
      expect(q('[data-slot="admin-layout-subnav"]')).toBeNull();
      expect(q("#tabs")).not.toBeNull();
      expect(q("#page")).not.toBeNull();
      expect(text(q('[data-slot="admin-layout-footer"]'))).toBe("Footer");
    },
  );
});

describe("<AdminLayout /> bar actions", () => {
  const buttons = () => qa('[data-slot="admin-layout-bar-button"]');

  test("without onRefresh / onMaximizedChange: no buttons on the right of the tab bar", async () => {
    await mount({ layout: "top" });
    expect(q('[data-slot="admin-layout-bar-actions"]')).toBeNull();
  });

  test("refresh: clicking calls onRefresh, the name is Refresh page", async () => {
    const onRefresh = vi.fn();
    await mount({ layout: "top", onRefresh });
    expect(buttons()).toHaveLength(1);
    expect(buttons()[0].getAttribute("aria-label")).toBe("Refresh page");
    await click(buttons()[0]);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test("maximize / restore: the button's name and aria-pressed follow maximized, clicking reports the opposite value; the tab bar stays when maximized", async () => {
    const onMaximizedChange = vi.fn();
    await mount({ layout: "side", onMaximizedChange });
    const button = () => buttons()[0];
    expect(button().getAttribute("aria-label")).toBe("Maximize content");
    expect(button().getAttribute("aria-pressed")).toBe("false");
    await click(button());
    expect(onMaximizedChange).toHaveBeenLastCalledWith(true);
    await act(async () => root?.unmount());
    host!.remove();
    await mount({ layout: "side", maximized: true, onMaximizedChange });
    expect(q('[data-slot="admin-layout-header"]')).toBeNull();
    expect(q('[data-slot="sidebar"]')).toBeNull();
    expect(button().getAttribute("aria-label")).toBe("Restore layout");
    expect(button().getAttribute("aria-pressed")).toBe("true");
    await click(button());
    expect(onMaximizedChange).toHaveBeenLastCalledWith(false);
  });

  test("with both, the order is refresh -> maximize; without tabs (no tab bar) neither appears", async () => {
    await mount({ layout: "top", onRefresh: () => {}, onMaximizedChange: () => {} });
    expect(buttons().map((b) => b.getAttribute("aria-label"))).toEqual([
      "Refresh page",
      "Maximize content",
    ]);
    await act(async () => root?.unmount());
    host!.remove();
    await mount({
      layout: "top",
      tabs: undefined,
      onRefresh: () => {},
      onMaximizedChange: () => {},
    });
    expect(q('[data-slot="admin-layout-bar"]')).toBeNull();
    expect(buttons()).toHaveLength(0);
  });

  test("text follows the locale", async () => {
    await mount({ layout: "top", onRefresh: () => {} }, true);
    expect(buttons()[0].getAttribute("aria-label")).toBe("刷新当前页");
  });
});

describe("<AdminLayout /> menuVariant", () => {
  test("modern is passed to the sidebar's SideMenu; no data-variant by default", async () => {
    await mount({ layout: "side" });
    expect(q('[data-slot="sidemenu"]')!.hasAttribute("data-variant")).toBe(false);
    await act(async () => root?.unmount());
    host!.remove();
    await mount({ layout: "side", menuVariant: "modern" });
    expect(q('[data-slot="sidemenu"]')!.dataset.variant).toBe("modern");
  });

  test("the mix sidebar, the column submenu and the narrow-screen drawer menu all follow", async () => {
    await mount({ layout: "mix", menuVariant: "modern", activeKey: "/tenants/list" });
    expect(q('[data-slot="sidebar"] [data-slot="sidemenu"]')!.dataset.variant).toBe("modern");
    await act(async () => root?.unmount());
    host!.remove();
    await mount({ layout: "column", menuVariant: "modern", activeKey: "/tenants/list" });
    expect(q('[data-slot="admin-layout-subnav"] [data-slot="sidemenu"]')!.dataset.variant).toBe(
      "modern",
    );
    await click(q('[data-slot="admin-layout-menu-button"]')!);
    expect(q('[data-slot="admin-layout-drawer"] [data-slot="sidemenu"]')!.dataset.variant).toBe(
      "modern",
    );
  });
});

describe("<AdminLayout /> narrow-screen drawer", () => {
  test.each(["top", "mix", "column"] as const)(
    "%s: the header has an open-menu button that opens a drawer with the full navigation tree; picking an item closes it",
    async (layout) => {
      const onNavigate = vi.fn();
      await mount({ layout, onNavigate });
      const button = q('[data-slot="admin-layout-menu-button"]')!;
      expect(button.getAttribute("aria-label")).toBe("Open menu");
      await click(button);
      const drawer = q('[data-slot="admin-layout-drawer"]')!;
      expect(text(q('[data-slot="admin-layout-drawer-header"]', drawer))).toBe("Brand");
      expect(text(drawer)).toContain("Home");
      expect(text(drawer)).toContain("Apps");
      const home = qa('[data-slot="sidemenu-link"]', drawer).find((e) => text(e).includes("Home"))!;
      await click(home);
      expect(onNavigate.mock.calls[0][0]).toBe("/home");
      await act(async () => void (await new Promise((r) => setTimeout(r, 80))));
      expect(q('[data-slot="admin-layout-drawer"]')).toBeNull();
    },
  );

  test("side / boxed have no header menu button (narrow screens use the sidebar's own drawer)", async () => {
    await mount({ layout: "side" });
    expect(q('[data-slot="admin-layout-menu-button"]')).toBeNull();
    expect(q('[data-slot="admin-layout-sidebar-trigger"]')).not.toBeNull();
  });
});

describe("<AdminLayout /> i18n", () => {
  test("locale / labels", async () => {
    await mount({ layout: "top" }, true);
    expect(q('[data-slot="admin-layout-menu-button"]')!.getAttribute("aria-label")).toBe(
      "打开菜单",
    );
    expect(q('[data-slot="admin-layout-nav"]')!.getAttribute("aria-label")).toBe("主导航");
  });

  test("the component's own labels win", async () => {
    await mount({ layout: "top", labels: { navigation: "Primary" } }, true);
    expect(q('[data-slot="admin-layout-nav"]')!.getAttribute("aria-label")).toBe("Primary");
  });
});
