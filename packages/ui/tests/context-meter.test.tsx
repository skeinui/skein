// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { ContextMeter, formatTokens } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
});

describe("formatTokens", () => {
  test.each([
    [0, "0"],
    [999, "999"],
    [1000, "1K"],
    [12345, "12.3K"],
    [128000, "128K"],
    [1_000_000, "1M"],
    [1_500_000, "1.5M"],
    [-5, "0"],
    [Number.NaN, "0"],
  ])("%s → %s", (n, text) => {
    expect(formatTokens(n)).toBe(text);
  });
});

describe("ContextMeter", () => {
  test("SSR: the trigger is a button whose name has the percentage and token count, no class / style", () => {
    const html = ssr(createElement(ContextMeter, { used: 57600, max: 128000 }));
    expect(html).toContain('data-slot="context-meter"');
    expect(html).toContain('aria-label="Context 45% used, 57.6K of 128K tokens"');
    expect(html).toContain('data-slot="context-meter-percent" aria-hidden="true">45%<');
    expect(html).toContain('data-slot="context-meter-ring"');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("usage level: warn from 70%, danger from 90%; above max counts as 100%", () => {
    expect(ssr(createElement(ContextMeter, { used: 10, max: 100 }))).toContain('data-level="ok"');
    expect(ssr(createElement(ContextMeter, { used: 70, max: 100 }))).toContain('data-level="warn"');
    expect(ssr(createElement(ContextMeter, { used: 90, max: 100 }))).toContain(
      'data-level="danger"',
    );
    const over = ssr(createElement(ContextMeter, { used: 500, max: 100 }));
    expect(over).toContain(">100%<");
    expect(over).toContain('data-level="danger"');
  });

  test("the ring's arc follows the percentage", () => {
    const circumference = 2 * Math.PI * 8;
    const html = ssr(createElement(ContextMeter, { used: 50, max: 100 }));
    expect(html).toContain(`stroke-dasharray="${circumference / 2} ${circumference}"`);
  });

  test("max of 0 does not crash (treated as 1)", () => {
    expect(() => ssr(createElement(ContextMeter, { used: 0, max: 0 }))).not.toThrow();
  });

  test("opened: title, total, breakdown list (including uncategorised and remaining)", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(
        createElement(ContextMeter, {
          used: 50000,
          max: 100000,
          segments: [
            { id: "m", label: "Messages", tokens: 30000 },
            { id: "t", label: "Tool results", tokens: 10000 },
          ],
        }),
      );
    });
    await act(async () => host!.querySelector<HTMLElement>('[data-slot="context-meter"]')!.click());
    expect(document.querySelector('[data-slot="context-meter-heading"]')!.textContent).toBe(
      "Context window",
    );
    expect(document.querySelector('[data-slot="context-meter-total"]')!.textContent).toBe(
      "50K / 100K tokens · 50%",
    );
    const rows = [...document.querySelectorAll('[data-slot="context-meter-item"]')].map(
      (r) => r.textContent,
    );
    expect(rows).toEqual(["Messages30K", "Tool results10K", "Other10K", "Free50K"]);
    // Stacked bar: each segment's width is written as --ctx-w
    const widths = [
      ...document.querySelectorAll<HTMLElement>('[data-slot="context-meter-segment"]'),
    ].map((s) => s.style.getPropertyValue("--ctx-w"));
    expect(widths).toEqual(["30%", "10%"]);
  });

  test("without segments: the popup has only the total", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ContextMeter, { used: 1, max: 4 }));
    });
    await act(async () => host!.querySelector<HTMLElement>('[data-slot="context-meter"]')!.click());
    expect(document.querySelector('[data-slot="context-meter-list"]')).toBeNull();
  });

  test("labels switch the language", () => {
    const html = ssr(
      createElement(ContextMeter, {
        used: 10,
        max: 100,
        labels: { summary: (p) => `${p}% of the context` },
      }),
    );
    expect(html).toContain('aria-label="10% of the context"');
  });
});
