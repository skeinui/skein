// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { WebPreview } from "../src/index.ts";

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
const frame = () => host!.querySelector<HTMLIFrameElement>("iframe")!;
const input = () => host!.querySelector<HTMLInputElement>('[data-slot="web-preview-url"]')!;
async function type(el: HTMLInputElement, value: string) {
  await act(async () => {
    Reflect.set(HTMLInputElement.prototype, "value", value, el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const key = (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });

describe("<WebPreview />", () => {
  test("SSR has no class / style; default iframe sandbox: scripts and forms only, no same-origin", () => {
    const html = ssr(createElement(WebPreview, { src: "https://example.com" }));
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    expect(html).toContain('sandbox="allow-scripts allow-forms"');
    expect(html).not.toContain("allow-same-origin");
  });

  test("the iframe and address bar are named, the new tab link has noopener", async () => {
    await mount(createElement(WebPreview, { src: "https://example.com/a", title: "Demo" }));
    expect(frame().title).toBe("Demo");
    expect(frame().getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(frame().getAttribute("src")).toBe("https://example.com/a");
    expect(input().getAttribute("aria-label")).toBe("Address");
    const a = host!.querySelector<HTMLAnchorElement>("a")!;
    expect(a.getAttribute("href")).toBe("https://example.com/a");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    expect(a.getAttribute("aria-label")).toBe("Open in new tab");
  });

  test("status while loading, gone after the iframe loads", async () => {
    await mount(createElement(WebPreview, { src: "https://example.com" }));
    expect(host!.querySelector('[data-slot="web-preview-loading"]')?.getAttribute("role")).toBe(
      "status",
    );
    expect(host!.querySelector('[data-slot="web-preview"]')?.hasAttribute("data-loading")).toBe(
      true,
    );
    await act(async () => frame().dispatchEvent(new Event("load")));
    expect(host!.querySelector('[data-slot="web-preview-loading"]')).toBeNull();
    expect(host!.querySelector('[data-slot="web-preview"]')?.hasAttribute("data-loading")).toBe(
      false,
    );
  });

  test("Enter in the address bar navigates: adds https without a protocol, calls onNavigate", async () => {
    const onNavigate = vi.fn();
    await mount(createElement(WebPreview, { src: "https://a.com", onNavigate }));
    await type(input(), "b.com/x");
    await key(input(), "Enter");
    expect(frame().getAttribute("src")).toBe("https://b.com/x");
    expect(input().value).toBe("https://b.com/x");
    expect(onNavigate).toHaveBeenCalledWith("https://b.com/x");
  });

  test("javascript: / data: addresses don't navigate, show an error and set aria-invalid", async () => {
    const onNavigate = vi.fn();
    await mount(createElement(WebPreview, { src: "https://a.com", onNavigate }));
    for (const bad of ["javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd"]) {
      await type(input(), bad);
      await key(input(), "Enter");
      expect(frame().getAttribute("src")).toBe("https://a.com");
      expect(input().getAttribute("aria-invalid")).toBe("true");
      expect(host!.querySelector('[role="alert"]')).not.toBeNull();
    }
    expect(onNavigate).not.toHaveBeenCalled();
    await type(input(), "https://ok.com");
    expect(input().hasAttribute("aria-invalid")).toBe(false);
  });

  test("Esc restores the address bar; read-only with editable=false, Enter doesn't navigate", async () => {
    await mount(createElement(WebPreview, { src: "https://a.com" }));
    await type(input(), "zzz");
    await key(input(), "Escape");
    expect(input().value).toBe("https://a.com");
    await act(async () =>
      root!.render(createElement(WebPreview, { src: "https://a.com", editable: false })),
    );
    expect(input().readOnly).toBe(true);
  });

  test("reload recreates the iframe and goes back to loading", async () => {
    await mount(createElement(WebPreview, { src: "https://a.com" }));
    await act(async () => frame().dispatchEvent(new Event("load")));
    const before = frame();
    const reload = host!.querySelector<HTMLButtonElement>('button[aria-label="Reload"]')!;
    await act(async () => reload.click());
    expect(frame()).not.toBe(before);
    expect(host!.querySelector('[data-slot="web-preview-loading"]')).not.toBeNull();
  });

  test("follows src changes from outside; html mode uses srcdoc, no new tab link", async () => {
    await mount(createElement(WebPreview, { src: "https://a.com" }));
    await act(async () => root!.render(createElement(WebPreview, { src: "https://b.com" })));
    expect(frame().getAttribute("src")).toBe("https://b.com");
    expect(input().value).toBe("https://b.com");
    await act(async () =>
      root!.render(createElement(WebPreview, { html: "<p>hi</p>", title: "Doc" })),
    );
    expect(frame().getAttribute("srcdoc")).toBe("<p>hi</p>");
    expect(host!.querySelector("a")).toBeNull();
    expect(host!.querySelector("input")).toBeNull();
  });

  test("height as a CSS variable, custom sandbox and labels apply", async () => {
    await mount(
      createElement(WebPreview, {
        src: "https://a.com",
        height: 200,
        sandbox: "allow-scripts",
        labels: { reload: "Refresh frame", open: "Pop out", address: "Location" },
      }),
    );
    expect(
      host!
        .querySelector<HTMLElement>('[data-slot="web-preview-viewport"]')!
        .style.getPropertyValue("--web-height"),
    ).toBe("200px");
    expect(frame().getAttribute("sandbox")).toBe("allow-scripts");
    expect(host!.querySelector('button[aria-label="Refresh frame"]')).not.toBeNull();
    expect(host!.querySelector('a[aria-label="Pop out"]')).not.toBeNull();
    expect(input().getAttribute("aria-label")).toBe("Location");
  });
});
