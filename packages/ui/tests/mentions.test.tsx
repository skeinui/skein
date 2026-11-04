// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Mentions } from "../src/index.ts";
import type { MentionsProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 30)));

const field = () => document.querySelector<HTMLTextAreaElement>('[data-slot="textarea"]')!;
/** Simulate the user typing in the input: set the value, place the caret, fire the input event. */
async function type(el: HTMLTextAreaElement, text: string) {
  act(() => el.focus());
  await act(async () => {
    Reflect.set(HTMLTextAreaElement.prototype, "value", text, el);
    el.setSelectionRange(text.length, text.length);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await settle();
}
const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });
const optionTexts = () =>
  [...document.querySelectorAll('[data-slot="mentions-option"]')].map((o) => o.textContent);

const OPTIONS = ["Ada", "Alan", "Grace"];

describe("Mentions", () => {
  test("SSR: textarea, combobox attributes, no class / style, no list by default", () => {
    const html = renderToStaticMarkup(
      createElement(Mentions, { options: OPTIONS, name: "msg", defaultValue: "hi" }),
    );
    expect(html).toContain('data-slot="mentions"');
    expect(html).toContain("<textarea");
    // A <textarea> can't carry role="combobox" (ARIA in HTML); express it with aria-autocomplete / aria-haspopup
    expect(html).not.toContain('role="combobox"');
    expect(html).not.toContain("aria-expanded");
    expect(html).toContain('aria-autocomplete="list"');
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('<input type="hidden" name="msg" value="hi"');
    expect(html).not.toContain('data-slot="mentions-list"');
    expect(html).not.toContain("class=");
    expect(html.replace(/<(input|textarea)[^>]*>/g, "")).not.toContain("style=");
  });

  test("multiline=false renders a single-line input", () => {
    const html = renderToStaticMarkup(
      createElement(Mentions, { options: OPTIONS, multiline: false }),
    );
    expect(html).toContain('data-slot="input"');
    expect(html).not.toContain("<textarea");
    // A single-line input can be labeled in the full combobox way
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
  });

  test("typing @ opens suggestions filtered by the query; whitespace ends it", async () => {
    mount(createElement(Mentions, { options: OPTIONS }));
    await type(field(), "hi @");
    expect(optionTexts()).toEqual(["Ada", "Alan", "Grace"]);
    expect(field().getAttribute("aria-controls")).toBeTruthy();
    expect(field().getAttribute("aria-activedescendant")).toBeTruthy();
    await type(field(), "hi @al");
    expect(optionTexts()).toEqual(["Alan"]);
    await type(field(), "hi @al ");
    expect(optionTexts()).toEqual([]);
    expect(field().getAttribute("aria-controls")).toBeNull();
  });

  test("@ in an email doesn't trigger (not preceded by whitespace)", async () => {
    mount(createElement(Mentions, { options: OPTIONS }));
    await type(field(), "a@");
    expect(optionTexts()).toEqual([]);
  });

  test("arrow keys move the highlight (wrapping), Enter inserts '@name ' with the caret after it", async () => {
    const selected: string[] = [];
    mount(
      createElement(Mentions, {
        options: OPTIONS,
        onSelect: (o: { value: string }, p: string) => selected.push(p + o.value),
      }),
    );
    await type(field(), "hi @");
    key(field(), "ArrowDown");
    expect(field().getAttribute("aria-activedescendant")).toMatch(/-1$/);
    key(field(), "ArrowUp");
    key(field(), "ArrowUp"); // wraps to the last item
    expect(document.querySelector("[data-active]")!.textContent).toBe("Grace");
    key(field(), "Enter");
    await settle();
    expect(field().value).toBe("hi @Grace ");
    expect(field().selectionStart).toBe("hi @Grace ".length);
    expect(selected).toEqual(["@Grace"]);
    expect(optionTexts()).toEqual([]);
  });

  test("triggered mid-text: replaces only the part before the caret, keeps the rest", async () => {
    mount(createElement(Mentions, { options: OPTIONS, defaultValue: "hello  world" }));
    const el = field();
    act(() => el.focus());
    await act(async () => {
      Reflect.set(HTMLTextAreaElement.prototype, "value", "hello @ world", el);
      el.setSelectionRange(7, 7);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await settle();
    key(el, "Tab");
    await settle();
    expect(el.value).toBe("hello @Ada  world");
  });

  test("Esc closes; typing a new trigger opens it again", async () => {
    mount(createElement(Mentions, { options: OPTIONS }));
    await type(field(), "@a");
    expect(optionTexts().length).toBeGreaterThan(0);
    key(field(), "Escape");
    await settle();
    expect(optionTexts()).toEqual([]);
    await type(field(), "@a x @");
    expect(optionTexts().length).toBe(3);
  });

  test("several prefixes: each triggers on its own, onSelect gets the prefix", async () => {
    const selected: string[] = [];
    mount(
      createElement(Mentions, {
        options: ["bug"],
        prefix: ["@", "#"],
        onSelect: (o: { value: string }, p: string) => selected.push(p + o.value),
      }),
    );
    await type(field(), "see #b");
    key(field(), "Enter");
    await settle();
    expect(field().value).toBe("see #bug ");
    expect(selected).toEqual(["#bug"]);
  });

  test("disabled options can't be picked; disabled / readOnly don't open", async () => {
    mount(
      createElement(Mentions, {
        options: [{ value: "off", disabled: true }, "on"],
      }),
    );
    await type(field(), "@");
    key(field(), "Enter"); // the highlight starts on the first item, which is disabled, so Enter inserts nothing
    await settle();
    expect(field().value).toBe("@");
    act(() => root?.unmount());
    host?.remove();
    mount(createElement(Mentions, { options: OPTIONS, readOnly: true, defaultValue: "@" }));
    await type(field(), "@");
    expect(optionTexts()).toEqual([]);
  });

  test("filterOption=false + onSearch: the caller supplies options, onSearch gets the query", async () => {
    const queries: string[] = [];
    function Demo(props: Partial<MentionsProps>) {
      const [opts, setOpts] = useState<string[]>([]);
      return createElement(Mentions, {
        options: opts,
        filterOption: false,
        onSearch: (q: string) => {
          queries.push(q);
          setOpts(["from-server"]);
        },
        ...props,
      });
    }
    mount(createElement(Demo));
    await type(field(), "@zz");
    expect(queries.at(-1)).toBe("zz");
    expect(optionTexts()).toEqual(["from-server"]);
  });
});
