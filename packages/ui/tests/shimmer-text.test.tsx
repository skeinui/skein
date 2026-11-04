// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { ShimmerText } from "../src/index.ts";

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

describe("ShimmerText", () => {
  test("SSR: text plus an aria-hidden highlight layer, no class / style", () => {
    const html = ssr(createElement(ShimmerText, null, "Thinking…"));
    expect(html).toContain('data-slot="shimmer-text"');
    expect(html).toContain("data-active");
    expect(html).toContain('data-slot="shimmer-text-label">Thinking…<');
    expect(html).toContain('data-slot="shimmer-text-highlight" aria-hidden="true">Thinking…<');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("active=false: no highlight layer, no data-active", () => {
    const html = ssr(createElement(ShimmerText, { active: false }, "Done"));
    expect(html).not.toContain("shimmer-text-highlight");
    expect(html).not.toContain("data-active");
    expect(html).toContain("Done");
  });

  test("duration is written as --sh-duration", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ShimmerText, { duration: 3.5 }, "Thinking…"));
    });
    const el = host.querySelector<HTMLElement>('[data-slot="shimmer-text"]')!;
    expect(el.style.getPropertyValue("--sh-duration")).toBe("3.5s");
  });
});
