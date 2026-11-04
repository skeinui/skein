// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Marquee } from "../src/index.ts";
import type { MarqueeProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
/** jsdom has no layout: data-slot decides the size, content is 400 wide, viewport is 100 (scrolls) or 1000 (doesn't scroll). */
function stubLayout(viewport: number) {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return (this as HTMLElement).dataset.slot === "marquee-content" ? 400 : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get() {
      return (this as HTMLElement).dataset.slot === "marquee-viewport" ? viewport : 0;
    },
  });
}
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.unstubAllGlobals();
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
}
const marquee = () => document.querySelector<HTMLElement>('[data-slot="marquee"]')!;
const copies = () => document.querySelectorAll('[data-slot="marquee-content"]');
const make = (props: Partial<MarqueeProps> = {}) =>
  createElement(Marquee, {
    "aria-label": "News",
    ...props,
    children: "Breaking news that is long",
  });

describe("Marquee", () => {
  test("SSR: role=marquee, one copy of the content, no button, no class / style", () => {
    const html = renderToStaticMarkup(make());
    expect(html).toContain('role="marquee"');
    expect(html).toContain('aria-label="News"');
    expect(html.match(/data-slot="marquee-content"/g)).toHaveLength(1);
    expect(html).not.toContain("marquee-pause");
    expect(html).not.toMatch(/class=|style=/);
  });

  test("scrolls only when wider than the container: a duplicate (aria-hidden + inert), duration = width / speed, a pause button", async () => {
    stubLayout(100);
    await mount(make({ speed: 100 }));
    expect(marquee().hasAttribute("data-overflow")).toBe(true);
    expect(copies()).toHaveLength(2);
    expect(copies()[1]!.getAttribute("aria-hidden")).toBe("true");
    expect(copies()[1]!.hasAttribute("inert")).toBe(true);
    expect(marquee().style.getPropertyValue("--marquee-duration")).toBe("4s");
    expect(document.querySelector('[data-slot="marquee-pause"]')).not.toBeNull();
  });

  test("content that fits stays still: no duplicate, no button", async () => {
    stubLayout(1000);
    await mount(make());
    expect(marquee().hasAttribute("data-overflow")).toBe(false);
    expect(copies()).toHaveLength(1);
    expect(document.querySelector('[data-slot="marquee-pause"]')).toBeNull();
  });

  test("pause button: aria-pressed toggle, name follows state, calls onPausedChange; paused wins when controlled", async () => {
    stubLayout(100);
    const onPausedChange = vi.fn();
    await mount(make({ onPausedChange }));
    const button = () => document.querySelector<HTMLButtonElement>('[data-slot="marquee-pause"]')!;
    expect(button().getAttribute("aria-label")).toBe("Pause scrolling");
    expect(button().getAttribute("aria-pressed")).toBe("false");
    await act(async () => button().click());
    expect(marquee().hasAttribute("data-paused")).toBe(true);
    expect(button().getAttribute("aria-label")).toBe("Start scrolling");
    expect(onPausedChange).toHaveBeenLastCalledWith(true);
    await act(async () => root!.unmount());
    host!.remove();
    await mount(make({ paused: true, onPausedChange }));
    await act(async () => button().click());
    expect(marquee().hasAttribute("data-paused")).toBe(true);
    expect(onPausedChange).toHaveBeenLastCalledWith(false);
  });

  test("direction / pauseOnHover become attributes, pausable=false removes the button", async () => {
    stubLayout(100);
    await mount(make({ direction: "end", pauseOnHover: false, pausable: false }));
    expect(marquee().getAttribute("data-direction")).toBe("end");
    expect(marquee().hasAttribute("data-pause-on-hover")).toBe(false);
    expect(document.querySelector('[data-slot="marquee-pause"]')).toBeNull();
  });
});
