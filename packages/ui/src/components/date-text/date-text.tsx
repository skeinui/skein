import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useConfig } from "../config-provider/index.ts";

type Without<T> = Omit<T, "className" | "style" | "children" | "dateTime">;
type DateInput = Date | string | number;
type DateStyle = "full" | "long" | "medium" | "short";

export interface DateFormatOptions {
  /** @default "medium" */
  dateStyle?: DateStyle;
  /** None by default: a date only. */
  timeStyle?: DateStyle;
  /**
   * Only the day of the week ("Sun", "Sunday", "S"): `dateStyle` and `timeStyle` are not used with it.
   * For a column of days (a week's opening hours) rather than a moment.
   */
  weekday?: "long" | "short" | "narrow";
  /** BCP 47 tag of the language (e.g. "zh-CN"); the browser's when omitted. */
  locale?: string;
  /** IANA name of the time zone ("Asia/Shanghai"); the browser's when omitted. */
  timeZone?: string;
}

/** A date or a moment as text in the language of `locale` ("Nov 10, 2026", "2026年11月10日 18:37"); an empty or invalid value is `undefined`. */
export function formatDateText(
  value: DateInput | null | undefined,
  { dateStyle, timeStyle, weekday, locale, timeZone }: DateFormatOptions = {},
): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  // Intl does not take a weekday together with a date style
  if (weekday) return new Intl.DateTimeFormat(locale, { weekday, timeZone }).format(date);
  return new Intl.DateTimeFormat(locale, {
    // A time alone is not asked for: with neither style given it is the date
    dateStyle: dateStyle ?? (timeStyle ? undefined : "medium"),
    timeStyle,
    timeZone,
  }).format(date);
}

export interface DateTextProps
  extends Without<ComponentPropsWithoutRef<"time">>, DateFormatOptions {
  /** The date or moment: a `Date`, an ISO string or a timestamp in milliseconds. */
  value?: DateInput | null;
  /**
   * Shown when there is no value or it is not a date.
   * @default "—"
   */
  fallback?: ReactNode;
}

/**
 * Date text: a date or a moment as text in the language of the app, as a `<time>` element with the exact moment in its `dateTime`.
 * `dateStyle` and `timeStyle` pick how much is said ("Nov 10", "Nov 10, 2026, 6:37 PM"); the language is the `locale` of ConfigProvider.
 * With no value it shows `fallback` (a dash). For "5 minutes ago" use RelativeTime; for the text alone (a CSV cell) use `formatDateText`.
 */
export function DateText({
  value,
  dateStyle,
  timeStyle,
  weekday,
  locale: localeProp,
  timeZone,
  fallback = "—",
  ...rest
}: DateTextProps) {
  const config = useConfig();
  const locale = localeProp ?? config.locale;
  const text = formatDateText(value, { dateStyle, timeStyle, weekday, locale, timeZone });
  if (text === undefined) return <>{fallback}</>;
  return (
    <time {...rest} dateTime={new Date(value as DateInput).toISOString()}>
      {text}
    </time>
  );
}
