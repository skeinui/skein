// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { MermaidBlock } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  document.documentElement.removeAttribute("data-mode");
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
const flush = () => act(async () => {});
const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';
const q = (s: string) => host!.querySelector<HTMLElement>(s);

describe("<MermaidBlock />", () => {
  test("SSR has no class / style; renders as loading on the server", () => {
    const html = ssr(
      createElement(MermaidBlock, { code: "graph TD;A-->B", render: async () => SVG }),
    );
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    expect(html).toContain('data-state="loading"');
  });

  test("status while rendering; on success the diagram goes into an <img> (data URL, no injected SVG)", async () => {
    let resolve!: (s: string) => void;
    const render = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    await mount(createElement(MermaidBlock, { code: "graph TD;A-->B", render }));
    expect(q('[data-slot="mermaid-status"]')?.getAttribute("role")).toBe("status");
    await act(async () => resolve(SVG));
    expect(q('[data-slot="mermaid"]')?.getAttribute("data-state")).toBe("ready");
    expect(q('[data-slot="mermaid-status"]')).toBeNull();
    const img = q("img")!;
    expect(img.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);
    expect(img.getAttribute("alt")).toBe("Diagram");
    expect(img.getAttribute("width")).toBe("10");
    expect(img.getAttribute("height")).toBe("10");
    expect(host!.querySelector('[data-slot="mermaid-body"] svg')).toBeNull();
    expect(render).toHaveBeenCalledWith("graph TD;A-->B", { theme: "light" });
  });

  test("a render function returning non-SVG (e.g. HTML) counts as a failure", async () => {
    await mount(
      createElement(MermaidBlock, {
        code: "x",
        render: async () => "<img src=x onerror=alert(1)>",
      }),
    );
    expect(q('[data-slot="mermaid"]')?.getAttribute("data-state")).toBe("error");
    expect(q("img")).toBeNull();
  });

  test("failure: role=alert shows the error, the source replaces the diagram", async () => {
    await mount(
      createElement(MermaidBlock, {
        code: "bad ;;",
        render: () => Promise.reject(new Error("Parse error on line 1")),
      }),
    );
    expect(q('[data-slot="mermaid-error"]')?.getAttribute("role")).toBe("alert");
    expect(q('[data-slot="mermaid-error"]')?.textContent).toContain("Parse error on line 1");
    expect(q('[data-slot="mermaid-source"]')?.textContent).toBe("bad ;;");
  });

  test("success then failure: keeps the previous diagram faded (data-stale) and shows the error", async () => {
    const render = vi.fn().mockResolvedValueOnce(SVG).mockRejectedValueOnce(new Error("boom"));
    await mount(createElement(MermaidBlock, { code: "a", render }));
    await act(async () => root!.render(createElement(MermaidBlock, { code: "b", render })));
    await flush();
    expect(q("img")?.hasAttribute("data-stale")).toBe(true);
    expect(q('[data-slot="mermaid-error"]')?.textContent).toContain("boom");
  });

  test("source toggle: aria-pressed, name follows state, the source area is focusable and named", async () => {
    await mount(createElement(MermaidBlock, { code: "graph TD;A-->B", render: async () => SVG }));
    const toggle = q('[data-slot="mermaid-action"]')!;
    expect(toggle.getAttribute("aria-label")).toBe("View source");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    await act(async () => toggle.click());
    expect(toggle.getAttribute("aria-label")).toBe("View diagram");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    const src = q('[data-slot="mermaid-source"]')!;
    expect(src.textContent).toBe("graph TD;A-->B");
    expect(src.getAttribute("tabindex")).toBe("0");
    expect(src.getAttribute("aria-label")).toBe("Diagram source");
    expect(q('[data-slot="mermaid-body"]')).toBeNull();
  });

  test("copies the source, the button name becomes Copied", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await mount(createElement(MermaidBlock, { code: "graph TD;A-->B", render: async () => SVG }));
    const copy = host!.querySelectorAll<HTMLElement>('[data-slot="mermaid-action"]')[1]!;
    expect(copy.getAttribute("aria-label")).toBe("Copy source");
    await act(async () => copy.click());
    expect(writeText).toHaveBeenCalledWith("graph TD;A-->B");
    expect(copy.getAttribute("aria-label")).toBe("Copied");
  });

  test("re-renders with the new theme when data-mode changes", async () => {
    document.documentElement.setAttribute("data-mode", "dark");
    const render = vi.fn().mockResolvedValue(SVG);
    await mount(createElement(MermaidBlock, { code: "a", render }));
    expect(render).toHaveBeenLastCalledWith("a", { theme: "dark" });
    await act(async () => document.documentElement.setAttribute("data-mode", "light"));
    await flush();
    expect(render).toHaveBeenLastCalledWith("a", { theme: "light" });
  });

  test("re-renders when code changes; stale results don't overwrite newer ones", async () => {
    const resolvers: ((s: string) => void)[] = [];
    const render = vi.fn(() => new Promise<string>((r) => resolvers.push(r)));
    await mount(createElement(MermaidBlock, { code: "a", render }));
    await act(async () => root!.render(createElement(MermaidBlock, { code: "b", render })));
    await act(async () => resolvers[1]!(SVG.replace("0 0 10 10", "0 0 20 20")));
    const fresh = q("img")!.getAttribute("src");
    await act(async () => resolvers[0]!(SVG.replace("0 0 10 10", "0 0 30 30")));
    expect(q("img")!.getAttribute("src")).toBe(fresh);
  });

  test("labels apply", async () => {
    await mount(
      createElement(MermaidBlock, {
        code: "a",
        render: async () => SVG,
        labels: { diagram: "Flow chart", showSource: "Show code", copy: "Copy code" },
      }),
    );
    expect(q("img")?.getAttribute("alt")).toBe("Flow chart");
    expect(q('[data-slot="mermaid-action"]')?.getAttribute("aria-label")).toBe("Show code");
  });
});
