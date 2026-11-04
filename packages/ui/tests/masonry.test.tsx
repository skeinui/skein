// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { Masonry, layoutMasonry, resolveResponsive } from "../src/index.ts";
import type { MasonryProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("layoutMasonry", () => {
  test("each item goes into the shortest column, leftmost on ties; total height drops the trailing gap", () => {
    const { placed, height } = layoutMasonry([100, 50, 80, 40], 2, 10);
    expect(placed.map((p) => p.column)).toEqual([0, 1, 1, 0]);
    expect(placed.map((p) => p.y)).toEqual([0, 0, 60, 110]);
    // Column 0: 100 + 10 + 40 = 150, column 1: 50 + 10 + 80 = 140 (plus one gap each) -> take the tallest, 150
    expect(height).toBe(150);
    expect(layoutMasonry([], 3, 8).height).toBe(0);
  });

  test("items with a fixed column go there (clamped), the rest fill the shortest", () => {
    const { placed } = layoutMasonry([10, 10, 10, 10], 3, 0, [2, undefined, 9, -1]);
    expect(placed.map((p) => p.column)).toEqual([2, 0, 2, 0]);
  });
});

describe("resolveResponsive", () => {
  test("a number as is; an object takes the largest reached breakpoint, or the smallest if none; undefined uses the fallback", () => {
    expect(resolveResponsive(4, 100, 3)).toBe(4);
    const v = { xs: 1, md: 3, xl: 5 };
    expect(resolveResponsive(v, 300, 9)).toBe(1);
    expect(resolveResponsive(v, 800, 9)).toBe(3);
    expect(resolveResponsive(v, 1300, 9)).toBe(5);
    expect(resolveResponsive({ md: 3 }, 100, 9)).toBe(3);
    expect(resolveResponsive(undefined, 100, 9)).toBe(9);
  });
});

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
beforeEach(() => {
  // jsdom has no layout: an item's height is read from the data-h of the first element inside it
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      const el = this as HTMLElement;
      return el.dataset.slot === "masonry-item"
        ? Number(el.firstElementChild?.getAttribute("data-h") ?? 0)
        : 0;
    },
  });
});
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetHeight;
});
const cell = (h: number, key: number) => createElement("div", { key, "data-h": h }, `#${key}`);
async function mount(props: Partial<MasonryProps> & { heights?: number[] }) {
  const { heights = [100, 50, 80, 40], ...rest } = props;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(
      createElement(
        Masonry,
        { columns: 2, gutter: 10, "aria-label": "Gallery", ...rest },
        heights.map((h, i) => cell(h, i)),
      ),
    );
  });
  return document.querySelector<HTMLElement>('[data-slot="masonry"]')!;
}
const items = (el: HTMLElement) => [
  ...el.querySelectorAll<HTMLElement>('[data-slot="masonry-item"]'),
];

describe("Masonry", () => {
  test("SSR: ul / li, no data-ready before layout, no class / style; DOM order is item order", () => {
    const html = renderToStaticMarkup(
      createElement(Masonry, {
        columns: 2,
        "aria-label": "Gallery",
        items: [
          { key: "a", data: "A" },
          { key: "b", data: "B" },
        ],
        itemRender: (i) => String(i.data),
      }),
    );
    expect(html).toContain('<ul data-slot="masonry"');
    expect(html).toContain('aria-label="Gallery"');
    expect(html.match(/<li data-slot="masonry-item"/g)).toHaveLength(2);
    expect(html).not.toContain("data-ready");
    expect(html.indexOf(">A<")).toBeLessThan(html.indexOf(">B<"));
    expect(html).not.toMatch(/class=|style=/);
  });

  test("laid out after mount: item columns, vertical positions and container height as variables, data-ready set", async () => {
    const el = await mount({});
    expect(el.hasAttribute("data-ready")).toBe(true);
    expect(el.style.getPropertyValue("--ms-cols")).toBe("2");
    expect(el.style.getPropertyValue("--ms-gx")).toBe("10px");
    expect(items(el).map((i) => i.style.getPropertyValue("--ms-col"))).toEqual([
      "0",
      "1",
      "1",
      "0",
    ]);
    expect(items(el).map((i) => i.style.getPropertyValue("--ms-y"))).toEqual([
      "0px",
      "0px",
      "60px",
      "110px",
    ]);
    expect(el.style.getPropertyValue("--ms-height")).toBe("150px");
  });

  test("onLayoutChange gets the item columns; not called again when the layout is unchanged", async () => {
    const onLayoutChange = vi.fn();
    await mount({ onLayoutChange });
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(onLayoutChange.mock.calls[0]![0]).toEqual([
      { key: "0", column: 0 },
      { key: "1", column: 1 },
      { key: "2", column: 1 },
      { key: "3", column: 0 },
    ]);
  });

  test("data-driven items: item.column fixes the column, item.children wins over itemRender", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(
        createElement(Masonry, {
          columns: 3,
          items: [
            { key: "a", data: "A", height: 10, column: 2 },
            { key: "b", data: "B", height: 10 },
            { key: "c", children: createElement("b", { "data-h": 5 }, "custom") },
          ],
          itemRender: (i: { data?: unknown }) =>
            createElement("span", { "data-h": 10 }, String(i.data)),
        } as never),
      );
    });
    const el = document.querySelector<HTMLElement>('[data-slot="masonry"]')!;
    expect(items(el).map((i) => i.style.getPropertyValue("--ms-col"))).toEqual(["2", "0", "1"]);
    expect(items(el)[2]!.textContent).toBe("custom");
  });
});
