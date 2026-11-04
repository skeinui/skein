// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Result, Statistic, formatNumber } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("Result", () => {
  test("SSR: each part rendered when given, no class / style", () => {
    const html = ssr(
      createElement(
        Result,
        { status: "success", title: "Done", description: "All saved", extra: "Buttons" },
        "Details",
      ),
    );
    for (const slot of [
      "result",
      "result-icon",
      "result-title",
      "result-description",
      "result-extra",
      "result-content",
    ]) {
      expect(html, slot).toContain(`data-slot="${slot}"`);
    }
    expect(html).toContain('data-status="success"');
    expect(html).toContain("<svg");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("parts not given aren't rendered; default status is info", () => {
    const html = ssr(createElement(Result, { title: "Only title" }));
    expect(html).toContain('data-status="info"');
    expect(html).not.toContain("result-description");
    expect(html).not.toContain("result-extra");
    expect(html).not.toContain("result-content");
  });

  test("403 / 404 / 500 show the code instead of an icon; icon can be replaced", () => {
    for (const code of ["403", "404", "500"] as const) {
      const html = ssr(createElement(Result, { status: code, title: "x" }));
      expect(html).toContain(`<span data-slot="result-code">${code}</span>`);
      expect(html).not.toContain("<svg");
    }
    const custom = ssr(
      createElement(Result, { status: "404", icon: createElement("i", null, "★") }),
    );
    expect(custom).toContain("<i>★</i>");
    expect(custom).not.toContain("result-code");
  });

  test("the four statuses have different icons", () => {
    const paths = (["success", "error", "info", "warning"] as const).map(
      (s) => ssr(createElement(Result, { status: s })).match(/<path d="([^"]+)"/)![1],
    );
    expect(new Set(paths).size).toBe(4);
  });
});

describe("formatNumber", () => {
  test("group separator every three digits, keeps decimals, negatives", () => {
    expect(formatNumber(1234567.891)).toBe("1,234,567.891");
    expect(formatNumber(-1234567)).toBe("-1,234,567");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(0)).toBe("0");
  });

  test("precision rounds and pads zeros; custom separators; no grouping", () => {
    expect(formatNumber(1234.5, { precision: 2 })).toBe("1,234.50");
    expect(formatNumber(2.345, { precision: 2 })).toBe("2.35");
    expect(formatNumber(1234.5, { precision: 0 })).toBe("1,235");
    expect(formatNumber(1234567.5, { groupSeparator: ".", decimalSeparator: "," })).toBe(
      "1.234.567,5",
    );
    expect(formatNumber(1234567, { groupSeparator: "" })).toBe("1234567");
  });

  test("numeric strings are numbers; other strings as is, empty values as a dash; exponent forms untouched", () => {
    expect(formatNumber("1234")).toBe("1,234");
    expect(formatNumber("N/A")).toBe("N/A");
    expect(formatNumber(undefined)).toBe("-");
    expect(formatNumber("")).toBe("-");
    expect(formatNumber(1e21)).toBe("1e+21");
    expect(formatNumber(Number.NaN)).toBe("NaN");
  });
});

describe("Statistic", () => {
  test("SSR: title, value (formatted), prefix / suffix, description, no class / style", () => {
    const html = ssr(
      createElement(Statistic, {
        title: "Users",
        value: 112893,
        prefix: "$",
        suffix: "%",
        description: "+12% vs last week",
        color: "success",
        size: "lg",
      }),
    );
    expect(html).toContain('data-slot="statistic-title">Users<');
    expect(html).toContain('data-slot="statistic-value">112,893<');
    expect(html).toContain('data-slot="statistic-prefix">$<');
    expect(html).toContain('data-slot="statistic-suffix">%<');
    expect(html).toContain("+12% vs last week");
    expect(html).toContain('data-color="success"');
    expect(html).toContain('data-size="lg"');
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("custom precision and format", () => {
    expect(ssr(createElement(Statistic, { value: 93.1, precision: 2 }))).toContain(">93.10<");
    const html = ssr(
      createElement(Statistic, { value: 0.256, format: (v) => `${(Number(v) * 100).toFixed(1)}%` }),
    );
    expect(html).toContain(">25.6%<");
  });

  test("loading: a skeleton replaces the value, aria-busy, no prefix / suffix", () => {
    const html = ssr(
      createElement(Statistic, { title: "t", value: 1, prefix: "$", suffix: "%", loading: true }),
    );
    expect(html).toContain('data-slot="statistic-skeleton"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-loading=""');
    expect(html).not.toContain("statistic-value");
    expect(html).not.toContain("statistic-prefix");
  });

  test("no value shows a dash; no title / description renders no node", () => {
    const html = ssr(createElement(Statistic, {}));
    expect(html).toContain('data-slot="statistic-value">-<');
    expect(html).not.toContain("statistic-title");
    expect(html).not.toContain("statistic-description");
  });

  test("renders in the DOM", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root!.render(createElement(Statistic, { title: "A", value: 1500 })));
    expect(host.querySelector('[data-slot="statistic-value"]')!.textContent).toBe("1,500");
  });
});

describe("Statistic animated", () => {
  const raf = (n = 2) =>
    act(async () => {
      for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 30));
    });
  const strips = () => [
    ...document.querySelectorAll<HTMLElement>('[data-slot="statistic-digit-strip"]'),
  ];
  const vars = () => strips().map((s) => s.style.getPropertyValue("--stat-digit"));

  test("SSR: plain text, data-animated, no rolling layer", () => {
    const html = renderToStaticMarkup(createElement(Statistic, { value: 1234, animated: true }));
    expect(html).toContain("data-animated");
    expect(html).toContain("1,234");
    expect(html).not.toContain("statistic-digits");
    expect(html).not.toMatch(/class=|style=/);
  });

  test("after mount a rolling layer: 0 first, then the real number; the visual layer is aria-hidden, the real text stays; non-digits as is", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => {
      root.render(createElement(Statistic, { value: 1234.5, precision: 1, animated: true }));
    });
    expect(
      document.querySelector('[data-slot="statistic-digits"]')!.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(document.querySelector('[data-slot="statistic-text"]')!.textContent).toBe("1,234.5");
    expect(document.querySelectorAll('[data-slot="statistic-char"]').length).toBe(2);
    await raf(6);
    expect(vars()).toEqual(["1", "2", "3", "4", "5"]);
    await act(async () => {
      root.render(createElement(Statistic, { value: 9234.5, precision: 1, animated: true }));
    });
    expect(vars()).toEqual(["9", "2", "3", "4", "5"]);
    await act(async () => root.unmount());
    el.remove();
  });

  test("no rolling with format (custom content shown as is)", () => {
    const html = renderToStaticMarkup(
      createElement(Statistic, { value: 5, animated: true, format: (v) => `#${String(v)}` }),
    );
    expect(html).toContain("#5");
    expect(html).not.toContain("data-animated");
  });
});
