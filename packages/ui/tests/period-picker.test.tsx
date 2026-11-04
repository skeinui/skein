// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import {
  Calendar,
  DatePicker,
  PeriodCalendar,
  formatPeriod,
  periodEnd,
  periodOf,
  periodStart,
  shiftPeriod,
  weekStartOf,
} from "../src/index.ts";

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
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
  return host;
}
const click = (el: Element | null) => act(async () => (el as HTMLElement).click());
const period = (key: string) => document.querySelector<HTMLElement>(`[data-period="${key}"]`)!;
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });

describe("periods arithmetic", () => {
  test("start / end dates, shifting, containing period", () => {
    expect(periodStart("month", "2026-02")).toBe("2026-02-01");
    expect(periodEnd("month", "2026-02")).toBe("2026-02-28");
    expect(periodStart("quarter", "2026-Q3")).toBe("2026-07-01");
    expect(periodEnd("quarter", "2026-Q3")).toBe("2026-09-30");
    expect(periodEnd("year", "2024")).toBe("2024-12-31");
    expect(shiftPeriod("month", "2026-01", -1)).toBe("2025-12");
    expect(shiftPeriod("quarter", "2026-Q1", -1)).toBe("2025-Q4");
    expect(shiftPeriod("quarter", "2026-Q4", 5)).toBe("2028-Q1");
    expect(shiftPeriod("year", "2026", 3)).toBe("2029");
    expect(periodOf("quarter", "2026-05-17")).toBe("2026-Q2");
    expect(periodOf("month", "2026-05-17")).toBe("2026-05");
    expect(formatPeriod("quarter", "2026-Q2")).toBe("2026 Q2");
    expect(weekStartOf("2026-03-04", 1)).toBe("2026-03-02");
    expect(weekStartOf("2026-03-04", 0)).toBe("2026-03-01");
  });
});

describe("PeriodCalendar", () => {
  test("SSR: month grid, heading of the current page, no class / style", () => {
    const html = ssr(
      createElement(PeriodCalendar, { unit: "month", defaultValue: "2026-03", locale: "en-US" }),
    );
    expect(html).toContain('data-slot="calendar-periods"');
    expect(html.match(/data-slot="calendar-period"/g)).toHaveLength(12);
    expect(html).toContain('aria-label="March 2026"');
    expect(html).toContain('aria-selected="true"');
    expect(html).not.toMatch(/class=|style=/);
    expect(
      ssr(createElement(PeriodCalendar, { unit: "quarter" })).match(/calendar-period"/g),
    ).toHaveLength(4);
  });

  test("single selection by click; paging (year / decade)", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(PeriodCalendar, { unit: "month", defaultValue: "2026-03", onValueChange }),
    );
    await click(period("2026-07"));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-07");
    await click(document.querySelector('[data-direction="next"]'));
    expect(document.querySelector('[data-slot="calendar-title"]')!.textContent).toBe("2027");
    expect(period("2027-01")).not.toBeNull();
    await act(async () => root!.unmount());
    host!.remove();
    await mount(createElement(PeriodCalendar, { unit: "year", defaultValue: "2026" }));
    expect(document.querySelector('[data-slot="calendar-title"]')!.textContent).toBe("2020 – 2029");
    expect(period("2019").hasAttribute("data-outside")).toBe(true);
    await click(document.querySelector('[data-direction="next"]'));
    expect(document.querySelector('[data-slot="calendar-title"]')!.textContent).toBe("2030 – 2039");
  });

  test("range: two clicks, periods between are range-middle; a second click earlier than the first starts over", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(PeriodCalendar, {
        unit: "month",
        mode: "range",
        defaultValue: { start: "2026-02", end: null },
        onValueChange,
      }),
    );
    await click(period("2026-05"));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2026-02", end: "2026-05" });
    expect(period("2026-03").parentElement!.hasAttribute("data-range-middle")).toBe(true);
    expect(period("2026-02").parentElement!.hasAttribute("data-range-start")).toBe(true);
    await click(period("2026-01"));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2026-01", end: null });
  });

  test("min / max: periods fully outside are disabled; isPeriodDisabled", async () => {
    await mount(
      createElement(PeriodCalendar, {
        unit: "month",
        defaultValue: "2026-06",
        min: "2026-03-15",
        max: "2026-09-10",
        isPeriodDisabled: (k: string) => k === "2026-07",
      }),
    );
    expect(period("2026-02").hasAttribute("disabled")).toBe(true);
    expect(period("2026-03").hasAttribute("disabled")).toBe(false);
    expect(period("2026-09").hasAttribute("disabled")).toBe(false);
    expect(period("2026-10").hasAttribute("disabled")).toBe(true);
    expect(period("2026-07").hasAttribute("disabled")).toBe(true);
  });

  test("keyboard: arrow keys move (a row = 3 months), PageDown goes to the next year; roving tabindex", async () => {
    await mount(createElement(PeriodCalendar, { unit: "month", defaultValue: "2026-03" }));
    expect(period("2026-03").tabIndex).toBe(0);
    expect(period("2026-04").tabIndex).toBe(-1);
    await act(async () => period("2026-03").focus());
    await key(period("2026-03"), "ArrowRight");
    expect(document.activeElement).toBe(period("2026-04"));
    await key(period("2026-04"), "ArrowDown");
    expect(document.activeElement).toBe(period("2026-07"));
    await key(period("2026-07"), "PageDown");
    expect(document.querySelector('[data-slot="calendar-title"]')!.textContent).toBe("2027");
    expect(document.activeElement).toBe(period("2027-07"));
    await key(period("2027-07"), "Home");
    expect(document.activeElement).toBe(period("2027-07"));
  });
});

describe("Calendar mode=week", () => {
  test("clicking any day selects its week: the value is the week start, the whole week is a range", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(Calendar, {
        mode: "week",
        weekStartsOn: 1,
        defaultMonth: "2026-03",
        onValueChange,
      }),
    );
    await click(document.querySelector('[data-date="2026-03-11"]'));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-03-09");
    const cell = (d: string) => document.querySelector(`[data-date="${d}"]`)!.parentElement!;
    expect(cell("2026-03-09").hasAttribute("data-range-start")).toBe(true);
    expect(cell("2026-03-12").hasAttribute("data-range-middle")).toBe(true);
    expect(cell("2026-03-15").hasAttribute("data-range-end")).toBe(true);
    expect(cell("2026-03-16").hasAttribute("aria-selected")).toBe(false);
  });
});

describe("DatePicker picker", () => {
  const open = () => click(document.querySelector('[data-slot="select-trigger"]'));

  test("SSR: placeholder and value display for each granularity", () => {
    expect(ssr(createElement(DatePicker, { picker: "month" }))).toContain("Pick a month");
    expect(
      ssr(createElement(DatePicker, { picker: "quarter", defaultValue: "2026-Q2" })),
    ).toContain("2026 Q2");
    expect(ssr(createElement(DatePicker, { picker: "year", defaultValue: "2026" }))).toContain(
      ">2026<",
    );
    const week = ssr(
      createElement(DatePicker, { picker: "week", defaultValue: "2026-03-09", locale: "en-US" }),
    );
    expect(week).toContain("Mar 9, 2026");
    expect(week).toContain("Mar 15, 2026");
    const range = ssr(
      createElement(DatePicker, {
        mode: "range",
        picker: "month",
        defaultValue: { start: "2026-01", end: "2026-03" },
        locale: "en-US",
      }),
    );
    expect(range).toContain("January 2026");
    expect(range).toContain("March 2026");
  });

  test("month: picking a month commits and closes", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(DatePicker, {
        picker: "month",
        defaultValue: "2026-03",
        onValueChange,
        "aria-label": "Month",
      }),
    );
    await open();
    expect(document.querySelector('[role="dialog"]')!.getAttribute("aria-label")).toBe("Month");
    await click(period("2026-08"));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-08");
    expect(document.querySelector('[data-slot="calendar-periods"]')).toBeNull();
  });

  test("week: picking a day commits that week's start and closes", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(DatePicker, {
        picker: "week",
        weekStartsOn: 1,
        defaultValue: "2026-03-09",
        onValueChange,
      }),
    );
    await open();
    await click(document.querySelector('[data-date="2026-03-19"]'));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-03-16");
  });

  test("month range: closes only after picking the end month", async () => {
    const onValueChange = vi.fn();
    await mount(createElement(DatePicker, { mode: "range", picker: "month", onValueChange }));
    await open();
    await click(period(`${new Date().getFullYear()}-02`));
    expect(document.querySelector('[data-slot="calendar-periods"]')).not.toBeNull();
    await click(period(`${new Date().getFullYear()}-05`));
    expect(document.querySelector('[data-slot="calendar-periods"]')).toBeNull();
    expect(onValueChange).toHaveBeenLastCalledWith({
      start: `${new Date().getFullYear()}-02`,
      end: `${new Date().getFullYear()}-05`,
    });
  });
});
