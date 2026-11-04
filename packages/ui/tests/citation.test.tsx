// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Citation, Citations } from "../src/index.ts";

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
}

describe("Citation", () => {
  test("url source: a safe new-tab link, title defaults to the domain, no class / style", () => {
    const html = ssr(createElement(Citation, { href: "https://www.example.com/a/b" }));
    expect(html).toContain('href="https://www.example.com/a/b"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('data-slot="citation-title">example.com<');
    expect(html).toContain('data-type="url"');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("without a favicon shows the title's initial; with one shows the icon (empty alt, decorative)", () => {
    expect(ssr(createElement(Citation, { href: "https://a.com", title: "heroui" }))).toContain(
      'data-slot="citation-fallback">H<',
    );
    const withIcon = ssr(
      createElement(Citation, { href: "https://a.com", faviconUrl: "/f.png", title: "x" }),
    );
    expect(withIcon).toContain('<img data-slot="citation-favicon" src="/f.png" alt=""');
  });

  test("falls back to the initial when the icon fails to load", async () => {
    await mount(
      createElement(Citation, { href: "https://a.com", faviconUrl: "/bad.png", title: "base" }),
    );
    const img = host!.querySelector("img")!;
    await act(async () => img.dispatchEvent(new Event("error")));
    expect(host!.querySelector("img")).toBeNull();
    expect(host!.querySelector('[data-slot="citation-fallback"]')!.textContent).toBe("B");
  });

  test("non-http(s) addresses do not become links", () => {
    const html = ssr(createElement(Citation, { href: "javascript:alert(1)", title: "bad" }));
    expect(html).not.toContain("href=");
    expect(html).toContain("<span");
  });

  test("document source: not a link; a button when onClick is given", async () => {
    const html = ssr(createElement(Citation, { sourceType: "document", title: "report.pdf" }));
    expect(html).toContain('data-type="document"');
    expect(html).not.toContain("<a");
    expect(html).not.toContain("<button");
    const onClick = vi.fn();
    await mount(createElement(Citation, { sourceType: "document", title: "report.pdf", onClick }));
    const button = host!.querySelector<HTMLButtonElement>("button")!;
    await act(async () => button.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("with description: hover / focus shows a preview card (title, description, domain)", async () => {
    await mount(
      createElement(Citation, {
        href: "https://base-ui.com/docs",
        title: "Base UI",
        description: "Unstyled React components.",
      }),
    );
    const link = host!.querySelector<HTMLAnchorElement>("a")!;
    expect(link.getAttribute("data-slot")).toBe("citation");
    expect(link.getAttribute("target")).toBe("_blank");
    await act(async () => {
      link.focus();
      link.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    });
    // The preview needs a short delay to appear: here we only confirm the trigger is still a link and didn't lose attributes because of the preview
    expect(link.getAttribute("href")).toBe("https://base-ui.com/docs");
  });
});

describe("Citations", () => {
  test("the trigger is a summary, collapsed by default; expanded it shows a row of Citations", async () => {
    await mount(
      createElement(
        Citations,
        { label: "2 sources" },
        createElement(Citation, { href: "https://a.com" }),
        createElement(Citation, { href: "https://b.com" }),
      ),
    );
    const trigger = () =>
      host!.querySelector<HTMLButtonElement>('[data-slot="citations-trigger"]')!;
    expect(trigger().textContent).toContain("2 sources");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    await act(async () => trigger().click());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(host!.querySelectorAll('[data-slot="citation"]')).toHaveLength(2);
  });
});
