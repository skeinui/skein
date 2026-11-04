import type { UIColor } from "../../contract.ts";
import { addDays } from "../calendar/dates.ts";

/**
 * An event in the agenda. Dates are "YYYY-MM-DD", ones with a time are "YYYY-MM-DDTHH:mm" (local time, no time zone).
 * - All-day event: `allDay`, or start without a time; end is the last day (inclusive).
 * - Timed event: when end is not given it defaults to 60 minutes; may span days.
 */
export interface AgendaEvent {
  /** Unique id, stable across renders (used for keys and drag state). */
  id: string;
  /** Text shown on the event block. */
  title: string;
  /** Start: "YYYY-MM-DDTHH:mm" for a timed event, "YYYY-MM-DD" for an all-day one (no time zone). */
  start: string;
  /** End, same format as `start`. A date-only end means the end of that day (inclusive); a timed event without it lasts 60 minutes, an all-day one 1 day. */
  end?: string;
  /** Treat as an all-day event (shown in the all-day bar). Implied when `start` has no time. */
  allDay?: boolean;
  color?: UIColor;
  /** Supplementary description, read by screen readers, not shown in the cell. */
  description?: string;
}

const DEFAULT_MINUTES = 60;
/** Events that are too short take at least this height so they can be clicked and their title read. */
export const MIN_VISIBLE_MINUTES = 20;

const hasTime = (value: string) => value.length > 10;
const dayOf = (value: string) => value.slice(0, 10);
const minutesOfTime = (value: string) => {
  const [h, m] = value.slice(11, 16).split(":").map(Number);
  return h * 60 + m;
};

/** Date difference (days). */
export function dayDiff(from: string, to: string) {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export interface NormalizedEvent {
  event: AgendaEvent;
  allDay: boolean;
  /** First day and last day (inclusive). */
  firstDay: string;
  lastDay: string;
  /** Start / end minutes counted from 0:00 of firstDay (only meaningful for timed events, may exceed 1440). */
  startMin: number;
  endMin: number;
}

export function normalizeEvent(event: AgendaEvent): NormalizedEvent {
  const allDay = event.allDay === true || !hasTime(event.start);
  const firstDay = dayOf(event.start);
  if (allDay) {
    const last = event.end ? dayOf(event.end) : firstDay;
    return {
      event,
      allDay,
      firstDay,
      lastDay: last < firstDay ? firstDay : last,
      startMin: 0,
      endMin: 0,
    };
  }
  const startMin = minutesOfTime(event.start);
  let endMin: number;
  if (event.end && hasTime(event.end)) {
    endMin = dayDiff(firstDay, dayOf(event.end)) * 1440 + minutesOfTime(event.end);
  } else if (event.end) {
    // Only a date given: end of that day
    endMin = (dayDiff(firstDay, dayOf(event.end)) + 1) * 1440;
  } else {
    endMin = startMin + DEFAULT_MINUTES;
  }
  if (endMin <= startMin) endMin = startMin + MIN_VISIBLE_MINUTES;
  // Ends exactly at 0:00, counts as the end of the previous day
  const lastDay = addDays(firstDay, Math.floor((endMin - 1) / 1440));
  return { event, allDay, firstDay, lastDay, startMin, endMin };
}

/** Sort: all-day / multi-day first, then by start time, then longer ones first, finally by id for stability. */
const byStart = (a: NormalizedEvent, b: NormalizedEvent) =>
  a.firstDay.localeCompare(b.firstDay) ||
  Number(b.allDay) - Number(a.allDay) ||
  a.startMin - b.startMin ||
  b.endMin - a.endMin ||
  a.event.id.localeCompare(b.event.id);

export interface TimedSegment {
  item: NormalizedEvent;
  /** Start / end minutes within this day (0–1440). */
  start: number;
  end: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  /** Column index when overlapping (from 0) and the total number of columns in this cluster of overlapping events. */
  column: number;
  columns: number;
}

/** Timed events of a day, clipped to the range of this day, with overlapping ones placed side by side in columns. */
export function layoutDay(items: readonly NormalizedEvent[], day: string): TimedSegment[] {
  const segments: TimedSegment[] = [];
  for (const item of items) {
    if (item.allDay || day < item.firstDay || day > item.lastDay) continue;
    const offset = dayDiff(item.firstDay, day) * 1440;
    const start = Math.max(0, item.startMin - offset);
    const end = Math.min(1440, item.endMin - offset);
    if (end <= start) continue;
    segments.push({
      item,
      start,
      end,
      continuesBefore: item.startMin < offset,
      continuesAfter: item.endMin > offset + 1440,
      column: 0,
      columns: 1,
    });
  }
  segments.sort(
    (a, b) => a.start - b.start || b.end - a.end || a.item.event.id.localeCompare(b.item.event.id),
  );

  // Group mutually overlapping (chained) events into clusters, and assign columns greedily within a cluster
  let cluster: TimedSegment[] = [];
  let clusterEnd = 0;
  const flush = () => {
    const ends: number[] = [];
    for (const seg of cluster) {
      // Events that are visually too short occupy the minimum height, to avoid stacking on the next one
      const visibleEnd = Math.max(seg.end, seg.start + MIN_VISIBLE_MINUTES);
      let col = ends.findIndex((end) => end <= seg.start);
      if (col === -1) col = ends.length;
      ends[col] = visibleEnd;
      seg.column = col;
    }
    for (const seg of cluster) seg.columns = ends.length;
    cluster = [];
  };
  for (const seg of segments) {
    if (cluster.length && seg.start >= clusterEnd) flush();
    cluster.push(seg);
    clusterEnd = Math.max(clusterEnd, seg.end, seg.start + MIN_VISIBLE_MINUTES);
  }
  if (cluster.length) flush();
  return segments;
}

export interface WeekSegment {
  item: NormalizedEvent;
  /** Within this row: which column it starts at (from 1), how many columns it spans, which row (from 0). */
  col: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export interface WeekLayout {
  segments: WeekSegment[];
  /** Number of rows actually used. */
  lanes: number;
  /** Number of events collapsed (beyond maxLanes) for each day. */
  hidden: number[];
}

/**
 * Event bars in a row (several consecutive days): each event is cut into a segment for this row and assigned the smallest non-conflicting row number.
 * When `wholeDay` is true only all-day / multi-day events are placed (the all-day area at the top of day / week views),
 * otherwise all events are placed (month view, where a single-day timed event takes one cell).
 */
export function layoutWeek(
  items: readonly NormalizedEvent[],
  days: readonly string[],
  options: { maxLanes?: number; wholeDay?: boolean } = {},
): WeekLayout {
  const { maxLanes = Infinity, wholeDay = false } = options;
  const first = days[0];
  const last = days[days.length - 1];
  const candidates = items
    .filter((item) => item.lastDay >= first && item.firstDay <= last)
    .filter((item) => !wholeDay || item.allDay || item.firstDay !== item.lastDay)
    .sort(byStart);

  const laneEnds: number[] = [];
  const segments: WeekSegment[] = [];
  const hidden = days.map(() => 0);
  for (const item of candidates) {
    const startCol = item.firstDay < first ? 0 : days.indexOf(item.firstDay);
    const endCol = item.lastDay > last ? days.length - 1 : days.indexOf(item.lastDay);
    let lane = laneEnds.findIndex((end) => end < startCol);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = endCol;
    if (lane >= maxLanes) {
      for (let c = startCol; c <= endCol; c++) hidden[c] += 1;
      continue;
    }
    segments.push({
      item,
      col: startCol + 1,
      span: endCol - startCol + 1,
      lane,
      continuesBefore: item.firstDay < first,
      continuesAfter: item.lastDay > last,
    });
  }
  return { segments, lanes: Math.min(laneEnds.length, maxLanes), hidden };
}

/** "HH:mm" */
export const formatClock = (minutes: number) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export const clockOf = (value: string) => value.slice(11, 16);

/** New start and end after drag or keyboard operation, same format as the original event (a date for all-day, "YYYY-MM-DDTHH:mm" for timed). */
export interface EventRange {
  start: string;
  end?: string;
}

const at = (firstDay: string, abs: number) =>
  `${addDays(firstDay, Math.floor(abs / 1440))}T${formatClock(abs)}`;

/** Shifts as a whole: `days` days + `minutes` minutes (all-day events only use days). A timed event always has an explicit end after being moved. */
export function shiftEvent(
  event: AgendaEvent,
  shift: { days?: number; minutes?: number },
): EventRange {
  const { days = 0, minutes = 0 } = shift;
  const n = normalizeEvent(event);
  if (n.allDay) {
    return {
      start: addDays(n.firstDay, days),
      end: event.end ? addDays(n.lastDay, days) : undefined,
    };
  }
  const offset = days * 1440 + minutes;
  return { start: at(n.firstDay, n.startMin + offset), end: at(n.firstDay, n.endMin + offset) };
}

/** Resizes one end: only meaningful for timed events, keeping at least 15 minutes. */
export function resizeEvent(
  event: AgendaEvent,
  edge: "start" | "end",
  minutes: number,
): EventRange {
  const n = normalizeEvent(event);
  if (n.allDay) return { start: event.start, end: event.end };
  const MIN = 15;
  const startAbs = edge === "start" ? Math.min(n.startMin + minutes, n.endMin - MIN) : n.startMin;
  const endAbs = edge === "end" ? Math.max(n.endMin + minutes, n.startMin + MIN) : n.endMin;
  return { start: at(n.firstDay, startAbs), end: at(n.firstDay, endAbs) };
}
