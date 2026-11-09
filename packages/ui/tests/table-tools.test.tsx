// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { ConfigProvider, TableTools, useFixedHeader } from "../src/index.ts";
import { zhCN } from "../src/locales/zh-CN.ts";

let host: HTMLElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = root = null;
  localStorage.clear();
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root!.render(node));
  return host;
}
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);
const click = async (el: Element | null | undefined) => {
  await act(async () => (el as HTMLElement).click());
};
const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
];

describe("TableTools", () => {
  test("a button is shown for each thing it is given, nothing else; no class / style of ours", () => {
    expect(ssr(createElement(TableTools))).not.toContain("<button");
    const all = ssr(
      createElement(TableTools, {
        onRefresh: () => {},
        onFixedChange: () => {},
        columns: COLUMNS,
        visible: ["name"],
        onVisibleChange: () => {},
        onOrderChange: () => {},
        onExport: () => {},
      }),
    );
    expect(all).toContain('data-slot="table-tools"');
    expect(all.match(/<button/g)).toHaveLength(4);
    for (const label of [
      "Refresh",
      "Fix the header and scroll the rows",
      "Columns",
      "Export CSV",
    ]) {
      expect(all).toContain(`aria-label="${label}"`);
    }
    // the columns button needs all four of its props
    const partial = ssr(createElement(TableTools, { columns: COLUMNS, visible: ["name"] }));
    expect(partial).not.toContain("<button");
    expect(ssr(createElement(TableTools, { onExport: () => {} }))).not.toMatch(/ style=/);
  });

  test("while it refreshes the refresh icon turns, there is no loading button, and a click does nothing", async () => {
    const onRefresh = vi.fn();
    const el = await mount(createElement(TableTools, { onRefresh, refreshing: true }));
    const button = el.querySelector('[aria-label="Refresh"]')!;
    expect(el.querySelector('[data-slot="table-tools"]')!.getAttribute("aria-busy")).toBe("true");
    expect(button.querySelectorAll("svg")).toHaveLength(1);
    expect(button.querySelector("svg")!.hasAttribute("data-spinning")).toBe(true);
    expect(button.hasAttribute("data-loading")).toBe(false);
    await click(button);
    expect(onRefresh).not.toHaveBeenCalled();
    await act(async () =>
      root!.render(createElement(TableTools, { onRefresh, refreshing: false })),
    );
    expect(el.querySelector('[aria-label="Refresh"] svg')!.hasAttribute("data-spinning")).toBe(
      false,
    );
    await click(el.querySelector('[aria-label="Refresh"]'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test("the texts follow the locale, and `labels` wins", () => {
    const zh = ssr(
      createElement(
        ConfigProvider,
        { ...zhCN },
        createElement(TableTools, { onRefresh: () => {} }),
      ),
    );
    expect(zh).toContain('aria-label="刷新"');
    const own = ssr(
      createElement(TableTools, { onRefresh: () => {}, labels: { refresh: "Reload" } }),
    );
    expect(own).toContain('aria-label="Reload"');
  });

  test("refresh and export call back; the fixed toggle says what it is now and asks for the opposite", async () => {
    const onRefresh = vi.fn();
    const onExport = vi.fn();
    const onFixedChange = vi.fn();
    const el = await mount(
      createElement(TableTools, { onRefresh, onExport, fixed: true, onFixedChange }),
    );
    await click(el.querySelector('[aria-label="Refresh"]'));
    await click(el.querySelector('[aria-label="Export CSV"]'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledTimes(1);
    const fixed = el.querySelector('[aria-label="Fix the header and scroll the rows"]')!;
    expect(fixed.getAttribute("aria-pressed")).toBe("true");
    await click(fixed);
    expect(onFixedChange).toHaveBeenLastCalledWith(false);
    await act(async () => root!.render(createElement(TableTools, { fixed: false, onFixedChange })));
    const off = el.querySelector('[aria-label="Fix the header and scroll the rows"]')!;
    expect(off.getAttribute("aria-pressed")).toBe("false");
    await click(off);
    expect(onFixedChange).toHaveBeenLastCalledWith(true);
  });

  test("the columns popover lists the columns with a tick each; ticking keeps the order of `columns`", async () => {
    const onVisibleChange = vi.fn();
    const el = await mount(
      createElement(TableTools, {
        columns: COLUMNS,
        visible: ["name", "role"],
        onVisibleChange,
        onOrderChange: () => {},
      }),
    );
    await click(el.querySelector('[aria-label="Columns"]'));
    const boxes = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-slot="table-tools-columns"] [role="checkbox"]',
      ),
    ];
    expect(boxes).toHaveLength(3);
    expect(boxes.map((b) => b.getAttribute("aria-checked"))).toEqual(["true", "false", "true"]);
    await click(boxes[1]);
    expect(onVisibleChange).toHaveBeenLastCalledWith(["name", "email", "role"]);
    await click(boxes[0]);
    expect(onVisibleChange).toHaveBeenLastCalledWith(["role"]);
  });
});

describe("useFixedHeader", () => {
  beforeEach(() => localStorage.clear());
  function Probe({ id, initial }: { id: string; initial?: boolean }) {
    const [fixed, setFixed] = useFixedHeader(id, initial);
    return createElement(
      "button",
      { "data-testid": "probe", onClick: () => setFixed(!fixed) },
      String(fixed),
    );
  }
  test("starts as `initial` (true by default), and remembers what the user chose, per key", async () => {
    let el = await mount(createElement(Probe, { id: "a" }));
    expect(el.textContent).toBe("true");
    await click(el.querySelector("button"));
    expect(el.textContent).toBe("false");
    expect(localStorage.getItem("table-fixed-header:a")).toBe("0");
    await act(async () => root!.unmount());
    host!.remove();
    el = await mount(createElement(Probe, { id: "a" }));
    expect(el.textContent).toBe("false");
    await act(async () => root!.unmount());
    host!.remove();
    el = await mount(createElement(Probe, { id: "b", initial: false }));
    expect(el.textContent).toBe("false");
  });
  test("blocked storage is not an error", async () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const el = await mount(createElement(Probe, { id: "c" }));
    expect(el.textContent).toBe("true");
    spy.mockRestore();
  });
});
