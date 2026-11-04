import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { UIColor, UISize } from "../../contract.ts";
import { useConfig } from "../config-provider/context.ts";
import { todayISO } from "./dates.ts";
import type { CalendarRange } from "./calendar.tsx";
import {
  formatMonthShort,
  formatPeriod,
  pageKeys,
  pageOf,
  parsePeriod,
  periodEnd,
  periodOf,
  periodStart,
  shiftPeriod,
} from "./periods.ts";
import type { PeriodUnit } from "./periods.ts";
import { useLabels } from "../../locales/use-labels.ts";

interface PeriodBaseProps {
  /** What to select by: month "YYYY-MM", quarter "YYYY-Qn", year "YYYY". */
  unit: PeriodUnit;
  /** Earliest / latest selectable date, "YYYY-MM-DD": a period is disabled only if it falls entirely outside the range. */
  min?: string;
  /** Latest selectable date, "YYYY-MM-DD" (see `min`). */
  max?: string;
  /** Extra disabling rule; the argument is the period's value. */
  isPeriodDisabled?: (key: string) => boolean;
  /** BCP 47 locale for month names and labels (e.g. "zh-CN"); defaults to ConfigProvider's locale. */
  locale?: string;
  size?: UISize;
  color?: UIColor;
}

export interface PeriodCalendarSingleProps extends PeriodBaseProps {
  mode?: "single";
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

export interface PeriodCalendarRangeProps extends PeriodBaseProps {
  mode: "range";
  value?: CalendarRange;
  defaultValue?: CalendarRange;
  onValueChange?: (value: CalendarRange) => void;
}

export type PeriodCalendarProps = PeriodCalendarSingleProps | PeriodCalendarRangeProps;

const EMPTY_RANGE: CalendarRange = { start: null, end: null };
const COLUMNS: Record<PeriodUnit, number> = { month: 3, quarter: 4, year: 3 };

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

const pageTitle = (unit: PeriodUnit, page: number) =>
  unit === "year" ? `${page} – ${page + 9}` : String(page);
/**
 * Panel for selecting by month / quarter / year: same shell as Calendar (header / title / nav), with a grid of one cell per period inside.
 * Keyboard: arrow keys move (up / down one row), PageUp / PageDown turn pages, Home / End go to the start / end of the row. Range selection is two clicks, same as Calendar.
 */
export function PeriodCalendar(props: PeriodCalendarProps) {
  const t = useLabels("calendar");
  const {
    unit,
    min,
    max,
    isPeriodDisabled,
    locale: localeProp,
    size = "md",
    color = "primary",
  } = props;
  const config = useConfig();
  const locale = localeProp ?? config.locale;
  const mode = props.mode ?? "single";
  const today = periodOf(unit, todayISO());

  const [innerValue, setInnerValue] = useState<string | null | CalendarRange>(
    (props.defaultValue as string | null | CalendarRange | undefined) ??
      (mode === "range" ? EMPTY_RANGE : null),
  );
  const value = (props.value !== undefined ? props.value : innerValue) as
    | string
    | null
    | CalendarRange;
  const range: CalendarRange =
    mode === "range" ? ((value as CalendarRange | null) ?? EMPTY_RANGE) : EMPTY_RANGE;
  const single = mode === "single" ? (value as string | null) : null;

  const anchor = single ?? range.start ?? today;
  const [page, setPage] = useState(() => pageOf(unit, anchor));
  const [focusKey, setFocusKey] = useState(anchor);
  const shouldFocus = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = COLUMNS[unit];

  const disabled = (key: string) =>
    (min !== undefined && periodEnd(unit, key) < min) ||
    (max !== undefined && periodStart(unit, key) > max) ||
    (isPeriodDisabled?.(key) ?? false);

  const select = (key: string) => {
    if (disabled(key)) return;
    if (mode === "range") {
      const next: CalendarRange =
        !range.start || range.end || key < range.start
          ? { start: key, end: null }
          : { start: range.start, end: key };
      if (props.value === undefined) setInnerValue(next);
      (props.onValueChange as ((v: CalendarRange) => void) | undefined)?.(next);
    } else {
      if (props.value === undefined) setInnerValue(key);
      (props.onValueChange as ((v: string | null) => void) | undefined)?.(key);
    }
  };

  const moveFocus = (key: string) => {
    setFocusKey(key);
    const p = pageOf(unit, key);
    if (p !== page) setPage(p);
    shouldFocus.current = true;
  };
  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-period="${focusKey}"]`)?.focus();
  });

  const pageSize = unit === "year" ? 10 : unit === "month" ? 12 : 4;
  const onKeyDown = (e: KeyboardEvent) => {
    const step = (n: number) => shiftPeriod(unit, focusKey, n);
    const { index, year } = parsePeriod(unit, focusKey);
    const rowStart = unit === "year" ? ((year % 10) + 9) % 3 : index % cols;
    const map: Record<string, string> = {
      ArrowLeft: step(-1),
      ArrowRight: step(1),
      ArrowUp: step(-cols),
      ArrowDown: step(cols),
      Home: step(-rowStart),
      End: step(cols - 1 - rowStart),
      PageUp: step(-pageSize),
      PageDown: step(pageSize),
    };
    const next = map[e.key];
    if (next) {
      e.preventDefault();
      moveFocus(next);
    }
  };

  const items = pageKeys(unit, page);
  const first = items[0]!.key;
  const last = items[items.length - 1]!.key;
  const canPrev = min === undefined || periodEnd(unit, shiftPeriod(unit, first, -1)) >= min;
  const canNext = max === undefined || periodStart(unit, shiftPeriod(unit, last, 1)) <= max;
  const step = unit === "year" ? 10 : 1;
  // When the focused period is not on the current page, move the focusable position to the first (non-filler) period on the current page
  const tabbable = items.some((i) => i.key === focusKey && !i.outside)
    ? focusKey
    : (items.find((i) => !i.outside)?.key ?? first);

  const rows: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));

  return (
    <div data-slot="calendar" data-size={size} data-color={color} data-mode={mode} data-unit={unit}>
      <div data-slot="calendar-header">
        <button
          type="button"
          data-slot="calendar-nav-button"
          data-direction="prev"
          aria-label={unit === "year" ? t.previousDecade : t.previousYear}
          disabled={!canPrev}
          onClick={() => setPage(page - step)}
        >
          <Chevron d="m15 18-6-6 6-6" />
        </button>
        <div data-slot="calendar-title" aria-live="polite">
          {pageTitle(unit, page)}
        </div>
        <button
          type="button"
          data-slot="calendar-nav-button"
          data-direction="next"
          aria-label={unit === "year" ? t.nextDecade : t.nextYear}
          disabled={!canNext}
          onClick={() => setPage(page + step)}
        >
          <Chevron d="m9 18 6-6-6-6" />
        </button>
      </div>
      <div
        ref={gridRef}
        role="grid"
        data-slot="calendar-periods"
        aria-label={pageTitle(unit, page)}
        onKeyDown={onKeyDown}
      >
        {rows.map((row) => (
          <div key={row[0]!.key} role="row" data-slot="calendar-period-row">
            {row.map(({ key, outside }) => {
              const isDisabled = disabled(key);
              const selected =
                mode === "single" ? key === single : key === range.start || key === range.end;
              const inRange =
                mode === "range" &&
                !!range.start &&
                !!range.end &&
                key > range.start &&
                key < range.end;
              const { index } = parsePeriod(unit, key);
              return (
                <div
                  key={key}
                  role="gridcell"
                  data-slot="calendar-cell"
                  aria-selected={selected || inRange || undefined}
                  data-range-middle={inRange ? "" : undefined}
                  data-range-start={mode === "range" && key === range.start ? "" : undefined}
                  data-range-end={mode === "range" && key === range.end ? "" : undefined}
                >
                  <button
                    type="button"
                    data-slot="calendar-period"
                    data-period={key}
                    data-selected={selected ? "" : undefined}
                    data-today={key === today ? "" : undefined}
                    data-outside={outside ? "" : undefined}
                    data-disabled={isDisabled ? "" : undefined}
                    disabled={isDisabled}
                    tabIndex={key === tabbable ? 0 : -1}
                    aria-label={formatPeriod(unit, key, locale)}
                    aria-current={key === today ? "date" : undefined}
                    onClick={() => {
                      setFocusKey(key);
                      select(key);
                      if (outside) setPage(pageOf(unit, key));
                    }}
                    onFocus={() => setFocusKey(key)}
                  >
                    {unit === "month"
                      ? formatMonthShort(index, locale)
                      : unit === "quarter"
                        ? `Q${index + 1}`
                        : parsePeriod(unit, key).year}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
