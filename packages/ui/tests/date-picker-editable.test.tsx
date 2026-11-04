// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { DatePicker } from "../src/index.ts";
import {
  parseDateText,
  parseDateTimeText,
  parsePeriodText,
  parseWeekText,
  splitRange,
} from "../src/components/date-picker/parse.ts";

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
const input = () => document.querySelector<HTMLInputElement>('[data-slot="date-input"]')!;
const wrap = () => document.querySelector<HTMLElement>('[data-slot="select-trigger"]')!;

/** A controlled input must go through React's value setter so the change event triggers onChange. */
async function type(el: HTMLInputElement, text: string) {
  await act(async () => {
    el.focus();
    Reflect.set(HTMLInputElement.prototype, "value", text, el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const key = (el: HTMLElement, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });
const blur = () =>
  act(async () => {
    input().blur();
  });

describe("DatePicker editable text parsing", () => {
  test("dates are validated strictly", () => {
    expect(parseDateText("2026-10-23")).toBe("2026-10-23");
    expect(parseDateText("2026/1/5")).toBe("2026-01-05");
    expect(parseDateText("2026-02-30")).toBeNull();
    expect(parseDateText("2026-13-01")).toBeNull();
    expect(parseDateText("hello")).toBeNull();
  });
  test("periods", () => {
    expect(parsePeriodText("month", "2026-3")).toBe("2026-03");
    expect(parsePeriodText("month", "2026-13")).toBeNull();
    expect(parsePeriodText("quarter", "2026q2")).toBe("2026-Q2");
    expect(parsePeriodText("quarter", "2026-Q5")).toBeNull();
    expect(parsePeriodText("year", "2026")).toBe("2026");
    expect(parsePeriodText("year", "26")).toBeNull();
  });
  test("range separators and weeks", () => {
    expect(splitRange("2026-01-01 – 2026-01-05")).toEqual(["2026-01-01", "2026-01-05"]);
    expect(splitRange("2026-01-01 - 2026-01-05")).toEqual(["2026-01-01", "2026-01-05"]);
    expect(splitRange("2026-01-01")).toBeNull();
    expect(parseWeekText("2026-10-22", 1)).toBe("2026-10-19");
    expect(parseWeekText("2026-10-19 – 2026-10-25", 0)).toBe("2026-10-18");
  });
  test("date-times", () => {
    expect(parseDateTimeText("2026-10-23 14:30")).toEqual({ date: "2026-10-23", time: "14:30" });
    expect(parseDateTimeText("2026-10-23T14:30:05")).toEqual({
      date: "2026-10-23",
      time: "14:30:05",
    });
    expect(parseDateTimeText("2026-10-23")).toEqual({ date: "2026-10-23", time: null });
    expect(parseDateTimeText("2026-10-23 25:00")).toBeNull();
  });
});

describe("DatePicker editable", () => {
  test("SSR: the input shows the value in a fixed format, no class / style", () => {
    const html = ssr(createElement(DatePicker, { editable: true, defaultValue: "2026-10-23" }));
    expect(html).toContain('data-slot="date-input"');
    expect(html).toContain('value="2026-10-23"');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    expect(ssr(createElement(DatePicker, { editable: true }))).toContain(
      'placeholder="YYYY-MM-DD"',
    );
    expect(ssr(createElement(DatePicker, { editable: true, picker: "quarter" }))).toContain(
      'placeholder="YYYY-Qn"',
    );
    // When not typeable it is still a button
    expect(ssr(createElement(DatePicker, {}))).not.toContain("date-input");
  });

  test("typing then Enter: commits and closes, the value becomes the typed date", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(DatePicker, { editable: true, onValueChange, "aria-label": "Birthday" }),
    );
    expect(input().getAttribute("aria-label")).toBe("Birthday");
    await type(input(), "2026-10-23");
    expect(onValueChange).not.toHaveBeenCalled(); // the value is untouched before commit
    await key(input(), "Enter");
    expect(onValueChange).toHaveBeenCalledWith("2026-10-23");
    expect(input().value).toBe("2026-10-23");
  });

  test("blur commits too; invalid text is restored on blur", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(DatePicker, { editable: true, defaultValue: "2026-01-01", onValueChange }),
    );
    await type(input(), "2026-02-30");
    await blur();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input().value).toBe("2026-01-01");
    await type(input(), "2026-03-04");
    await blur();
    expect(onValueChange).toHaveBeenCalledWith("2026-03-04");
  });

  test("Enter on invalid text: marked invalid, text kept; recovers on further typing", async () => {
    const onValueChange = vi.fn();
    await mount(createElement(DatePicker, { editable: true, onValueChange }));
    await type(input(), "nope");
    await key(input(), "Enter");
    expect(wrap().hasAttribute("data-invalid")).toBe(true);
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(input().value).toBe("nope");
    await type(input(), "2026-05-06");
    expect(wrap().hasAttribute("data-invalid")).toBe(false);
  });

  test("clearing the text commits null", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(DatePicker, { editable: true, defaultValue: "2026-01-01", onValueChange }),
    );
    await type(input(), "");
    await key(input(), "Enter");
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  test("dates outside min / max / isDateDisabled are rejected", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(DatePicker, {
        editable: true,
        min: "2026-10-10",
        max: "2026-10-20",
        isDateDisabled: (d: string) => d === "2026-10-15",
        onValueChange,
      }),
    );
    for (const text of ["2026-10-09", "2026-10-21", "2026-10-15"]) {
      await type(input(), text);
      await key(input(), "Enter");
    }
    expect(onValueChange).not.toHaveBeenCalled();
    await type(input(), "2026-10-16");
    await key(input(), "Enter");
    expect(onValueChange).toHaveBeenCalledWith("2026-10-16");
  });

  test("month / quarter / year", async () => {
    const onValueChange = vi.fn();
    await mount(createElement(DatePicker, { editable: true, picker: "quarter", onValueChange }));
    await type(input(), "2026q3");
    await key(input(), "Enter");
    expect(onValueChange).toHaveBeenCalledWith("2026-Q3");
    expect(input().value).toBe("2026-Q3");
  });

  test("week: typing any day takes the week start, shown as both end dates", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(DatePicker, { editable: true, picker: "week", weekStartsOn: 1, onValueChange }),
    );
    await type(input(), "2026-10-22");
    await key(input(), "Enter");
    expect(onValueChange).toHaveBeenCalledWith("2026-10-19");
    expect(input().value).toBe("2026-10-19 – 2026-10-25");
  });

  test("range: commits only when both ends are valid, an end before the start is invalid", async () => {
    const onValueChange = vi.fn();
    await mount(createElement(DatePicker, { editable: true, mode: "range", onValueChange }));
    await type(input(), "2026-10-20 – 2026-10-10");
    await key(input(), "Enter");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(wrap().hasAttribute("data-invalid")).toBe(true);
    await type(input(), "2026-10-10 – 2026-10-20");
    await key(input(), "Enter");
    expect(onValueChange).toHaveBeenCalledWith({ start: "2026-10-10", end: "2026-10-20" });
    expect(input().value).toBe("2026-10-10 – 2026-10-20");
  });

  test("with time: a date alone keeps the existing time, a full value uses what was typed", async () => {
    const onValueChange = vi.fn();
    await mount(
      createElement(DatePicker, {
        editable: true,
        showTime: true,
        defaultValue: "2026-10-23T14:30",
        onValueChange,
      }),
    );
    expect(input().value).toBe("2026-10-23 14:30");
    await type(input(), "2026-11-01");
    await key(input(), "Enter");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-01T14:30");
    await type(input(), "2026-11-02 08:05");
    await key(input(), "Enter");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-02T08:05");
  });

  test("Down opens the calendar, the icon button is the popup trigger", async () => {
    await mount(createElement(DatePicker, { editable: true }));
    const icon = document.querySelector<HTMLElement>('button[data-slot="select-icon"]')!;
    expect(icon.getAttribute("aria-label")).toBe("Choose date");
    expect(icon.getAttribute("aria-expanded")).toBe("false");
    await key(input(), "ArrowDown");
    expect(document.querySelector('[data-slot="calendar"]')).not.toBeNull();
    expect(wrap().hasAttribute("data-popup-open")).toBe(true);
  });

  test("picking a date in the calendar updates the input", async () => {
    await mount(createElement(DatePicker, { editable: true, defaultValue: "2026-10-23" }));
    await key(input(), "ArrowDown");
    const day = document.querySelector<HTMLElement>('[data-date="2026-10-05"]')!;
    await act(async () => day.click());
    expect(input().value).toBe("2026-10-05");
  });

  test("disabled", async () => {
    await mount(createElement(DatePicker, { editable: true, disabled: true }));
    expect(input().disabled).toBe(true);
    expect(wrap().hasAttribute("data-disabled")).toBe(true);
  });
});
