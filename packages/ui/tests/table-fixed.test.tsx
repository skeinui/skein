// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Table } from "../src/index.ts";
import { withoutScrollAreaInternals } from "./base-ui-markup.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const WIDTHS: Record<string, number> = { a: 100, b: 60, c: 80, d: 70 };
Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  get() {
    return WIDTHS[(this as HTMLElement).dataset.col ?? ""] ?? 0;
  },
});

const table = () =>
  createElement(
    Table,
    { "aria-label": "t" },
    createElement(
      Table.Header,
      null,
      createElement(
        Table.Row,
        null,
        createElement(Table.Head, { fixed: "start", "data-col": "a" } as never, "A"),
        createElement(Table.Head, { fixed: "start", "data-col": "b" } as never, "B"),
        createElement(Table.Head, { "data-col": "c" } as never, "C"),
        createElement(Table.Head, { fixed: "end", "data-col": "d" } as never, "D"),
      ),
    ),
    createElement(
      Table.Body,
      null,
      createElement(
        Table.Row,
        null,
        createElement(Table.Cell, { fixed: "start", "data-col": "a" } as never, "1"),
        createElement(Table.Cell, { fixed: "start", "data-col": "b" } as never, "2"),
        createElement(Table.Cell, { "data-col": "c" } as never, "3"),
        createElement(Table.Cell, { fixed: "end", "data-col": "d" } as never, "4"),
      ),
    ),
  );

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
async function mount() {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(table());
  });
  return host;
}
const cell = (h: HTMLElement, col: string) =>
  h.querySelector<HTMLElement>(`td[data-col="${col}"]`)!;

describe("Table fixed columns", () => {
  test("SSR: fixed is written as data-fixed, no class / style", () => {
    const html = renderToStaticMarkup(table());
    expect(html.match(/data-fixed="start"/g)).toHaveLength(4);
    expect(html.match(/data-fixed="end"/g)).toHaveLength(2);
    expect(withoutScrollAreaInternals(html)).not.toMatch(/class=|style=/);
  });

  test("each row sums the widths of the fixed columns before (after) into --tbl-fixed; the innermost cell gets data-fixed-edge", async () => {
    const h = await mount();
    expect(cell(h, "a").style.getPropertyValue("--tbl-fixed")).toBe("0px");
    expect(cell(h, "b").style.getPropertyValue("--tbl-fixed")).toBe("100px");
    expect(cell(h, "d").style.getPropertyValue("--tbl-fixed")).toBe("0px");
    expect(cell(h, "b").hasAttribute("data-fixed-edge")).toBe(true);
    expect(cell(h, "a").hasAttribute("data-fixed-edge")).toBe(false);
    expect(cell(h, "d").hasAttribute("data-fixed-edge")).toBe(true);
    expect(cell(h, "c").hasAttribute("data-fixed-edge")).toBe(false);
    const th = h.querySelector<HTMLElement>('th[data-col="b"]')!;
    expect(th.style.getPropertyValue("--tbl-fixed")).toBe("100px");
  });

  test("the container's horizontal scroll position is written as data-scroll-x: none / start / middle / end", async () => {
    const h = await mount();
    const frame = h.querySelector<HTMLElement>('[data-slot="table-container"]')!;
    // The scroller is the viewport of the ScrollArea in the container; the position is written on the container
    const box = frame.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;
    expect(frame.dataset.scrollX).toBe("none");
    const set = (left: number) => {
      Object.defineProperty(box, "scrollWidth", { configurable: true, value: 500 });
      Object.defineProperty(box, "clientWidth", { configurable: true, value: 200 });
      box.scrollLeft = left;
    };
    for (const [left, expected] of [
      [0, "start"],
      [100, "middle"],
      [300, "end"],
    ] as const) {
      set(left);
      await act(async () => {
        box.dispatchEvent(new Event("scroll"));
      });
      expect(frame.dataset.scrollX).toBe(expected);
    }
  });
});
