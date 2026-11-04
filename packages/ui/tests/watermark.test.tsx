// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { Watermark } from "../src/index.ts";
import type { WatermarkProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no canvas: use a fake 2d context that records calls
const calls: Record<string, unknown[][]> = {};
const ctx: Record<string, unknown> = {
  font: "",
  fillStyle: "",
  globalAlpha: 1,
  textAlign: "",
  textBaseline: "",
};
for (const name of ["scale", "save", "restore", "translate", "rotate", "fillText", "drawImage"]) {
  ctx[name] = (...args: unknown[]) => {
    (calls[name] ??= []).push(args);
  };
}
ctx.measureText = (text: string) => ({ width: text.length * 10 });
let canvasAvailable = true;
let dataUrls = 0;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
  ctx.globalAlpha = 1;
  canvasAvailable = true;
  dataUrls = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() =>
    canvasAvailable ? ctx : null) as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(
    () => `data:image/png;base64,AAA${++dataUrls}`,
  );
});
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.restoreAllMocks();
});

function mount(props: Partial<WatermarkProps> = {}) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(createElement(Watermark, { content: "Hi", ...props }, "body")));
}
const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 40)));
const layer = () => document.querySelector<HTMLElement>('[data-slot="watermark-layer"]');
const v = (name: string) => layer()!.style.getPropertyValue(name);

describe("Watermark", () => {
  test("SSR: only container and content, no watermark layer, no class / style", () => {
    const html = renderToStaticMarkup(createElement(Watermark, { content: "x" }, "body"));
    expect(html).toContain('data-slot="watermark"');
    expect(html).toContain("body");
    expect(html).not.toContain("watermark-layer");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("draws the pattern after mount: the layer is aria-hidden with the variables on it, sized as a tile of two staggered marks", async () => {
    mount();
    await settle();
    expect(layer()).not.toBeNull();
    expect(layer()!.getAttribute("aria-hidden")).toBe("true");
    expect(v("--wm-image")).toBe('url("data:image/png;base64,AAA1")');
    // "Hi" is 20 wide, ceil(16 * 1.2) = 20 tall; plus the default gap of 100: cell 120 x 120, the tile cell is twice that
    expect(v("--wm-w")).toBe("240");
    expect(v("--wm-h")).toBe("240");
    expect(v("--wm-z")).toBe("9");
    expect(v("--wm-ox")).toBe("0");
  });

  test("multiple lines: height by line count; width / height / gap / offset / zIndex / rotate all apply", async () => {
    mount({ content: ["ab", "cde"], gap: [10, 20], offset: [5, 6], zIndex: 3, rotate: 30 });
    await settle();
    // The widest line "cde" = 30, two lines tall ceil(2 * 19.2) = 39; cell (30 + 10, 39 + 20) = 40 x 59
    expect(v("--wm-w")).toBe("80");
    expect(v("--wm-h")).toBe("118");
    expect(v("--wm-ox")).toBe("5");
    expect(v("--wm-oy")).toBe("6");
    expect(v("--wm-z")).toBe("3");
    expect(calls.rotate![0]![0]).toBeCloseTo((Math.PI / 180) * 30);
    // Each watermark has two lines, two watermarks are drawn: 4 fillText calls
    expect(calls.fillText).toHaveLength(4);
    act(() => root!.render(createElement(Watermark, { content: "x", width: 200, height: 50 })));
    await settle();
    expect(v("--wm-w")).toBe(String((200 + 100) * 2));
    expect(v("--wm-h")).toBe(String((50 + 100) * 2));
  });

  test("color: defaults to the text color at 15%; a given color is used as is without extra opacity", async () => {
    mount();
    await settle();
    expect(ctx.globalAlpha).toBe(0.15);
    act(() => root!.render(createElement(Watermark, { content: "x", font: { color: "#f00" } })));
    ctx.globalAlpha = 1;
    await settle();
    expect(ctx.fillStyle).toBe("#f00");
    expect(ctx.globalAlpha).toBe(1);
  });

  test("no canvas or empty content: no watermark layer and no error", async () => {
    canvasAvailable = false;
    mount();
    await settle();
    expect(layer()).toBeNull();
    canvasAvailable = true;
    act(() => root!.render(createElement(Watermark, { content: "" })));
    await settle();
    expect(layer()).toBeNull();
  });

  test("image: drawn at width / height (default 120 × 64)", async () => {
    const OriginalImage = globalThis.Image;
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      crossOrigin = "";
      set src(_: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    globalThis.Image = FakeImage as unknown as typeof Image;
    try {
      mount({ content: undefined, image: "/logo.png" });
      await settle();
      expect(calls.drawImage![0]!.slice(1)).toEqual([-60, -32, 120, 64]);
      expect(v("--wm-w")).toBe(String((120 + 100) * 2));
    } finally {
      globalThis.Image = OriginalImage;
    }
  });

  test("anti-tamper: the layer is restored when removed, its style cleared or other attributes added", async () => {
    mount();
    await settle();
    layer()!.remove();
    await settle();
    expect(layer()).not.toBeNull();
    layer()!.removeAttribute("style");
    await settle();
    expect(v("--wm-image")).toContain("data:image");
    layer()!.style.display = "none";
    layer()!.setAttribute("class", "hacked");
    await settle();
    expect(layer()!.style.display).toBe("");
    expect(layer()!.hasAttribute("class")).toBe(false);
    expect(v("--wm-w")).not.toBe("");
  });

  test("antiTamper=false: not restored when removed", async () => {
    mount({ antiTamper: false });
    await settle();
    layer()!.remove();
    await settle();
    expect(layer()).toBeNull();
  });

  test("redraws on theme / theme style changes (html attributes); the layer is removed on unmount", async () => {
    mount();
    await settle();
    const first = v("--wm-image");
    act(() => {
      document.documentElement.setAttribute("data-mode", "dark");
    });
    await settle();
    expect(v("--wm-image")).not.toBe(first);
    document.documentElement.removeAttribute("data-mode");
    act(() => root!.unmount());
    root = null;
    expect(layer()).toBeNull();
  });
});
