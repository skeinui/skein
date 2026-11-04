import { useRef, useState } from "react";
import type { FieldVariant, UISize } from "../../contract.ts";
import { Calendar, PeriodCalendar, formatDate, formatPeriod } from "../calendar/index.ts";
import type { CalendarRange, PeriodUnit } from "../calendar/index.ts";
import { useFieldDefaults } from "../field/context.ts";
import { Button } from "../button/index.ts";
import { Popover } from "../popover/index.ts";
import { TimePanel } from "../time-picker/index.ts";
import type { TimePanelProps } from "../time-picker/index.ts";
import { displayTime, parseTime } from "../time-picker/time.ts";
import { addDays, todayISO } from "../calendar/dates.ts";
import { useConfig } from "../config-provider/context.ts";
import {
  parseDateText,
  parseDateTimeText,
  parsePeriodText,
  parseWeekText,
  periodOutOfRange,
  splitRange,
} from "./parse.ts";
import { useLabels } from "../../locales/use-labels.ts";

/** What to pick by: date (default), week, month, quarter, year. */
export type DatePickerPicker = "date" | "week" | "month" | "quarter" | "year";

interface DatePickerBaseProps {
  placeholder?: string;
  variant?: FieldVariant;
  size?: UISize;
  /** @default false */
  fullWidth?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  /**
   * The trigger becomes an input where a date can be typed directly (fixed format, not affected by locale): day "YYYY-MM-DD", month "YYYY-MM", quarter "YYYY-Qn", year "YYYY",
   * for week write any day in it (the first day of that week is used), ranges join both ends with " – ", and with time append "HH:mm" after the date.
   * Validated and committed on Enter or blur; invalid text is marked invalid after Enter and restored after blur; the calendar icon button still opens the popup, and the Down key can open it too.
   * @default false
   */
  editable?: boolean;
  /** Earliest selectable date, "YYYY-MM-DD" (also limits weeks / months / quarters / years that lie entirely before it). */
  min?: string;
  /** Latest selectable date, "YYYY-MM-DD" (also limits periods that lie entirely after it). */
  max?: string;
  /** Extra rule for disabling single days (e.g. weekends); receives "YYYY-MM-DD". */
  isDateDisabled?: (date: string) => boolean;
  /** Disable rule when picker is month / quarter / year; the argument is the period value ("YYYY-MM" / "YYYY-Qn" / "YYYY"). */
  isPeriodDisabled?: (key: string) => boolean;
  /** Which weekday each week starts on, 0 = Sunday, 1 = Monday. Default 0. Also decides the value of a week pick. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** BCP 47 locale for month / weekday names and the displayed value (e.g. "zh-CN"); defaults to ConfigProvider's locale. */
  locale?: string;
  "aria-label"?: string;
}

/** Details of showTime: show seconds, 12-hour clock, step of each column. */
export type DatePickerTimeOptions = Pick<
  TimePanelProps,
  "seconds" | "hour12" | "hourStep" | "minuteStep" | "secondStep" | "labels"
> & {
  /** Text of the "OK" button at the bottom. */
  okLabel?: string;
};

export interface DatePickerSingleProps extends DatePickerBaseProps {
  /**
   * Pick one date, or a range (`{ start, end }`).
   * @default "single"
   */
  mode?: "single";
  /**
   * Granularity to pick. Value formats: date "YYYY-MM-DD"; week is "YYYY-MM-DD" of the first day of the week (the week start is decided by weekStartsOn);
   * month "YYYY-MM"; quarter "YYYY-Qn"; year "YYYY". showTime only works with date.
   * @default "date"
   */
  picker?: DatePickerPicker;
  /**
   * Date plus time: the popup gets a time panel next to the calendar, and the value becomes "YYYY-MM-DDTHH:mm" (with :ss when seconds are shown).
   * Picking a date / time does not close the popup; it closes on clicking "OK" or clicking outside. Only single selection supports it (range selection does not support time yet).
   */
  showTime?: boolean | DatePickerTimeOptions;
  /** Value: "YYYY-MM-DD" without time, "YYYY-MM-DDTHH:mm[:ss]" with time. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

export interface DatePickerRangeProps extends DatePickerBaseProps {
  /** Pick one date, or a range (`{ start, end }`). */
  mode: "range";
  /** Range selection supports date / month / quarter / year (no week ranges). */
  picker?: Exclude<DatePickerPicker, "week">;
  value?: CalendarRange;
  defaultValue?: CalendarRange;
  onValueChange?: (value: CalendarRange) => void;
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;

/** When typing is allowed, the placeholder for no value gives the format directly. */
const EDIT_PLACEHOLDERS: Record<DatePickerPicker, string> = {
  date: "YYYY-MM-DD",
  week: "YYYY-MM-DD",
  month: "YYYY-MM",
  quarter: "YYYY-Qn",
  year: "YYYY",
};

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
  </svg>
);

/**
 * Form field that opens a calendar popup to pick a date, a week / month / quarter / year (`picker`), a date with time (`showTime`) or a range (`mode="range"`).
 * Values are strings: "YYYY-MM-DD" (or "YYYY-MM", "YYYY-Qn", "YYYY", "YYYY-MM-DDTHH:mm"); a range is `{ start, end }`. Use `value` / `onValueChange`,
 * limit choices with `min` / `max` / `isDateDisabled`, and set `editable` to let users type the date. Single selection closes once a date is picked,
 * range selection after the end date is picked (with `showTime`, on "OK" or clicking outside).
 * For an always-visible calendar use Calendar; for a time of day only use TimePicker.
 *
 * Theme style: the trigger reuses Select's look (slot is select-trigger), the popup reuses Popover with a Calendar inside.
 */
export function DatePicker(props: DatePickerProps) {
  const {
    placeholder: placeholderProp,
    variant,
    size,
    fullWidth = false,
    invalid,
    disabled,
    editable = false,
    locale: localeProp,
    "aria-label": ariaLabel,
    ...calendar
  } = props;
  const config = useConfig();
  const locale = localeProp ?? config.locale;
  const mode = props.mode ?? "single";
  const picker: DatePickerPicker = props.picker ?? "date";
  const unit: PeriodUnit | null =
    picker === "month" || picker === "quarter" || picker === "year" ? picker : null;
  const showTimeProp =
    mode === "single" && picker === "date" ? (props as DatePickerSingleProps).showTime : undefined;
  const time: DatePickerTimeOptions | null = showTimeProp
    ? showTimeProp === true
      ? {}
      : showTimeProp
    : null;
  const dp = useLabels("datePicker");
  const placeholder =
    placeholderProp ??
    (editable
      ? mode === "range"
        ? `${EDIT_PLACEHOLDERS[picker]} – ${EDIT_PLACEHOLDERS[picker]}`
        : time
          ? `${EDIT_PLACEHOLDERS[picker]} HH:mm${time.seconds ? ":ss" : ""}`
          : EDIT_PLACEHOLDERS[picker]
      : dp.placeholders[picker]);
  const { okLabel, ...panelOptions } = time ?? {};
  const timeLabels = useLabels("timePicker");
  const seconds = !!time?.seconds;
  const field = useFieldDefaults();
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<string | null | CalendarRange>(
    (props.defaultValue as string | null | CalendarRange | undefined) ??
      (mode === "range" ? { start: null, end: null } : null),
  );
  const value = (props.value !== undefined ? props.value : inner) as string | null | CalendarRange;

  const fmt = (v: string) => (unit ? formatPeriod(unit, v, locale) : formatDate(v, locale));
  const text = (() => {
    if (mode === "range") {
      const r = value as CalendarRange;
      if (!r?.start) return null;
      return `${fmt(r.start)} – ${r.end ? fmt(r.end) : "…"}`;
    }
    if (!value) return null;
    if (unit) return fmt(value as string);
    if (picker === "week") {
      return `${formatDate(value as string, locale)} – ${formatDate(addDays(value as string, 6), locale)}`;
    }
    const [datePart = "", timePart] = (value as string).split("T");
    const parsed = time ? parseTime(timePart) : null;
    return parsed
      ? `${formatDate(datePart, locale)} ${displayTime(parsed, seconds, !!time?.hour12)}`
      : formatDate(datePart, locale);
  })();

  const [datePart, timePart] = typeof value === "string" ? (value as string).split("T") : [];
  /** Value of a datetime: if no time was picked, use 00:00 (00:00:00 when seconds are shown). */
  const compose = (date: string, clock: string | undefined) =>
    `${date}T${clock ?? (seconds ? "00:00:00" : "00:00")}`;

  const change = (next: string | null | CalendarRange) => {
    if (props.value === undefined) setInner(next);
    (props.onValueChange as ((v: unknown) => void) | undefined)?.(next);
    if (time) return; // with time, it closes on OK or a click outside
    if (mode === "single" || (next as CalendarRange).end) setOpen(false);
  };

  const {
    mode: _mode,
    value: _value,
    defaultValue: _dv,
    onValueChange: _ovc,
    showTime: _showTime,
    picker: _picker,
    isPeriodDisabled,
    ...calendarRest
  } = calendar as Record<string, unknown>;
  void _mode;
  void _value;
  void _dv;
  void _ovc;
  void _showTime;
  void _picker;

  // ---- Typeable: text ⇄ value ----
  const wrapRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const { min, max, isDateDisabled, weekStartsOn } = calendarRest as {
    min?: string;
    max?: string;
    isDateDisabled?: (date: string) => boolean;
    weekStartsOn?: number;
  };
  const dayOk = (d: string) =>
    !(min !== undefined && d < min) && !(max !== undefined && d > max) && !isDateDisabled?.(d);
  const periodOk = (u: PeriodUnit, key: string) =>
    !periodOutOfRange(u, key, min, max) &&
    !(isPeriodDisabled as ((k: string) => boolean) | undefined)?.(key);

  /** Input text for the value (fixed format). */
  const editText = (() => {
    const one = (v: string | null | undefined) => v ?? "";
    if (mode === "range") {
      const r = value as CalendarRange;
      return r?.start ? `${r.start} – ${one(r.end)}` : "";
    }
    if (!value) return "";
    if (unit) return value as string;
    if (picker === "week") return `${value as string} – ${addDays(value as string, 6)}`;
    return time && timePart ? `${datePart} ${timePart}` : (datePart ?? "");
  })();

  /** Text → value; undefined means invalid. Empty text clears. */
  const parseText = (raw: string): string | null | CalendarRange | undefined => {
    const text = raw.trim();
    if (mode === "range") {
      if (!text) return { start: null, end: null };
      const ends = splitRange(text);
      if (!ends) return undefined;
      const [a, b] = unit
        ? ends.map((e) => parsePeriodText(unit, e))
        : ends.map((e) => parseDateText(e));
      if (!a || !b || b < a) return undefined;
      const ok = unit ? periodOk(unit, a) && periodOk(unit, b) : dayOk(a) && dayOk(b);
      return ok ? { start: a, end: b } : undefined;
    }
    if (!text) return null;
    if (unit) {
      const key = parsePeriodText(unit, text);
      return key && periodOk(unit, key) ? key : undefined;
    }
    if (picker === "week") {
      const start = parseWeekText(text, weekStartsOn ?? 0);
      return start && Array.from({ length: 7 }, (_, i) => addDays(start, i)).some(dayOk)
        ? start
        : undefined;
    }
    if (time) {
      const parsed = parseDateTimeText(text);
      return parsed && dayOk(parsed.date)
        ? compose(parsed.date, parsed.time ?? timePart)
        : undefined;
    }
    const date = parseDateText(text);
    return date && dayOk(date) ? date : undefined;
  };

  const commitDraft = (fromEnter: boolean) => {
    if (draft === null) {
      if (fromEnter) setOpen(false);
      return;
    }
    const next = parseText(draft);
    if (next === undefined) {
      if (fromEnter) {
        setBad(true);
      } else {
        setDraft(null);
        setBad(false);
      }
      return;
    }
    setDraft(null);
    setBad(false);
    if (JSON.stringify(next) !== JSON.stringify(value)) change(next);
    if (fromEnter) setOpen(false);
  };
  const isInvalid = invalid || bad;
  const variantValue = variant ?? field?.variant ?? "outline";
  const sizeValue = size ?? field?.size ?? "md";
  const calendarLabel = dp.choose[picker];

  const trigger = editable ? (
    <div
      ref={wrapRef}
      data-slot="select-trigger"
      data-editable=""
      data-variant={variantValue}
      data-size={sizeValue}
      data-full-width={fullWidth ? "" : undefined}
      data-popup-open={open ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      {...(isInvalid ? { "data-invalid": "" } : null)}
    >
      <input
        data-slot="date-input"
        type="text"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={isInvalid ? true : undefined}
        value={draft ?? editText}
        onChange={(e) => {
          setDraft(e.target.value);
          setBad(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft(true);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          } else if (e.key === "Escape" && draft !== null) {
            setDraft(null);
            setBad(false);
          }
        }}
        onBlur={() => commitDraft(false)}
      />
      <Popover.Trigger
        disabled={disabled}
        aria-label={calendarLabel}
        data-slot="select-icon"
        render={<button type="button" />}
      >
        <CalendarIcon />
      </Popover.Trigger>
    </div>
  ) : (
    <Popover.Trigger
      disabled={disabled}
      // The accessible name must include the visible text (WCAG 2.5.3 Label in Name), so the value goes first, followed by the name given by the caller
      aria-label={ariaLabel ? `${text ?? placeholder}, ${ariaLabel}` : undefined}
      {...(invalid ? { "data-invalid": "", "aria-invalid": true } : null)}
      data-slot="select-trigger"
      data-variant={variantValue}
      data-size={sizeValue}
      data-full-width={fullWidth ? "" : undefined}
      render={<button type="button" />}
    >
      <span data-slot="select-value" data-placeholder={text ? undefined : ""}>
        {text ?? placeholder}
      </span>
      <span data-slot="select-icon">
        <CalendarIcon />
      </span>
    </Popover.Trigger>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {trigger}
      <Popover.Content
        anchor={editable ? wrapRef : undefined}
        data-picker=""
        side="bottom"
        align="start"
        aria-label={ariaLabel ?? calendarLabel}
      >
        {unit ? (
          <PeriodCalendar
            unit={unit}
            min={(calendarRest as { min?: string }).min}
            max={(calendarRest as { max?: string }).max}
            isPeriodDisabled={isPeriodDisabled as ((key: string) => boolean) | undefined}
            locale={locale}
            {...(mode === "range"
              ? {
                  mode: "range" as const,
                  value: value as CalendarRange,
                  onValueChange: change as (v: CalendarRange) => void,
                }
              : {
                  value: value as string | null,
                  onValueChange: change as (v: string | null) => void,
                })}
          />
        ) : picker === "week" ? (
          <Calendar
            {...(calendarRest as object)}
            mode="week"
            locale={locale}
            value={value as string | null}
            onValueChange={change}
          />
        ) : mode === "range" ? (
          <Calendar
            {...(calendarRest as object)}
            mode="range"
            locale={locale}
            value={value as CalendarRange}
            onValueChange={change}
          />
        ) : time ? (
          <>
            <div data-slot="datetime">
              <Calendar
                {...(calendarRest as object)}
                locale={locale}
                value={datePart || null}
                onValueChange={(date) => change(date ? compose(date, timePart) : null)}
              />
              <div data-slot="datetime-time">
                <TimePanel
                  value={timePart ?? null}
                  onChange={(clock) => change(compose(datePart || todayISO(), clock))}
                  {...panelOptions}
                />
              </div>
            </div>
            <div data-slot="timepanel-footer">
              <span />
              <Button size="sm" color="primary" onClick={() => setOpen(false)}>
                {okLabel ?? timeLabels.ok}
              </Button>
            </div>
          </>
        ) : (
          <Calendar
            {...(calendarRest as object)}
            locale={locale}
            value={value as string | null}
            onValueChange={change}
          />
        )}
      </Popover.Content>
    </Popover>
  );
}
