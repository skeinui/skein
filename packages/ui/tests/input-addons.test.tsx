// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { PasswordInput, SearchInput, TagInput, Textarea } from "../src/index.ts";

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
const input = () => document.querySelector<HTMLInputElement>("input")!;
const type = (value: string) =>
  act(async () => {
    // oxlint-disable-next-line typescript/unbound-method
    Reflect.set(HTMLInputElement.prototype, "value", value, input());
    input().dispatchEvent(new Event("input", { bubbles: true }));
  });
const key = (k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    input().dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });
const click = (el: Element | null) => act(async () => (el as HTMLElement).click());
const actionBtn = (label: string) =>
  document.querySelector<HTMLButtonElement>(
    `[data-slot="input-group-action"][aria-label="${label}"]`,
  );
const tagTexts = () =>
  [...document.querySelectorAll('[data-slot="tag-label"]')].map((e) => e.textContent);

describe("PasswordInput", () => {
  test("SSR: type=password, the button is named and an aria-pressed toggle, no class / style", () => {
    const html = ssr(createElement(PasswordInput, { "aria-label": "Password" }));
    expect(html).toContain('type="password"');
    expect(html).toContain('aria-label="Show password"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('autoComplete="current-password"');
    expect(html).not.toMatch(/class=|style=/);
    expect(ssr(createElement(PasswordInput, { visibilityToggle: false }))).not.toContain(
      "input-group-action",
    );
  });

  test("the button toggles plain / masked text, name and aria-pressed follow; onVisibleChange gets the new state", async () => {
    const onVisibleChange = vi.fn();
    await mount(createElement(PasswordInput, { onVisibleChange }));
    await click(actionBtn("Show password"));
    expect(input().type).toBe("text");
    expect(actionBtn("Hide password")!.getAttribute("aria-pressed")).toBe("true");
    expect(onVisibleChange).toHaveBeenLastCalledWith(true);
    await click(actionBtn("Hide password"));
    expect(input().type).toBe("password");
  });

  test("labels replace the text", () => {
    expect(ssr(createElement(PasswordInput, { labels: { show: "Reveal password" } }))).toContain(
      'aria-label="Reveal password"',
    );
  });
});

describe("SearchInput", () => {
  test("Enter and the button both fire onSearch; Enter during composition does not", async () => {
    const onSearch = vi.fn();
    await mount(createElement(SearchInput, { onSearch }));
    await type("abc");
    await key("Enter");
    expect(onSearch).toHaveBeenLastCalledWith("abc", "enter");
    await key("Enter", { isComposing: true } as KeyboardEventInit);
    expect(onSearch).toHaveBeenCalledTimes(1);
    await click(actionBtn("Search"));
    expect(onSearch).toHaveBeenLastCalledWith("abc", "button");
  });

  test("a clear button only with content, clicking clears and notifies; Esc clears", async () => {
    const onSearch = vi.fn();
    await mount(createElement(SearchInput, { onSearch }));
    expect(actionBtn("Clear")).toBeNull();
    await type("abc");
    await click(actionBtn("Clear"));
    expect(input().value).toBe("");
    expect(onSearch).toHaveBeenLastCalledWith("", "clear");
    await type("x");
    await key("Escape");
    expect(input().value).toBe("");
  });

  test("loading: the search button is aria-busy and no longer searches", async () => {
    const onSearch = vi.fn();
    await mount(createElement(SearchInput, { onSearch, loading: true, defaultValue: "q" }));
    expect(actionBtn("Search")!.getAttribute("aria-busy")).toBe("true");
    await key("Enter");
    await click(actionBtn("Search"));
    expect(onSearch).not.toHaveBeenCalled();
  });

  test("SSR: no class / style; controlled value", () => {
    const html = ssr(createElement(SearchInput, { value: "hi", "aria-label": "Find" }));
    expect(html).toContain('value="hi"');
    expect(html).not.toMatch(/class=|style=/);
  });
});

describe("TagInput", () => {
  test("SSR: existing tags are removable Tags, the remove button's name includes the tag", () => {
    const html = ssr(createElement(TagInput, { defaultValue: ["a", "b"] }));
    expect(html).toContain('data-slot="input-group-tags"');
    expect(html).toContain('aria-label="Remove a"');
    expect(html).not.toMatch(/class=|style=/);
    expect(ssr(createElement(TagInput))).not.toContain("input-group-tags");
  });

  test("Enter commits; empty text and duplicates are ignored; a separator (comma) commits too", async () => {
    const onValueChange = vi.fn();
    await mount(createElement(TagInput, { onValueChange }));
    await type("react");
    await key("Enter");
    expect(tagTexts()).toEqual(["react"]);
    expect(input().value).toBe("");
    await key("Enter");
    await type("react");
    await key("Enter");
    expect(tagTexts()).toEqual(["react"]);
    await type("vue,");
    expect(tagTexts()).toEqual(["react", "vue"]);
    expect(onValueChange).toHaveBeenLastCalledWith(["react", "vue"]);
  });

  test("Backspace on an empty input removes the last; a tag's remove button removes that tag", async () => {
    await mount(createElement(TagInput, { defaultValue: ["a", "b", "c"] }));
    await key("Backspace");
    expect(tagTexts()).toEqual(["a", "b"]);
    await click(document.querySelector('[aria-label="Remove a"]'));
    expect(tagTexts()).toEqual(["b"]);
  });

  test("no more once max is reached; validate rejects bad ones; allowDuplicates allows duplicates", async () => {
    await mount(createElement(TagInput, { max: 2, validate: (t: string) => t.length > 1 }));
    await type("x");
    await key("Enter");
    expect(tagTexts()).toEqual([]);
    await type("aa");
    await key("Enter");
    await type("bb");
    await key("Enter");
    expect(tagTexts()).toEqual(["aa", "bb"]);
    expect(input().readOnly).toBe(true);
    await act(async () => root!.unmount());
    host!.remove();
    await mount(createElement(TagInput, { allowDuplicates: true, defaultValue: ["a"] }));
    await type("a");
    await key("Enter");
    expect(tagTexts()).toEqual(["a", "a"]);
  });

  test("pasting text splits it into tags by separators; addOnBlur commits on blur", async () => {
    await mount(createElement(TagInput, { addOnBlur: true }));
    const data = { getData: () => "a, b ,c" };
    await act(async () => {
      const ev = new Event("paste", { bubbles: true, cancelable: true });
      Object.assign(ev, { clipboardData: data });
      input().dispatchEvent(ev);
    });
    expect(tagTexts()).toEqual(["a", "b", "c"]);
    await type("tail");
    await act(async () => {
      input().dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
    expect(tagTexts()).toEqual(["a", "b", "c", "tail"]);
  });
});

describe("Textarea autoSize / showCount", () => {
  const area = () => document.querySelector<HTMLTextAreaElement>("textarea")!;
  const typeInto = (value: string) =>
    act(async () => {
      // oxlint-disable-next-line typescript/unbound-method
      Reflect.set(HTMLTextAreaElement.prototype, "value", value, area());
      area().dispatchEvent(new Event("input", { bubbles: true }));
    });

  test("SSR: without showCount just a textarea (no wrapper), showCount adds a counter; no class / style", () => {
    const bare = ssr(createElement(Textarea, { "aria-label": "t" }));
    expect(bare).not.toContain("textarea-wrapper");
    expect(bare).not.toContain("data-autosize");
    const counted = ssr(
      createElement(Textarea, {
        showCount: true,
        maxLength: 20,
        defaultValue: "hello",
        "aria-label": "t",
      }),
    );
    expect(counted).toContain('data-slot="textarea-wrapper"');
    expect(counted).toContain("5 / 20");
    expect(counted).toMatch(/aria-describedby="[^"]+"/);
    expect(ssr(createElement(Textarea, { showCount: true, defaultValue: "abc" }))).toContain(">3<");
    expect(ssr(createElement(Textarea, { autoSize: true }))).toContain("data-autosize");
    expect(counted).not.toMatch(/class=|style=/);
  });

  test("the count updates as you type, data-limit at maxLength; aria-describedby points to the counter", async () => {
    await mount(createElement(Textarea, { showCount: true, maxLength: 5, "aria-label": "t" }));
    const count = () => document.querySelector('[data-slot="textarea-count"]')!;
    expect(count().textContent).toBe("0 / 5");
    await typeInto("abc");
    expect(count().textContent).toBe("3 / 5");
    expect(count().hasAttribute("data-limit")).toBe(false);
    await typeInto("abcde");
    expect(count().hasAttribute("data-limit")).toBe(true);
    expect(area().getAttribute("aria-describedby")).toContain(count().id);
  });

  test("autoSize: height clamped between min / max rows (--ta-height), data-overflow beyond max rows", async () => {
    // jsdom has no layout: line height is font size 16 x 1.5 = 24 (the fallback when lineHeight has no value), scrollHeight is specified manually
    let scroll = 40;
    Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => scroll,
    });
    await mount(
      createElement(Textarea, { autoSize: { minRows: 2, maxRows: 4 }, "aria-label": "t" }),
    );
    const h = () => parseFloat(area().style.getPropertyValue("--ta-height"));
    expect(h()).toBeCloseTo(48, 0); // 2 rows x 24, content 40 is shorter -> the minimum
    scroll = 63;
    await typeInto("1\n2\n3");
    expect(h()).toBeCloseTo(63, 0);
    expect(area().hasAttribute("data-overflow")).toBe(false);
    scroll = 200;
    await typeInto("1\n2\n3\n4\n5\n6\n7\n8");
    expect(h()).toBeCloseTo(96, 0); // capped at 4 rows
    expect(area().hasAttribute("data-overflow")).toBe(true);
  });
});
