// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Queue } from "../src/index.ts";
import type { QueueItem } from "../src/index.ts";

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
async function mount(el: React.ReactElement) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(el));
  return host;
}

const ITEMS: QueueItem[] = [
  { id: "a", text: "Summarize the report" },
  { id: "b", text: "Translate to French" },
  { id: "c", text: "Draft an email" },
];
const texts = () =>
  [...host!.querySelectorAll('[data-slot="queue-text"]')].map((e) => e.textContent);
const key = (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });

function Harness({ onChange }: { onChange?: (items: QueueItem[]) => void }) {
  const [items, setItems] = useState(ITEMS);
  return createElement(Queue, {
    items,
    onChange: (next) => {
      setItems(next);
      onChange?.(next);
    },
  });
}

describe("<Queue />", () => {
  test("SSR has no class / style; the header has a title and a count", () => {
    const html = ssr(createElement(Queue, { items: ITEMS, onChange: () => {} }));
    expect(html).not.toMatch(/\sclass=/);
    expect(html).toContain("Queued");
    expect(html).toContain('data-slot="queue-count">3<');
  });

  test("lists in order, a named list and named remove buttons", async () => {
    await mount(createElement(Harness));
    expect(texts()).toEqual(ITEMS.map((i) => i.text));
    expect(host!.querySelector("ul")?.getAttribute("aria-label")).toBe("Queued messages");
    expect(host!.querySelector('button[aria-label="Remove Translate to French"]')).not.toBeNull();
  });

  test("remove: onChange gets the queue without that item, the count updates", async () => {
    const onChange = vi.fn();
    await mount(createElement(Harness, { onChange }));
    const btn = host!.querySelector<HTMLButtonElement>(
      'button[aria-label="Remove Translate to French"]',
    )!;
    await act(async () => btn.click());
    expect(onChange).toHaveBeenCalledWith([ITEMS[0], ITEMS[2]]);
    expect(texts()).toEqual(["Summarize the report", "Draft an email"]);
    expect(host!.querySelector('[data-slot="queue-count"]')?.textContent).toBe("2");
  });

  test("keyboard reorder: Space on the handle picks up, ↓ moves, Space drops, onChange gets the new order", async () => {
    const onChange = vi.fn();
    await mount(createElement(Harness, { onChange }));
    const handle = host!.querySelector<HTMLElement>('[data-slot="sortable-handle"]')!;
    await act(async () => handle.focus());
    await key(handle, " ");
    await key(handle, "ArrowDown");
    await key(handle, " ");
    expect(onChange).toHaveBeenCalled();
    expect(texts()).toEqual(["Translate to French", "Summarize the report", "Draft an email"]);
  });

  test("an empty queue shows a hint and no list; labels apply", async () => {
    await mount(
      createElement(Queue, {
        items: [],
        onChange: () => {},
        labels: { title: "Up next", empty: "No messages waiting" },
      }),
    );
    expect(host!.querySelector("ul")).toBeNull();
    expect(host!.querySelector('[data-slot="queue-empty"]')?.textContent).toBe(
      "No messages waiting",
    );
    expect(host!.querySelector('[data-slot="queue-title"]')?.textContent).toBe("Up next");
  });
});
