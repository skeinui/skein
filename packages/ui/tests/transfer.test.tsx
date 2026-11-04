// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Transfer } from "../src/index.ts";
import type { TransferItem } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

const ITEMS: TransferItem[] = [
  { key: "a", label: "Apple" },
  { key: "b", label: "Banana" },
  { key: "c", label: "Cherry", disabled: true },
  { key: "d", label: "Date" },
];

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
function mount(el: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(el));
  return host;
}
const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
const typeInto = (input: HTMLInputElement, v: string) =>
  act(() => {
    Reflect.set(HTMLInputElement.prototype, "value", v, input);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

const list = (h: HTMLElement, side: "source" | "target") =>
  h.querySelector<HTMLElement>(`[data-slot="transfer-list"][data-side="${side}"]`)!;
const labels = (el: HTMLElement) =>
  [...el.querySelectorAll('[data-slot="transfer-item"]')].map((e) => e.textContent);
const boxFor = (el: HTMLElement, text: string) =>
  [...el.querySelectorAll<HTMLElement>('[data-slot="transfer-item"]')]
    .find((e) => e.textContent === text)!
    .querySelector<HTMLElement>('[role="checkbox"]')!;
const move = (h: HTMLElement, label: string) =>
  click(h.querySelector<HTMLElement>(`button[aria-label="${label}"]`)!);

describe("Transfer", () => {
  test("SSR: two lists with two buttons between them, no class / style", () => {
    const html = ssr(
      createElement(Transfer, { items: ITEMS, defaultValue: ["d"], titles: ["All", "Chosen"] }),
    );
    expect(html.match(/data-slot="transfer-list"/g)).toHaveLength(2);
    expect(html).toContain('data-side="source"');
    expect(html).toContain('data-side="target"');
    expect(html).toContain("Apple");
    expect(html).toContain("0/3");
    expect(html).toContain("0/1");
    // Base UI's checkbox writes visually hidden inline styles on the hidden native input, strip them before checking
    const plain = html.replace(/<input[^>]*>/g, "").replace(/<span style="[^"]*"><\/span>/g, "");
    expect(plain).not.toContain("class=");
    expect(plain).not.toContain("style=");
  });

  test("checking items on the left and moving right calls onValueChange with the new keys, both lists update", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Transfer, { items: ITEMS, onValueChange: (v: string[]) => changes.push(v) }),
    );
    expect(labels(list(h, "source"))).toEqual(["Apple", "Banana", "Cherry", "Date"]);
    click(boxFor(list(h, "source"), "Banana"));
    click(boxFor(list(h, "source"), "Apple"));
    expect(list(h, "source").querySelector('[data-slot="transfer-count"]')!.textContent).toBe(
      "2/4",
    );
    move(h, "Move to target");
    expect(changes.at(-1)).toEqual(["a", "b"].sort((x, y) => (x < y ? -1 : 1)));
    expect(labels(list(h, "target"))).toEqual(["Apple", "Banana"]);
    expect(labels(list(h, "source"))).toEqual(["Cherry", "Date"]);
  });

  test("move buttons are disabled with nothing checked; moving back left", () => {
    const h = mount(createElement(Transfer, { items: ITEMS, defaultValue: ["a", "b"] }));
    const right = h.querySelector<HTMLButtonElement>('button[aria-label="Move to target"]')!;
    const left = h.querySelector<HTMLButtonElement>('button[aria-label="Move to source"]')!;
    expect(right.hasAttribute("disabled") || right.hasAttribute("data-disabled")).toBe(true);
    expect(left.hasAttribute("disabled") || left.hasAttribute("data-disabled")).toBe(true);
    click(boxFor(list(h, "target"), "Apple"));
    move(h, "Move to source");
    expect(labels(list(h, "target"))).toEqual(["Banana"]);
    expect(labels(list(h, "source"))).toContain("Apple");
  });

  test("select all: only enabled items; disabled ones are neither checked nor moved", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Transfer, { items: ITEMS, onValueChange: (v: string[]) => changes.push(v) }),
    );
    const all = list(h, "source").querySelector<HTMLElement>(
      '[data-slot="transfer-header"] [role="checkbox"]',
    )!;
    click(all);
    expect(list(h, "source").querySelector('[data-slot="transfer-count"]')!.textContent).toBe(
      "3/4",
    );
    move(h, "Move to target");
    expect(changes.at(-1)).toEqual(["a", "b", "d"]);
    expect(labels(list(h, "source"))).toEqual(["Cherry"]);
  });

  test("search: filters by label, select all only applies to the filtered items", () => {
    const h = mount(createElement(Transfer, { items: ITEMS, searchable: true }));
    const search = list(h, "source").querySelector<HTMLInputElement>(
      '[data-slot="transfer-search"] input',
    )!;
    typeInto(search, "an");
    expect(labels(list(h, "source"))).toEqual(["Banana"]);
    click(list(h, "source").querySelector('[data-slot="transfer-header"] [role="checkbox"]')!);
    expect(list(h, "source").querySelector('[data-slot="transfer-count"]')!.textContent).toBe(
      "1/4",
    );
    typeInto(search, "zzz");
    expect(list(h, "source").querySelector('[data-slot="transfer-empty"]')!.textContent).toBe(
      "No data",
    );
  });

  test("oneWay: only the move-right button, no checkboxes on the right", () => {
    const h = mount(createElement(Transfer, { items: ITEMS, defaultValue: ["a"], oneWay: true }));
    expect(h.querySelector('button[aria-label="Move to source"]')).toBeNull();
    expect(list(h, "target").querySelector('[role="checkbox"]')).toBeNull();
    expect(list(h, "target").querySelector('[data-slot="transfer-label"]')!.textContent).toBe(
      "Apple",
    );
  });

  test("controlled value: moving only calls back, no internal change", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Transfer, {
        items: ITEMS,
        value: [],
        onValueChange: (v: string[]) => changes.push(v),
      }),
    );
    click(boxFor(list(h, "source"), "Apple"));
    move(h, "Move to target");
    expect(changes.at(-1)).toEqual(["a"]);
    expect(labels(list(h, "target"))).toEqual([]);
  });

  test("disabled: nothing can be clicked", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Transfer, {
        items: ITEMS,
        disabled: true,
        onValueChange: (v: string[]) => changes.push(v),
      }),
    );
    click(boxFor(list(h, "source"), "Apple"));
    expect(list(h, "source").querySelector('[data-slot="transfer-count"]')!.textContent).toBe(
      "0/4",
    );
    expect(h.querySelector("[data-slot=transfer]")!.hasAttribute("data-disabled")).toBe(true);
  });
});
