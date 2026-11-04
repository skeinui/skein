// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Sidebar } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("<Sidebar /> collapse / expand transition switch", () => {
  test("no data-animate on mount (no animation for first-frame width changes), set after two frames", async () => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () =>
      root!.render(
        createElement(
          Sidebar.Provider,
          null,
          createElement(Sidebar, { collapsible: "icon" }, createElement("i")),
          createElement(Sidebar.Inset, null, "main"),
        ),
      ),
    );
    const sidebar = () => document.querySelector('[data-slot="sidebar"]')!;
    expect(sidebar().hasAttribute("data-animate")).toBe(false);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 120));
    });
    expect(sidebar().hasAttribute("data-animate")).toBe(true);
  });
});
