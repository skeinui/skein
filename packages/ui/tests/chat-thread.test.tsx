// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import { ChatThread } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
const observers: { cb: () => void; observed: Element[] }[] = [];

beforeEach(() => {
  observers.length = 0;
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    entry: { cb: () => void; observed: Element[] };
    constructor(cb: () => void) {
      this.entry = { cb, observed: [] };
      observers.push(this.entry);
    }
    observe(el: Element) {
      this.entry.observed.push(el);
    }
    disconnect() {
      this.entry.observed = [];
    }
    unobserve() {}
  };
});
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
});

/** jsdom has no layout: install readable and writable scrollHeight / clientHeight / scrollTop on the scroll area. */
function fakeLayout(el: HTMLElement, state: { scrollHeight: number; clientHeight: number }) {
  let top = 0;
  Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => state.scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, get: () => state.clientHeight });
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get: () => top,
    set: (v: number) => {
      top = v;
    },
  });
}
const scrollEvent = (el: HTMLElement) => act(async () => el.dispatchEvent(new Event("scroll")));

async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
  return host.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
}

const thread = () =>
  createElement(
    ChatThread,
    null,
    createElement(ChatThread.Content, null, "messages"),
    createElement(ChatThread.ScrollButton),
  );

describe("ChatThread", () => {
  test("SSR: role=log, has a name, focusable, no class / style", () => {
    const html = ssr(thread());
    expect(html).toContain('role="log"');
    expect(html).toContain('aria-label="Conversation"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('data-slot="chat-thread-content"');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    // Initially at the bottom, no back-to-bottom button
    expect(html).not.toContain("scroll-button");
  });

  test("at the bottom, growing content keeps it scrolled to the bottom", async () => {
    const state = { scrollHeight: 500, clientHeight: 300 };
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    // First give elements in jsdom a layout: patch the prototype before rendering, read right after rendering
    const proto = HTMLElement.prototype;
    const sh = Object.getOwnPropertyDescriptor(proto, "scrollHeight");
    Object.defineProperty(proto, "scrollHeight", {
      configurable: true,
      get: () => state.scrollHeight,
    });
    try {
      await act(async () => {
        root!.render(thread());
      });
      const el = host.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
      expect(el.scrollTop).toBe(500); // scrolls to the bottom on mount
      state.scrollHeight = 800;
      const growth = observers.find((o) => o.observed.length > 0)!;
      await act(async () => growth.cb());
      expect(el.scrollTop).toBe(800);
    } finally {
      if (sh) Object.defineProperty(proto, "scrollHeight", sh);
      else delete (proto as { scrollHeight?: number }).scrollHeight;
    }
  });

  test("scrolled up: no more auto-scroll, a scroll-to-bottom button appears; clicking it scrolls down and sticks to the bottom again", async () => {
    const state = { scrollHeight: 1000, clientHeight: 300 };
    const el = await mount(thread());
    fakeLayout(el, state);
    el.scrollTop = 100; // 600 from the bottom
    await scrollEvent(el);
    expect(el.hasAttribute("data-at-bottom")).toBe(false);
    const button = host!.querySelector<HTMLButtonElement>(
      '[data-slot="chat-thread-scroll-button-wrap"] button',
    )!;
    expect(button.getAttribute("aria-label")).toBe("Scroll to bottom");

    // Content grows taller: doesn't follow the scroll
    state.scrollHeight = 1400;
    const growth = observers.find((o) => o.observed.length > 0);
    if (growth) await act(async () => growth.cb());
    expect(el.scrollTop).toBe(100);

    await act(async () => button.click());
    expect(el.scrollTop).toBe(1400);
    // jsdom has no scrollTo, so it sets directly; after scrolling to the bottom a scroll event fires and the button disappears
    await scrollEvent(el);
    expect(host!.querySelector('[data-slot="chat-thread-scroll-button-wrap"]')).toBeNull();
    state.scrollHeight = 1800;
    if (growth) await act(async () => growth.cb());
    expect(el.scrollTop).toBe(1800);
  });

  test("within the threshold from the bottom still counts as at the bottom", async () => {
    const state = { scrollHeight: 1000, clientHeight: 300 };
    const el = await mount(thread());
    fakeLayout(el, state);
    el.scrollTop = 700 - 50; // 50 from the bottom < 64
    await scrollEvent(el);
    expect(el.hasAttribute("data-at-bottom")).toBe(true);
  });

  test("aria-label can be changed", async () => {
    const el = await mount(createElement(ChatThread, { "aria-label": "Chat history" }));
    expect(el.getAttribute("aria-label")).toBe("Chat history");
  });

  test("the scroll-to-bottom button's name can be changed, it is focusable", async () => {
    const state = { scrollHeight: 1000, clientHeight: 300 };
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(
        createElement(
          ChatThread,
          null,
          createElement(ChatThread.ScrollButton, { "aria-label": "Jump to latest" }),
        ),
      );
    });
    const el = host.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
    fakeLayout(el, state);
    el.scrollTop = 0;
    await scrollEvent(el);
    const button = host.querySelector<HTMLButtonElement>("button")!;
    expect(button.getAttribute("aria-label")).toBe("Jump to latest");
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
