// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { ThreadList } from "../src/index.ts";

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

const items = [
  { id: "a", title: "Project planning", preview: "Here is the plan…", meta: "Today" },
  { id: "b", title: "Recipe ideas" },
];

describe("ThreadList", () => {
  test("SSR: a named nav, each row a button, no class / style", () => {
    const html = ssr(createElement(ThreadList, { items }));
    expect(html).toContain('<nav data-slot="thread-list" aria-label="Conversations">');
    expect(html.match(/<button type="button"/g)).toHaveLength(2);
    expect(html).toContain('data-slot="thread-list-title">Project planning<');
    expect(html).toContain('data-slot="thread-list-preview">Here is the plan…<');
    expect(html).toContain('data-slot="thread-list-meta">Today<');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    // A row without a preview has no preview slot
    expect(html.match(/thread-list-preview/g)).toHaveLength(1);
  });

  test("current thread: aria-current and data-selected", () => {
    const html = ssr(createElement(ThreadList, { items, value: "b" }));
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    expect(html).toMatch(
      /data-selected="" aria-current="true"[^>]*>(?:(?!<\/button>).)*Recipe ideas/,
    );
  });

  test("no threads: shows empty, no list", () => {
    const html = ssr(createElement(ThreadList, { items: [], empty: "No conversations yet" }));
    expect(html).toContain('data-slot="thread-list-empty">No conversations yet<');
    expect(html).not.toContain("<ul");
  });

  test("aria-label can be changed", () => {
    expect(ssr(createElement(ThreadList, { items, "aria-label": "Conversations" }))).toContain(
      'aria-label="Conversations"',
    );
  });

  test("clicking a row calls onValueChange with its id", async () => {
    const onValueChange = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ThreadList, { items, value: "a", onValueChange }));
    });
    const buttons = host.querySelectorAll<HTMLButtonElement>("button");
    await act(async () => buttons[1]!.click());
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});
