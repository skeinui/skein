import { useEffect, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { useConfig } from "../config-provider/index.ts";

type Without<T> = Omit<T, "className" | "style" | "children" | "dateTime">;

type TimeInput = Date | string | number;

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

/**
 * "5 minutes ago", "in 2 hours", "yesterday": the time between `value` and `now`, in the largest unit that fits (seconds under 45 s, minutes under an hour,
 * hours under a day, days under 30 days, then months and years), in the language of `locale` (a BCP 47 tag; the browser's when omitted).
 */
export function formatRelativeTime(
  value: TimeInput,
  options: { now?: TimeInput; numeric?: "auto" | "always"; locale?: string } = {},
): string {
  const { now = Date.now(), numeric = "auto", locale } = options;
  const seconds = (new Date(value).getTime() - new Date(now).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric });
  const abs = Math.abs(seconds);
  if (Number.isNaN(seconds)) return "";
  if (abs < 45) return rtf.format(Math.round(seconds), "second");
  if (abs < HOUR) return rtf.format(Math.round(seconds / MINUTE), "minute");
  if (abs < DAY) return rtf.format(Math.round(seconds / HOUR), "hour");
  const days = seconds / DAY;
  if (Math.abs(days) < 30) return rtf.format(Math.round(days), "day");
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30.44), "month");
  return rtf.format(Math.round(days / 365), "year");
}

export interface RelativeTimeProps extends Without<ComponentPropsWithoutRef<"time">> {
  /** The moment: a `Date`, an ISO string or a timestamp in milliseconds. */
  value: TimeInput;
  /**
   * `auto` says "yesterday" and "now", `always` says "1 day ago" and "0 seconds ago".
   * @default "auto"
   */
  numeric?: "auto" | "always";
  /** BCP 47 tag of the language (e.g. "zh-CN"); defaults to the `locale` of ConfigProvider, then the browser's. */
  locale?: string;
  /** The moment to count from, instead of the clock: for a fixed picture or a test. */
  now?: TimeInput;
  /**
   * Count again every this many seconds, so "5 minutes ago" does not go stale on a page that stays open; 0 does not.
   * @default 0
   */
  refresh?: number;
}

/**
 * Relative time: "5 minutes ago" for a moment, as a `<time>` element with the exact moment in its `dateTime` and, on hover, the full date.
 * `value` is the moment, `numeric` chooses between "yesterday" and "1 day ago", `refresh` keeps it current; `formatRelativeTime` gives the same text as a string.
 * For a date that is not relative use Intl.DateTimeFormat or a DatePicker's format.
 */
export function RelativeTime({
  value,
  numeric = "auto",
  locale: localeProp,
  now,
  refresh = 0,
  title,
  ...rest
}: RelativeTimeProps) {
  const config = useConfig();
  const locale = localeProp ?? config.locale;
  const [, tick] = useState(0);
  useEffect(() => {
    if (!refresh || now !== undefined) return;
    const id = setInterval(() => tick((n) => n + 1), refresh * 1000);
    return () => clearInterval(id);
  }, [refresh, now]);
  const date = new Date(value);
  const valid = !Number.isNaN(date.getTime());
  return (
    <time
      {...rest}
      dateTime={valid ? date.toISOString() : undefined}
      title={title ?? (valid ? date.toLocaleString(locale) : undefined)}
      // The text depends on the clock: the server's and the browser's differ
      suppressHydrationWarning
    >
      {formatRelativeTime(value, { now, numeric, locale })}
    </time>
  );
}
