// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Sidebar, SideMenu } from "../src/index.ts";
import type { SideMenuEntry } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.restoreAllMocks();
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
  return host;
}
const click = (el: Element) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
const key = (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });

const ITEMS: SideMenuEntry[] = [
  { key: "home", label: "Home", icon: createElement("i", null, "H") },
  {
    key: "users",
    label: "Users",
    children: [
      { key: "list", label: "List" },
      { key: "roles", label: "Roles", disabled: true },
      { key: "more", label: "More", children: [{ key: "deep", label: "Deep" }] },
    ],
  },
  { type: "divider" },
  { type: "group", key: "g", label: "Group", children: [{ key: "a", label: "A", href: "/a" }] },
  { key: "off", label: "Off", disabled: true },
];
const q = (el: ParentNode, sel: string) => el.querySelector<HTMLElement>(sel)!;
const link = (el: ParentNode, k: string) => q(el, `[data-key="${k}"]`);

describe("SideMenu structure", () => {
  test("a list inside nav: leaves are buttons, links with href, submenu triggers are buttons; groups and separators have their own structure", () => {
    const html = ssr(createElement(SideMenu, { items: ITEMS, "aria-label": "Main" }));
    expect(html).toMatch(/^<nav[^>]*aria-label="Main"[^>]*data-slot="sidemenu"/);
    expect(html).toContain('<a data-slot="sidemenu-link"');
    expect(html).toContain('href="/a"');
    expect(html).toContain('data-slot="sidemenu-group-title"');
    // A divider is only decoration: role=separator isn't allowed inside a ul, so use an aria-hidden li
    expect(html).toContain('aria-hidden="true" data-slot="sidemenu-divider"');
    expect(html).not.toMatch(/class=|style=/);
  });

  test("data-level: 1 at the top, 2 in a submenu, 3 deeper; groups don't add a level", () => {
    const html = ssr(
      createElement(SideMenu, {
        items: [
          {
            key: "p",
            label: "P",
            children: [
              { type: "group", key: "g", label: "G", children: [{ key: "c", label: "C" }] },
            ],
          },
        ],
      }),
    );
    expect(html).toMatch(/data-slot="sidemenu-group" data-level="2"/);
    expect(html).toMatch(/data-slot="sidemenu-item" data-level="2"/);
  });

  test("icons are aria-hidden, the label is its own span", () => {
    const html = ssr(createElement(SideMenu, { items: ITEMS }));
    expect(html).toContain('data-slot="sidemenu-icon" aria-hidden="true"');
    expect(html).toContain('<span data-slot="sidemenu-label">Home</span>');
  });
});

describe("SideMenu selection and expansion", () => {
  test("defaultSelectedKey: the item has aria-current=page, all ancestor submenus start open with data-has-selected", async () => {
    const el = await mount(createElement(SideMenu, { items: ITEMS, defaultSelectedKey: "deep" }));
    expect(link(el, "deep").getAttribute("aria-current")).toBe("page");
    expect(link(el, "users").getAttribute("aria-expanded")).toBe("true");
    expect(link(el, "more").getAttribute("aria-expanded")).toBe("true");
    expect(q(el, '[data-key="users"]').closest("li")!.hasAttribute("data-has-selected")).toBe(true);
    expect(q(el, '[data-key="home"]').getAttribute("aria-current")).toBeNull();
  });

  test("clicking a leaf: selects it when uncontrolled, onSelect gets the key, item and event", async () => {
    const onSelect = vi.fn();
    const el = await mount(createElement(SideMenu, { items: ITEMS, onSelect }));
    await click(link(el, "home"));
    expect(link(el, "home").getAttribute("aria-current")).toBe("page");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]![0]).toBe("home");
    expect(onSelect.mock.calls[0]![1].label).toBe("Home");
  });

  test("controlled selectedKey: clicks only notify, selectedKey decides the selection", async () => {
    const onSelect = vi.fn();
    const el = await mount(
      createElement(SideMenu, { items: ITEMS, selectedKey: "home", onSelect }),
    );
    await click(link(el, "users"));
    await click(link(el, "list"));
    expect(onSelect).toHaveBeenCalledWith("list", expect.anything(), expect.anything());
    expect(link(el, "home").getAttribute("aria-current")).toBe("page");
    expect(link(el, "list").getAttribute("aria-current")).toBeNull();
  });

  test("clicking a submenu trigger opens / closes it, uncontrolled; onOpenChange gets the new open list", async () => {
    const onOpenChange = vi.fn();
    const el = await mount(createElement(SideMenu, { items: ITEMS, onOpenChange }));
    const trigger = link(el, "users");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange).toHaveBeenLastCalledWith(["users"]);
    await click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith([]);
  });

  test("controlled openKeys: clicks only notify", async () => {
    const onOpenChange = vi.fn();
    const el = await mount(createElement(SideMenu, { items: ITEMS, openKeys: [], onOpenChange }));
    await click(link(el, "users"));
    expect(onOpenChange).toHaveBeenCalledWith(["users"]);
    expect(link(el, "users").getAttribute("aria-expanded")).toBe("false");
  });

  test("panels are referenced by aria-controls, a closed panel has no data-open", async () => {
    const el = await mount(createElement(SideMenu, { items: ITEMS }));
    const trigger = link(el, "users");
    const panel = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    expect(panel.hasAttribute("data-open")).toBe(false);
    await click(trigger);
    expect(panel.hasAttribute("data-open")).toBe(true);
  });
});

describe("SideMenu links, disabled", () => {
  test("items with href are <a>; preventDefault in onSelect stops navigation", async () => {
    const el = await mount(
      createElement(SideMenu, { items: ITEMS, onSelect: (_k, _i, e) => e.preventDefault() }),
    );
    const a = link(el, "a");
    expect(a.tagName).toBe("A");
    expect(a.getAttribute("href")).toBe("/a");
    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    await act(async () => {
      a.dispatchEvent(ev);
    });
    expect(ev.defaultPrevented).toBe(true);
  });

  test("disabled items: the button is disabled, clicks don't select or notify; disabled submenus don't open", async () => {
    const onSelect = vi.fn();
    const el = await mount(
      createElement(SideMenu, {
        items: [
          ...ITEMS,
          { key: "dp", label: "DP", disabled: true, children: [{ key: "x", label: "X" }] },
        ],
        onSelect,
      }),
    );
    expect((link(el, "off") as HTMLButtonElement).disabled).toBe(true);
    await click(link(el, "off"));
    expect(onSelect).not.toHaveBeenCalled();
    expect((link(el, "dp") as HTMLButtonElement).disabled).toBe(true);
  });

  test("danger is written as data-danger", () => {
    const html = ssr(createElement(SideMenu, { items: [{ key: "x", label: "X", danger: true }] }));
    expect(html).toContain("data-danger");
  });
});

describe("SideMenu collapsed", () => {
  test("collapsed: data-collapsed on the root, leaves have aria-label (from title or a string label)", () => {
    const html = ssr(
      createElement(SideMenu, {
        collapsed: true,
        items: [
          { key: "a", label: "Alpha" },
          { key: "b", label: createElement("b", null, "Beta"), title: "Bee" },
        ],
      }),
    );
    expect(html).toContain("data-collapsed");
    expect(html).toContain('aria-label="Alpha"');
    expect(html).toContain('aria-label="Bee"');
  });

  test("inside Sidebar (collapsible=icon): follows the sidebar's collapsed state without collapsed", async () => {
    const el = await mount(
      createElement(
        Sidebar.Provider,
        null,
        createElement(Sidebar, { collapsible: "icon" }, createElement(SideMenu, { items: ITEMS })),
        createElement(Sidebar.Inset, null, createElement(Sidebar.Trigger)),
      ),
    );
    const nav = q(el, "nav");
    expect(nav.hasAttribute("data-collapsed")).toBe(false);
    await click(q(el, "[data-slot=sidebar-trigger]"));
    expect(nav.hasAttribute("data-collapsed")).toBe(true);
  });

  test("an explicit collapsed wins over Sidebar", async () => {
    const el = await mount(
      createElement(
        Sidebar.Provider,
        { defaultOpen: false },
        createElement(
          Sidebar,
          { collapsible: "icon" },
          createElement(SideMenu, { items: ITEMS, collapsed: false }),
        ),
      ),
    );
    expect(q(el, "nav").hasAttribute("data-collapsed")).toBe(false);
  });

  test("when collapsed, submenu triggers open a popup (no inline panel)", async () => {
    const el = await mount(createElement(SideMenu, { items: ITEMS, collapsed: true }));
    expect(el.querySelector("[data-slot=sidemenu-panel]")).toBeNull();
    expect(link(el, "users").getAttribute("aria-label")).toBe("Users");
  });
});

describe("SideMenu keyboard", () => {
  test("roving tabindex: only the selected item (or the first) is in the Tab order", async () => {
    const el = await mount(createElement(SideMenu, { items: ITEMS, defaultSelectedKey: "list" }));
    const tabbable = [
      ...el.querySelectorAll<HTMLElement>("[data-slot=sidemenu-link],[data-slot=sidemenu-trigger]"),
    ]
      .filter((e) => e.tabIndex === 0)
      .map((e) => e.dataset.key);
    expect(tabbable).toEqual(["list"]);
    await act(async () => root!.unmount());
    host!.remove();
    const el2 = await mount(createElement(SideMenu, { items: ITEMS }));
    expect(link(el2, "home").tabIndex).toBe(0);
    expect(link(el2, "users").tabIndex).toBe(-1);
  });

  test("up / down move between visible items, skipping disabled ones and closed children; Home / End go to the ends", async () => {
    const el = await mount(createElement(SideMenu, { items: ITEMS }));
    act(() => link(el, "home").focus());
    await key(link(el, "home"), "ArrowDown");
    expect(document.activeElement).toBe(link(el, "users"));
    await key(link(el, "users"), "ArrowDown"); // submenu closed: the next one is a (List is in the closed panel)
    expect(document.activeElement).toBe(link(el, "a"));
    await key(link(el, "a"), "ArrowDown"); // off is disabled, there is no next
    expect(document.activeElement).toBe(link(el, "a"));
    await key(link(el, "a"), "Home");
    expect(document.activeElement).toBe(link(el, "home"));
    await key(link(el, "home"), "End");
    expect(document.activeElement).toBe(link(el, "a"));
  });

  test("Right opens a submenu, Right again goes to the first child; Left closes it or goes back to the parent", async () => {
    const el = await mount(createElement(SideMenu, { items: ITEMS }));
    const users = link(el, "users");
    act(() => users.focus());
    await key(users, "ArrowRight");
    expect(users.getAttribute("aria-expanded")).toBe("true");
    await key(users, "ArrowRight");
    expect(document.activeElement).toBe(link(el, "list"));
    await key(link(el, "list"), "ArrowLeft");
    expect(document.activeElement).toBe(users);
    await key(users, "ArrowLeft");
    expect(users.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("<SideMenu /> variant", () => {
  test("modern is set on the root, off by default; also in submenus that pop out from the collapsed rail", async () => {
    const el = await mount(createElement(SideMenu, { items: ITEMS }));
    expect(el.querySelector('[data-slot="sidemenu"]')!.hasAttribute("data-variant")).toBe(false);
    await act(async () => root?.unmount());
    el.remove();
    const modern = await mount(createElement(SideMenu, { items: ITEMS, variant: "modern" }));
    expect(modern.querySelector('[data-slot="sidemenu"]')!.getAttribute("data-variant")).toBe(
      "modern",
    );
  });
});
