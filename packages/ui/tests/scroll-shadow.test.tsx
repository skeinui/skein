// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { ScrollShadow } from "../src/index.ts";
import type { ScrollShadowProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
async function mount(props: Partial<ScrollShadowProps> = {}) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(
      createElement(ScrollShadow, {
        "aria-label": "List",
        ...props,
        children: createElement("p", null, "content"),
      }),
    );
  });
  return document.querySelector<HTMLElement>('[data-slot="scroll-shadow"]')!;
}
const scrollTo = (el: HTMLElement, prop: "scrollTop" | "scrollLeft", value: number) =>
  act(async () => {
    Object.defineProperty(el, prop, { configurable: true, writable: true, value });
    el.dispatchEvent(new Event("scroll"));
  });

describe("ScrollShadow", () => {
  test("SSR: container + content, orientation as an attribute, no class / style", () => {
    const html = renderToStaticMarkup(
      createElement(ScrollShadow, { hideScrollbar: true }, createElement("p", null, "x")),
    );
    expect(html).toContain('data-slot="scroll-shadow"');
    expect(html).toContain('data-slot="scroll-shadow-content"');
    expect(html).toContain('data-orientation="vertical"');
    expect(html).toContain('data-scrollbar="hidden"');
    expect(html).not.toContain("tabindex");
    expect(html).not.toMatch(/class=|style=/);
  });

  test("content fits: no fade, not focusable; --ss-size as a variable", async () => {
    const el = await mount({ size: 24 });
    expect(el.style.getPropertyValue("--ss-size")).toBe("24px");
    expect(el.hasAttribute("data-shadow-start")).toBe(false);
    expect(el.hasAttribute("data-shadow-end")).toBe(false);
    expect(el.hasAttribute("tabindex")).toBe(false);
  });

  test("vertical: at the top only the end fades, in the middle both, at the bottom only the start; a focusable region when overflowing", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    const orig = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 400,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get: () => 100,
    });
    try {
      await act(async () => {
        root!.render(
          createElement(ScrollShadow, {
            "aria-label": "List",
            children: createElement("p", null, "x"),
          }),
        );
      });
      const el = document.querySelector<HTMLElement>('[data-slot="scroll-shadow"]')!;
      expect(el.hasAttribute("data-shadow-start")).toBe(false);
      expect(el.hasAttribute("data-shadow-end")).toBe(true);
      expect(el.getAttribute("tabindex")).toBe("0");
      expect(el.getAttribute("role")).toBe("region");
      expect(el.getAttribute("aria-label")).toBe("List");
      await scrollTo(el, "scrollTop", 150);
      expect(el.hasAttribute("data-shadow-start")).toBe(true);
      expect(el.hasAttribute("data-shadow-end")).toBe(true);
      await scrollTo(el, "scrollTop", 300);
      expect(el.hasAttribute("data-shadow-start")).toBe(true);
      expect(el.hasAttribute("data-shadow-end")).toBe(false);
    } finally {
      if (orig) Object.defineProperty(HTMLElement.prototype, "scrollHeight", orig);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight;
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight;
    }
  });

  test("horizontal reads scrollLeft / scrollWidth; without aria-label it is only focusable when overflowing, not a region", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get: () => 500,
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get: () => 100,
    });
    try {
      await act(async () => {
        root!.render(
          createElement(ScrollShadow, {
            orientation: "horizontal",
            children: createElement("p", null, "x"),
          }),
        );
      });
      const el = document.querySelector<HTMLElement>('[data-slot="scroll-shadow"]')!;
      expect(el.hasAttribute("data-shadow-end")).toBe(true);
      expect(el.getAttribute("tabindex")).toBe("0");
      expect(el.hasAttribute("role")).toBe(false);
      await scrollTo(el, "scrollLeft", 400);
      expect(el.hasAttribute("data-shadow-start")).toBe(true);
      expect(el.hasAttribute("data-shadow-end")).toBe(false);
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollWidth;
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
    }
  });
});
