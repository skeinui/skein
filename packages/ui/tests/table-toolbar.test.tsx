// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { ConfigProvider, EnumTag, TableToolbar } from "../src/index.ts";
import type { QueryField } from "../src/index.ts";
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

const STATUS = {
  open: { label: "Open", color: "primary" },
  urgent: { label: "Urgent", color: "danger", variant: "solid" },
} as const;

describe("EnumTag", () => {
  test("the text and the colour come from the table; a value of its own can change the variant", () => {
    const open = ssr(createElement(EnumTag, { value: "open", options: STATUS }));
    expect(open).toContain("Open");
    expect(open).toContain('data-color="primary"');
    expect(open).toContain('data-variant="soft"');
    const urgent = ssr(createElement(EnumTag, { value: "urgent", options: STATUS }));
    expect(urgent).toContain('data-variant="solid"');
    expect(urgent).toContain('data-color="danger"');
    expect(open).not.toContain("class=");
  });

  test("a value that is not in the table is shown as it is, in neutral", () => {
    const html = ssr(createElement(EnumTag, { value: "weird", options: STATUS }));
    expect(html).toContain("weird");
    expect(html).toContain('data-color="neutral"');
  });
});

const FIELDS: QueryField[] = [{ name: "name", label: "Name", type: "text" }];

describe("TableToolbar", () => {
  test("each part shows when its props are given", () => {
    expect(ssr(createElement(TableToolbar, {}))).not.toContain("<input");
    const html = ssr(
      createElement(TableToolbar, {
        onSearch: () => {},
        fields: FIELDS,
        onFilterChange: () => {},
        tools: createElement("b", null, "TOOLS"),
        below: createElement("i", null, "BELOW"),
      }),
    );
    expect(html).toContain('data-slot="input-group"');
    // wide enough for a hint of a few words by default; `searchWidth` changes it
    expect(html).toContain('data-width="lg"');
    expect(ssr(createElement(TableToolbar, { onSearch: () => {}, searchWidth: "sm" }))).toContain(
      'data-width="sm"',
    );
    expect(html).toContain('data-slot="query-builder"');
    expect(html).toContain("TOOLS");
    expect(html).toContain("BELOW");
    expect(html).not.toContain("class=");
  });

  test("Enter searches with the keyword; Reset shows only with something set, and resets", async () => {
    const onSearch = vi.fn();
    const onReset = vi.fn();
    const el = await mount(
      createElement(TableToolbar, { keyword: "ada", onKeywordChange: () => {}, onSearch, onReset }),
    );
    const input = el.querySelector("input")!;
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(onSearch).toHaveBeenCalledWith("ada");
    const reset = [...el.querySelectorAll("button")].find((b) => b.textContent === "Reset")!;
    await act(async () => reset.click());
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(
      ssr(createElement(TableToolbar, { keyword: "", onSearch: () => {}, onReset: () => {} })),
    ).not.toContain("Reset");
  });

  test("without `keyword` the box keeps what is typed itself, and Reset clears it", async () => {
    const onReset = vi.fn();
    const el = await mount(createElement(TableToolbar, { onSearch: () => {}, onReset }));
    const input = el.querySelector("input")!;
    expect([...el.querySelectorAll("button")].some((b) => b.textContent === "Reset")).toBe(false);
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "ada");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(input.value).toBe("ada");
    const reset = [...el.querySelectorAll("button")].find((b) => b.textContent === "Reset")!;
    await act(async () => reset.click());
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(input.value).toBe("");
  });

  test("the filter shows as a chip; the language follows ConfigProvider", () => {
    const html = ssr(
      createElement(
        ConfigProvider,
        { ...zhCN },
        createElement(TableToolbar, {
          keyword: "x",
          onSearch: () => {},
          onReset: () => {},
          fields: FIELDS,
          filter: { field: "name", op: "contains", value: "ada" },
          onFilterChange: () => {},
        }),
      ),
    );
    expect(html).toContain("重置");
    expect(html).toContain('data-slot="query-builder-chip"');
  });
});
