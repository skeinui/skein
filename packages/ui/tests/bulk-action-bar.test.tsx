// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { BULK_ACTION_BAR_SLOTS } from "../src/contract.ts";
import { BulkActionBar, ConfigProvider } from "../src/index.ts";
import { zhCN } from "../src/locales/zh-CN.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = root = null;
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root!.render(node));
  return host;
}
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("BulkActionBar", () => {
  test("`offset` is written as the CSS variable the theme style reads", async () => {
    const el = await mount(
      createElement(BulkActionBar, { count: 2, floating: true, offset: 1.5 }, "x"),
    );
    const bar = el.querySelector<HTMLElement>('[data-slot="bulk-action-bar"]')!;
    expect(bar.style.getPropertyValue("--bulk-action-bar-offset")).toBe("1.5rem");
    await act(async () =>
      root!.render(createElement(BulkActionBar, { count: 2, floating: true }, "x")),
    );
    expect(bar.style.getPropertyValue("--bulk-action-bar-offset")).toBe("");
  });

  test("nothing is selected: nothing is shown", () => {
    expect(ssr(createElement(BulkActionBar, { count: 0 }))).toBe("");
  });

  test("a toolbar with the count, the actions and the slot / placement hooks; no class", () => {
    expect(BULK_ACTION_BAR_SLOTS).toEqual(["bulk-action-bar", "bulk-action-bar-anchor"]);
    const html = ssr(createElement(BulkActionBar, { count: 3, onClear: () => {} }, "Delete"));
    expect(html).toContain('data-slot="bulk-action-bar"');
    expect(html).toContain('data-placement="top"');
    expect(html).toContain('role="toolbar"');
    expect(html).toContain("3 selected");
    expect(html).toContain("Delete");
    expect(html).toContain("Clear");
    expect(html).not.toContain("class=");
    expect(ssr(createElement(BulkActionBar, { count: 1, placement: "bottom" }))).toContain(
      'data-placement="bottom"',
    );
    // floating is a separate switch, off by default
    expect(html).not.toContain("data-floating");
    const floating = ssr(createElement(BulkActionBar, { count: 1, floating: true }));
    expect(floating).toContain("data-floating");
    // laid over the table's edge on a zero-height anchor, not in the flow
    expect(floating).toContain('data-slot="bulk-action-bar-anchor"');
    expect(html).not.toContain("bulk-action-bar-anchor");
    // inside the table by default, or outside its edge
    expect(floating).toContain('data-floating-in="inside"');
    expect(
      ssr(createElement(BulkActionBar, { count: 1, floating: true, floatingIn: "outside" })),
    ).toContain('data-floating-in="outside"');
    expect(html).not.toContain("data-floating-in");
  });

  test("Clear shows only when onClear is given, and calls it", async () => {
    expect(ssr(createElement(BulkActionBar, { count: 2 }))).not.toContain("Clear");
    const onClear = vi.fn();
    const el = await mount(createElement(BulkActionBar, { count: 2, onClear }));
    await act(async () => el.querySelector("button")!.click());
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  test("the language follows ConfigProvider; `labels` replace the texts", () => {
    const zh = ssr(
      createElement(
        ConfigProvider,
        { ...zhCN },
        createElement(BulkActionBar, { count: 3, onClear: () => {} }),
      ),
    );
    expect(zh).toContain("已选 3 项");
    expect(zh).toContain("清除");
    expect(
      ssr(createElement(BulkActionBar, { count: 3, labels: { selected: (n) => `${n} tickets` } })),
    ).toContain("3 tickets");
  });
});
