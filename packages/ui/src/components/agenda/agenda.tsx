import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  ComponentPropsWithoutRef,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { AgendaEventKind, AgendaView } from "../../contract.ts";
import { Button } from "../button/index.ts";
import {
  addDays,
  addMonths,
  formatDate,
  formatMonthTitle,
  formatWeekday,
  monthGrid,
  monthOf,
  todayISO,
  weekStartOf,
  weekday,
} from "../calendar/dates.ts";
import { en } from "../../locales/en.ts";
import { useVars } from "../../internal/use-vars.ts";
import { useConfig } from "../config-provider/context.ts";
import { Segmented } from "../segmented/segmented.tsx";
import {
  dayDiff,
  layoutDay,
  layoutWeek,
  normalizeEvent,
  resizeEvent,
  shiftEvent,
} from "./layout.ts";
import type { AgendaEvent, EventRange, NormalizedEvent } from "./layout.ts";

type Without<T> = Omit<T, "className" | "style" | "children" | "onSelect">;

export interface AgendaLabels {
  today?: string;
  previous?: string;
  next?: string;
  day?: string;
  week?: string;
  month?: string;
  allDay?: string;
  /** Events that do not fit in one day of the month view, default `+${n} more`. */
  more?: (count: number) => string;
  /** Name of the view switcher, default "Calendar view". */
  views?: string;
  /** Name of the current time line, default "Current time". */
  now?: string;
  /** Hint for keyboard move / resize of events (read by screen readers on the event). */
  moveHint?: string;
  /** Announcement after an event is moved / resized; `when` is the new date and time. */
  moved?: (title: string, when: string) => string;
}

export interface AgendaProps extends Without<ComponentPropsWithoutRef<"section">> {
  /** The events to show, owned by the caller (update them in `onEventChange`). */
  events: readonly AgendaEvent[];
  /** Current view, controlled. */
  view?: AgendaView;
  /**
   * Initial `view` when uncontrolled.
   * @default "week"
   */
  defaultView?: AgendaView;
  onViewChange?: (view: AgendaView) => void;
  /** The day the view is centered on, "YYYY-MM-DD", controlled; the week view shows the week containing it, the month view the month containing it. */
  date?: string;
  /** Initial `date` when uncontrolled; today when not given. */
  defaultDate?: string;
  onDateChange?: (date: string) => void;
  /**
   * Which views are offered, all three by default.
   * @default ["day", "week", "month"]
   */
  views?: readonly AgendaView[];
  /**
   * Which weekday each week starts on, 0 = Sunday.
   * @default 0
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Locale for weekdays, dates and times, defaults to the `locale` of ConfigProvider. */
  locale?: string;
  /**
   * First hour shown in the day / week views.
   * @default 0
   */
  startHour?: number;
  /**
   * Last hour shown in the day / week views (exclusive end of the range).
   * @default 24
   */
  endHour?: number;
  /**
   * Hour the day / week views scroll to when opened.
   * @default 8
   */
  scrollToHour?: number;
  /**
   * Maximum event rows per day in the month view; extras collapse into "+n more".
   * @default 3
   */
  maxEvents?: number;
  /** "Now": when given it is fixed at this time (for demos and tests); when not given the real time is used and refreshed every minute. */
  now?: string | Date;
  /** Click on an event (not fired right after a drag). */
  onEventClick?: (event: AgendaEvent) => void;
  /** Click on empty space: the day / week views give the date and the time aligned to half an hour, the month view gives only the date. */
  onSlotClick?: (slot: { date: string; time?: string }) => void;
  /** Click on "+n more" in the month view. If not passed, it switches to the day view of that day. */
  onMoreClick?: (date: string) => void;
  /**
   * Called after an event is dragged / moved or resized with the keyboard, giving the new start and end (same format as the original event); the event is still owned by the caller,
   * just update `events` once you get it. Drag is enabled only when it is passed: drag an event block to move it, drag the top / bottom edge to change duration, drag all-day bars and month-view events to other dates;
   * keyboard: after focusing an event, Alt + arrow keys move it (up / down 15 minutes, left / right 1 day, up / down 7 days in the month view), Alt + Shift + up / down adjusts the end time.
   */
  onEventChange?: (event: AgendaEvent, next: EventRange) => void;
  labels?: AgendaLabels;
}

/** Entry point for drag / keyboard operations; event components take it from here to avoid passing it down layer by layer. */
interface DragApi {
  enabled: boolean;
  hintId: string;
  draggingId: string | null;
  begin: (
    e: ReactPointerEvent<HTMLElement>,
    mode: "move" | "start" | "end",
    event: AgendaEvent,
    segment?: { day: string; start: number },
  ) => void;
  keyDown: (e: ReactKeyboardEvent<HTMLElement>, event: AgendaEvent, kind: AgendaEventKind) => void;
  /** The click right after a drag ends must be swallowed so it is not treated as a click event. */
  guardClick: () => boolean;
}
const NO_DRAG: DragApi = {
  enabled: false,
  hintId: "",
  draggingId: null,
  begin: () => {},
  keyDown: () => {},
  guardClick: () => false,
};
const DragContext = createContext<DragApi>(NO_DRAG);

const NAV_ICON = {
  prev: "m15 18-6-6 6-6",
  next: "m9 18 6-6-6-6",
};
const chevron = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

function timeText(minutes: number, locale?: string) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, Math.floor(m / 60), m % 60)));
}

function hourText(hour: number, locale?: string) {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, 0, 1, hour % 24)),
  );
}

function rangeTitle(from: string, to: string, locale?: string) {
  const [a, b] = [from, to].map((d) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, day));
  });
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  return typeof format.formatRange === "function"
    ? format.formatRange(a, b)
    : `${format.format(a)} – ${format.format(b)}`;
}

/** "Now": local date + minutes of the day; refreshed every minute when there is no fixed value. */
function useNow(fixed?: string | Date) {
  const read = () => {
    const d = fixed instanceof Date ? fixed : new Date();
    if (typeof fixed === "string") {
      const [h, m] = (fixed.slice(11, 16) || "00:00").split(":").map(Number);
      return { date: fixed.slice(0, 10), minutes: h * 60 + m };
    }
    return {
      date: `${String(d.getFullYear()).padStart(4, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      minutes: d.getHours() * 60 + d.getMinutes(),
    };
  };
  const [now, setNow] = useState(read);
  const fixedKey = fixed instanceof Date ? fixed.getTime() : fixed;
  useEffect(() => {
    setNow(read());
    if (fixedKey !== undefined) return;
    const id = setInterval(() => setNow(read()), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedKey]);
  return now;
}

interface EventViewProps {
  item: NormalizedEvent;
  kind: AgendaEventKind;
  vars?: Record<string, string | number>;
  continuesBefore?: boolean;
  continuesAfter?: boolean;
  showTime?: boolean;
  /** The time block is too short for two lines: title and time are laid out on one line. */
  short?: boolean;
  /** The time block's position within its day (used to convert to minutes when dragging). */
  segment?: { day: string; start: number };
  locale?: string;
  onEventClick?: (event: AgendaEvent) => void;
}

/** One event: a button when it has a click callback or is draggable, otherwise a plain block (does not pretend to be clickable). */
function EventView({
  item,
  kind,
  vars = {},
  continuesBefore,
  continuesAfter,
  showTime,
  short,
  segment,
  locale,
  onEventClick,
}: EventViewProps) {
  const { event } = item;
  const drag = useContext(DragContext);
  const ref = useVars<HTMLElement>(vars);
  const range =
    showTime && !item.allDay
      ? `${timeText(item.startMin, locale)} – ${timeText(item.endMin, locale)}`
      : undefined;
  // In the month view a dot has room only for the start time; screen readers still read the full start and end
  const time = range && kind === "chip" ? timeText(item.startMin, locale) : range;
  const label = [event.title, range, event.description].filter(Boolean).join(", ");
  const shared = {
    "data-slot": "agenda-event",
    "data-kind": kind,
    "data-color": event.color ?? "primary",
    "data-continues-before": continuesBefore ? "" : undefined,
    "data-continues-after": continuesAfter ? "" : undefined,
    "data-short": short ? "" : undefined,
    "data-event-id": event.id,
    "aria-label": label,
  } as const;
  const resizable = drag.enabled && kind === "block" && !item.allDay;
  const content = (
    <>
      {resizable && !continuesBefore ? (
        <span data-slot="agenda-event-handle" data-edge="start" aria-hidden="true" />
      ) : null}
      <span data-slot="agenda-event-title">{event.title}</span>
      {time ? <span data-slot="agenda-event-time">{time}</span> : null}
      {resizable && !continuesAfter ? (
        <span data-slot="agenda-event-handle" data-edge="end" aria-hidden="true" />
      ) : null}
    </>
  );
  return onEventClick || drag.enabled ? (
    <button
      {...shared}
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      data-draggable={drag.enabled ? "" : undefined}
      data-dragging={drag.draggingId === event.id ? "" : undefined}
      aria-describedby={drag.enabled ? drag.hintId : undefined}
      onClick={() => (drag.guardClick() ? undefined : onEventClick?.(event))}
      onKeyDown={drag.enabled ? (e) => drag.keyDown(e, event, kind) : undefined}
      onPointerDown={
        drag.enabled
          ? (e) => {
              const edge = (e.target as HTMLElement)
                .closest<HTMLElement>('[data-slot="agenda-event-handle"]')
                ?.getAttribute("data-edge");
              drag.begin(e, edge === "start" || edge === "end" ? edge : "move", event, segment);
            }
          : undefined
      }
    >
      {content}
    </button>
  ) : (
    <div {...shared} ref={ref as React.RefObject<HTMLDivElement>} role="group">
      {content}
    </div>
  );
}

/** One event bar (all-day / multi-day, or a row in the month view), placed in a row's grid. */
function WeekEvents({
  layout,
  kindOf,
  rowOffset,
  locale,
  onEventClick,
}: {
  layout: ReturnType<typeof layoutWeek>;
  kindOf: (item: NormalizedEvent) => AgendaEventKind;
  rowOffset: number;
  locale?: string;
  onEventClick?: (event: AgendaEvent) => void;
}) {
  return (
    <>
      {layout.segments.map((seg) => {
        const kind = kindOf(seg.item);
        return (
          <EventView
            key={`${seg.item.event.id}-${seg.col}`}
            item={seg.item}
            kind={kind}
            vars={{
              "--seg-col": seg.col,
              "--seg-span": seg.span,
              "--seg-row": seg.lane + rowOffset,
            }}
            continuesBefore={seg.continuesBefore}
            continuesAfter={seg.continuesAfter}
            showTime={kind === "chip"}
            locale={locale}
            onEventClick={onEventClick}
          />
        );
      })}
    </>
  );
}

function DayColumn({
  day,
  items,
  startHour,
  endHour,
  today,
  weekend,
  now,
  nowLabel,
  locale,
  onEventClick,
  onSlotClick,
}: {
  day: string;
  items: readonly NormalizedEvent[];
  startHour: number;
  endHour: number;
  today: boolean;
  weekend: boolean;
  now: number | null;
  nowLabel: string;
  locale?: string;
  onEventClick?: (event: AgendaEvent) => void;
  onSlotClick?: AgendaProps["onSlotClick"];
}) {
  const from = startHour * 60;
  const to = endHour * 60;
  const segments = layoutDay(items, day).filter((s) => s.end > from && s.start < to);
  const handle = (e: MouseEvent<HTMLDivElement>) => {
    if (!onSlotClick || (e.target as HTMLElement).closest('[data-slot="agenda-event"]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.height <= 0) return;
    const raw = from + ((e.clientY - rect.top) / rect.height) * (to - from);
    const snapped = Math.min(to - 30, Math.max(from, Math.floor(raw / 30) * 30));
    onSlotClick({
      date: day,
      time: `${String(Math.floor(snapped / 60)).padStart(2, "0")}:${String(snapped % 60).padStart(2, "0")}`,
    });
  };
  return (
    // Click on empty space is a shortcut for mouse / touch; keyboard users use the app's own "New" entry point
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      data-slot="agenda-column"
      data-date={day}
      data-today={today ? "" : undefined}
      data-weekend={weekend ? "" : undefined}
      role="group"
      aria-label={formatDate(day, locale, "full")}
      onClick={handle}
    >
      {segments.map((seg) => (
        <EventView
          key={`${seg.item.event.id}-${day}`}
          item={{
            ...seg.item,
            startMin: seg.item.startMin,
            endMin: seg.item.endMin,
          }}
          kind="block"
          vars={{
            "--ev-start": Math.max(seg.start, from) - from,
            "--ev-length": Math.max(Math.min(seg.end, to) - Math.max(seg.start, from), 20),
            "--ev-col": seg.column,
            "--ev-cols": seg.columns,
          }}
          continuesBefore={seg.continuesBefore}
          continuesAfter={seg.continuesAfter}
          showTime
          short={Math.min(seg.end, to) - Math.max(seg.start, from) < 45}
          segment={{ day, start: seg.start }}
          locale={locale}
          onEventClick={onEventClick}
        />
      ))}
      {now !== null ? <NowLine minutes={now - from} label={nowLabel} /> : null}
    </div>
  );
}

function NowLine({ minutes, label }: { minutes: number; label: string }) {
  const ref = useVars<HTMLDivElement>({ "--ev-start": minutes });
  return <div ref={ref} data-slot="agenda-now" role="separator" aria-label={label} />;
}

/**
 * Calendar of events with day, week and month views, navigation and optional drag-to-reschedule.
 * Pass `events` (`AgendaEvent[]`: `id`, `title`, `start` / `end` as "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm", no time zone); events are owned by the caller.
 * `view` / `onViewChange` and `date` / `onDateChange` control the view and the day shown (or use the uncontrolled defaults).
 * The day and week views are timelines (all-day / multi-day bars on top, timed events placed by time, overlapping ones side by side, a current time line today);
 * the month view has one week per row, and events that do not fit collapse into "+n more" (`onMoreClick`, or it switches to that day).
 * `onEventClick` / `onSlotClick` report clicks; passing `onEventChange` enables dragging and Alt + arrow keys to move / resize events.
 * For picking a date use Calendar or DatePicker.
 *
 * Theme style: positions and sizes are numbers only known at runtime, written as CSS variables with a ref: --ev-start / --ev-length (minutes), --ev-col / --ev-cols
 * (overlap columns), --seg-col / --seg-span / --seg-row (event bars in a row), converted to lengths by the theme style.
 */
export function Agenda({
  events,
  view: viewProp,
  defaultView = "week",
  onViewChange,
  date: dateProp,
  defaultDate,
  onDateChange,
  views = ["day", "week", "month"],
  weekStartsOn = 0,
  locale: localeProp,
  startHour = 0,
  endHour = 24,
  scrollToHour = 8,
  maxEvents = 3,
  now: nowProp,
  onEventClick,
  onSlotClick,
  onMoreClick,
  onEventChange,
  labels: labelsProp,
  ...rest
}: AgendaProps) {
  const config = useConfig();
  const locale = localeProp ?? config.locale;
  const labels = { ...en.labels.agenda, ...config.labels?.agenda, ...labelsProp };
  const now = useNow(nowProp);
  const today = now.date || todayISO();

  const [innerView, setInnerView] = useState<AgendaView>(defaultView);
  const [innerDate, setInnerDate] = useState(defaultDate ?? today);
  const view = viewProp ?? innerView;
  const date = dateProp ?? innerDate;
  const setView = (next: AgendaView) => {
    if (viewProp === undefined) setInnerView(next);
    onViewChange?.(next);
  };
  const setDate = (next: string) => {
    if (dateProp === undefined) setInnerDate(next);
    onDateChange?.(next);
  };
  const openDay = (day: string) => {
    setDate(day);
    if (views.includes("day")) setView("day");
  };

  const hintId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [preview, setPreview] = useState<({ id: string } & EventRange) | null>(null);
  const [status, setStatus] = useState("");
  const suppressClick = useRef(false);
  const pendingFocus = useRef<string | null>(null);
  const shown = preview
    ? events.map((e) =>
        e.id === preview.id ? { ...e, start: preview.start, end: preview.end } : e,
      )
    : events;
  const items = shown.map(normalizeEvent);

  const step = (dir: 1 | -1) =>
    setDate(
      view === "month" ? addMonths(date, dir) : addDays(date, dir * (view === "week" ? 7 : 1)),
    );

  const weekDays =
    view === "day"
      ? [date]
      : Array.from({ length: 7 }, (_, i) => addDays(weekStartOf(date, weekStartsOn), i));
  const title =
    view === "month"
      ? formatMonthTitle(monthOf(date), locale)
      : view === "week"
        ? rangeTitle(weekDays[0], weekDays[6], locale)
        : formatDate(date, locale, "full");

  const hours = endHour - startHour;
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeGrid = view !== "month";
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !timeGrid) return;
    // Leave a little margin so the first hour label is not half cut off by the top edge
    el.scrollTop = Math.max(
      0,
      el.scrollHeight * (Math.max(0, scrollToHour - startHour) / hours) - 8,
    );
  }, [timeGrid, view, scrollToHour, startHour, hours]);

  const from = startHour * 60;
  const to = endHour * 60;

  const describe = (ev: AgendaEvent) => {
    const n = normalizeEvent(ev);
    const day = formatDate(n.firstDay, locale, "medium");
    return n.allDay
      ? day
      : `${day}, ${timeText(n.startMin, locale)} – ${timeText(n.endMin, locale)}`;
  };
  const commit = (ev: AgendaEvent, next: EventRange) => {
    if (next.start === ev.start && next.end === ev.end) return;
    onEventChange?.(ev, next);
    setStatus(labels.moved(ev.title, describe({ ...ev, ...next })));
  };
  // After a keyboard move, the event may land in a different column (remounted); give focus back to it
  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (id === null) return;
    pendingFocus.current = null;
    const found = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="agenda-event"]') ?? []),
    ].find((el) => el.dataset.eventId === id);
    found?.focus();
  }, [events]);

  /** The date under the pointer: for the month view by the date cells' extents, for day / week by the columns' horizontal extents (clamped to the ends when outside). */
  const dayAt = (x: number, y: number): string | null => {
    const root = rootRef.current;
    if (!root) return null;
    if (view === "month") {
      const hit = [
        ...root.querySelectorAll<HTMLElement>('[data-slot="agenda-day"][data-date]'),
      ].find((el) => {
        const r = el.getBoundingClientRect();
        return x >= r.left && x < r.right && y >= r.top && y < r.bottom;
      });
      return hit?.dataset.date ?? null;
    }
    const cols = [...root.querySelectorAll<HTMLElement>('[data-slot="agenda-column"]')];
    if (cols.length === 0) return null;
    const hit =
      cols.find((c) => {
        const r = c.getBoundingClientRect();
        return x >= r.left && x < r.right;
      }) ?? (x < cols[0].getBoundingClientRect().left ? cols[0] : cols[cols.length - 1]);
    return hit.dataset.date ?? null;
  };
  /** The minute corresponding to the pointer within a day's column. */
  const minutesAt = (day: string, y: number): number | null => {
    const col = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="agenda-column"]') ?? []),
    ].find((c) => c.dataset.date === day);
    const rect = col?.getBoundingClientRect();
    return rect && rect.height > 0 ? from + ((y - rect.top) / rect.height) * (to - from) : null;
  };
  const snap = (minutes: number) => Math.round(minutes / 15) * 15;

  const begin: DragApi["begin"] = (down, mode, event, segment) => {
    if (down.pointerType === "mouse" && down.button !== 0) return;
    const grabDay = segment?.day ?? dayAt(down.clientX, down.clientY);
    const grabMinutes = segment ? minutesAt(segment.day, down.clientY) : null;
    const grabOffset = grabMinutes !== null && segment ? grabMinutes - segment.start : 0;
    const n = normalizeEvent(event);
    let started = false;
    let latest: EventRange | null = null;

    const compute = (e: PointerEvent): EventRange | null => {
      if (mode === "move") {
        const day = dayAt(e.clientX, e.clientY);
        if (!day || !grabDay) return null;
        const days = dayDiff(grabDay, day);
        if (!timeGrid || n.allDay || !segment) return shiftEvent(event, { days });
        const m = minutesAt(day, e.clientY);
        if (m === null) return null;
        return shiftEvent(event, { days, minutes: snap(m - grabOffset) - segment.start });
      }
      if (!segment || grabMinutes === null) return null;
      const m = minutesAt(segment.day, e.clientY);
      return m === null ? null : resizeEvent(event, mode, snap(m) - snap(grabMinutes));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key);
      setPreview(null);
    };
    const move = (e: PointerEvent) => {
      if (!started && Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) < 4) return;
      started = true;
      const next = compute(e);
      if (next) {
        latest = next;
        setPreview({ id: event.id, ...next });
      }
    };
    const up = () => {
      const next = latest;
      stop();
      if (started) {
        // The click that follows is not a click event
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 0);
        if (next) commit(event, next);
      }
    };
    const cancel = () => stop();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key);
  };

  const keyDown: DragApi["keyDown"] = (e, event, kind) => {
    if (!e.altKey) return;
    const sign = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    const dir = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    let next: EventRange | null = null;
    if (dir) next = shiftEvent(event, { days: dir });
    else if (sign && kind === "block") {
      next = e.shiftKey
        ? resizeEvent(event, "end", sign * 15)
        : shiftEvent(event, { minutes: sign * 15 });
    } else if (sign && view === "month" && !e.shiftKey)
      next = shiftEvent(event, { days: sign * 7 });
    if (!next) return;
    e.preventDefault();
    pendingFocus.current = event.id;
    commit(event, next);
  };

  const dragApi: DragApi = {
    enabled: onEventChange !== undefined,
    hintId,
    draggingId: preview ? preview.id : null,
    begin,
    keyDown,
    guardClick: () => suppressClick.current,
  };

  const bodyVars = useVars<HTMLDivElement>({
    "--agenda-hours": hours,
    "--agenda-cols": weekDays.length,
  });
  const isWeekend = (day: string) => weekday(day) === 0 || weekday(day) === 6;

  return (
    <DragContext.Provider value={dragApi}>
      <section
        {...rest}
        ref={rootRef}
        data-slot="agenda"
        data-view={view}
        data-dragging={preview ? "" : undefined}
      >
        <div data-slot="agenda-header">
          <h2 data-slot="agenda-title" aria-live="polite">
            {title}
          </h2>
          <div data-slot="agenda-controls">
            {views.length > 1 ? (
              <div data-slot="agenda-views">
                <Segmented
                  size="sm"
                  aria-label={labels.views}
                  value={view}
                  onValueChange={(v) => setView(v as AgendaView)}
                  options={views.map((v) => ({ value: v, label: labels[v] }))}
                />
              </div>
            ) : null}
            <div data-slot="agenda-nav">
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label={labels.previous}
                onClick={() => step(-1)}
              >
                {chevron(NAV_ICON.prev)}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDate(today)}>
                {labels.today}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label={labels.next}
                onClick={() => step(1)}
              >
                {chevron(NAV_ICON.next)}
              </Button>
            </div>
          </div>
        </div>

        {timeGrid ? (
          <div ref={bodyVars} data-slot="agenda-body" data-view={view}>
            <div data-slot="agenda-heads">
              {weekDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  data-slot="agenda-head"
                  data-today={day === today ? "" : undefined}
                  data-weekend={isWeekend(day) ? "" : undefined}
                  aria-label={formatDate(day, locale, "full")}
                  onClick={() => (view === "week" ? openDay(day) : undefined)}
                  disabled={view === "day"}
                >
                  <span data-slot="agenda-head-name">{formatWeekday(weekday(day), locale)}</span>
                  <span data-slot="agenda-head-date">{Number(day.slice(8))}</span>
                </button>
              ))}
            </div>
            <AllDay
              items={items}
              days={weekDays}
              label={labels.allDay}
              locale={locale}
              onEventClick={onEventClick}
            />
            <div
              ref={scrollRef}
              data-slot="agenda-scroll"
              tabIndex={0}
              role="group"
              aria-label={title}
            >
              <div data-slot="agenda-gutter" aria-hidden="true">
                {Array.from({ length: hours }, (_, i) => (
                  <span key={i} data-slot="agenda-hour">
                    {i === 0 ? "" : hourText(startHour + i, locale)}
                  </span>
                ))}
              </div>
              <div data-slot="agenda-columns">
                {weekDays.map((day) => (
                  <DayColumn
                    key={day}
                    day={day}
                    items={items}
                    startHour={startHour}
                    endHour={endHour}
                    today={day === today}
                    weekend={isWeekend(day)}
                    now={
                      day === today && now.minutes >= startHour * 60 && now.minutes < endHour * 60
                        ? now.minutes
                        : null
                    }
                    nowLabel={labels.now}
                    locale={locale}
                    onEventClick={onEventClick}
                    onSlotClick={onSlotClick}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div data-slot="agenda-month" data-view="month">
            <div data-slot="agenda-weekdays" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} data-slot="agenda-weekday">
                  {formatWeekday((weekStartsOn + i) % 7, locale)}
                </span>
              ))}
            </div>
            {monthGrid(monthOf(date), weekStartsOn).map((week) => (
              <MonthWeek
                key={week[0]}
                days={week}
                month={monthOf(date)}
                today={today}
                items={items}
                maxEvents={maxEvents}
                labels={labels}
                locale={locale}
                onEventClick={onEventClick}
                onSlotClick={onSlotClick}
                onDayClick={openDay}
                onMoreClick={(day) => (onMoreClick ? onMoreClick(day) : openDay(day))}
              />
            ))}
          </div>
        )}
        {onEventChange ? (
          <>
            <span id={hintId} hidden>
              {labels.moveHint}
            </span>
            <span data-slot="agenda-status" role="status" aria-live="polite">
              {status}
            </span>
          </>
        ) : null}
      </section>
    </DragContext.Provider>
  );
}

function AllDay({
  items,
  days,
  label,
  locale,
  onEventClick,
}: {
  items: readonly NormalizedEvent[];
  days: readonly string[];
  label: string;
  locale?: string;
  onEventClick?: (event: AgendaEvent) => void;
}) {
  const layout = layoutWeek(items, days, { wholeDay: true });
  const ref = useVars<HTMLDivElement>({ "--agenda-lanes": Math.max(layout.lanes, 1) });
  if (layout.segments.length === 0) return null;
  return (
    <div ref={ref} data-slot="agenda-allday">
      <span data-slot="agenda-allday-label">{label}</span>
      <div data-slot="agenda-allday-events">
        <WeekEvents
          layout={layout}
          kindOf={() => "bar"}
          rowOffset={1}
          locale={locale}
          onEventClick={onEventClick}
        />
      </div>
    </div>
  );
}

function MonthWeek({
  days,
  month,
  today,
  items,
  maxEvents,
  labels,
  locale,
  onEventClick,
  onSlotClick,
  onDayClick,
  onMoreClick,
}: {
  days: readonly string[];
  month: string;
  today: string;
  items: readonly NormalizedEvent[];
  maxEvents: number;
  labels: Required<AgendaLabels>;
  locale?: string;
  onEventClick?: (event: AgendaEvent) => void;
  onSlotClick?: AgendaProps["onSlotClick"];
  onDayClick: (day: string) => void;
  onMoreClick: (day: string) => void;
}) {
  const layout = layoutWeek(items, days, { maxLanes: maxEvents });
  const ref = useVars<HTMLDivElement>({ "--agenda-lanes": Math.max(layout.lanes, 1) });
  return (
    <div ref={ref} data-slot="agenda-week">
      {days.map((day, i) => (
        <MonthDay
          key={day}
          day={day}
          col={i + 1}
          outside={monthOf(day) !== month}
          today={day === today}
          weekend={weekday(day) === 0 || weekday(day) === 6}
          locale={locale}
          onDayClick={onDayClick}
          onSlotClick={onSlotClick}
        />
      ))}
      <WeekEvents
        layout={layout}
        kindOf={(item) => (item.allDay || item.firstDay !== item.lastDay ? "bar" : "chip")}
        rowOffset={2}
        locale={locale}
        onEventClick={onEventClick}
      />
      {layout.hidden.map((count, i) =>
        count > 0 ? (
          <MoreButton
            key={days[i]}
            col={i + 1}
            row={layout.lanes + 2}
            label={labels.more(count)}
            onClick={() => onMoreClick(days[i])}
          />
        ) : null,
      )}
    </div>
  );
}

function MonthDay({
  day,
  col,
  outside,
  today,
  weekend,
  locale,
  onDayClick,
  onSlotClick,
}: {
  day: string;
  col: number;
  outside: boolean;
  today: boolean;
  weekend: boolean;
  locale?: string;
  onDayClick: (day: string) => void;
  onSlotClick?: AgendaProps["onSlotClick"];
}) {
  const ref = useVars<HTMLDivElement>({ "--seg-col": col });
  return (
    // Click on a cell's empty space is a shortcut for mouse / touch; keyboard users use the date buttons and the app's own "New" entry point
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      ref={ref}
      data-slot="agenda-day"
      data-date={day}
      data-outside={outside ? "" : undefined}
      data-today={today ? "" : undefined}
      data-weekend={weekend ? "" : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSlotClick?.({ date: day });
      }}
    >
      <button
        type="button"
        data-slot="agenda-day-number"
        aria-label={formatDate(day, locale, "full")}
        aria-current={today ? "date" : undefined}
        onClick={() => onDayClick(day)}
      >
        {Number(day.slice(8))}
      </button>
    </div>
  );
}

function MoreButton({
  col,
  row,
  label,
  onClick,
}: {
  col: number;
  row: number;
  label: string;
  onClick: () => void;
}) {
  const ref = useVars<HTMLButtonElement>({ "--seg-col": col, "--seg-span": 1, "--seg-row": row });
  return (
    <button ref={ref} type="button" data-slot="agenda-more" onClick={onClick}>
      {label}
    </button>
  );
}
