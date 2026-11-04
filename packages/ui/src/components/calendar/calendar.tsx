import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { CalendarMode, UIColor, UISize } from "../../contract.ts";
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
} from "./dates.ts";
import { useConfig } from "../config-provider/context.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface CalendarRange {
  /** First day of the range, "YYYY-MM-DD"; null while nothing is picked. */
  start: string | null;
  /** Last day of the range (inclusive), "YYYY-MM-DD"; null while only the start is picked. */
  end: string | null;
}

interface CalendarBaseProps {
  /** Displayed month "YYYY-MM", controlled; when not passed it manages itself. */
  month?: string;
  defaultMonth?: string;
  onMonthChange?: (month: string) => void;
  /** Earliest selectable date, "YYYY-MM-DD"; earlier days are disabled. */
  min?: string;
  /** Latest selectable date, "YYYY-MM-DD"; later days are disabled. */
  max?: string;
  /** Extra disabling rule, e.g. weekends not selectable. */
  isDateDisabled?: (date: string) => boolean;
  /**
   * Which weekday each week starts on, 0 = Sunday, 1 = Monday.
   * @default 0
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Locale for month and weekday names, defaults to the browser's. */
  locale?: string;
  /**
   * Show the days of the previous / next month that fill the first and last weeks.
   * @default true
   */
  showOutsideDays?: boolean;
  size?: UISize;
  color?: UIColor;
}

export interface CalendarSingleProps extends CalendarBaseProps {
  /**
   * Selection mode: one day, a range (`{ start, end }`), or a whole week (the value is its first day).
   * @default "single"
   */
  mode?: "single";
  /** The value, controlled: dates are "YYYY-MM-DD" strings (a range is `{ start, end }`), serializable and free of time-zone issues. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

export interface CalendarRangeProps extends CalendarBaseProps {
  /**
   * Selection mode: one day, a range (`{ start, end }`), or a whole week (the value is its first day).
   * @default "single"
   */
  mode: "range";
  value?: CalendarRange;
  defaultValue?: CalendarRange;
  onValueChange?: (value: CalendarRange) => void;
}

/** Select by week: clicking any day selects that whole week, and the value is the date of the first day of the week (the week start is decided by weekStartsOn). */
export interface CalendarWeekProps extends CalendarBaseProps {
  /**
   * Selection mode: one day, a range (`{ start, end }`), or a whole week (the value is its first day).
   * @default "single"
   */
  mode: "week";
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (weekStart: string | null) => void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps | CalendarWeekProps;

const EMPTY_RANGE: CalendarRange = { start: null, end: null };

const Chevron = ({ d }: { d: string }) => (
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

/**
 * Calendar: single / range selection, with dates as "YYYY-MM-DD" strings. Keyboard: arrow keys move, Home / End go to the start / end of the row,
 * PageUp / PageDown switch month (with Shift, year). Month and weekday names use Intl, with no dependence on a date library.
 */
export function Calendar(props: CalendarProps) {
  const t = useLabels("calendar");
  const {
    month: monthProp,
    defaultMonth,
    onMonthChange,
    min,
    max,
    isDateDisabled,
    weekStartsOn = 0,
    locale: localeProp,
    showOutsideDays = true,
    size = "md",
    color = "primary",
  } = props;
  const config = useConfig();
  const locale = localeProp ?? config.locale;
  const mode: CalendarMode = props.mode ?? "single";
  const today = useMemo(() => todayISO(), []);

  // Value: a string for single selection, { start, end } for range
  const [innerValue, setInnerValue] = useState<string | null | CalendarRange>(
    (props.defaultValue as string | null | CalendarRange | undefined) ??
      (mode === "range" ? EMPTY_RANGE : null),
  );
  const value = (props.value !== undefined ? props.value : innerValue) as
    | string
    | null
    | CalendarRange;
  // In week mode the selected week is shown as a range (reusing the range selection style), so it is converted to a range
  const weekValue = mode === "week" ? (value as string | null) : null;
  const range: CalendarRange =
    mode === "range"
      ? ((value as CalendarRange | null) ?? EMPTY_RANGE)
      : weekValue
        ? {
            start: weekStartOf(weekValue, weekStartsOn),
            end: addDays(weekStartOf(weekValue, weekStartsOn), 6),
          }
        : EMPTY_RANGE;
  const single = mode === "single" ? (value as string | null) : null;
  const rangeLike = mode === "range" || mode === "week";

  const anchor = single ?? weekValue ?? range.start ?? today;
  const [innerMonth, setInnerMonth] = useState(defaultMonth ?? monthOf(anchor));
  const month = monthProp ?? innerMonth;
  const setMonth = (next: string) => {
    if (monthProp === undefined) setInnerMonth(next);
    onMonthChange?.(next);
  };

  const [focusDate, setFocusDate] = useState(() =>
    monthOf(anchor) === month ? anchor : `${month}-01`,
  );
  const shouldFocus = useRef(false);
  const gridRef = useRef<HTMLTableElement>(null);

  const disabled = (iso: string) =>
    (min !== undefined && iso < min) ||
    (max !== undefined && iso > max) ||
    (isDateDisabled?.(iso) ?? false);

  const select = (iso: string) => {
    if (disabled(iso)) return;
    if (mode === "range") {
      const next: CalendarRange =
        !range.start || range.end || iso < range.start
          ? { start: iso, end: null }
          : { start: range.start, end: iso };
      if (props.value === undefined) setInnerValue(next);
      (props.onValueChange as ((v: CalendarRange) => void) | undefined)?.(next);
    } else if (mode === "week") {
      const start = weekStartOf(iso, weekStartsOn);
      if (props.value === undefined) setInnerValue(start);
      (props.onValueChange as ((v: string | null) => void) | undefined)?.(start);
    } else {
      if (props.value === undefined) setInnerValue(iso);
      (props.onValueChange as ((v: string | null) => void) | undefined)?.(iso);
    }
  };

  const moveFocus = (iso: string) => {
    setFocusDate(iso);
    if (monthOf(iso) !== month) setMonth(monthOf(iso));
    shouldFocus.current = true;
  };

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${focusDate}"]`)?.focus();
  });

  const onKeyDown = (e: KeyboardEvent) => {
    const dayOffset = (weekday(focusDate) - weekStartsOn + 7) % 7;
    const map: Record<string, string> = {
      ArrowLeft: addDays(focusDate, -1),
      ArrowRight: addDays(focusDate, 1),
      ArrowUp: addDays(focusDate, -7),
      ArrowDown: addDays(focusDate, 7),
      Home: addDays(focusDate, -dayOffset),
      End: addDays(focusDate, 6 - dayOffset),
      PageUp: addMonths(focusDate, e.shiftKey ? -12 : -1),
      PageDown: addMonths(focusDate, e.shiftKey ? 12 : 1),
    };
    const next = map[e.key];
    if (next) {
      e.preventDefault();
      moveFocus(next);
    }
  };

  const grid = monthGrid(month, weekStartsOn);
  const weekdays = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);
  const canPrev = min === undefined || addDays(`${month}-01`, -1) >= min;
  const canNext = max === undefined || addMonths(`${month}-01`, 1) <= max;
  // If the keyboard-focused date is not in the current month, move the focusable position to the first day of the current month
  const tabbable = monthOf(focusDate) === month ? focusDate : `${month}-01`;

  return (
    <div data-slot="calendar" data-size={size} data-color={color} data-mode={mode}>
      <div data-slot="calendar-header">
        <button
          type="button"
          data-slot="calendar-nav-button"
          data-direction="prev"
          aria-label={t.previousMonth}
          disabled={!canPrev}
          onClick={() => setMonth(addMonths(`${month}-01`, -1).slice(0, 7))}
        >
          <Chevron d="m15 18-6-6 6-6" />
        </button>
        <div data-slot="calendar-title" aria-live="polite">
          {formatMonthTitle(month, locale)}
        </div>
        <button
          type="button"
          data-slot="calendar-nav-button"
          data-direction="next"
          aria-label={t.nextMonth}
          disabled={!canNext}
          onClick={() => setMonth(addMonths(`${month}-01`, 1).slice(0, 7))}
        >
          <Chevron d="m9 18 6-6-6-6" />
        </button>
      </div>
      <table
        ref={gridRef}
        data-slot="calendar-grid"
        role="grid"
        aria-label={formatMonthTitle(month, locale)}
        onKeyDown={onKeyDown}
      >
        <thead>
          <tr data-slot="calendar-week">
            {weekdays.map((d) => (
              <th key={d} data-slot="calendar-weekday" scope="col">
                {formatWeekday(d, locale)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((week) => (
            <tr key={week[0]} data-slot="calendar-week">
              {week.map((iso) => {
                const outside = monthOf(iso) !== month;
                const isDisabled = disabled(iso);
                const selected =
                  mode === "single" ? iso === single : iso === range.start || iso === range.end;
                const inRange =
                  rangeLike && !!range.start && !!range.end && iso > range.start && iso < range.end;
                return (
                  <td
                    key={iso}
                    data-slot="calendar-cell"
                    role="gridcell"
                    aria-selected={selected || inRange || undefined}
                    data-range-middle={inRange ? "" : undefined}
                    data-range-start={rangeLike && iso === range.start ? "" : undefined}
                    data-range-end={rangeLike && iso === range.end ? "" : undefined}
                    hidden={outside && !showOutsideDays ? true : undefined}
                  >
                    {outside && !showOutsideDays ? null : (
                      <button
                        type="button"
                        data-slot="calendar-day"
                        data-date={iso}
                        data-selected={selected ? "" : undefined}
                        data-today={iso === today ? "" : undefined}
                        data-outside={outside ? "" : undefined}
                        data-disabled={isDisabled ? "" : undefined}
                        disabled={isDisabled}
                        tabIndex={iso === tabbable ? 0 : -1}
                        aria-label={formatDate(iso, locale, "full")}
                        aria-current={iso === today ? "date" : undefined}
                        onClick={() => {
                          setFocusDate(iso);
                          select(iso);
                          if (outside) setMonth(monthOf(iso));
                        }}
                        onFocus={() => setFocusDate(iso)}
                      >
                        {Number(iso.slice(8))}
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
