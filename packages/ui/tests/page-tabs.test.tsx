// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { ConfigProvider, PageTabs } from "../src/index.ts";
import type { PageTab, PageTabsProps } from "../src/index.ts";
import { zhCN } from "../src/locales/zh-CN.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const TABS: PageTab[] = [
  { key: "/home", title: "Home", pinned: true },
  { key: "/a", title: "Alpha" },
  { key: "/b", title: "Beta" },
  { key: "/c", title: "Gamma" },
];

async function mount(props: Partial<PageTabsProps> = {}, pack?: boolean) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const el = createElement(PageTabs, {
    tabs: TABS,
    activeKey: "/a",
    onActiveKeyChange: () => {},
    ...props,
  });
  await act(async () => root!.render(pack ? createElement(ConfigProvider, { ...zhCN }, el) : el));
  return host;
}

/** A version that really updates: tabs and the current item are both kept in state. */
function Stateful(
  props: Partial<PageTabsProps> & { initial?: readonly PageTab[]; start?: string },
) {
  const [tabs, setTabs] = useState<readonly PageTab[]>(props.initial ?? TABS);
  const [active, setActive] = useState(props.start ?? "/a");
  return createElement(PageTabs, {
    ...props,
    tabs,
    activeKey: active,
    onActiveKeyChange: setActive,
    onTabsChange: setTabs,
  });
}
async function mountStateful(props: Parameters<typeof Stateful>[0] = {}) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(createElement(Stateful, props)));
}

const q = (s: string, from: ParentNode = document) => from.querySelector<HTMLElement>(s);
const qa = (s: string, from: ParentNode = document) => [...from.querySelectorAll<HTMLElement>(s)];
const text = (el: Element | null) => el?.textContent ?? "";
const titles = () => qa('[role="tab"]').map(text);
const tab = (title: string) => qa('[role="tab"]').find((t) => text(t) === title)!;
const click = (el: Element) =>
  act(async () => void el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(
    async () =>
      void el.dispatchEvent(
        new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
      ),
  );
const status = () => text(q('[data-slot="page-tabs-status"]'));

describe("<PageTabs /> structure", () => {
  test("tablist / tab roles, the active tab has aria-selected, only it is in the Tab order (roving tabindex)", async () => {
    await mount();
    expect(q('[role="tablist"]')?.getAttribute("aria-label")).toBe("Open pages");
    expect(titles()).toEqual(["Home", "Alpha", "Beta", "Gamma"]);
    expect(tab("Alpha").getAttribute("aria-selected")).toBe("true");
    expect(tab("Beta").getAttribute("aria-selected")).toBe("false");
    expect(qa('[role="tab"]').map((t) => t.tabIndex)).toEqual([-1, 0, -1, -1]);
    expect(q('[data-slot="page-tabs-item"][data-active]')).toBe(tab("Alpha").parentElement);
  });

  test("aria-label / aria-labelledby go to the tablist, not to the outer div (no role)", async () => {
    await mount({ "aria-label": "Pages" } as Partial<PageTabsProps>);
    expect(q('[role="tablist"]')?.getAttribute("aria-label")).toBe("Pages");
    expect(q('[data-slot="page-tabs"]')?.hasAttribute("aria-label")).toBe(false);
    await act(async () => root?.unmount());
    host?.remove();
    await mount({ "aria-labelledby": "heading" } as Partial<PageTabsProps>);
    expect(q('[role="tablist"]')?.getAttribute("aria-labelledby")).toBe("heading");
    expect(q('[role="tablist"]')?.hasAttribute("aria-label")).toBe(false);
    expect(q('[data-slot="page-tabs"]')?.hasAttribute("aria-labelledby")).toBe(false);
  });

  test("when the active key isn't in the list, the first tab is focusable", async () => {
    await mount({ activeKey: "/gone" });
    expect(qa('[role="tab"]').map((t) => t.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  test("clicking a tab → onActiveKeyChange; variant / size are on the root", async () => {
    const onActiveKeyChange = vi.fn();
    await mount({ onActiveKeyChange, variant: "chrome", size: "lg" });
    await click(tab("Gamma"));
    expect(onActiveKeyChange).toHaveBeenCalledWith("/c");
    expect(q('[data-slot="page-tabs"]')?.getAttribute("data-variant")).toBe("chrome");
    expect(q('[data-slot="page-tabs"]')?.getAttribute("data-size")).toBe("lg");
  });

  test("without onTabsChange: just a row of switchable tabs, no close buttons, no live region", async () => {
    await mount();
    expect(q('[data-slot="page-tabs-close"]')).toBeNull();
    expect(q('[data-slot="page-tabs-status"]')).toBeNull();
    await key(tab("Alpha"), "Delete");
  });

  test("icons, pinned marker; the close button is outside the tab, pinned tabs have none", async () => {
    await mount({
      onTabsChange: () => {},
      tabs: [
        { key: "/x", title: "X", icon: createElement("i", { id: "ico" }), pinned: true },
        ...TABS.slice(1),
      ],
    });
    expect(q('[data-slot="page-tabs-icon"] #ico')).not.toBeNull();
    const pinned = tab("X").parentElement!;
    expect(pinned.hasAttribute("data-pinned")).toBe(true);
    expect(q('[data-slot="page-tabs-close"]', pinned)).toBeNull();
    const alpha = tab("Alpha");
    const close = q('[data-slot="page-tabs-close"]', alpha.parentElement!)!;
    expect(alpha.contains(close)).toBe(false);
    expect(close.getAttribute("aria-label")).toBe("Close Alpha");
  });
});

describe("<PageTabs /> closing", () => {
  test("close button: returns a new array; closing the active tab moves to its right neighbour; announces", async () => {
    await mountStateful();
    await click(q('[aria-label="Close Alpha"]')!);
    expect(titles()).toEqual(["Home", "Beta", "Gamma"]);
    expect(tab("Beta").getAttribute("aria-selected")).toBe("true");
    expect(status()).toBe("Alpha closed");
  });

  test("closing another tab keeps the active tab", async () => {
    await mountStateful();
    await click(q('[aria-label="Close Gamma"]')!);
    expect(titles()).toEqual(["Home", "Alpha", "Beta"]);
    expect(tab("Alpha").getAttribute("aria-selected")).toBe("true");
  });

  test("Delete closes and moves focus to a neighbour; pinned tabs can't close", async () => {
    await mountStateful();
    tab("Alpha").focus();
    await key(tab("Alpha"), "Delete");
    expect(titles()).toEqual(["Home", "Beta", "Gamma"]);
    expect(document.activeElement).toBe(tab("Beta"));
    await key(tab("Home"), "Delete");
    expect(titles()).toEqual(["Home", "Beta", "Gamma"]);
  });

  test("middle click closes", async () => {
    await mountStateful();
    await act(
      async () =>
        void tab("Beta").dispatchEvent(
          new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }),
        ),
    );
    expect(titles()).toEqual(["Home", "Alpha", "Gamma"]);
  });
});

describe("<PageTabs /> keyboard", () => {
  test("arrow keys / Home / End move focus (without switching), no wrapping", async () => {
    await mountStateful();
    tab("Alpha").focus();
    await key(tab("Alpha"), "ArrowRight");
    expect(document.activeElement).toBe(tab("Beta"));
    await key(tab("Beta"), "End");
    expect(document.activeElement).toBe(tab("Gamma"));
    await key(tab("Gamma"), "ArrowRight");
    expect(document.activeElement).toBe(tab("Gamma"));
    await key(tab("Gamma"), "Home");
    expect(document.activeElement).toBe(tab("Home"));
    expect(tab("Alpha").getAttribute("aria-selected")).toBe("true");
  });

  test("Alt + left / right reorders (not past pinned tabs), focus stays on the tab, announces", async () => {
    await mountStateful();
    tab("Beta").focus();
    await key(tab("Beta"), "ArrowLeft", { altKey: true });
    expect(titles()).toEqual(["Home", "Beta", "Alpha", "Gamma"]);
    expect(document.activeElement).toBe(tab("Beta"));
    expect(status()).toBe("Beta moved to position 2 of 4");
    await key(tab("Beta"), "ArrowLeft", { altKey: true }); // the pinned home tab is before it
    expect(titles()).toEqual(["Home", "Beta", "Alpha", "Gamma"]);
  });
});

describe("<PageTabs /> context menu", () => {
  const openMenu = (title: string) =>
    act(
      async () =>
        void tab(title).dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 5,
            clientY: 5,
          }),
        ),
    );
  const items = () => qa('[data-slot="menu-item"]');
  const item = (label: string) => items().find((i) => text(i) === label)!;

  test("context menu: close / others / left / right / all; disabled when nothing to close", async () => {
    await mountStateful();
    await openMenu("Home");
    expect(items().map(text)).toEqual([
      "Close",
      "Close other tabs",
      "Close tabs to the left",
      "Close tabs to the right",
      "Close all tabs",
    ]);
    // The home page is pinned: it can't be closed and has no tab to its left
    expect(item("Close").hasAttribute("data-disabled")).toBe(true);
    expect(item("Close tabs to the left").hasAttribute("data-disabled")).toBe(true);
    expect(item("Close tabs to the right").hasAttribute("data-disabled")).toBe(false);
  });

  test("close others: the clicked tab becomes active (even if the active one was closed)", async () => {
    await mountStateful();
    await openMenu("Gamma");
    await click(item("Close other tabs"));
    expect(titles()).toEqual(["Home", "Gamma"]);
    expect(tab("Gamma").getAttribute("aria-selected")).toBe("true");
    expect(status()).toBe("2 tabs closed");
  });

  test("close to the right / all", async () => {
    await mountStateful();
    await openMenu("Alpha");
    await click(item("Close tabs to the right"));
    expect(titles()).toEqual(["Home", "Alpha"]);
    await openMenu("Alpha");
    await click(item("Close all tabs"));
    expect(titles()).toEqual(["Home"]);
    expect(tab("Home").getAttribute("aria-selected")).toBe("true");
  });

  test("pin / unpin and refresh: only with pinnable / onRefresh", async () => {
    const onRefresh = vi.fn();
    await mountStateful({ pinnable: true, onRefresh });
    await openMenu("Beta");
    expect(items().map(text).slice(0, 2)).toEqual(["Refresh", "Pin tab"]);
    await click(item("Refresh"));
    expect(onRefresh).toHaveBeenCalledWith("/b");
    await openMenu("Beta");
    await click(item("Pin tab"));
    expect(titles()).toEqual(["Home", "Beta", "Alpha", "Gamma"]);
    expect(tab("Beta").parentElement!.hasAttribute("data-pinned")).toBe(true);
    expect(status()).toBe("Beta pinned");
    await openMenu("Beta");
    expect(items().map(text)).toContain("Unpin tab");
  });
});

describe("<PageTabs /> drag", () => {
  /** jsdom has no layout: give each tab a position and the list a starting point. */
  const stub = () => {
    qa('[data-slot="page-tabs-item"]').forEach((el, i) => {
      Object.defineProperty(el, "offsetLeft", { configurable: true, get: () => i * 100 });
      Object.defineProperty(el, "offsetWidth", { configurable: true, get: () => 90 });
      el.getBoundingClientRect = () =>
        ({
          left: i * 100,
          top: 0,
          width: 90,
          height: 30,
          right: i * 100 + 90,
          bottom: 30,
        }) as DOMRect;
    });
    const list = q('[data-slot="page-tabs-list"]')!;
    list.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 400, height: 30, right: 400, bottom: 30 }) as DOMRect;
  };
  const fire = (type: string, x: number, el: EventTarget = window) =>
    act(
      async () =>
        void el.dispatchEvent(
          new MouseEvent(type, { bubbles: true, clientX: x, clientY: 10, button: 0 }),
        ),
    );

  test("dragging past another tab: other tabs make room (preview), release returns the new order and announces; no click after the drag", async () => {
    const onActiveKeyChange = vi.fn();
    await mountStateful({ onActiveKeyChange });
    stub();
    await fire("pointerdown", 120, tab("Alpha")); // Alpha spans 100–190
    await fire("pointermove", 125);
    expect(q('[data-slot="page-tabs-item"][data-dragging]')).toBe(tab("Alpha").parentElement);
    await fire("pointermove", 330); // past the middle of Beta (200–290)
    expect(titles()).toEqual(["Home", "Beta", "Alpha", "Gamma"]);
    await fire("pointerup", 330);
    expect(titles()).toEqual(["Home", "Beta", "Alpha", "Gamma"]);
    expect(status()).toBe("Alpha moved to position 3 of 4");
    expect(q('[data-slot="page-tabs-item"][data-dragging]')).toBeNull();
    await click(tab("Alpha")); // the click right after doesn't count
    expect(onActiveKeyChange).not.toHaveBeenCalled();
  });

  test("can't drag past pinned tabs; Esc cancels without reordering; no dragging without onTabsChange", async () => {
    await mountStateful();
    stub();
    await fire("pointerdown", 220, tab("Beta"));
    await fire("pointermove", 230);
    await fire("pointermove", 5); // dragged to the far left, still stops after the pinned tabs
    expect(titles()).toEqual(["Home", "Beta", "Alpha", "Gamma"]);
    await act(
      async () => void window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
    );
    expect(titles()).toEqual(["Home", "Alpha", "Beta", "Gamma"]);
    await fire("pointerup", 5);
    expect(titles()).toEqual(["Home", "Alpha", "Beta", "Gamma"]);
  });
});

describe("<PageTabs /> scrolling into view", () => {
  // jsdom has no layout: in key order give each tab a 100px width and the list 250px
  const stubLayout = () => {
    const proto = HTMLElement.prototype;
    const saved = ["offsetLeft", "offsetWidth", "clientWidth"].map(
      (k) => [k, Object.getOwnPropertyDescriptor(proto, k)] as const,
    );
    const index = (el: HTMLElement) => TABS.findIndex((t) => t.key === el.dataset.key);
    Object.defineProperty(proto, "offsetLeft", {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset.slot === "page-tabs-item" ? index(this) * 100 : 0;
      },
    });
    Object.defineProperty(proto, "offsetWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset.slot === "page-tabs-item" ? 100 : 0;
      },
    });
    Object.defineProperty(proto, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset.slot === "page-tabs-list" ? 250 : 0;
      },
    });
    return () => {
      for (const [k, d] of saved) {
        if (d) Object.defineProperty(proto, k, d);
        else delete (proto as unknown as Record<string, unknown>)[k];
      }
    };
  };

  test("scrolls only the tab bar's own scrollLeft, not the page (no scrollIntoView)", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const restore = stubLayout();
    try {
      await mount({ activeKey: "/c" }); // 4th tab: 300–400, the list is only 250 wide
      expect(q('[data-slot="page-tabs-list"]')!.scrollLeft).toBe(150);
      expect(scrollIntoView).not.toHaveBeenCalled();
    } finally {
      restore();
      delete (Element.prototype as unknown as Record<string, unknown>).scrollIntoView;
    }
  });

  test("active tab already visible: no scrolling", async () => {
    const restore = stubLayout();
    try {
      await mount({ activeKey: "/a" }); // 100–200, within 0–250
      expect(q('[data-slot="page-tabs-list"]')!.scrollLeft).toBe(0);
    } finally {
      restore();
    }
  });
});

describe("<PageTabs /> i18n", () => {
  test("locale: names, close button", async () => {
    await mount({ onTabsChange: () => {} }, true);
    expect(q('[role="tablist"]')?.getAttribute("aria-label")).toBe("已打开的页面");
    expect(q('[data-slot="page-tabs-close"]')?.getAttribute("aria-label")).toBe("关闭Alpha");
  });

  test("the component's own labels win over the locale", async () => {
    await mount({ onTabsChange: () => {}, labels: { tabs: "Pages" } }, true);
    expect(q('[role="tablist"]')?.getAttribute("aria-label")).toBe("Pages");
  });
});
