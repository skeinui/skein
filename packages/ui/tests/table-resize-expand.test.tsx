// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Table } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
}

const handle = () => document.querySelector<HTMLElement>('[data-slot="table-resize-handle"]')!;
const th = () => document.querySelector<HTMLElement>('[data-slot="table-head"]')!;
const pointer = (el: Element, type: string, clientX: number) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button: 0 }));
  });
const keydown = (el: Element, key: string, shiftKey = false) =>
  act(async () => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }),
    );
  });

function Resizable(props: {
  min?: number;
  max?: number;
  onResize?: (w: number) => void;
  onResizeEnd?: (w: number) => void;
}) {
  const [width, setWidth] = useState(200);
  return createElement(
    Table,
    { "aria-label": "t" },
    createElement(
      Table.Header,
      null,
      createElement(
        Table.Row,
        null,
        createElement(
          Table.Head,
          {
            resizable: true,
            width,
            minWidth: props.min,
            maxWidth: props.max,
            onResizeEnd: props.onResizeEnd,
            onResize: (w: number) => {
              setWidth(w);
              props.onResize?.(w);
            },
          },
          "Name",
        ),
        createElement(Table.Head, null, "Other"),
      ),
    ),
    createElement(
      Table.Body,
      null,
      createElement(
        Table.Row,
        null,
        createElement(Table.Cell, null, "a"),
        createElement(Table.Cell, null, "b"),
      ),
    ),
  );
}

describe("Table resizable columns", () => {
  test("SSR: the handle is a separator, no class / style", () => {
    const html = ssr(
      createElement(
        Table,
        null,
        createElement(
          Table.Header,
          null,
          createElement(
            Table.Row,
            null,
            createElement(Table.Head, { resizable: true, width: 120, maxWidth: 400 }, "A"),
          ),
        ),
      ),
    );
    expect(html).toContain('data-slot="table-resize-handle"');
    expect(html).toContain('role="separator"');
    expect(html).toContain('aria-orientation="vertical"');
    expect(html).toContain('aria-valuenow="120"');
    expect(html).toContain('aria-valuemin="48"');
    expect(html).toContain('aria-valuemax="400"');
    expect(html).toContain('data-width="120"');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("no handle without resizable", () => {
    const html = ssr(
      createElement(
        Table,
        null,
        createElement(
          Table.Header,
          null,
          createElement(Table.Row, null, createElement(Table.Head, { width: 100 }, "A")),
        ),
      ),
    );
    expect(html).not.toContain("resize-handle");
  });

  test("widths are written as --tbl-col-w, the table gets --tbl-sum", async () => {
    await mount(createElement(Resizable, {}));
    expect(th().style.getPropertyValue("--tbl-col-w")).toBe("200px");
    const table = document.querySelector<HTMLElement>('[data-slot="table"]')!;
    expect(table.hasAttribute("data-sized")).toBe(true);
    // 200 + the 96 reserved for the other column (no width set)
    expect(table.style.getPropertyValue("--tbl-sum")).toBe("296px");
  });

  test("pointer drag: width = start width + delta, limited by min / max", async () => {
    const onResize = vi.fn();
    const onResizeEnd = vi.fn();
    await mount(createElement(Resizable, { min: 100, max: 260, onResize, onResizeEnd }));
    await pointer(handle(), "pointerdown", 500);
    expect(th().hasAttribute("data-resizing")).toBe(true);
    await pointer(handle(), "pointermove", 530);
    expect(onResize).toHaveBeenLastCalledWith(230);
    await pointer(handle(), "pointermove", 700);
    expect(onResize).toHaveBeenLastCalledWith(260);
    await pointer(handle(), "pointermove", 100);
    expect(onResize).toHaveBeenLastCalledWith(100);
    expect(onResizeEnd).not.toHaveBeenCalled(); // not called while dragging
    await pointer(handle(), "pointerup", 100);
    expect(onResizeEnd).toHaveBeenCalledTimes(1);
    expect(onResizeEnd).toHaveBeenCalledWith(100);
    expect(th().hasAttribute("data-resizing")).toBe(false);
    expect(th().style.getPropertyValue("--tbl-col-w")).toBe("100px");
    // Moving again after release no longer takes effect
    onResize.mockClear();
    await pointer(handle(), "pointermove", 300);
    expect(onResize).not.toHaveBeenCalled();
  });

  test("press without moving: no onResizeEnd", async () => {
    const onResizeEnd = vi.fn();
    await mount(createElement(Resizable, { onResizeEnd }));
    await pointer(handle(), "pointerdown", 500);
    await pointer(handle(), "pointerup", 500);
    expect(onResizeEnd).not.toHaveBeenCalled();
  });

  test("keyboard: arrows ±10, Shift ±50, Home / End", async () => {
    const onResize = vi.fn();
    const onResizeEnd = vi.fn();
    await mount(createElement(Resizable, { min: 100, max: 300, onResize, onResizeEnd }));
    await keydown(handle(), "ArrowRight");
    expect(onResize).toHaveBeenLastCalledWith(210);
    expect(onResizeEnd).toHaveBeenLastCalledWith(210); // each key press is a complete resize
    await keydown(handle(), "ArrowLeft", true);
    expect(onResize).toHaveBeenLastCalledWith(160);
    await keydown(handle(), "Home");
    expect(onResize).toHaveBeenLastCalledWith(100);
    await keydown(handle(), "End");
    expect(onResize).toHaveBeenLastCalledWith(300);
    expect(handle().getAttribute("aria-valuenow")).toBe("300");
    expect(handle().tabIndex).toBe(0);
  });
});

function Expandable() {
  const [open, setOpen] = useState<string[]>([]);
  const rows = ["a", "b"];
  return createElement(
    Table,
    { "aria-label": "t" },
    createElement(
      Table.Body,
      null,
      ...rows.flatMap((id) => {
        const expanded = open.includes(id);
        return [
          createElement(
            Table.Row,
            { key: id, expanded },
            createElement(
              Table.Cell,
              { kind: "expand" },
              createElement(Table.ExpandButton, {
                expanded,
                "aria-controls": `detail-${id}`,
                onToggle: () =>
                  setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id])),
              }),
            ),
            createElement(Table.Cell, null, id),
          ),
          expanded
            ? createElement(
                Table.ExpandedRow,
                { key: `${id}-x`, id: `detail-${id}`, colSpan: 2 },
                `detail ${id}`,
              )
            : null,
        ];
      }),
    ),
  );
}

describe("Table expandable rows", () => {
  test("SSR: ARIA and slot of the expand button, no class / style", () => {
    const html = ssr(
      createElement(
        Table,
        null,
        createElement(
          Table.Body,
          null,
          createElement(
            Table.Row,
            { expanded: true },
            createElement(
              Table.Cell,
              { kind: "expand" },
              createElement(Table.ExpandButton, { expanded: true, onToggle: () => {} }),
            ),
          ),
          createElement(Table.ExpandedRow, { colSpan: 1 }, "x"),
        ),
      ),
    );
    expect(html).toContain('data-slot="table-expand-button"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-label="Collapse row"');
    expect(html).toContain('data-kind="expand"');
    expect(html).toContain('data-slot="table-expanded-cell"');
    expect(html).toContain('colSpan="1"');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("the button expands / collapses; aria-expanded and aria-controls match the expanded row", async () => {
    await mount(createElement(Expandable));
    const button = () => document.querySelector<HTMLElement>('[data-slot="table-expand-button"]')!;
    expect(button().getAttribute("aria-expanded")).toBe("false");
    expect(button().getAttribute("aria-label")).toBe("Expand row");
    expect(document.querySelector('[data-slot="table-expanded-row"]')).toBeNull();
    await act(async () => button().click());
    expect(button().getAttribute("aria-expanded")).toBe("true");
    expect(button().getAttribute("aria-label")).toBe("Collapse row");
    const target = document.getElementById(button().getAttribute("aria-controls")!)!;
    expect(target.textContent).toBe("detail a");
    expect(target.getAttribute("colspan")).toBe("2");
    expect(document.querySelector('[data-slot="table-row"][data-expanded]')).not.toBeNull();
    await act(async () => button().click());
    expect(document.querySelector('[data-slot="table-expanded-row"]')).toBeNull();
  });

  test("the button is a native button: Enter / Space handled by the browser, type=button", async () => {
    await mount(createElement(Expandable));
    const b = document.querySelector<HTMLButtonElement>('[data-slot="table-expand-button"]')!;
    expect(b.tagName).toBe("BUTTON");
    expect(b.type).toBe("button");
  });
});

describe("Table expanded rows and stripes", () => {
  test("only data rows count when expanded: even data rows get data-stripe, restored after collapsing", async () => {
    await mount(createElement(Expandable));
    const body = () => document.querySelector<HTMLElement>('[data-slot="table-body"]')!;
    const rows = () => [...document.querySelectorAll<HTMLElement>('[data-slot="table-row"]')];
    expect(body().hasAttribute("data-stripe-managed")).toBe(false);
    const buttons = () => [
      ...document.querySelectorAll<HTMLElement>('[data-slot="table-expand-button"]'),
    ];
    await act(async () => buttons()[0]!.click());
    // MutationObserver callbacks are microtasks, wait one round
    await act(async () => {
      await Promise.resolve();
    });
    expect(body().hasAttribute("data-stripe-managed")).toBe(true);
    expect(rows().map((r) => r.hasAttribute("data-stripe"))).toEqual([false, true]);
    await act(async () => buttons()[0]!.click());
    await act(async () => {
      await Promise.resolve();
    });
    expect(body().hasAttribute("data-stripe-managed")).toBe(false);
    expect(rows().some((r) => r.hasAttribute("data-stripe"))).toBe(false);
  });
});
