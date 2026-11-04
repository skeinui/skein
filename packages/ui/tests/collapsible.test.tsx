// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Collapsible } from "../src/index.ts";

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
  return host;
}
const demo = (props: Record<string, unknown> = {}, triggerProps: Record<string, unknown> = {}) =>
  createElement(
    Collapsible,
    props,
    createElement(Collapsible.Trigger, triggerProps, "More"),
    createElement(Collapsible.Panel, null, "Hidden stuff"),
  );
const click = (el: Element) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });

describe("Collapsible", () => {
  test("SSR: trigger has aria-expanded=false and an arrow; collapsed by default, the panel content is not in the accessibility tree; no class / style", () => {
    const html = ssr(demo());
    expect(html).toContain('data-slot="collapsible"');
    const button = /<button[^>]*>/.exec(html)![0];
    expect(button).toContain('data-slot="collapsible-trigger"');
    expect(button).toContain('aria-expanded="false"');
    expect(html).toContain('data-slot="collapsible-icon"');
    expect(html).not.toContain("Hidden stuff");
    expect(html).not.toMatch(/class=|style=/);
  });

  test("defaultOpen: the panel is open, data-panel-open for the arrow is on the trigger", async () => {
    const el = await mount(demo({ defaultOpen: true }));
    expect(el.textContent).toContain("Hidden stuff");
    expect(
      el.querySelector("[data-slot=collapsible-trigger]")!.hasAttribute("data-panel-open"),
    ).toBe(true);
  });

  test("clicking the trigger opens / closes, onOpenChange gets the new state, aria-controls points to the panel", async () => {
    const onOpenChange = vi.fn();
    const el = await mount(demo({ onOpenChange }));
    const btn = el.querySelector<HTMLButtonElement>("[data-slot=collapsible-trigger]")!;
    await click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange.mock.calls[0]![0]).toBe(true);
    const panel = el.querySelector("[data-slot=collapsible-panel]")!;
    expect(btn.getAttribute("aria-controls")).toBe(panel.id);
    await click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  test("controlled open: clicking only notifies; disabled does not respond", async () => {
    const onOpenChange = vi.fn();
    const el = await mount(demo({ open: false, onOpenChange }));
    await click(el.querySelector("[data-slot=collapsible-trigger]")!);
    expect(onOpenChange).toHaveBeenCalled();
    expect(el.querySelector("[data-slot=collapsible-trigger]")!.getAttribute("aria-expanded")).toBe(
      "false",
    );
    await act(async () => root!.unmount());
    host!.remove();
    const el2 = await mount(demo({ disabled: true }));
    const btn = el2.querySelector<HTMLButtonElement>("[data-slot=collapsible-trigger]")!;
    await click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  test("icon={false} renders no arrow; keyboard: the trigger is a <button>, Enter / Space fire click natively", () => {
    const html = ssr(demo({}, { icon: false }));
    expect(html).not.toContain("collapsible-icon");
    expect(html).toMatch(/<button[^>]*type="button"/);
  });
});
