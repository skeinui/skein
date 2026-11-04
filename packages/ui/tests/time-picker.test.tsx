// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import {
  DatePicker,
  Form,
  TimePanel,
  TimePicker,
  clampTime,
  displayTime,
  formatTime,
  parseTime,
} from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
});
async function mount(node: React.ReactNode) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
}
const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 40)));
const clickEl = async (el: Element) => {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await settle();
};
const q = (sel: string) => document.body.querySelector<HTMLElement>(sel);
const qa = (sel: string) => [...document.body.querySelectorAll<HTMLElement>(sel)];
const option = (column: string, label: string) =>
  qa(`[data-column="${column}"] [data-slot="timepanel-option"]`).find(
    (o) => o.textContent === label,
  )!;
const trigger = () => q('[data-slot="select-trigger"]')!;
const buttonByText = (text: string) => qa("button").find((b) => b.textContent === text)!;

describe("time logic", () => {
  test("parseTime: valid HH:mm / HH:mm:ss, null when out of range or malformed", () => {
    expect(parseTime("09:05")).toEqual({ h: 9, m: 5, s: 0 });
    expect(parseTime("9:05")).toEqual({ h: 9, m: 5, s: 0 });
    expect(parseTime("23:59:58")).toEqual({ h: 23, m: 59, s: 58 });
    for (const bad of ["24:00", "12:60", "12:30:60", "12", "ab:cd", "", null, undefined, "12:3"]) {
      expect(parseTime(bad as string), String(bad)).toBeNull();
    }
  });

  test("formatTime / displayTime (12-hour: midnight 12 AM, noon 12 PM)", () => {
    expect(formatTime({ h: 9, m: 5, s: 7 }, false)).toBe("09:05");
    expect(formatTime({ h: 9, m: 5, s: 7 }, true)).toBe("09:05:07");
    expect(displayTime({ h: 0, m: 30, s: 0 }, false, true)).toBe("12:30 AM");
    expect(displayTime({ h: 12, m: 0, s: 0 }, false, true)).toBe("12:00 PM");
    expect(displayTime({ h: 15, m: 4, s: 9 }, true, true)).toBe("03:04:09 PM");
    expect(displayTime({ h: 15, m: 4, s: 9 }, false, false)).toBe("15:04");
  });

  test("clampTime: clamps to min / max", () => {
    const bounds = { min: parseTime("09:00"), max: parseTime("17:30") };
    expect(formatTime(clampTime({ h: 8, m: 0, s: 0 }, bounds), false)).toBe("09:00");
    expect(formatTime(clampTime({ h: 12, m: 0, s: 0 }, bounds), false)).toBe("12:00");
    expect(formatTime(clampTime({ h: 18, m: 45, s: 0 }, bounds), false)).toBe("17:30");
  });
});

describe("TimePanel", () => {
  test("SSR: option counts of the hour and minute columns; seconds and 12-hour add columns; selected options marked", () => {
    const html = renderToStaticMarkup(
      createElement(TimePanel, { value: "14:30", onChange: () => {} }),
    );
    expect(html.match(/data-column="hour"/g)).toHaveLength(1);
    expect(html.match(/role="option"/g)).toHaveLength(24 + 60);
    expect(html).not.toContain('data-column="second"');
    expect(html.match(/data-selected/g)).toHaveLength(2); // 14 and 30
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
    const full = renderToStaticMarkup(
      createElement(TimePanel, { value: null, onChange: () => {}, seconds: true, hour12: true }),
    );
    expect(full).toContain('data-column="second"');
    expect(full).toContain('data-column="period"');
    expect(full.match(/role="option"/g)).toHaveLength(12 + 60 + 60 + 2);
  });

  test("step: 15-minute steps; min / max disable hours and minutes out of range", () => {
    const html = renderToStaticMarkup(
      createElement(TimePanel, {
        value: "10:00",
        onChange: () => {},
        minuteStep: 15,
        min: "09:00",
        max: "17:00",
      }),
    );
    expect(html.match(/role="option"/g)).toHaveLength(24 + 4);
    // Hours 0-8 and 18-23 are disabled
    expect(html.match(/data-disabled/g)!.length).toBeGreaterThanOrEqual(9 + 6);
  });

  test("clicking an option: fills from 00 without a value, changes only that column with one; the callback gets HH:mm", async () => {
    const changes: string[] = [];
    await mount(createElement(TimePanel, { value: null, onChange: (v) => changes.push(v) }));
    await clickEl(option("hour", "14"));
    expect(changes.at(-1)).toBe("14:00");
    await act(async () => root!.unmount());
    host!.remove();
    await mount(createElement(TimePanel, { value: "14:30", onChange: (v) => changes.push(v) }));
    await clickEl(option("minute", "45"));
    expect(changes.at(-1)).toBe("14:45");
    await clickEl(option("hour", "09"));
    expect(changes.at(-1)).toBe("09:30");
  });

  test("12-hour: the value stays 24-hour; switching AM / PM only shifts the hour by 12", async () => {
    const changes: string[] = [];
    await mount(
      createElement(TimePanel, { value: "09:20", onChange: (v) => changes.push(v), hour12: true }),
    );
    expect(option("hour", "09").hasAttribute("data-selected")).toBe(true);
    expect(option("period", "AM").hasAttribute("data-selected")).toBe(true);
    await clickEl(option("period", "PM"));
    expect(changes.at(-1)).toBe("21:20");
    await clickEl(option("hour", "03")); // clicking 03 in AM → 03:20
    expect(changes.at(-1)).toBe("03:20");
  });

  test("disabled options can't be clicked; values that would leave the range are clamped back into it", async () => {
    const changes: string[] = [];
    await mount(
      createElement(TimePanel, {
        value: "09:45",
        onChange: (v) => changes.push(v),
        min: "09:30",
        max: "17:00",
      }),
    );
    expect((option("hour", "08") as HTMLButtonElement).disabled).toBe(true);
    await clickEl(option("hour", "08"));
    expect(changes).toEqual([]);
    // Currently 09:45, change the hour to 17 -> 17:45 exceeds max, clamped to 17:00
    await clickEl(option("hour", "17"));
    expect(changes.at(-1)).toBe("17:00");
  });

  test("keyboard: up / down move focus in a column (skipping disabled), Home / End to the ends, one option in the tab order", async () => {
    await mount(
      createElement(TimePanel, { value: "10:00", onChange: () => {}, min: "09:00", max: "11:00" }),
    );
    const hours = () => qa('[data-column="hour"] [data-slot="timepanel-option"]');
    expect(hours().filter((o) => o.tabIndex === 0)).toHaveLength(1);
    expect(hours().find((o) => o.tabIndex === 0)!.textContent).toBe("10");
    const key = (el: Element, k: string) =>
      act(async () => {
        el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
      });
    const ten = hours().find((o) => o.textContent === "10")!;
    ten.focus();
    await key(ten, "ArrowDown");
    expect(document.activeElement!.textContent).toBe("11");
    await key(document.activeElement!, "ArrowDown"); // 12 and later are disabled, stays on 11
    expect(document.activeElement!.textContent).toBe("11");
    await key(document.activeElement!, "Home");
    expect(document.activeElement!.textContent).toBe("09"); // 0–8 are disabled, the first enabled one is 09
    await key(document.activeElement!, "End");
    expect(document.activeElement!.textContent).toBe("11");
  });
});

describe("TimePicker", () => {
  test("the trigger shows the time or a placeholder; AM / PM in 12-hour mode; clicking opens the panel", async () => {
    await mount(createElement(TimePicker, { defaultValue: "15:04", hour12: true }));
    expect(trigger().textContent).toBe("03:04 PM");
    expect(q('[data-slot="timepanel"]')).toBeNull();
    await clickEl(trigger());
    expect(q('[data-slot="timepanel"]')).not.toBeNull();
  });

  test("clicking an option changes the value right away and calls back, OK only closes; Now sets the current time; Clear empties it", async () => {
    const changes: (string | null)[] = [];
    await mount(createElement(TimePicker, { onValueChange: (v) => changes.push(v) }));
    expect(trigger().textContent).toBe("Pick a time");
    await clickEl(trigger());
    await clickEl(option("hour", "08"));
    await clickEl(option("minute", "30"));
    expect(changes).toEqual(["08:00", "08:30"]);
    expect(trigger().textContent).toBe("08:30");
    expect(q('[data-slot="timepanel"]')).not.toBeNull(); // still open
    await clickEl(buttonByText("Now"));
    expect(changes.at(-1)).toMatch(/^\d{2}:\d{2}$/);
    await clickEl(buttonByText("Clear"));
    expect(changes.at(-1)).toBeNull();
    await clickEl(buttonByText("OK"));
    expect(q('[data-slot="timepanel"]')).toBeNull();
  });

  test("seconds: the value has seconds; Now is disabled outside min / max; no clear with clearable=false", async () => {
    const changes: (string | null)[] = [];
    await mount(
      createElement(TimePicker, {
        seconds: true,
        defaultValue: "10:00:00",
        min: "23:59:58",
        clearable: false,
        onValueChange: (v) => changes.push(v),
      }),
    );
    await clickEl(trigger());
    expect(trigger().textContent).toBe("10:00:00");
    expect(buttonByText("Clear")).toBeUndefined();
    expect((buttonByText("Now") as HTMLButtonElement).disabled).toBe(true); // the current time is almost never >= 23:59:58
  });

  test("controlled: the parent decides value; name writes a hidden input; labels change the texts", async () => {
    await mount(
      createElement(TimePicker, {
        value: "07:15",
        name: "start",
        labels: { now: "Right now", ok: "Done", clear: "Reset" },
      }),
    );
    expect(q('input[type="hidden"][name="start"]')!.getAttribute("value")).toBe("07:15");
    await clickEl(trigger());
    await clickEl(option("hour", "09"));
    expect(trigger().textContent).toBe("07:15"); // unchanged by the parent
    expect(buttonByText("Right now")).toBeDefined();
    expect(buttonByText("Done")).toBeDefined();
  });
});

describe("DatePicker showTime", () => {
  const dayButton = (day: string) =>
    qa('[data-slot="calendar-day"]').find(
      (d) => d.textContent === day && !d.hasAttribute("data-outside"),
    )!;

  test("a time panel next to the calendar; picking a date keeps the popup open, the value has a time (00:00 by default)", async () => {
    const changes: (string | null)[] = [];
    await mount(
      createElement(DatePicker, {
        showTime: true,
        defaultValue: "2024-05-01T10:30",
        onValueChange: (v: string | null) => changes.push(v),
      }),
    );
    expect(trigger().textContent).toContain("10:30");
    await clickEl(trigger());
    expect(q('[data-slot="datetime"] [data-slot="calendar"]')).not.toBeNull();
    expect(q('[data-slot="datetime-time"] [data-slot="timepanel"]')).not.toBeNull();
    await clickEl(dayButton("15"));
    expect(changes.at(-1)).toBe("2024-05-15T10:30"); // date changed, time kept
    expect(q('[data-slot="datetime"]')).not.toBeNull(); // still open
  });

  test("picking a time: the date is kept; today when no date yet; OK closes", async () => {
    const changes: (string | null)[] = [];
    await mount(
      createElement(DatePicker, {
        showTime: { seconds: true },
        defaultValue: "2024-05-01T10:30:00",
        onValueChange: (v: string | null) => changes.push(v),
      }),
    );
    await clickEl(trigger());
    await clickEl(option("minute", "45"));
    expect(changes.at(-1)).toBe("2024-05-01T10:45:00");
    await clickEl(option("second", "07"));
    expect(changes.at(-1)).toBe("2024-05-01T10:45:07");
    await clickEl(buttonByText("OK"));
    expect(q('[data-slot="datetime"]')).toBeNull();
    // With no date, picking a time first -> the date is today
    await act(async () => root!.unmount());
    host!.remove();
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await mount(
      createElement(DatePicker, {
        showTime: true,
        onValueChange: (v: string | null) => changes.push(v),
      }),
    );
    await clickEl(trigger());
    await clickEl(option("hour", "08"));
    expect(changes.at(-1)!.startsWith(iso)).toBe(true);
    expect(changes.at(-1)!.endsWith("T08:00")).toBe(true);
  });

  test("DatePicker without showTime is unchanged: picking a date closes, the value is YYYY-MM-DD", async () => {
    const changes: (string | null)[] = [];
    await mount(
      createElement(DatePicker, {
        defaultValue: "2024-05-01",
        onValueChange: (v: string | null) => changes.push(v),
      }),
    );
    await clickEl(trigger());
    expect(q('[data-slot="timepanel"]')).toBeNull();
    await clickEl(dayButton("20"));
    expect(changes.at(-1)).toBe("2024-05-20");
    expect(q('[data-slot="calendar"]')).toBeNull();
  });
});

describe("Form time / datetime", () => {
  test("time and datetime fields: the value goes into the form, null when empty, required is validated", async () => {
    const submitted: unknown[] = [];
    await mount(
      createElement(Form, {
        fields: [
          { name: "start", type: "time", label: "Start", required: true },
          { name: "at", type: "datetime", label: "At" },
        ],
        onSubmit: (v: unknown) => void submitted.push(v),
      }),
    );
    await act(async () => {
      q('button[type="submit"]')!.click();
    });
    await settle();
    expect(q('[data-field-name="start"] [data-slot="field-error"]')!.textContent).toBe(
      "This field is required",
    );
    expect(submitted).toEqual([]);
    await clickEl(q('[data-field-name="start"] [data-slot="select-trigger"]')!);
    await clickEl(option("hour", "09"));
    await settle();
    expect(q('[data-field-name="start"] [data-slot="field-error"]')).toBeNull();
    await act(async () => {
      q('button[type="submit"]')!.click();
    });
    await settle();
    expect(submitted).toEqual([{ start: "09:00", at: null }]);
  });
});
