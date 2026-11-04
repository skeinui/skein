// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Progress } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
async function mount(props: Record<string, unknown>) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(Progress, { value: 30, "aria-label": "Upload", ...props } as never));
  });
}
const indicator = () =>
  document.querySelector<SVGElement>('[data-slot="progress-circle-indicator"]')!;

describe("Progress circle", () => {
  test("SSR: the ring is an aria-hidden SVG (accessibility is on the progressbar), track + indicator, no class / style", () => {
    const html = renderToStaticMarkup(
      createElement(Progress, { value: 40, type: "circle", showValue: true, "aria-label": "Done" }),
    );
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="40"');
    expect(html).toContain('data-type="circle"');
    expect(html).toMatch(/<svg[^>]*data-slot="progress-circle"[^>]*aria-hidden="true"/);
    expect(html).toContain('data-slot="progress-circle-track"');
    expect(html).toContain('data-slot="progress-circle-indicator"');
    expect(html).toContain('pathLength="100"');
    expect(html).toContain('data-slot="progress-circle-value"');
    expect(html).not.toContain("progress-track");
    // A visually hidden <span style=...> that Base UI places itself (an aid for screen readers) is part of its inline styles, not counted
    expect(html.replace(/<span role="presentation" style="[^"]*">[^<]*<\/span>/, "")).not.toMatch(
      /class=|style=/,
    );
  });

  test("the bar is unaffected: without type it is still track + indicator, no SVG", () => {
    const html = renderToStaticMarkup(createElement(Progress, { value: 40 }));
    expect(html).toContain('data-type="line"');
    expect(html).toContain('data-slot="progress-track"');
    expect(html).not.toContain("<svg");
  });

  test("progress as --pc-value (0–100, scaled by min / max); none for null; dashboard has data-type", async () => {
    await mount({ type: "circle", value: 30 });
    expect(indicator().style.getPropertyValue("--pc-value")).toBe("30");
    await act(async () => root!.unmount());
    host!.remove();
    await mount({ type: "dashboard", value: 50, min: 0, max: 200 });
    expect(indicator().style.getPropertyValue("--pc-value")).toBe("25");
    expect(document.querySelector('[data-slot="progress"]')!.getAttribute("data-type")).toBe(
      "dashboard",
    );
    await act(async () => root!.unmount());
    host!.remove();
    await mount({ type: "circle", value: null });
    expect(indicator().style.getPropertyValue("--pc-value")).toBe("");
    expect(
      document.querySelector('[data-slot="progress"]')!.hasAttribute("data-indeterminate"),
    ).toBe(true);
  });

  test("out-of-range values are clamped to 0–100; label shows below the ring", async () => {
    await mount({ type: "circle", value: 130, label: "Storage" });
    expect(indicator().style.getPropertyValue("--pc-value")).toBe("100");
    expect(document.querySelector('[data-slot="progress-label"]')!.textContent).toBe("Storage");
  });
});
