// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Suggestions } from "../src/index.ts";
import { SUGGESTIONS_LAYOUTS } from "../src/contract.ts";

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
  {
    title: "Summarize this document",
    description: "Create a concise summary.",
    prompt: "Summarize it",
  },
  { title: "Write a haiku" },
];

describe("Suggestions", () => {
  test("SSR: role=group named by the title, each suggestion a button, no class / style", () => {
    const html = ssr(
      createElement(Suggestions, {
        items,
        title: "What can I help with?",
        description: "Pick one.",
      }),
    );
    expect(html).toContain('role="group"');
    expect(html).toMatch(/aria-labelledby="[^"]+"/);
    expect(html).toContain('data-slot="suggestions-title"');
    expect(html).toContain('data-slot="suggestions-description">Pick one.<');
    expect(html.match(/<button type="button"/g)).toHaveLength(2);
    expect(html).toContain('data-slot="suggestions-item-title">Summarize this document<');
    expect(html).toContain('data-slot="suggestions-item-description">Create a concise summary.<');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("without a title it is named by aria-label (default Suggestions)", () => {
    expect(ssr(createElement(Suggestions, { items }))).toContain('aria-label="Suggestions"');
    expect(ssr(createElement(Suggestions, { items, "aria-label": "Starter prompts" }))).toContain(
      'aria-label="Starter prompts"',
    );
    expect(ssr(createElement(Suggestions, { items }))).not.toContain("suggestions-header");
  });

  test.each(SUGGESTIONS_LAYOUTS)("%s: layout is written on data-layout", (layout) => {
    expect(ssr(createElement(Suggestions, { items, layout }))).toContain(`data-layout="${layout}"`);
  });

  test("chips don't show descriptions", () => {
    const html = ssr(createElement(Suggestions, { items, layout: "chips" }));
    expect(html).not.toContain("suggestions-item-description");
  });

  test("icons are decorative (aria-hidden)", () => {
    const html = ssr(
      createElement(Suggestions, { items: [{ title: "x", icon: createElement("svg") }] }),
    );
    expect(html).toContain('data-slot="suggestions-item-icon" aria-hidden="true"');
  });

  test("clicking passes that suggestion to onSelect", async () => {
    const onSelect = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(Suggestions, { items, onSelect }));
    });
    const buttons = host.querySelectorAll<HTMLButtonElement>("button");
    await act(async () => buttons[0]!.click());
    expect(onSelect).toHaveBeenCalledWith(items[0]);
    await act(async () => buttons[1]!.click());
    expect(onSelect).toHaveBeenLastCalledWith(items[1]);
  });
});
