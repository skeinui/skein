import { describe, expect, it } from "vite-plus/test";
import {
  layoutDay,
  layoutWeek,
  normalizeEvent,
  resizeEvent,
  shiftEvent,
} from "../src/components/agenda/layout.ts";
import type { AgendaEvent } from "../src/components/agenda/layout.ts";

const ev = (id: string, start: string, end?: string, extra: Partial<AgendaEvent> = {}) =>
  normalizeEvent({ id, title: id, start, end, ...extra });

describe("normalizeEvent", () => {
  it("treats a date-only start as all-day, end inclusive", () => {
    const n = ev("a", "2026-10-20", "2026-10-22");
    expect(n).toMatchObject({ allDay: true, firstDay: "2026-10-20", lastDay: "2026-10-22" });
  });

  it("defaults a timed event to one hour and keeps the explicit all-day flag", () => {
    expect(ev("a", "2026-10-20T09:30")).toMatchObject({
      allDay: false,
      startMin: 570,
      endMin: 630,
    });
    expect(ev("b", "2026-10-20T09:30", undefined, { allDay: true }).allDay).toBe(true);
  });

  it("a timed event crossing midnight spans two days; ending exactly at 0:00 stays on the first", () => {
    expect(ev("a", "2026-10-20T22:00", "2026-10-21T02:00").lastDay).toBe("2026-10-21");
    expect(ev("b", "2026-10-20T22:00", "2026-10-21T00:00").lastDay).toBe("2026-10-20");
  });

  it("gives a zero or negative length event a minimum length", () => {
    const n = ev("a", "2026-10-20T10:00", "2026-10-20T10:00");
    expect(n.endMin).toBeGreaterThan(n.startMin);
  });
});

describe("layoutDay", () => {
  const day = "2026-10-20";
  it("puts overlapping events side by side and leaves the rest full width", () => {
    const items = [
      ev("a", `${day}T09:00`, `${day}T11:00`),
      ev("b", `${day}T10:00`, `${day}T12:00`),
      ev("c", `${day}T10:30`, `${day}T11:30`),
      ev("d", `${day}T14:00`, `${day}T15:00`),
    ];
    const seg = Object.fromEntries(layoutDay(items, day).map((s) => [s.item.event.id, s]));
    expect(seg.a).toMatchObject({ column: 0, columns: 3 });
    expect(seg.b).toMatchObject({ column: 1, columns: 3 });
    expect(seg.c).toMatchObject({ column: 2, columns: 3 });
    expect(seg.d).toMatchObject({ column: 0, columns: 1 });
  });

  it("reuses a freed column inside the same cluster", () => {
    const items = [
      ev("a", `${day}T09:00`, `${day}T10:00`),
      ev("b", `${day}T09:30`, `${day}T11:00`),
      ev("c", `${day}T10:00`, `${day}T10:45`),
    ];
    const seg = Object.fromEntries(layoutDay(items, day).map((s) => [s.item.event.id, s]));
    expect(seg.c).toMatchObject({ column: 0, columns: 2 });
  });

  it("clips a multi-day event to each day and marks the continuation", () => {
    const item = ev("a", `${day}T22:00`, "2026-10-21T02:00");
    const first = layoutDay([item], day)[0];
    const second = layoutDay([item], "2026-10-21")[0];
    expect(first).toMatchObject({
      start: 1320,
      end: 1440,
      continuesAfter: true,
      continuesBefore: false,
    });
    expect(second).toMatchObject({
      start: 0,
      end: 120,
      continuesBefore: true,
      continuesAfter: false,
    });
    expect(layoutDay([item], "2026-10-22")).toEqual([]);
  });

  it("ignores all-day events and other days", () => {
    expect(layoutDay([ev("a", day), ev("b", "2026-10-21T09:00")], day)).toEqual([]);
  });
});

describe("layoutWeek", () => {
  const days = [
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
    "2026-10-24",
    "2026-10-25",
  ];

  it("lays a multi-day event across columns and stacks overlapping ones in lanes", () => {
    const { segments, lanes } = layoutWeek(
      [
        ev("long", "2026-10-20", "2026-10-23"),
        ev("short", "2026-10-21", "2026-10-21"),
        ev("late", "2026-10-24"),
      ],
      days,
    );
    const by = Object.fromEntries(segments.map((s) => [s.item.event.id, s]));
    expect(by.long).toMatchObject({ col: 2, span: 4, lane: 0 });
    expect(by.short).toMatchObject({ col: 3, span: 1, lane: 1 });
    expect(by.late).toMatchObject({ col: 6, span: 1, lane: 0 });
    expect(lanes).toBe(2);
  });

  it("cuts an event at the row edges and flags the continuation", () => {
    const { segments } = layoutWeek(
      [ev("a", "2026-10-17", "2026-10-21"), ev("b", "2026-10-24", "2026-10-28")],
      days,
    );
    const by = Object.fromEntries(segments.map((s) => [s.item.event.id, s]));
    expect(by.a).toMatchObject({ col: 1, span: 3, continuesBefore: true, continuesAfter: false });
    expect(by.b).toMatchObject({ col: 6, span: 2, continuesBefore: false, continuesAfter: true });
  });

  it("wholeDay keeps only all-day and multi-day events", () => {
    const { segments } = layoutWeek(
      [
        ev("timed", "2026-10-20T09:00"),
        ev("allday", "2026-10-20"),
        ev("multi", "2026-10-20T22:00", "2026-10-21T02:00"),
      ],
      days,
      { wholeDay: true },
    );
    expect(segments.map((s) => s.item.event.id).sort()).toEqual(["allday", "multi"]);
  });

  it("hides what does not fit and counts it per day", () => {
    const { segments, hidden, lanes } = layoutWeek(
      [ev("a", "2026-10-20T09:00"), ev("b", "2026-10-20T10:00"), ev("c", "2026-10-20T11:00")],
      days,
      { maxLanes: 2 },
    );
    expect(segments).toHaveLength(2);
    expect(hidden[1]).toBe(1);
    expect(lanes).toBe(2);
  });

  it("ignores events outside the row", () => {
    expect(layoutWeek([ev("a", "2026-11-02")], days).segments).toEqual([]);
  });
});

describe("shiftEvent / resizeEvent", () => {
  const timed: AgendaEvent = {
    id: "a",
    title: "A",
    start: "2026-10-20T09:00",
    end: "2026-10-20T10:30",
  };

  it("moves a timed event by days and minutes and always writes an explicit end", () => {
    expect(shiftEvent(timed, { minutes: 15 })).toEqual({
      start: "2026-10-20T09:15",
      end: "2026-10-20T10:45",
    });
    expect(shiftEvent(timed, { days: 2 })).toEqual({
      start: "2026-10-22T09:00",
      end: "2026-10-22T10:30",
    });
    expect(shiftEvent({ id: "b", title: "B", start: "2026-10-20T09:00" }, { minutes: 30 })).toEqual(
      {
        start: "2026-10-20T09:30",
        end: "2026-10-20T10:30",
      },
    );
  });

  it("rolls over midnight in both directions", () => {
    expect(shiftEvent(timed, { minutes: 15 * 60 })).toEqual({
      start: "2026-10-21T00:00",
      end: "2026-10-21T01:30",
    });
    expect(shiftEvent(timed, { minutes: -10 * 60 })).toEqual({
      start: "2026-10-19T23:00",
      end: "2026-10-20T00:30",
    });
  });

  it("shifts all-day events by whole days and keeps the shape of end", () => {
    expect(
      shiftEvent(
        { id: "c", title: "C", start: "2026-10-20", end: "2026-10-22" },
        { days: 3, minutes: 90 },
      ),
    ).toEqual({
      start: "2026-10-23",
      end: "2026-10-25",
    });
    expect(shiftEvent({ id: "d", title: "D", start: "2026-10-20" }, { days: -1 })).toEqual({
      start: "2026-10-19",
      end: undefined,
    });
  });

  it("resizes one edge and keeps at least 15 minutes", () => {
    expect(resizeEvent(timed, "end", 30)).toEqual({
      start: "2026-10-20T09:00",
      end: "2026-10-20T11:00",
    });
    expect(resizeEvent(timed, "start", -30)).toEqual({
      start: "2026-10-20T08:30",
      end: "2026-10-20T10:30",
    });
    expect(resizeEvent(timed, "end", -600)).toEqual({
      start: "2026-10-20T09:00",
      end: "2026-10-20T09:15",
    });
    expect(resizeEvent(timed, "start", 600)).toEqual({
      start: "2026-10-20T10:15",
      end: "2026-10-20T10:30",
    });
  });

  it("leaves all-day events alone when resizing", () => {
    const allDay = { id: "e", title: "E", start: "2026-10-20", end: "2026-10-21" };
    expect(resizeEvent(allDay, "end", 60)).toEqual({ start: "2026-10-20", end: "2026-10-21" });
  });
});
