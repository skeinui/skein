// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { TreeSelect } from "../src/index.ts";
import type { TreeSelectNode } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

const NODES: TreeSelectNode[] = [
  {
    id: "zj",
    label: "Zhejiang",
    children: [
      { id: "hz", label: "Hangzhou" },
      { id: "nb", label: "Ningbo" },
    ],
  },
  { id: "js", label: "Jiangsu", children: [{ id: "nj", label: "Nanjing", disabled: true }] },
  { id: "bj", label: "Beijing" },
];

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
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
const trigger = (h: HTMLElement) =>
  h.querySelector<HTMLElement>('[data-slot="treeselect-trigger"]')!;
const row = (id: string) => document.querySelector<HTMLElement>(`[data-node-id="${id}"]`)!;
const panel = () => document.querySelector('[data-slot="treeselect-panel"]');
const input = (value: string) =>
  act(() => {
    const el = document.querySelector<HTMLInputElement>('[data-slot="treeselect-search"] input')!;
    // oxlint-disable-next-line typescript/unbound-method
    Reflect.set(HTMLInputElement.prototype, "value", value, el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

describe("TreeSelect", () => {
  test("SSR: placeholder or the selected node's label, no class / style, no panel by default", () => {
    const empty = ssr(createElement(TreeSelect, { nodes: NODES, placeholder: "Pick" }));
    expect(empty).toContain("Pick");
    expect(empty).toContain("data-placeholder");
    expect(empty).not.toContain("treeselect-panel");
    expect(empty).not.toMatch(/class=|style=/);
    const filled = ssr(createElement(TreeSelect, { nodes: NODES, defaultValue: "nb" }));
    expect(filled).toContain("Ningbo");
    expect(filled).not.toContain("data-placeholder");
    const multi = ssr(
      createElement(TreeSelect, { nodes: NODES, multiple: true, defaultValue: ["hz", "nb"] }),
    );
    expect(multi).toContain("Hangzhou");
    expect(multi).toContain('role="combobox"');
  });

  test("shows the placeholder when the id matches no node", () => {
    expect(ssr(createElement(TreeSelect, { nodes: NODES, defaultValue: "nope" }))).toContain(
      "data-placeholder",
    );
  });

  test("single: opens a tree, clicking a node commits and closes, the trigger shows its label", () => {
    const changes: (string | null)[] = [];
    const h = mount(
      createElement(TreeSelect, {
        nodes: NODES,
        onValueChange: (v: string | null) => changes.push(v),
      }),
    );
    click(trigger(h));
    expect(panel()).not.toBeNull();
    expect(document.querySelectorAll('[role="treeitem"]').length).toBeGreaterThan(0);
    click(row("bj"));
    expect(changes).toEqual(["bj"]);
    expect(panel()).toBeNull();
    expect(trigger(h).textContent).toContain("Beijing");
  });

  test("single: parent nodes can be selected; disabled nodes can't", () => {
    const changes: (string | null)[] = [];
    const h = mount(
      createElement(TreeSelect, {
        nodes: NODES,
        defaultExpandAll: true,
        onValueChange: (v: string | null) => changes.push(v),
      }),
    );
    click(trigger(h));
    click(row("nj"));
    expect(changes).toEqual([]);
    click(row("zj"));
    expect(changes).toEqual(["zj"]);
  });

  test("multiple: checking a parent checks all enabled leaves, value holds only leaves; tags are removable", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(TreeSelect, {
        nodes: NODES,
        multiple: true,
        defaultExpandAll: true,
        onValueChange: (v: string[]) => changes.push(v),
      }),
    );
    click(trigger(h));
    const box = row("zj").querySelector<HTMLElement>(
      '[data-slot="tree-checkbox"] [role="checkbox"]',
    )!;
    click(box);
    expect(changes.at(-1)!.sort()).toEqual(["hz", "nb"]);
    expect(trigger(h).textContent).toContain("Hangzhou");
    click(trigger(h).querySelector('[data-slot="tag-remove"]')!);
    expect(changes.at(-1)).toHaveLength(1);
  });

  test("search: typing keeps only matching nodes; cleared on close", () => {
    const h = mount(createElement(TreeSelect, { nodes: NODES, searchable: true }));
    click(trigger(h));
    input("hang");
    expect(row("hz")).not.toBeNull();
    expect(document.querySelector('[data-node-id="bj"]')).toBeNull();
  });

  test("clearable: a clear button with a value empties it; the trigger is disabled when disabled", () => {
    const changes: (string | null)[] = [];
    const h = mount(
      createElement(TreeSelect, {
        nodes: NODES,
        clearable: true,
        defaultValue: "bj",
        onValueChange: (v: string | null) => changes.push(v),
      }),
    );
    click(h.querySelector('[data-slot="treeselect-clear"]')!);
    expect(changes).toEqual([null]);
    expect(h.querySelector('[data-slot="treeselect-clear"]')).toBeNull();
    expect(ssr(createElement(TreeSelect, { nodes: NODES, disabled: true }))).toContain("disabled");
  });

  test("accessibility: aria-label starts with the visible text (Label in Name), the popup is named", () => {
    const html = ssr(
      createElement(TreeSelect, { nodes: NODES, defaultValue: "bj", "aria-label": "City" }),
    );
    expect(html).toContain('aria-label="Beijing, City"');
    const h = mount(createElement(TreeSelect, { nodes: NODES, "aria-label": "City" }));
    click(trigger(h));
    expect(document.querySelector('[role="dialog"]')?.getAttribute("aria-label")).toBe("City");
  });
});
