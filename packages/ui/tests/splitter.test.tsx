// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { Splitter } from "../src/index.ts";
import type { SplitterProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
beforeEach(() => {
  // jsdom has no layout: make the splitter container 600 x 300
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.getAttribute("data-slot") === "splitter"
      ? new DOMRect(0, 0, 600, 300)
      : new DOMRect();
  });
});
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.restoreAllMocks();
});

type PanelProps = { defaultSize?: number | string; min?: number | string; max?: number | string };
function mount(panels: PanelProps[], props: Omit<SplitterProps, "children"> = {}) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      createElement(
        Splitter,
        props,
        ...panels.map((p, i) => createElement(Splitter.Panel, { key: i, ...p }, `panel ${i}`)),
      ),
    ),
  );
  return host;
}
const panelEls = () => [...document.querySelectorAll<HTMLElement>('[data-slot="splitter-panel"]')];
const sizes = () => panelEls().map((p) => p.style.getPropertyValue("--splitter-size") || "rest");
const handle = (i = 0) =>
  document.querySelectorAll<HTMLElement>('[data-slot="splitter-handle"]')[i]!;
const keydown = (el: Element, key: string, shiftKey = false) =>
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }),
    );
  });
const pointer = (el: Element, type: string, x: number, y = 0) =>
  act(() => {
    el.dispatchEvent(
      new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true }),
    );
  });

describe("Splitter", () => {
  test("SSR: panel and handle structure, role=separator, no class / style, no data-ready", () => {
    const html = renderToStaticMarkup(
      createElement(
        Splitter,
        null,
        createElement(Splitter.Panel, { key: 1 }, "A"),
        createElement(Splitter.Panel, { key: 2 }, "B"),
      ),
    );
    expect(html.match(/data-slot="splitter-panel"/g)).toHaveLength(2);
    expect(html.match(/data-slot="splitter-handle"/g)).toHaveLength(1);
    expect(html).toContain('role="separator"');
    expect(html).toContain('data-orientation="horizontal"');
    expect(html).not.toContain("data-ready");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("initial sizes: percentages, pixels, the rest shared by panels without one; the last panel has no size (takes the rest)", () => {
    mount([{ defaultSize: "30%" }, {}]);
    expect(sizes()).toEqual(["180", "rest"]);
    document.body.innerHTML = "";
    act(() => root?.unmount());
    mount([{ defaultSize: 100 }, {}, {}]);
    expect(sizes()).toEqual(["100", "250", "rest"]);
    expect(document.querySelector('[data-slot="splitter"]')!.hasAttribute("data-ready")).toBe(true);
  });

  test("no defaultSize at all: equal split", () => {
    mount([{}, {}, {}]);
    expect(sizes()).toEqual(["200", "200", "rest"]);
  });

  test("initial sizes are clamped to min / max too", () => {
    mount([{ defaultSize: 50, min: 120 }, { defaultSize: 500, max: 300 }, {}]);
    expect(sizes().slice(0, 2)).toEqual(["120", "300"]);
  });

  test("keyboard: arrows ±10, Shift ±50, Home / End to the limits; calls onResize / onResizeEnd; aria stays in sync", () => {
    const resized: number[][] = [];
    const ended: number[][] = [];
    mount([{ defaultSize: 200, min: 100, max: 400 }, { min: 100 }], {
      onResize: (s) => resized.push(s),
      onResizeEnd: (s) => ended.push(s),
    });
    expect(handle().getAttribute("aria-valuenow")).toBe("33"); // the second panel has no size and gets the remaining 400: 200 / (200 + 400)
    keydown(handle(), "ArrowRight");
    expect(sizes()[0]).toBe("210");
    keydown(handle(), "ArrowRight", true);
    expect(sizes()[0]).toBe("260");
    keydown(handle(), "ArrowLeft");
    expect(sizes()[0]).toBe("250");
    keydown(handle(), "End");
    expect(sizes()[0]).toBe("400"); // clamped by max
    keydown(handle(), "Home");
    expect(sizes()[0]).toBe("100"); // clamped by min
    expect(resized.at(-1)).toEqual([100, 500]);
    expect(ended).toHaveLength(5);
    expect(handle().getAttribute("aria-orientation")).toBe("vertical");
  });

  test("pointer drag: down records the start, move applies the delta clamped to min / max, up calls onResizeEnd", () => {
    const ended: number[][] = [];
    mount([{ defaultSize: 200, min: 100, max: 350 }, {}], { onResizeEnd: (s) => ended.push(s) });
    pointer(handle(), "pointerdown", 200);
    expect(document.querySelector('[data-slot="splitter"]')!.hasAttribute("data-dragging")).toBe(
      true,
    );
    expect(handle().hasAttribute("data-active")).toBe(true);
    pointer(handle(), "pointermove", 260);
    expect(sizes()[0]).toBe("260");
    pointer(handle(), "pointermove", 900);
    expect(sizes()[0]).toBe("350"); // max
    pointer(handle(), "pointermove", -900);
    expect(sizes()[0]).toBe("100"); // min
    pointer(handle(), "pointerup", -900);
    expect(ended).toEqual([[100, 500]]);
    expect(document.querySelector('[data-slot="splitter"]')!.hasAttribute("data-dragging")).toBe(
      false,
    );
    // Moving again after release no longer changes anything
    pointer(handle(), "pointermove", 300);
    expect(sizes()[0]).toBe("100");
  });

  test("three panels: dragging the second handle only affects the panels next to it, the first stays", () => {
    mount([{ defaultSize: 100 }, { defaultSize: 200 }, {}]);
    pointer(handle(1), "pointerdown", 300);
    pointer(handle(1), "pointermove", 350);
    pointer(handle(1), "pointerup", 350);
    expect(sizes()).toEqual(["100", "250", "rest"]);
  });

  test("vertical: uses clientY and the container height", () => {
    mount([{ defaultSize: "50%" }, {}], { orientation: "vertical" });
    expect(sizes()[0]).toBe("150");
    expect(handle().getAttribute("aria-orientation")).toBe("horizontal");
    pointer(handle(), "pointerdown", 0, 100);
    pointer(handle(), "pointermove", 0, 130);
    expect(sizes()[0]).toBe("180");
    keydown(handle(), "ArrowDown");
    expect(sizes()[0]).toBe("190");
    keydown(handle(), "ArrowRight"); // left / right do nothing when vertical
    expect(sizes()[0]).toBe("190");
  });

  test("controlled sizes: dragging only calls onResize, the parent decides the sizes", () => {
    const resized: number[][] = [];
    mount([{}, {}], { sizes: [250, 350], onResize: (s) => resized.push(s) });
    expect(sizes()[0]).toBe("250");
    keydown(handle(), "ArrowRight");
    expect(resized.at(-1)).toEqual([260, 340]);
    expect(sizes()[0]).toBe("250"); // unchanged by the parent, still 250
  });

  test("disabled: ignores keyboard and pointer, not in the tab order", () => {
    mount([{ defaultSize: 200 }, {}], { disabled: true });
    keydown(handle(), "ArrowRight");
    pointer(handle(), "pointerdown", 200);
    pointer(handle(), "pointermove", 300);
    expect(sizes()[0]).toBe("200");
    expect(handle().tabIndex).toBe(-1);
    expect(handle().getAttribute("aria-disabled")).toBe("true");
    expect(document.querySelector('[data-slot="splitter"]')!.hasAttribute("data-disabled")).toBe(
      true,
    );
  });

  test("aria-valuemin / max reflect the constraints on both sides", () => {
    mount([{ defaultSize: 300, min: 150, max: 450 }, { min: 100 }]);
    // A pair of panels totals 600: the first has min 150 -> 25%; max is min(450, 600 - 100) = 450 -> 75%
    expect(handle().getAttribute("aria-valuemin")).toBe("25");
    expect(handle().getAttribute("aria-valuemax")).toBe("75");
    expect(handle().getAttribute("aria-valuenow")).toBe("50");
  });
});
