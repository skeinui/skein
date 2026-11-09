// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { ConfigProvider, SavedViews } from "../src/index.ts";
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
const byText = (text: string) =>
  [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === text);
const click = async (el: Element | null | undefined) =>
  act(async () => (el as HTMLElement).click());
const type = async (el: HTMLInputElement, text: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

type View = { id: string; name: string; keyword?: string };
const VIEWS: View[] = [
  { id: "a", name: "Mine", keyword: "ada" },
  { id: "b", name: "Overdue" },
];

describe("SavedViews", () => {
  test("nothing to show: nothing is rendered", () => {
    expect(ssr(createElement(SavedViews, { views: [] }))).toBe("");
  });

  test("the views, the one in use pressed; × and the save button only with their callbacks", () => {
    const plain = ssr(createElement(SavedViews, { views: VIEWS, value: "a" }));
    expect(plain).toContain("Mine");
    expect(plain).toContain('aria-pressed="true"');
    expect(plain).not.toContain("Remove Mine");
    expect(plain).not.toContain("Save as a view");
    expect(plain).not.toContain("class=");
    const full = ssr(
      createElement(SavedViews, { views: VIEWS, onDelete: () => {}, onSave: () => {} }),
    );
    expect(full).toContain('aria-label="Remove Mine"');
    expect(full).toContain("Save as a view");
  });

  test("choosing and removing hand the whole view back; nothing is stored", async () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    await mount(createElement(SavedViews, { views: VIEWS, onSelect, onDelete }));
    await click(byText("Mine"));
    expect(onSelect).toHaveBeenCalledWith(VIEWS[0]);
    await click(document.querySelector('button[aria-label="Remove Overdue"]'));
    expect(onDelete).toHaveBeenCalledWith(VIEWS[1]);
  });

  test("save: a name is asked, trimmed and handed to onSave; the dialog closes", async () => {
    const onSave = vi.fn();
    await mount(createElement(SavedViews, { views: [], onSave }));
    await click(byText("Save as a view"));
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Name"]')!;
    expect(byText("Save")!.disabled).toBe(true);
    await type(input, "  My queue ");
    await click(byText("Save"));
    expect(onSave).toHaveBeenCalledWith("My queue");
    expect(document.querySelector('input[aria-label="Name"]')).toBeNull();
  });

  test("a failing onSave keeps the dialog open; canSave off disables the button", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("no"));
    await mount(createElement(SavedViews, { views: [], onSave }));
    await click(byText("Save as a view"));
    await type(document.querySelector<HTMLInputElement>('input[aria-label="Name"]')!, "x");
    await click(byText("Save"));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(document.querySelector('input[aria-label="Name"]')).not.toBeNull();
    expect(
      ssr(createElement(SavedViews, { views: [], onSave: () => {}, canSave: false })),
    ).toContain("disabled");
  });

  test("the language follows ConfigProvider", () => {
    const html = ssr(
      createElement(
        ConfigProvider,
        { ...zhCN },
        createElement(SavedViews, { views: VIEWS, onDelete: () => {}, onSave: () => {} }),
      ),
    );
    expect(html).toContain("我的视图");
    expect(html).toContain("存成视图");
    expect(html).toContain("删除视图 Mine");
  });
});
