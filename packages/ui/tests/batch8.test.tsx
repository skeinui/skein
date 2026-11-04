// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Calendar, ContextMenu, DatePicker, PreviewCard, ScrollArea } from "../src/index.ts";
import { addDays, addMonths, monthGrid, weekday } from "../src/components/calendar/dates.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("date arithmetic", () => {
  test("adds days and months, clamping to the end of the month", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-01-15", -2)).toBe("2025-11-15");
  });
  test("weekday: 2026-10-19 is a Monday", () => {
    expect(weekday("2026-10-19")).toBe(1);
  });
  test("monthGrid is always 6 rows x 7 columns, the first cell is the weekStartsOn day", () => {
    const grid = monthGrid("2026-10", 1);
    expect(grid.length).toBe(6);
    expect(grid.every((row) => row.length === 7)).toBe(true);
    expect(weekday(grid[0][0])).toBe(1);
    expect(grid.flat()).toContain("2026-10-01");
    expect(grid.flat()).toContain("2026-10-31");
  });
});

describe("Calendar (SSR)", () => {
  const html = ssr(
    createElement(Calendar, {
      defaultMonth: "2026-10",
      defaultValue: "2026-10-15",
      weekStartsOn: 1,
      locale: "en-US",
    }),
  );
  test("title, weekdays, 42 day cells, the selected date has data-selected", () => {
    expect(html).toContain('data-slot="calendar-title"');
    expect(html).toContain("October 2026");
    expect(html.match(/data-slot="calendar-weekday"/g)?.length).toBe(7);
    expect(html.match(/data-slot="calendar-day"/g)?.length).toBe(42);
    expect(html).toContain('data-date="2026-10-15" data-selected=""');
    expect(html).not.toContain("class=");
  });
  test("dates outside min / max are disabled", () => {
    const h = ssr(
      createElement(Calendar, { defaultMonth: "2026-10", min: "2026-10-10", max: "2026-10-20" }),
    );
    expect(h.match(/data-disabled/g)!.length).toBeGreaterThan(20);
  });
});

describe("interaction (DOM)", () => {
  const mounted: { unmount: () => void; el: HTMLElement }[] = [];
  afterEach(async () => {
    for (const m of mounted.splice(0)) {
      await act(async () => m.unmount());
      m.el.remove();
    }
    document.body.innerHTML = "";
  });
  async function mount(node: React.ReactNode) {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    mounted.push({ unmount: () => root.unmount(), el });
    await act(async () => root.render(node));
    return el;
  }
  const day = (el: ParentNode, iso: string) =>
    el.querySelector(`[data-date="${iso}"]`) as HTMLElement;

  test("single: clicking a date calls back with an ISO string", async () => {
    const calls: (string | null)[] = [];
    const el = await mount(
      createElement(Calendar, {
        defaultMonth: "2026-10",
        onValueChange: (v: string | null) => calls.push(v),
      }),
    );
    await act(async () => day(el, "2026-10-12").click());
    expect(calls).toEqual(["2026-10-12"]);
    expect(day(el, "2026-10-12").hasAttribute("data-selected")).toBe(true);
  });

  test("range: click the start then the end, cells between are range-middle, an earlier click restarts the start", async () => {
    const calls: unknown[] = [];
    const el = await mount(
      createElement(Calendar, {
        mode: "range",
        defaultMonth: "2026-10",
        onValueChange: (v: unknown) => calls.push(v),
      }),
    );
    await act(async () => day(el, "2026-10-10").click());
    await act(async () => day(el, "2026-10-14").click());
    expect(calls).toEqual([
      { start: "2026-10-10", end: null },
      { start: "2026-10-10", end: "2026-10-14" },
    ]);
    expect(el.querySelectorAll("[data-range-middle]").length).toBe(3);
    await act(async () => day(el, "2026-10-05").click());
    expect(calls[2]).toEqual({ start: "2026-10-05", end: null });
  });

  test("the title changes after going to the next month", async () => {
    const el = await mount(createElement(Calendar, { defaultMonth: "2026-10", locale: "en-US" }));
    await act(async () => (el.querySelector('[aria-label="Next month"]') as HTMLElement).click());
    expect(el.querySelector('[data-slot="calendar-title"]')?.textContent).toBe("November 2026");
  });

  test("keyboard: arrow keys move focus across months, PageDown goes to the next month", async () => {
    const el = await mount(
      createElement(Calendar, {
        defaultMonth: "2026-10",
        defaultValue: "2026-10-31",
        locale: "en-US",
      }),
    );
    day(el, "2026-10-31").focus();
    await act(async () => {
      day(el, "2026-10-31").dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
    });
    expect(el.querySelector('[data-slot="calendar-title"]')?.textContent).toBe("November 2026");
    expect(document.activeElement?.getAttribute("data-date")).toBe("2026-11-01");
    await act(async () => {
      (document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent("keydown", { key: "PageDown", bubbles: true }),
      );
    });
    expect(el.querySelector('[data-slot="calendar-title"]')?.textContent).toBe("December 2026");
  });

  test("DatePicker: shows the formatted date, picking a day closes it and calls back", async () => {
    const calls: (string | null)[] = [];
    const el = await mount(
      createElement(DatePicker, {
        defaultValue: "2026-10-15",
        locale: "en-US",
        "aria-label": "Date",
        onValueChange: (v: string | null) => calls.push(v),
      }),
    );
    const trigger = el.querySelector('[data-slot="select-trigger"]') as HTMLElement;
    expect(el.querySelector('[data-slot="select-value"]')?.textContent).toBe("Oct 15, 2026");
    await act(async () => trigger.click());
    expect(document.body.querySelector('[data-slot="calendar"]')).not.toBeNull();
    await act(async () => day(document.body, "2026-10-20").click());
    expect(calls).toEqual(["2026-10-20"]);
  });

  test("ScrollArea renders a viewport and a vertical scrollbar", async () => {
    const el = await mount(createElement(ScrollArea, null, createElement("p", null, "Content")));
    expect(el.querySelector('[data-slot="scroll-area-viewport"]')).not.toBeNull();
    expect(el.querySelector('[data-slot="scroll-area"]')?.hasAttribute("class")).toBe(false);
  });

  test("ContextMenu renders items with the menu slots when open", async () => {
    await mount(
      createElement(
        ContextMenu,
        { open: true } as never,
        createElement(ContextMenu.Trigger, null, "Right-click here"),
        createElement(ContextMenu.Content, null, createElement(ContextMenu.Item, null, "Copy")),
      ),
    );
    expect(document.body.querySelector('[data-slot="menu"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="menu-item"]')?.textContent).toBe("Copy");
  });

  test("PreviewCard renders with the popover slots when open", async () => {
    await mount(
      createElement(
        PreviewCard,
        { open: true },
        createElement(PreviewCard.Trigger, { href: "#" }, "Link"),
        createElement(PreviewCard.Content, null, "Preview content"),
      ),
    );
    expect(document.body.querySelector('[data-slot="popover"]')?.textContent).toBe(
      "Preview content",
    );
    expect(document.body.querySelector('[data-slot="popover-positioner"]')).not.toBeNull();
  });

  test("PreviewCard.Title / Description work inside the hover card (Popover.Title needs Popover's context and would throw there)", async () => {
    await mount(
      createElement(
        PreviewCard,
        { open: true },
        createElement(PreviewCard.Trigger, { href: "#" }, "Link"),
        createElement(
          PreviewCard.Content,
          null,
          createElement(PreviewCard.Title, null, "Docs"),
          createElement(PreviewCard.Description, null, "Guides and API"),
        ),
      ),
    );
    expect(document.body.querySelector('[data-slot="popover-title"]')?.textContent).toBe("Docs");
    expect(document.body.querySelector('[data-slot="popover-description"]')?.textContent).toBe(
      "Guides and API",
    );
    expect(document.body.querySelector('[data-slot="popover"]')?.outerHTML).not.toMatch(
      /class=|style=/,
    );
  });
});
