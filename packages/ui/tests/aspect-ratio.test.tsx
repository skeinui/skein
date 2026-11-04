// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { AspectRatio } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
async function mount(ratio?: number | string) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(
      createElement(
        AspectRatio,
        { ratio, radius: "md" },
        createElement("img", { alt: "", src: "x.png" }),
      ),
    );
  });
  return document.querySelector<HTMLElement>('[data-slot="aspect-ratio"]')!;
}

describe("AspectRatio", () => {
  test("SSR: wraps the content, radius written as an attribute, no class / style", () => {
    const html = renderToStaticMarkup(
      createElement(AspectRatio, { radius: "lg" }, createElement("img", { alt: "", src: "x.png" })),
    );
    expect(html).toContain('data-slot="aspect-ratio"');
    expect(html).toContain('data-radius="lg"');
    expect(html).toContain("<img");
    expect(html).not.toMatch(/class=|style=/);
  });

  test("ratio written as --ar-ratio: a number, a '16/9' string, default 1; invalid values count as 1", async () => {
    expect((await mount(16 / 9)).style.getPropertyValue("--ar-ratio")).toBe(String(16 / 9));
    await act(async () => root!.unmount());
    host!.remove();
    expect((await mount("4 / 3")).style.getPropertyValue("--ar-ratio")).toBe(String(4 / 3));
    await act(async () => root!.unmount());
    host!.remove();
    expect((await mount()).style.getPropertyValue("--ar-ratio")).toBe("1");
    await act(async () => root!.unmount());
    host!.remove();
    expect((await mount(-2)).style.getPropertyValue("--ar-ratio")).toBe("1");
  });
});
