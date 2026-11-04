// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Cascader } from "../src/index.ts";
import type { CascaderOption } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

const OPTIONS: CascaderOption[] = [
  {
    value: "zj",
    label: "Zhejiang",
    children: [
      {
        value: "hz",
        label: "Hangzhou",
        children: [{ value: "xh", label: "West Lake" }],
      },
      { value: "nb", label: "Ningbo" },
    ],
  },
  {
    value: "js",
    label: "Jiangsu",
    children: [{ value: "nj", label: "Nanjing", disabled: true }],
  },
  { value: "bj", label: "Beijing" },
  { value: "xx", label: "Closed", disabled: true },
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
const hover = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mouseenter"));
  });
const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });
const trigger = (h: HTMLElement) => h.querySelector<HTMLElement>('[data-slot="cascader-trigger"]')!;
const panel = () => document.querySelector<HTMLElement>('[data-slot="cascader-panel"]');
const menu = (level: number) =>
  document.querySelector<HTMLElement>(`[data-slot="cascader-menu"][data-level="${level}"]`);
const option = (level: number, value: string) =>
  menu(level)!.querySelector<HTMLElement>(`[data-value="${value}"]`)!;
const open = (h: HTMLElement) => click(trigger(h));
// The overlay's initial focus is asynchronous in Base UI, wait a moment before asserting focus
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });

describe("Cascader", () => {
  test("SSR: the trigger shows the placeholder or the selected path, no class / style, the panel is not rendered by default", () => {
    const empty = ssr(createElement(Cascader, { options: OPTIONS, placeholder: "Pick one" }));
    expect(empty).toContain("Pick one");
    expect(empty).toContain("data-placeholder");
    expect(empty).not.toContain("cascader-panel");
    expect(empty).not.toContain("class=");
    expect(empty).not.toContain("style=");
    const filled = ssr(
      createElement(Cascader, { options: OPTIONS, defaultValue: ["zj", "hz", "xh"] }),
    );
    expect(filled).toContain("Zhejiang / Hangzhou / West Lake");
    expect(filled).not.toContain("data-placeholder");
    const custom = ssr(
      createElement(Cascader, { options: OPTIONS, defaultValue: ["zj", "nb"], separator: " > " }),
    );
    expect(custom).toContain("Zhejiang &gt; Ningbo");
  });

  test("a path that does not match the options shows the placeholder, not a partial path", () => {
    const html = ssr(createElement(Cascader, { options: OPTIONS, defaultValue: ["zj", "nope"] }));
    expect(html).toContain("data-placeholder");
  });

  test("opened, columns expand one by one, reaching a leaf commits the whole path and closes", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Cascader, {
        options: OPTIONS,
        onValueChange: (p: string[]) => changes.push(p),
      }),
    );
    open(h);
    expect(menu(0)).not.toBeNull();
    expect(menu(1)).toBeNull();
    click(option(0, "zj"));
    expect(menu(1)).not.toBeNull();
    expect(option(0, "zj").hasAttribute("data-active")).toBe(true);
    click(option(1, "hz"));
    expect(menu(2)).not.toBeNull();
    click(option(2, "xh"));
    expect(changes).toEqual([["zj", "hz", "xh"]]);
    expect(panel()).toBeNull();
    expect(trigger(h).textContent).toContain("Zhejiang / Hangzhou / West Lake");
  });

  test("a top-level leaf commits directly", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Cascader, {
        options: OPTIONS,
        onValueChange: (p: string[]) => changes.push(p),
      }),
    );
    open(h);
    click(option(0, "bj"));
    expect(changes).toEqual([["bj"]]);
  });

  test("disabled options do not respond; non-leaf nodes only expand, not commit", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Cascader, {
        options: OPTIONS,
        onValueChange: (p: string[]) => changes.push(p),
      }),
    );
    open(h);
    click(option(0, "xx"));
    expect(changes).toEqual([]);
    click(option(0, "js"));
    click(option(1, "nj")); // disabled
    expect(changes).toEqual([]);
    expect(panel()).not.toBeNull();
  });

  test("changeOnSelect: clicking a non-leaf commits, the panel stays open", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Cascader, {
        options: OPTIONS,
        changeOnSelect: true,
        onValueChange: (p: string[]) => changes.push(p),
      }),
    );
    open(h);
    click(option(0, "zj"));
    expect(changes).toEqual([["zj"]]);
    expect(panel()).not.toBeNull();
    expect(menu(1)).not.toBeNull();
  });

  test("expandTrigger=hover: hovering expands the next column", () => {
    const h = mount(createElement(Cascader, { options: OPTIONS, expandTrigger: "hover" }));
    open(h);
    hover(option(0, "zj"));
    expect(menu(1)).not.toBeNull();
    hover(option(1, "hz"));
    expect(menu(2)).not.toBeNull();
  });

  test("keyboard: Up / Down move, Right enters the next column, Left goes back, Enter selects", async () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Cascader, {
        options: OPTIONS,
        onValueChange: (p: string[]) => changes.push(p),
      }),
    );
    open(h);
    await settle();
    expect(document.activeElement).toBe(option(0, "zj")); // focus on the first item after opening
    key(option(0, "zj"), "ArrowDown");
    expect(document.activeElement).toBe(option(0, "js"));
    key(option(0, "js"), "ArrowUp");
    expect(document.activeElement).toBe(option(0, "zj"));
    key(option(0, "zj"), "ArrowRight");
    expect(menu(1)).not.toBeNull();
    expect(document.activeElement).toBe(option(1, "hz"));
    key(option(1, "hz"), "ArrowLeft");
    expect(menu(1)).not.toBeNull(); // the parent stays expanded, only focus goes back to the previous column
    expect(document.activeElement).toBe(option(0, "zj"));
    key(option(0, "zj"), "End");
    expect(document.activeElement).toBe(option(0, "bj")); // skips the disabled last item
    key(option(0, "bj"), "Enter");
    expect(changes).toEqual([["bj"]]);
  });

  test("reopening restores expansion and focus to the current value", async () => {
    const h = mount(createElement(Cascader, { options: OPTIONS, defaultValue: ["zj", "nb"] }));
    open(h);
    await settle();
    expect(menu(1)).not.toBeNull();
    expect(option(1, "nb").hasAttribute("data-selected")).toBe(true);
    expect(document.activeElement).toBe(option(1, "nb"));
  });

  test("clearable: a clear button only with a value, clicking clears", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Cascader, {
        options: OPTIONS,
        clearable: true,
        defaultValue: ["bj"],
        onValueChange: (p: string[]) => changes.push(p),
      }),
    );
    const clear = h.querySelector<HTMLElement>('[data-slot="cascader-clear"]')!;
    expect(clear).not.toBeNull();
    click(clear);
    expect(changes).toEqual([[]]);
    expect(h.querySelector('[data-slot="cascader-clear"]')).toBeNull();
    expect(trigger(h).textContent).toContain("Select");
  });

  test("controlled value: selecting only calls back, the trigger shows the outside value", () => {
    const changes: string[][] = [];
    const h = mount(
      createElement(Cascader, {
        options: OPTIONS,
        value: ["bj"],
        onValueChange: (p: string[]) => changes.push(p),
      }),
    );
    open(h);
    click(option(0, "zj"));
    click(option(1, "nb"));
    expect(changes).toEqual([["zj", "nb"]]);
    expect(trigger(h).textContent).toContain("Beijing");
  });

  test("disabled: does not open; emptyText without options", () => {
    const h = mount(createElement(Cascader, { options: OPTIONS, disabled: true }));
    open(h);
    expect(panel()).toBeNull();
    act(() => root?.unmount());
    host?.remove();
    const h2 = mount(createElement(Cascader, { options: [], emptyText: "Nothing" }));
    open(h2);
    expect(panel()!.textContent).toBe("Nothing");
  });

  const typeInto = (input: HTMLInputElement, v: string) =>
    act(() => {
      Reflect.set(HTMLInputElement.prototype, "value", v, input);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  const check = (level: number, value: string) =>
    option(level, value).querySelector<HTMLElement>('[role="checkbox"]')!;
  const tags = (h: HTMLElement) =>
    [...h.querySelectorAll('[data-slot="tag"]')].map((e) => e.textContent);

  describe("multiple", () => {
    test("checking a leaf commits an array of paths; checking a parent takes all enabled leaves; disabled leaves are skipped", () => {
      const changes: string[][][] = [];
      const h = mount(
        createElement(Cascader, {
          options: OPTIONS,
          multiple: true,
          onValueChange: (p: string[][]) => changes.push(p),
        }),
      );
      open(h);
      expect(panel()).not.toBeNull(); // multiple does not close on select
      click(check(0, "bj"));
      expect(changes.at(-1)).toEqual([["bj"]]);
      click(option(0, "zj")); // expand
      click(check(0, "zj")); // check the parent: the two leaves under zj (hz/xh, nb)
      expect(changes.at(-1)).toEqual([["bj"], ["zj", "hz", "xh"], ["zj", "nb"]]);
      expect(check(0, "zj").getAttribute("aria-checked")).toBe("true");
      click(check(0, "zj")); // click again to uncheck all
      expect(changes.at(-1)).toEqual([["bj"]]);
      click(option(0, "js"));
      expect(
        check(0, "js").hasAttribute("disabled") || check(0, "js").hasAttribute("data-disabled"),
      ).toBe(true);
    });

    test("a partly checked parent is indeterminate; the trigger has a removable tag per path", () => {
      const changes: string[][][] = [];
      const h = mount(
        createElement(Cascader, {
          options: OPTIONS,
          multiple: true,
          defaultValue: [["zj", "nb"], ["bj"]],
          onValueChange: (p: string[][]) => changes.push(p),
        }),
      );
      expect(tags(h)).toEqual(["Zhejiang / Ningbo", "Beijing"]);
      open(h);
      expect(check(0, "zj").getAttribute("aria-checked")).toBe("mixed");
      // Remove the first tag
      click(h.querySelector<HTMLElement>('[data-slot="tag"] button')!);
      expect(changes.at(-1)).toEqual([["bj"]]);
      expect(tags(h)).toEqual(["Beijing"]);
    });

    test("tags beyond maxTagCount fold into +N; clear all", () => {
      const h = mount(
        createElement(Cascader, {
          options: OPTIONS,
          multiple: true,
          maxTagCount: 1,
          clearable: true,
          defaultValue: [["zj", "nb"], ["bj"]],
        }),
      );
      expect(tags(h)).toEqual(["Zhejiang / Ningbo", "+1"]);
      click(h.querySelector<HTMLElement>('[data-slot="cascader-clear"]')!);
      expect(tags(h)).toEqual([]);
    });

    test("Space checks a leaf", async () => {
      const changes: string[][][] = [];
      const h = mount(
        createElement(Cascader, {
          options: OPTIONS,
          multiple: true,
          onValueChange: (p: string[][]) => changes.push(p),
        }),
      );
      open(h);
      await settle();
      key(option(0, "bj").parentElement!.querySelector("[data-value=bj]")!, " ");
      expect(changes.at(-1)).toEqual([["bj"]]);
    });
  });

  describe("search", () => {
    const searchInput = () =>
      panel()!.querySelector<HTMLInputElement>('[data-slot="cascader-search"] input')!;

    test("typing a keyword lists the matching full paths, clicking one selects it and closes", () => {
      const changes: string[][] = [];
      const h = mount(
        createElement(Cascader, {
          options: OPTIONS,
          searchable: true,
          onValueChange: (p: string[]) => changes.push(p),
        }),
      );
      open(h);
      expect(menu(0)).not.toBeNull();
      typeInto(searchInput(), "lake");
      const results = [...panel()!.querySelectorAll('[data-slot="cascader-option"]')];
      expect(results.map((e) => e.textContent)).toEqual(["Zhejiang / Hangzhou / West Lake"]);
      click(results[0]!);
      expect(changes).toEqual([["zj", "hz", "xh"]]);
      expect(panel()).toBeNull();
    });

    test("matches text at any level; disabled ones and no results", () => {
      const h = mount(
        createElement(Cascader, { options: OPTIONS, searchable: true, emptyText: "None" }),
      );
      open(h);
      typeInto(searchInput(), "zhejiang"); // matches the first level, all leaves count
      expect(
        [...panel()!.querySelectorAll('[data-slot="cascader-option"]')].map((e) => e.textContent),
      ).toEqual(["Zhejiang / Hangzhou / West Lake", "Zhejiang / Ningbo"]);
      typeInto(searchInput(), "nanjing"); // disabled
      expect(panel()!.querySelector('[data-slot="cascader-empty"]')!.textContent).toBe("None");
      typeInto(searchInput(), "");
      expect(menu(0)).not.toBeNull();
    });

    test("multiple + search: clicking a result checks or unchecks it, the panel stays open", () => {
      const changes: string[][][] = [];
      const h = mount(
        createElement(Cascader, {
          options: OPTIONS,
          multiple: true,
          searchable: true,
          onValueChange: (p: string[][]) => changes.push(p),
        }),
      );
      open(h);
      typeInto(searchInput(), "ning");
      click(panel()!.querySelector('[data-slot="cascader-option"]')!);
      expect(changes.at(-1)).toEqual([["zj", "nb"]]);
      expect(panel()).not.toBeNull();
      click(panel()!.querySelector('[data-slot="cascader-option"]')!);
      expect(changes.at(-1)).toEqual([]);
    });

    test("on open focus is in the search box, Down enters the results", async () => {
      const h = mount(createElement(Cascader, { options: OPTIONS, searchable: true }));
      open(h);
      await settle();
      expect(document.activeElement).toBe(searchInput());
      typeInto(searchInput(), "bei");
      act(() => {
        searchInput().dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
        );
      });
      expect(document.activeElement?.getAttribute("data-slot")).toBe("cascader-option");
    });
  });

  describe("async loading", () => {
    test("lazy options show an arrow, expanding calls onLoadChildren(path), a spinner while loading, children appear when loaded", async () => {
      const calls: string[][] = [];
      let release: () => void = () => {};
      function Demo() {
        const [opts, setOpts] = useState<CascaderOption[]>([
          { value: "remote", label: "Remote", lazy: true },
        ]);
        return createElement(Cascader, {
          options: opts,
          onLoadChildren: (path: string[]) => {
            calls.push(path);
            return new Promise<void>((resolve) => {
              release = () => {
                setOpts([
                  { value: "remote", label: "Remote", children: [{ value: "x", label: "x.ts" }] },
                ]);
                resolve();
              };
            });
          },
        });
      }
      const h = mount(createElement(Demo));
      open(h);
      expect(option(0, "remote").hasAttribute("data-has-children")).toBe(true);
      click(option(0, "remote"));
      expect(calls).toEqual([["remote"]]);
      expect(option(0, "remote").hasAttribute("data-loading")).toBe(true);
      expect(option(0, "remote").getAttribute("aria-busy")).toBe("true");
      expect(panel()!.querySelector('[data-slot="cascader-spinner"]')).not.toBeNull();
      click(option(0, "remote")); // clicking again while loading does not request again
      expect(calls).toHaveLength(1);
      await act(async () => {
        release();
      });
      expect(option(0, "remote").hasAttribute("data-loading")).toBe(false);
      expect(menu(1)).not.toBeNull();
      expect(option(1, "x")).not.toBeNull();
    });

    test("Right also triggers loading; an empty result turns it into a leaf (selectable once lazy is dropped)", async () => {
      const calls: string[][] = [];
      const changes: string[][] = [];
      function Demo() {
        const [opts, setOpts] = useState<CascaderOption[]>([
          { value: "a", label: "A", lazy: true },
        ]);
        return createElement(Cascader, {
          options: opts,
          onValueChange: (p: string[]) => changes.push(p),
          onLoadChildren: async (path: string[]) => {
            calls.push(path);
            setOpts([{ value: "a", label: "A" }]);
          },
        });
      }
      const h = mount(createElement(Demo));
      open(h);
      await settle();
      key(option(0, "a"), "ArrowRight");
      await settle();
      expect(calls).toEqual([["a"]]);
      expect(option(0, "a").hasAttribute("data-has-children")).toBe(false);
      click(option(0, "a"));
      expect(changes).toEqual([["a"]]);
    });
  });
});
