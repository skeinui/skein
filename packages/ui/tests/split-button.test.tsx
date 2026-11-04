// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { SplitButton } from "../src/index.ts";
import type { SplitButtonEntry, SplitButtonProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
  return host;
}
const ITEMS: SplitButtonEntry[] = [
  { key: "draft", label: "Save as draft" },
  { key: "copy", label: "Save a copy", disabled: true },
  { type: "separator" },
  { key: "discard", label: "Discard", danger: true },
];
const make = (props: Partial<Omit<SplitButtonProps, "children">> = {}) =>
  createElement(SplitButton, { items: ITEMS, children: "Save", ...props });
const menuItems = () => [...document.querySelectorAll<HTMLElement>("[data-slot=menu-item]")];

describe("SplitButton", () => {
  test("SSR: a main button and an arrow button in a button-group; the icon-only arrow is named and has aria-haspopup=menu; no class / style", () => {
    const html = ssr(make());
    expect(html).toMatch(/<div role="group"[^>]*data-slot="button-group"/);
    expect(html.match(/data-slot="button"/g)).toHaveLength(2);
    expect(html).toContain("Save");
    expect(html).toMatch(/<button[^>]*aria-label="More actions"[^>]*>/);
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain("data-icon-only");
    expect(html).not.toMatch(/class=|style=/);
  });

  test("variant / color / size reach both buttons through ButtonGroup; menuLabel can be changed", () => {
    const html = ssr(
      make({ variant: "solid", color: "primary", size: "sm", menuLabel: "Other actions" }),
    );
    expect(html).toContain('data-variant="solid"');
    expect(html).toContain('data-color="primary"');
    expect(html).toContain('data-size="sm"');
    expect(html).toContain('aria-label="Other actions"');
  });

  test("clicking the main button only calls onClick, no menu", async () => {
    const onClick = vi.fn();
    const el = await mount(make({ onClick }));
    await act(async () => el.querySelector<HTMLElement>("[data-slot=button]")!.click());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(menuItems()).toHaveLength(0);
  });

  test("open: items rendered from data, disabled ones aria-disabled, danger ones data-color=danger, separators", async () => {
    await mount(make({ open: true }));
    expect(menuItems().map((i) => i.textContent)).toEqual([
      "Save as draft",
      "Save a copy",
      "Discard",
    ]);
    expect(menuItems()[1]!.getAttribute("aria-disabled")).toBe("true");
    expect(menuItems()[2]!.getAttribute("data-color")).toBe("danger");
    expect(document.querySelector("[data-slot=menu-separator]")).not.toBeNull();
    expect(document.querySelector("[role=menu]")).not.toBeNull();
  });

  test("picking an item calls item.onSelect and onSelect and closes the menu; disabled items don't fire", async () => {
    const onSelect = vi.fn();
    const itemSelect = vi.fn();
    const onOpenChange = vi.fn();
    const items: SplitButtonEntry[] = [
      { key: "a", label: "A", onSelect: itemSelect },
      { key: "b", label: "B", disabled: true },
    ];
    await mount(make({ items, onSelect, onOpenChange, defaultOpen: true }));
    await act(async () => menuItems()[1]!.click());
    expect(onSelect).not.toHaveBeenCalled();
    await act(async () => menuItems()[0]!.click());
    expect(itemSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("a");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("disabled disables both buttons", () => {
    const html = ssr(make({ disabled: true }));
    expect(html.match(/disabled=""/g)!.length).toBeGreaterThanOrEqual(2);
  });
});
