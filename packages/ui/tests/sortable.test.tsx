// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Sortable, arrayMove } from "../src/index.ts";
import type { SortableItem } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

const ITEMS: SortableItem[] = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
  { id: "c", label: "Gamma" },
  { id: "d", label: "Delta", disabled: true },
];

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
/** A stateful wrapper: the order is held by the "caller", consistent with real usage. */
function Harness({
  onChange,
  orientation,
}: {
  onChange?: (ids: string[]) => void;
  orientation?: "vertical" | "horizontal";
}) {
  const [items, setItems] = useState(ITEMS);
  return createElement(Sortable, {
    items,
    orientation,
    "aria-label": "Tasks",
    onReorder: (ids) => {
      setItems(ids.map((id) => items.find((i) => i.id === id)!));
      onChange?.(ids);
    },
  });
}
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
}
const order = () =>
  [...document.querySelectorAll('[data-slot="sortable-item"]')].map(
    (e) => e.querySelector('[data-slot="sortable-content"]')!.textContent,
  );
const handle = (id: string) =>
  document.querySelector<HTMLButtonElement>(`[data-handle-id="${id}"]`)!;
const key = (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });
const status = () => document.querySelector('[role="status"]')!.textContent;

describe("arrayMove", () => {
  test("moves an item to a new position without mutating the array", () => {
    const src = [1, 2, 3, 4];
    expect(arrayMove(src, 0, 2)).toEqual([2, 3, 1, 4]);
    expect(arrayMove(src, 3, 0)).toEqual([4, 1, 2, 3]);
    expect(src).toEqual([1, 2, 3, 4]);
  });
});

describe("Sortable structure", () => {
  test("SSR: a named list, one named handle per item (aria-pressed, description, roledescription), no class / style", () => {
    const html = ssr(
      createElement(Sortable, { items: ITEMS, onReorder: () => {}, "aria-label": "Tasks" }),
    );
    expect(html).toContain('<ul data-slot="sortable"');
    expect(html).toContain('aria-label="Tasks"');
    expect(html.match(/data-slot="sortable-handle"/g)).toHaveLength(4);
    expect(html).toContain('aria-label="Reorder Alpha"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-roledescription="sortable"');
    expect(html).toContain("Press space to pick up");
    expect(html).toContain("disabled");
    expect(html).not.toMatch(/class=|style=/);
  });

  test("labels can switch language; content is shown over label", () => {
    const html = ssr(
      createElement(Sortable, {
        items: [{ id: "x", label: "Plain", content: createElement("b", null, "Rich") }],
        onReorder: () => {},
        labels: { handle: (l: string) => `Drag ${l}` },
      }),
    );
    expect(html).toContain('aria-label="Drag Plain"');
    expect(html).toContain("<b>Rich</b>");
  });
});

describe("Sortable keyboard", () => {
  test("Space picks up → arrows move → Space drops; focus stays on the handle, announced", async () => {
    const onChange = vi.fn();
    await mount(createElement(Harness, { onChange }));
    handle("a").focus();
    await key(handle("a"), " ");
    expect(handle("a").getAttribute("aria-pressed")).toBe("true");
    expect(status()).toBe("Picked up Alpha. Position 1 of 4.");
    await key(handle("a"), "ArrowDown");
    expect(order()).toEqual(["Beta", "Alpha", "Gamma", "Delta"]);
    expect(onChange).toHaveBeenLastCalledWith(["b", "a", "c", "d"]);
    expect(document.activeElement).toBe(handle("a"));
    expect(status()).toBe("Alpha moved to position 2 of 4.");
    await key(handle("a"), "ArrowDown");
    expect(order()).toEqual(["Beta", "Gamma", "Alpha", "Delta"]);
    await key(handle("a"), " ");
    expect(handle("a").getAttribute("aria-pressed")).toBe("false");
    expect(status()).toBe("Alpha dropped at position 3 of 4.");
  });

  test("arrows do nothing before pick-up; stops at the ends; can't move onto a disabled item's position", async () => {
    await mount(createElement(Harness));
    await key(handle("a"), "ArrowDown");
    expect(order()[0]).toBe("Alpha");
    await key(handle("a"), " ");
    await key(handle("a"), "ArrowUp");
    expect(order()[0]).toBe("Alpha");
    await key(handle("a"), "End");
    expect(order()).toEqual(["Alpha", "Beta", "Gamma", "Delta"]);
    await key(handle("a"), "ArrowDown");
    await key(handle("a"), "ArrowDown");
    expect(order()).toEqual(["Beta", "Gamma", "Alpha", "Delta"]);
  });

  test("Esc cancels: back to the position before pick-up", async () => {
    await mount(createElement(Harness));
    await key(handle("b"), " ");
    await key(handle("b"), "ArrowUp");
    await key(handle("b"), "ArrowUp");
    expect(order()[0]).toBe("Beta");
    await key(handle("b"), "Escape");
    expect(order()).toEqual(["Alpha", "Beta", "Gamma", "Delta"]);
    expect(handle("b").getAttribute("aria-pressed")).toBe("false");
    expect(status()).toContain("cancelled");
  });

  test("horizontal uses left / right, up / down do nothing", async () => {
    await mount(createElement(Harness, { orientation: "horizontal" }));
    await key(handle("a"), " ");
    await key(handle("a"), "ArrowDown");
    expect(order()[0]).toBe("Alpha");
    await key(handle("a"), "ArrowRight");
    expect(order()[1]).toBe("Alpha");
  });
});

describe("Sortable pointer", () => {
  // jsdom has no layout, use manual rects: each item is 40 tall, laid out one after another
  function layout() {
    const els = [...document.querySelectorAll<HTMLElement>('[data-slot="sortable-item"]')];
    els.forEach((el, i) => {
      el.getBoundingClientRect = () =>
        ({
          top: i * 40,
          height: 40,
          left: 0,
          width: 100,
          bottom: i * 40 + 40,
          right: 100,
        }) as DOMRect;
    });
  }
  const ptr = (el: Element, type: string, y: number) =>
    act(async () => {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      Object.assign(ev, { clientX: 10, clientY: y, pointerId: 1, pointerType: "touch", button: 0 });
      el.dispatchEvent(ev);
    });

  test("onReorder only after dropping elsewhere; while dragging, the drop target and follow offset are marked", async () => {
    const onChange = vi.fn();
    await mount(createElement(Harness, { onChange }));
    layout();
    await ptr(handle("a"), "pointerdown", 20);
    await ptr(handle("a"), "pointermove", 95); // other item centers are 80 (b), 120 (c), 160 (d): past b
    const item = (id: string) => handle(id).closest<HTMLElement>('[data-slot="sortable-item"]')!;
    expect(item("a").hasAttribute("data-dragging")).toBe(true);
    expect(item("a").style.getPropertyValue("--sort-offset")).toBe("75px");
    expect(item("c").getAttribute("data-drop")).toBe("before");
    expect(onChange).not.toHaveBeenCalled();
    await ptr(handle("a"), "pointerup", 95);
    expect(onChange).toHaveBeenCalledWith(["b", "a", "c", "d"]);
    expect(item("a").hasAttribute("data-dragging")).toBe(false);
    expect(item("a").style.getPropertyValue("--sort-offset")).toBe("");
    expect(order()).toEqual(["Beta", "Alpha", "Gamma", "Delta"]);
  });

  test("dragging to the end drops after the last item; releasing without moving or cancel doesn't fire", async () => {
    const onChange = vi.fn();
    await mount(createElement(Harness, { onChange }));
    layout();
    await ptr(handle("a"), "pointerdown", 20);
    await ptr(handle("a"), "pointermove", 500);
    expect(handle("d").closest('[data-slot="sortable-item"]')!.getAttribute("data-drop")).toBe(
      "after",
    );
    await ptr(handle("a"), "pointercancel", 500);
    expect(onChange).not.toHaveBeenCalled();
    await ptr(handle("b"), "pointerdown", 60);
    await ptr(handle("b"), "pointerup", 60);
    expect(onChange).not.toHaveBeenCalled();
  });
});
