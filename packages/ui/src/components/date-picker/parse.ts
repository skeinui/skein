import { daysInMonth, toISO, weekStartOf } from "../calendar/dates.ts";
import { periodEnd, periodKey, periodStart } from "../calendar/periods.ts";
import type { PeriodUnit } from "../calendar/periods.ts";
import { formatTime, parseTime } from "../time-picker/time.ts";

/**
 * Fixed formats used to convert between text and value in typeable mode (not affected by locale, so typing is unambiguous):
 *   date "YYYY-MM-DD", month "YYYY-MM", quarter "YYYY-Qn", year "YYYY",
 *   week is shown as the two dates "Monday – Sunday" and typing any day in it is enough, ranges join both ends with " – ", and with time append "HH:mm[:ss]" after the date.
 */

/** Strict calendar date: nonexistent days like "2026-02-30" return null. "/" and "." are also accepted as separators. */
export function parseDateText(text: string): string | null {
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text.trim());
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m) ? toISO(y, m, d) : null;
}

/** Period: "2026-03" / "2026-Q2" ("2026Q2" and lowercase are also accepted) / "2026". Out of range (month 13, Q5) returns null. */
export function parsePeriodText(unit: PeriodUnit, text: string): string | null {
  const s = text.trim();
  if (unit === "year") return /^\d{4}$/.test(s) ? periodKey(unit, Number(s), 0) : null;
  if (unit === "month") {
    const match = /^(\d{4})[-/.](\d{1,2})$/.exec(s);
    const month = Number(match?.[2]);
    return match && month >= 1 && month <= 12 ? periodKey(unit, Number(match[1]), month - 1) : null;
  }
  const match = /^(\d{4})[-/. ]?[Qq]([1-4])$/.exec(s);
  return match ? periodKey(unit, Number(match[1]), Number(match[2]) - 1) : null;
}

/** Separators between range ends: " – " " — " " ~ " " - " (spaces required on both sides, to avoid confusion with - in dates) and " to ". */
export function splitRange(text: string): [string, string] | null {
  const parts = text.trim().split(/\s*[–—~]\s*|\s+-\s+|\s+to\s+/i);
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : null;
}

/** Date plus time: "YYYY-MM-DD HH:mm[:ss]" (T separator also accepted); when only a date is written, the caller fills in the time. */
export function parseDateTimeText(text: string): { date: string; time: string | null } | null {
  const match = /^(\S+?)(?:[\sT]+(\d{1,2}:\d{2}(?::\d{2})?))?$/.exec(text.trim());
  if (!match) return null;
  const date = parseDateText(match[1] ?? "");
  if (!date) return null;
  if (match[2] === undefined) return { date, time: null };
  const parsed = parseTime(match[2]);
  return parsed ? { date, time: formatTime(parsed, match[2].split(":").length === 3) } : null;
}

/** Week: the week containing the first date in the text, and the value is the first day of that week. */
export function parseWeekText(text: string, weekStartsOn: number): string | null {
  const first = /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.exec(text)?.[0];
  const date = first ? parseDateText(first) : null;
  return date ? weekStartOf(date, weekStartsOn) : null;
}

/** Whether the period lies entirely outside min / max. */
export const periodOutOfRange = (unit: PeriodUnit, key: string, min?: string, max?: string) =>
  (min !== undefined && periodEnd(unit, key) < min) ||
  (max !== undefined && periodStart(unit, key) > max);
