// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Agenda, ConfigProvider } from "../src/index.ts";
import type { AgendaEvent, AgendaProps } from "../src/index.ts";

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
async function mount(props: Partial<AgendaProps> = {}) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const all: AgendaProps = {
    events: EVENTS,
    date: "2026-10-21",
    now: "2026-10-21T10:30",
    locale: "en-US",
    ...props,
  };
  await act(async () => root!.render(createElement(Agenda, all)));
  return host;
}
const q = (s: string) => host!.querySelector<HTMLElement>(s);
const qa = (s: string) => [...host!.querySelectorAll<HTMLElement>(s)];
const click = (el: Element) =>
  act(async () => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const text = (el: Element | null) => el?.textContent ?? "";

const EVENTS: AgendaEvent[] = [
  { id: "standup", title: "Standup", start: "2026-10-21T09:00", end: "2026-10-21T09:30" },
  {
    id: "review",
    title: "Design review",
    start: "2026-10-21T09:15",
    end: "2026-10-21T10:15",
    color: "success",
  },
  { id: "holiday", title: "Offsite", start: "2026-10-22", end: "2026-10-23", color: "warning" },
  { id: "lunch", title: "Lunch", start: "2026-10-23T12:00", end: "2026-10-23T13:00" },
];

describe("<Agenda />", () => {
  test("SSR has no class / style", () => {
    const html = ssr(
      createElement(Agenda, { events: EVENTS, date: "2026-10-21", now: "2026-10-21T10:30" }),
    );
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    expect(html).toContain('data-slot="agenda"');
  });

  test("week view: 7 date buttons, the title is the date range, today is marked", async () => {
    await mount();
    expect(q('[data-slot="agenda"]')?.dataset.view).toBe("week");
    const heads = qa('[data-slot="agenda-head"]');
    expect(heads).toHaveLength(7);
    expect(text(heads[0])).toContain("Sun");
    expect(text(heads[0])).toContain("18");
    expect(heads.filter((h) => h.hasAttribute("data-today")).map((h) => text(h))).toEqual([
      "Wed21",
    ]);
    expect(text(q('[data-slot="agenda-title"]'))).toMatch(/Oct 18\s*[–-]\s*24, 2026/);
    expect(qa('[data-slot="agenda-column"]')).toHaveLength(7);
  });

  test("weekStartsOn changes the first day of the week", async () => {
    await mount({ weekStartsOn: 1 });
    expect(text(qa('[data-slot="agenda-head"]')[0])).toContain("Mon");
  });

  test("timed events go into their day's column, position written as CSS variables, overlapping ones split into two columns", async () => {
    await mount();
    const column = qa('[data-slot="agenda-column"]')[3]; // Wednesday
    const blocks = [...column.querySelectorAll<HTMLElement>('[data-slot="agenda-event"]')];
    expect(blocks.map((b) => b.dataset.color)).toEqual(["primary", "success"]);
    const standup = blocks[0];
    expect(standup.style.getPropertyValue("--ev-start")).toBe("540");
    expect(standup.style.getPropertyValue("--ev-length")).toBe("30");
    expect(standup.style.getPropertyValue("--ev-cols")).toBe("2");
    expect(blocks[1].style.getPropertyValue("--ev-col")).toBe("1");
    expect(text(standup)).toContain("Standup");
    expect(text(standup)).toMatch(/9:00 AM – 9:30 AM/);
    expect(standup.hasAttribute("data-short")).toBe(true);
    expect(blocks[1].hasAttribute("data-short")).toBe(false);
  });

  test("all-day / multi-day events go in the all-day area at the top, hidden when there are none", async () => {
    await mount();
    const bars = qa('[data-slot="agenda-allday"] [data-slot="agenda-event"]');
    expect(bars.map((b) => text(b))).toEqual(["Offsite"]);
    expect(bars[0].dataset.kind).toBe("bar");
    expect(bars[0].style.getPropertyValue("--seg-span")).toBe("2");
    await mount({ events: [EVENTS[0]] });
    expect(q('[data-slot="agenda-allday"]')).toBeNull();
  });

  test("the now line is only in today's column, absent when today is out of range", async () => {
    await mount();
    const lines = qa('[data-slot="agenda-now"]');
    expect(lines).toHaveLength(1);
    expect(lines[0].style.getPropertyValue("--ev-start")).toBe(String(10 * 60 + 30));
    expect(lines[0].closest('[data-slot="agenda-column"]')?.hasAttribute("data-today")).toBe(true);
    await mount({ startHour: 11 });
    expect(q('[data-slot="agenda-now"]')).toBeNull();
    await mount({ date: "2026-11-30" });
    expect(q('[data-slot="agenda-now"]')).toBeNull();
  });

  test("day view has one column, the date button is not clickable", async () => {
    await mount({ defaultView: "day" });
    expect(qa('[data-slot="agenda-column"]')).toHaveLength(1);
    expect((q('[data-slot="agenda-head"]') as HTMLButtonElement).disabled).toBe(true);
    expect(text(q('[data-slot="agenda-title"]'))).toContain("Wednesday, October 21, 2026");
  });

  test("previous / next / today move the date by the current view's unit", async () => {
    const onDateChange = vi.fn();
    await mount({ onDateChange });
    const buttons = qa('[data-slot="agenda-nav"] button');
    await click(buttons[0]);
    expect(onDateChange).toHaveBeenLastCalledWith("2026-10-14");
    await click(buttons[2]);
    expect(onDateChange).toHaveBeenLastCalledWith("2026-10-28");
    await click(buttons[1]);
    expect(onDateChange).toHaveBeenLastCalledWith("2026-10-21");
    await mount({ onDateChange, defaultView: "month" });
    await click(qa('[data-slot="agenda-nav"] button')[2]);
    expect(onDateChange).toHaveBeenLastCalledWith("2026-11-21");
    await mount({ onDateChange, defaultView: "day" });
    await click(qa('[data-slot="agenda-nav"] button')[0]);
    expect(onDateChange).toHaveBeenLastCalledWith("2026-10-20");
  });

  test("uncontrolled, switches date and view itself", async () => {
    await mount({ date: undefined, defaultDate: "2026-10-21" });
    await click(qa('[data-slot="agenda-nav"] button')[2]);
    expect(text(q('[data-slot="agenda-title"]'))).toMatch(/Oct 25\s*[–-]\s*31, 2026/);
    await click(qa('[data-slot="agenda-views"] [role="radio"]')[2]);
    expect(q('[data-slot="agenda"]')?.dataset.view).toBe("month");
  });

  test("view switch: controlled only notifies, views limits the available views", async () => {
    const onViewChange = vi.fn();
    await mount({ view: "week", onViewChange });
    await click(qa('[data-slot="agenda-views"] [role="radio"]')[0]);
    expect(onViewChange).toHaveBeenCalledWith("day");
    expect(q('[data-slot="agenda"]')?.dataset.view).toBe("week");
    await mount({ views: ["week"] });
    expect(q('[data-slot="agenda-views"]')).toBeNull();
  });

  test("clicking a date in week view switches to that day's day view", async () => {
    const onDateChange = vi.fn();
    await mount({ onDateChange });
    await click(qa('[data-slot="agenda-head"]')[5]);
    expect(onDateChange).toHaveBeenCalledWith("2026-10-23");
    expect(q('[data-slot="agenda"]')?.dataset.view).toBe("day");
  });

  test("onEventClick: events are buttons with the callback, not without", async () => {
    const onEventClick = vi.fn();
    await mount({ onEventClick });
    const button = qa('[data-slot="agenda-event"]').find((b) => text(b).includes("Lunch"))!;
    expect(button.tagName).toBe("BUTTON");
    await click(button);
    expect(onEventClick).toHaveBeenCalledWith(EVENTS[3]);
    await mount();
    expect(q('[data-slot="agenda-event"]')?.tagName).toBe("DIV");
    expect(q('[data-slot="agenda-event"] button')).toBeNull();
  });

  test("an event's name has title, time and description", async () => {
    await mount({
      events: [{ ...EVENTS[0], description: "Daily sync" }],
    });
    expect(q('[data-slot="agenda-event"]')?.getAttribute("aria-label")).toBe(
      "Standup, 9:00 AM – 9:30 AM, Daily sync",
    );
  });

  test("onSlotClick: clicking empty space in a column gives the date and time snapped to the half hour, clicking an event does not fire it", async () => {
    const onSlotClick = vi.fn();
    await mount({ onSlotClick, startHour: 8, endHour: 20 });
    const column = qa('[data-slot="agenda-column"]')[1];
    column.getBoundingClientRect = () => ({
      top: 100,
      height: 1200,
      left: 0,
      width: 100,
      right: 100,
      bottom: 1300,
      x: 0,
      y: 100,
      toJSON() {},
    });
    // Starting at 8:00, 12 hours / 1200px: 100px per hour; point y = 100 + 275 -> 10:45 -> 10:30
    await act(async () =>
      column.dispatchEvent(new MouseEvent("click", { bubbles: true, clientY: 375 })),
    );
    expect(onSlotClick).toHaveBeenCalledWith({ date: "2026-10-19", time: "10:30" });
    onSlotClick.mockClear();
    const event = qa('[data-slot="agenda-event"]')[0];
    await click(event);
    expect(onSlotClick).not.toHaveBeenCalled();
  });

  test("month view: 6 rows, dates outside the month are marked, single-day timed events are chips, multi-day ones bars", async () => {
    await mount({ defaultView: "month" });
    expect(qa('[data-slot="agenda-week"]')).toHaveLength(6);
    expect(qa('[data-slot="agenda-weekday"]')).toHaveLength(7);
    expect(qa('[data-slot="agenda-day"][data-outside]').length).toBeGreaterThan(0);
    expect(qa('[data-slot="agenda-day"][data-today]')).toHaveLength(1);
    const kinds = Object.fromEntries(
      qa('[data-slot="agenda-event"]').map((e) => [
        text(e.querySelector('[data-slot="agenda-event-title"]')),
        e.dataset.kind,
      ]),
    );
    expect(kinds).toMatchObject({ Offsite: "bar", Lunch: "chip", Standup: "chip" });
    expect(text(qa('[data-slot="agenda-day-number"]')[0])).toMatch(/^\d+$/);
    const lunch = qa('[data-slot="agenda-event"]').find((e) => text(e).includes("Lunch"))!;
    expect(text(lunch.querySelector('[data-slot="agenda-event-time"]'))).toBe("12:00 PM");
    expect(lunch.getAttribute("aria-label")).toBe("Lunch, 12:00 PM – 1:00 PM");
  });

  test("month view: overflow folds into +n more, clicking it goes to that day (or to onMoreClick)", async () => {
    const onDateChange = vi.fn();
    const events: AgendaEvent[] = [1, 2, 3, 4].map((n) => ({
      id: `e${n}`,
      title: `Event ${n}`,
      start: `2026-10-21T0${n}:00`,
    }));
    await mount({ events, defaultView: "month", maxEvents: 2, onDateChange });
    const more = q('[data-slot="agenda-more"]')!;
    expect(text(more)).toBe("+2 more");
    expect(qa('[data-slot="agenda-event"]')).toHaveLength(2);
    await click(more);
    expect(onDateChange).toHaveBeenCalledWith("2026-10-21");
    expect(q('[data-slot="agenda"]')?.dataset.view).toBe("day");

    const onMoreClick = vi.fn();
    await mount({ events, defaultView: "month", maxEvents: 2, onMoreClick });
    await click(q('[data-slot="agenda-more"]')!);
    expect(onMoreClick).toHaveBeenCalledWith("2026-10-21");
    expect(q('[data-slot="agenda"]')?.dataset.view).toBe("month");
  });

  test("labels replace the text", async () => {
    await mount({
      labels: { today: "Now", week: "7 days", more: (n) => `${n} hidden`, allDay: "Whole day" },
    });
    expect(text(q('[data-slot="agenda-nav"]'))).toContain("Now");
    expect(text(q('[data-slot="agenda-views"]'))).toContain("7 days");
    expect(text(q('[data-slot="agenda-allday-label"]'))).toBe("Whole day");
  });

  test("in time grid views an event across midnight continues the next day", async () => {
    await mount({
      events: [
        { id: "night", title: "Deploy", start: "2026-10-21T23:00", end: "2026-10-22T01:00" },
      ],
    });
    const columns = qa('[data-slot="agenda-column"]');
    const first = columns[3].querySelector<HTMLElement>('[data-slot="agenda-event"]');
    const second = columns[4].querySelector<HTMLElement>('[data-slot="agenda-event"]');
    expect(first?.hasAttribute("data-continues-after")).toBe(true);
    expect(second?.hasAttribute("data-continues-before")).toBe(true);
    expect(second?.style.getPropertyValue("--ev-length")).toBe("60");
  });
});

describe("<Agenda /> drag and keyboard", () => {
  const down = (el: Element, x: number, y: number) =>
    act(async () =>
      el.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, clientX: x, clientY: y, button: 0 }),
      ),
    );
  const moveTo = (x: number, y: number) =>
    act(
      async () =>
        void window.dispatchEvent(new MouseEvent("pointermove", { clientX: x, clientY: y })),
    );
  const release = (x = 0, y = 0) =>
    act(
      async () =>
        void window.dispatchEvent(new MouseEvent("pointerup", { clientX: x, clientY: y })),
    );
  const rect = (left: number, top: number, width: number, height: number) =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON() {},
    }) as DOMRect;
  /** Each column is 100 wide and 2400 tall (24 hours, 5/3 px per minute). */
  const stubColumns = () =>
    qa('[data-slot="agenda-column"]').forEach((c, i) => {
      c.getBoundingClientRect = () => rect(i * 100, 0, 100, 2400);
    });
  const yOf = (minutes: number) => (minutes * 2400) / 1440;

  const one: AgendaEvent = {
    id: "m",
    title: "Meet",
    start: "2026-10-21T09:00",
    end: "2026-10-21T09:30",
  };

  test("no dragging, handles or hints without onEventChange", async () => {
    await mount({ events: [one], onEventClick: () => {} });
    expect(q('[data-slot="agenda-event-handle"]')).toBeNull();
    expect(q('[data-slot="agenda-status"]')).toBeNull();
    expect(q('[data-slot="agenda-event"]')?.hasAttribute("data-draggable")).toBe(false);
  });

  test("draggable events are buttons with handles and a keyboard hint", async () => {
    await mount({ events: [one], onEventChange: () => {} });
    const block = q('[data-slot="agenda-event"]')!;
    expect(block.tagName).toBe("BUTTON");
    expect(block.hasAttribute("data-draggable")).toBe(true);
    expect(qa('[data-slot="agenda-event-handle"]').map((h) => h.dataset.edge)).toEqual([
      "start",
      "end",
    ]);
    const hint = document.getElementById(block.getAttribute("aria-describedby")!);
    expect(hint?.textContent).toMatch(/Alt/);
  });

  test("dragging an event: across days and times, live preview, notifies on release; no click after dragging", async () => {
    const onEventChange = vi.fn();
    const onEventClick = vi.fn();
    await mount({ events: [one], onEventChange, onEventClick });
    stubColumns();
    const block = q('[data-slot="agenda-event"]')!;
    await down(block, 350, yOf(9 * 60 + 10));
    await moveTo(450, yOf(10 * 60 + 10));
    expect(q('[data-slot="agenda"]')?.hasAttribute("data-dragging")).toBe(true);
    // Preview: already moved to the Thursday column
    expect(
      qa('[data-slot="agenda-column"]')[4].querySelector('[data-slot="agenda-event"]'),
    ).not.toBeNull();
    expect(onEventChange).not.toHaveBeenCalled();
    // In a browser, a click follows right after pointerup, in the same task
    await act(async () => {
      window.dispatchEvent(new MouseEvent("pointerup"));
      q('[data-slot="agenda-event"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onEventChange).toHaveBeenCalledWith(one, {
      start: "2026-10-22T10:00",
      end: "2026-10-22T10:30",
    });
    expect(q('[data-slot="agenda"]')?.hasAttribute("data-dragging")).toBe(false);
    expect(onEventClick).not.toHaveBeenCalled();
    await act(() => new Promise((r) => setTimeout(r, 5)));
    await click(q('[data-slot="agenda-event"]')!);
    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(text(q('[data-slot="agenda-status"]'))).toContain("Meet moved to");
  });

  test("dragging the bottom edge changes the end, snapping to 15 minutes, at least 15 minutes long", async () => {
    const onEventChange = vi.fn();
    await mount({ events: [one], onEventChange });
    stubColumns();
    const end = q('[data-slot="agenda-event-handle"][data-edge="end"]')!;
    await down(end, 350, yOf(9 * 60 + 30));
    await moveTo(350, yOf(10 * 60 + 5));
    await release();
    expect(onEventChange).toHaveBeenLastCalledWith(one, {
      start: "2026-10-21T09:00",
      end: "2026-10-21T10:00",
    });
    await down(end, 350, yOf(9 * 60 + 30));
    await moveTo(350, yOf(8 * 60));
    await release();
    expect(onEventChange).toHaveBeenLastCalledWith(one, {
      start: "2026-10-21T09:00",
      end: "2026-10-21T09:15",
    });
  });

  test("dragging the top edge changes the start", async () => {
    const onEventChange = vi.fn();
    await mount({ events: [one], onEventChange });
    stubColumns();
    await down(q('[data-slot="agenda-event-handle"][data-edge="start"]')!, 350, yOf(9 * 60));
    await moveTo(350, yOf(8 * 60 + 30));
    await release();
    expect(onEventChange).toHaveBeenCalledWith(one, {
      start: "2026-10-21T08:30",
      end: "2026-10-21T09:30",
    });
  });

  test("Esc cancels a drag; no movement is a click", async () => {
    const onEventChange = vi.fn();
    const onEventClick = vi.fn();
    await mount({ events: [one], onEventChange, onEventClick });
    stubColumns();
    await down(q('[data-slot="agenda-event"]')!, 350, yOf(9 * 60 + 10));
    await moveTo(450, yOf(11 * 60));
    await act(
      async () => void window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
    );
    expect(q('[data-slot="agenda"]')?.hasAttribute("data-dragging")).toBe(false);
    await release();
    expect(onEventChange).not.toHaveBeenCalled();
    expect(
      qa('[data-slot="agenda-column"]')[3].querySelector('[data-slot="agenda-event"]'),
    ).not.toBeNull();
    // After cancelling, the event returns to its original column (remounted), so the element must be fetched again
    const again = qa('[data-slot="agenda-column"]')[3].querySelector<HTMLElement>(
      '[data-slot="agenda-event"]',
    )!;
    await down(again, 350, yOf(9 * 60 + 10));
    await release();
    await click(again);
    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(onEventChange).not.toHaveBeenCalled();
  });

  test("dragging an all-day bar to another date", async () => {
    const onEventChange = vi.fn();
    const bar: AgendaEvent = { id: "b", title: "Trip", start: "2026-10-19", end: "2026-10-20" };
    await mount({ events: [bar], onEventChange });
    stubColumns();
    const el = q('[data-slot="agenda-allday"] [data-slot="agenda-event"]')!;
    await down(el, 150, 10);
    await moveTo(350, 10);
    await release();
    expect(onEventChange).toHaveBeenCalledWith(bar, { start: "2026-10-21", end: "2026-10-22" });
  });

  test("dragging an event to another day in month view keeps its time", async () => {
    const onEventChange = vi.fn();
    const lunch = EVENTS[3];
    await mount({ events: [lunch], onEventChange, defaultView: "month" });
    qa('[data-slot="agenda-day"]').forEach((cell, i) => {
      cell.getBoundingClientRect = () => rect((i % 7) * 100, Math.floor(i / 7) * 100, 100, 100);
    });
    const cells = qa('[data-slot="agenda-day"]');
    const from = cells.findIndex((c) => c.dataset.date === "2026-10-23");
    const to = cells.findIndex((c) => c.dataset.date === "2026-10-27");
    const chip = q('[data-slot="agenda-event"]')!;
    await down(chip, (from % 7) * 100 + 50, Math.floor(from / 7) * 100 + 50);
    await moveTo((to % 7) * 100 + 50, Math.floor(to / 7) * 100 + 50);
    await release();
    expect(onEventChange).toHaveBeenCalledWith(lunch, {
      start: "2026-10-27T12:00",
      end: "2026-10-27T13:00",
    });
  });

  test("keyboard: Alt + arrows move, Alt + Shift + Up / Down change the end, with announcements; focus stays on the event", async () => {
    const onEventChange = vi.fn((_e: AgendaEvent, next: { start: string; end?: string }) => next);
    await mount({ events: [one], onEventChange });
    const key = (k: string, extra: KeyboardEventInit = {}) =>
      act(
        async () =>
          void q('[data-slot="agenda-event"]')!.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: k,
              altKey: true,
              bubbles: true,
              cancelable: true,
              ...extra,
            }),
          ),
      );
    await key("ArrowDown");
    expect(onEventChange).toHaveBeenLastCalledWith(one, {
      start: "2026-10-21T09:15",
      end: "2026-10-21T09:45",
    });
    await key("ArrowUp");
    expect(onEventChange).toHaveBeenLastCalledWith(one, {
      start: "2026-10-21T08:45",
      end: "2026-10-21T09:15",
    });
    await key("ArrowRight");
    expect(onEventChange).toHaveBeenLastCalledWith(one, {
      start: "2026-10-22T09:00",
      end: "2026-10-22T09:30",
    });
    await key("ArrowLeft");
    expect(onEventChange).toHaveBeenLastCalledWith(one, {
      start: "2026-10-20T09:00",
      end: "2026-10-20T09:30",
    });
    await key("ArrowDown", { shiftKey: true });
    expect(onEventChange).toHaveBeenLastCalledWith(one, {
      start: "2026-10-21T09:00",
      end: "2026-10-21T09:45",
    });
    expect(text(q('[data-slot="agenda-status"]'))).toMatch(/^Meet moved to/);
    // Without Alt it doesn't move
    onEventChange.mockClear();
    await act(
      async () =>
        void q('[data-slot="agenda-event"]')!.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        ),
    );
    expect(onEventChange).not.toHaveBeenCalled();
  });

  test("after a keyboard move to another column focus is still on the event", async () => {
    function Controlled() {
      const [events, setEvents] = useState<AgendaEvent[]>([one]);
      return createElement(Agenda, {
        events,
        date: "2026-10-21",
        now: "2026-10-21T10:30",
        locale: "en-US",
        onEventChange: (e: AgendaEvent, next) => setEvents([{ ...e, ...next }]),
      });
    }
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root!.render(createElement(Controlled)));
    const block = q('[data-slot="agenda-event"]') as HTMLElement;
    act(() => block.focus());
    await act(
      async () =>
        void block.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowRight",
            altKey: true,
            bubbles: true,
            cancelable: true,
          }),
        ),
    );
    expect(
      qa('[data-slot="agenda-column"]')[4].querySelector('[data-slot="agenda-event"]'),
    ).not.toBeNull();
    expect(document.activeElement?.getAttribute("data-slot")).toBe("agenda-event");
    expect((document.activeElement as HTMLElement).dataset.eventId).toBe("m");
  });

  test("month view keyboard: Up / Down move a week", async () => {
    const onEventChange = vi.fn();
    const lunch = EVENTS[3];
    await mount({ events: [lunch], onEventChange, defaultView: "month" });
    await act(
      async () =>
        void q('[data-slot="agenda-event"]')!.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowDown",
            altKey: true,
            bubbles: true,
            cancelable: true,
          }),
        ),
    );
    expect(onEventChange).toHaveBeenCalledWith(lunch, {
      start: "2026-10-30T12:00",
      end: "2026-10-30T13:00",
    });
  });
});

describe("<Agenda /> i18n", () => {
  const zh = {
    today: "今天",
    week: "周",
    month: "月",
    day: "日",
    allDay: "全天",
    moved: (title: string, when: string) => `${title}已移动到${when}`,
  };
  async function mountIn(
    config: Parameters<typeof ConfigProvider>[0],
    props: Partial<AgendaProps> = {},
  ) {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () =>
      root!.render(
        createElement(
          ConfigProvider,
          config,
          createElement(Agenda, {
            events: EVENTS,
            date: "2026-10-21",
            now: "2026-10-21T10:30",
            ...props,
          }),
        ),
      ),
    );
  }

  test("ConfigProvider's locale and labels.agenda switch the whole language", async () => {
    await mountIn({ locale: "zh-CN", labels: { agenda: zh } });
    expect(text(qa('[data-slot="agenda-head"]')[0])).toContain("周日");
    expect(text(q('[data-slot="agenda-nav"]'))).toContain("今天");
    expect(text(q('[data-slot="agenda-views"]'))).toContain("月");
    expect(text(q('[data-slot="agenda-allday-label"]'))).toBe("全天");
    // Items not given still use the default text
    expect(q('[data-slot="agenda-nav"] button')?.getAttribute("aria-label")).toBe("Previous");
  });

  test("the component's own locale and labels win over ConfigProvider", async () => {
    await mountIn(
      { locale: "zh-CN", labels: { agenda: zh } },
      { locale: "en-US", labels: { today: "Now" } },
    );
    expect(text(qa('[data-slot="agenda-head"]')[0])).toContain("Sun");
    expect(text(q('[data-slot="agenda-nav"]'))).toContain("Now");
    expect(text(q('[data-slot="agenda-views"]'))).toContain("月");
  });

  test("announcements use labels.moved too", async () => {
    const one: AgendaEvent = {
      id: "m",
      title: "会议",
      start: "2026-10-21T09:00",
      end: "2026-10-21T09:30",
    };
    await mountIn(
      { locale: "zh-CN", labels: { agenda: zh } },
      { events: [one], onEventChange: () => {} },
    );
    await act(
      async () =>
        void q('[data-slot="agenda-event"]')!.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowDown",
            altKey: true,
            bubbles: true,
            cancelable: true,
          }),
        ),
    );
    expect(text(q('[data-slot="agenda-status"]'))).toMatch(/^会议已移动到2026年10月21日/);
  });
});
