// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import { Anchor } from "../src/index.ts";
import type { AnchorItem, AnchorProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
let box: HTMLElement;
const tops: Record<string, number> = {};

beforeEach(() => {
  // A scrollable container with three sections inside; tops controls their current position relative to the viewport
  box = document.createElement("div");
  box.getBoundingClientRect = () => new DOMRect(0, 0, 300, 200);
  Object.defineProperty(box, "clientHeight", { value: 200, configurable: true });
  Object.defineProperty(box, "scrollHeight", { value: 600, configurable: true });
  box.scrollBy = ((opts: ScrollToOptions) => {
    scrolled.push(opts);
  }) as typeof box.scrollBy;
  for (const id of ["one", "two", "three"]) {
    const sec = document.createElement("section");
    sec.id = id;
    tops[id] = { one: 0, two: 200, three: 400 }[id]!;
    sec.getBoundingClientRect = () => new DOMRect(0, tops[id]!, 300, 200);
    box.appendChild(sec);
  }
  document.body.appendChild(box);
  scrolled.length = 0;
});
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  box.remove();
  root = null;
  host = null;
});
const scrolled: ScrollToOptions[] = [];

const ITEMS: AnchorItem[] = [
  { href: "#one", title: "One" },
  { href: "#two", title: "Two", children: [{ href: "#three", title: "Three" }] },
];
function mount(props: Partial<AnchorProps> = {}) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(createElement(Anchor, { items: ITEMS, container: box, ...props })));
}
const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 40)));
const q = (sel: string) => document.querySelector<HTMLElement>(sel);
const links = () => [...document.querySelectorAll<HTMLAnchorElement>('[data-slot="anchor-link"]')];
const activeText = () => q('[data-slot="anchor-link"][data-active]')?.textContent ?? null;
const scrollTo = async (tos: Record<string, number>, scrollTop = 0) => {
  Object.assign(tops, tos);
  box.scrollTop = scrollTop;
  await act(async () => {
    box.dispatchEvent(new Event("scroll"));
  });
  await settle();
};

describe("Anchor", () => {
  test("SSR: nav, nested lists, real a[href], no class / style", () => {
    const html = renderToStaticMarkup(createElement(Anchor, { items: ITEMS }));
    expect(html).toContain("<nav");
    expect(html).toContain('href="#one"');
    expect(html).toContain('data-level="2"');
    expect(html).toContain('data-empty=""');
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("on mount highlights by the current position; follows scrolling; aria-current=location", async () => {
    mount();
    await settle();
    expect(activeText()).toBe("One");
    expect(q('[data-slot="anchor-link"][data-active]')!.getAttribute("aria-current")).toBe(
      "location",
    );
    await scrollTo({ one: -200, two: 0, three: 200 }, 200);
    expect(activeText()).toBe("Two");
    await scrollTo({ one: -400, two: -200, three: 0 }, 300);
    expect(activeText()).toBe("Three"); // child links count too
  });

  test("offset: a target counts as reached only past the offset", async () => {
    mount({ offset: 100 });
    await scrollTo({ one: -150, two: 90, three: 290 }, 150);
    expect(activeText()).toBe("Two"); // 90 <= 100 + 5
    await scrollTo({ one: -160, two: 110, three: 310 }, 160);
    expect(activeText()).toBe("One"); // 110 > 105
  });

  test("scrolled to the bottom: takes the last one even if its top has not passed the threshold", async () => {
    mount();
    Object.defineProperty(box, "scrollTop", { value: 400, configurable: true, writable: true });
    await scrollTo({ one: -400, two: -200, three: 150 }, 400);
    expect(activeText()).toBe("Three");
  });

  test("click: prevents the default jump, scrolls smoothly with offset, highlights at once, scrolling meanwhile does not override it", async () => {
    const changes: string[] = [];
    mount({ offset: 20, onValueChange: (h: string) => changes.push(h) });
    await settle();
    act(() => {
      links()[1]!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    expect(scrolled).toEqual([{ top: 200 - 20, behavior: "smooth" }]);
    expect(activeText()).toBe("Two");
    expect(changes.at(-1)).toBe("#two");
    // Passing One during smooth scrolling: locked, doesn't revert
    await scrollTo({ one: 0, two: 200, three: 400 }, 20);
    expect(activeText()).toBe("Two");
  });

  test("a link whose target is missing: not intercepted, handled as a normal link", async () => {
    mount({ items: [{ href: "#nope", title: "Nope" }] });
    await settle();
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => {
      links()[0]!.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    expect(scrolled).toEqual([]);
  });

  test("controlled value: scrolling does not change it, clicking only calls back", async () => {
    const changes: string[] = [];
    mount({ value: "#three", onValueChange: (h: string) => changes.push(h) });
    await settle();
    expect(activeText()).toBe("Three");
    await scrollTo({ one: -200, two: 0, three: 200 }, 200);
    expect(activeText()).toBe("Three");
    act(() => {
      links()[0]!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    expect(changes.at(-1)).toBe("#one");
    expect(activeText()).toBe("Three");
  });

  test("updateHash: after a click replaceState changes the hash", async () => {
    mount({ updateHash: true });
    await settle();
    act(() => {
      links()[1]!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    expect(location.hash).toBe("#two");
    history.replaceState(null, "", location.pathname);
  });

  test("direction on the root; indicator position variables on the root", async () => {
    mount({ direction: "horizontal" });
    await settle();
    const nav = q('[data-slot="anchor"]')!;
    expect(nav.getAttribute("data-direction")).toBe("horizontal");
    expect(nav.style.getPropertyValue("--anchor-w")).not.toBe("");
    expect(nav.hasAttribute("data-empty")).toBe(false);
  });
});
