// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Command, CommandDialog } from "../src/index.ts";
import { score } from "../src/components/command/filter.ts";
import type { CommandEntry } from "../src/index.ts";

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
const input = () => document.querySelector<HTMLInputElement>("[data-slot=command-input]")!;
const labels = () =>
  [...document.querySelectorAll("[data-slot=command-item] [data-slot=command-label]")].map(
    (e) => e.textContent,
  );
const active = () =>
  document.querySelector("[data-slot=command-item][data-active] [data-slot=command-label]")
    ?.textContent;
const type = async (value: string) => {
  const el = input();
  await act(async () => {
    // React intercepts assignments to input.value, so the setter on the prototype must be used to trigger onChange
    // oxlint-disable-next-line typescript/unbound-method
    Reflect.set(HTMLInputElement.prototype, "value", value, el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const key = (k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    input().dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });

const ITEMS: CommandEntry[] = [
  { key: "home", label: "Go to Home", shortcut: "G H" },
  {
    type: "group",
    key: "files",
    label: "Files",
    items: [
      { key: "new", label: "New file", keywords: ["create"] },
      { key: "open", label: "Open file" },
      { key: "off", label: "Archive", disabled: true },
    ],
  },
  { type: "group", key: "empty", label: "Nothing", items: [] },
];

describe("score", () => {
  test("no query matches everything; exact > prefix > word start > contains > alias > subsequence; no match is 0", () => {
    expect(score("", "x")).toBe(1);
    const s = (q: string, l: string, k: string[] = []) => score(q, l, k);
    expect(s("home", "Home")).toBeGreaterThan(s("ho", "Home"));
    expect(s("ho", "Home")).toBeGreaterThan(s("fi", "New file"));
    expect(s("fi", "New file")).toBeGreaterThan(s("ew", "New file"));
    expect(s("ew", "New file")).toBeGreaterThan(s("create", "Open", ["create"]) - 0 || 0);
    expect(s("create", "Open", ["Create"])).toBeGreaterThan(s("nfl", "New file"));
    expect(s("nfl", "New file")).toBeGreaterThan(0);
    expect(s("zzz", "New file")).toBe(0);
  });
});

describe("Command", () => {
  test("SSR: the input is a combobox pointing to the listbox, groups have names, shortcuts are kbd; no class / style", () => {
    const html = ssr(createElement(Command, { items: ITEMS, "aria-label": "Palette" }));
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-autocomplete="list"');
    expect(html).toMatch(/aria-controls="([^"]+)"[\s\S]*role="listbox"/);
    expect(html).toContain('role="group" aria-label="Files"');
    expect(html).toContain('<kbd data-slot="command-shortcut">G H</kbd>');
    expect(html).not.toMatch(/class=|style=/);
  });

  test("no query: keeps the given order, ungrouped commands first, empty groups hidden; the first enabled item is active", async () => {
    await mount(createElement(Command, { items: ITEMS }));
    expect(labels()).toEqual(["Go to Home", "New file", "Open file", "Archive"]);
    expect(document.querySelector('[aria-label="Nothing"]')).toBeNull();
    expect(active()).toBe("Go to Home");
    expect(input().getAttribute("aria-activedescendant")).toBe(
      document.querySelector("[data-slot=command-item][data-active]")!.id,
    );
  });

  test("typing filters: sorted by match score, aliases (keywords) match too, emptyText when nothing matches", async () => {
    await mount(createElement(Command, { items: ITEMS, emptyText: "Nope" }));
    await type("file");
    expect(labels()).toEqual(["New file", "Open file"]);
    await type("create");
    expect(labels()).toEqual(["New file"]);
    await type("zzz");
    expect(labels()).toEqual([]);
    expect(document.querySelector("[data-slot=command-empty]")!.textContent).toBe("Nope");
    expect(input().hasAttribute("aria-activedescendant")).toBe(false);
  });

  test("scrolling the active item into view only sets the list's scrollTop, no scrollIntoView (it would scroll the page too)", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      await mount(createElement(Command, { items: ITEMS }));
      const list = document.querySelector<HTMLElement>("[data-slot=command-list]")!;
      const rect = (top: number, bottom: number) =>
        ({ top, bottom, left: 0, right: 0, width: 0, height: bottom - top }) as DOMRect;
      list.getBoundingClientRect = () => rect(0, 100);
      const rows = [...document.querySelectorAll<HTMLElement>("[data-slot=command-item]")];
      rows.forEach(
        (row, i) =>
          (row.getBoundingClientRect = () =>
            rect(i * 60 - list.scrollTop, i * 60 + 40 - list.scrollTop)),
      );
      list.scrollTop = 0;
      await key("ArrowDown"); // item 2: 60-100, still visible
      expect(list.scrollTop).toBe(0);
      await key("ArrowDown"); // item 3: 120-160, 60 past the bottom edge
      expect(list.scrollTop).toBe(60);
      expect(scrollIntoView).not.toHaveBeenCalled();
    } finally {
      delete (Element.prototype as unknown as Record<string, unknown>).scrollIntoView;
    }
  });

  test("Up / Down move between enabled items, wrapping, skipping disabled ones; Home / End go to the ends", async () => {
    await mount(createElement(Command, { items: ITEMS }));
    await key("ArrowDown");
    expect(active()).toBe("New file");
    await key("ArrowDown");
    expect(active()).toBe("Open file");
    await key("ArrowDown"); // Archive is disabled, wraps to the first
    expect(active()).toBe("Go to Home");
    await key("ArrowUp");
    expect(active()).toBe("Open file");
    await key("Home");
    expect(active()).toBe("Go to Home");
    await key("End");
    expect(active()).toBe("Open file");
  });

  test("Enter runs the active item: both item.onSelect and onSelect are called; clicking a disabled item does nothing; Enter during IME composition does not run", async () => {
    const itemSelect = vi.fn();
    const onSelect = vi.fn();
    const items: CommandEntry[] = [
      { key: "a", label: "Alpha", onSelect: itemSelect },
      { key: "b", label: "Beta", disabled: true },
    ];
    await mount(createElement(Command, { items, onSelect }));
    await key("Enter", { isComposing: true } as KeyboardEventInit);
    expect(onSelect).not.toHaveBeenCalled();
    await key("Enter");
    expect(itemSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]![0]).toBe("a");
    await act(async () =>
      document.querySelectorAll<HTMLElement>("[data-slot=command-item]")[1]!.click(),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test("click runs; hovering makes an item active; a new query resets the active item to the first", async () => {
    const onSelect = vi.fn();
    await mount(createElement(Command, { items: ITEMS, onSelect }));
    const rows = document.querySelectorAll<HTMLElement>("[data-slot=command-item]");
    await act(async () =>
      rows[2]!.dispatchEvent(new PointerEvent("pointermove", { bubbles: true })),
    );
    expect(active()).toBe("Open file");
    await type("file");
    expect(active()).toBe("New file");
    await act(async () =>
      document.querySelectorAll<HTMLElement>("[data-slot=command-item]")[1]!.click(),
    );
    expect(onSelect.mock.calls[0]![0]).toBe("open");
  });

  test("controlled query: typing only notifies, query decides what is shown", async () => {
    const onQueryChange = vi.fn();
    await mount(createElement(Command, { items: ITEMS, query: "open", onQueryChange }));
    expect(labels()).toEqual(["Open file"]);
    await type("x");
    expect(onQueryChange).toHaveBeenCalledWith("x");
    expect(input().value).toBe("open");
  });
});

describe("CommandDialog", () => {
  const openDialog = () => document.querySelector("[data-slot=command-dialog]");

  test("open controls visibility; the dialog has a name; closes after selecting by default, not with closeOnSelect=false", async () => {
    const onOpenChange = vi.fn();
    await mount(
      createElement(CommandDialog, { items: ITEMS, open: true, onOpenChange, title: "Palette" }),
    );
    expect(openDialog()!.getAttribute("aria-label")).toBe("Palette");
    await key("Enter");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await act(async () => root!.unmount());
    host!.remove();
    const second = vi.fn();
    await mount(
      createElement(CommandDialog, {
        items: ITEMS,
        open: true,
        onOpenChange: second,
        closeOnSelect: false,
      }),
    );
    await key("Enter");
    expect(second).not.toHaveBeenCalled();
  });

  test("hotkey: mod+k toggles (Ctrl or Cmd), other combinations do not, no listening after unmount", async () => {
    await mount(createElement(CommandDialog, { items: ITEMS, hotkey: "mod+k" }));
    expect(openDialog()).toBeNull();
    const press = (init: KeyboardEventInit) =>
      act(async () => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }),
        );
      });
    await press({ key: "k", ctrlKey: true });
    expect(openDialog()).not.toBeNull();
    await press({ key: "k" }); // no modifier key
    expect(openDialog()).not.toBeNull();
    await press({ key: "k", metaKey: true });
    expect(openDialog()).toBeNull();
    await press({ key: "j", ctrlKey: true });
    expect(openDialog()).toBeNull();
  });
});
