/**
 * Dates are all represented as "YYYY-MM-DD" strings (serializable, and avoiding time zone issues), months as "YYYY-MM".
 * All calculations here are done on the UTC calendar, with no dependence on the local time zone.
 */
const pad = (n: number, len = 2) => String(n).padStart(len, "0");

export const toISO = (y: number, m: number, d: number) => `${pad(y, 4)}-${pad(m)}-${pad(d)}`;

export function parseISO(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

const toUTC = (iso: string) => {
  const [y, m, d] = parseISO(iso);
  return new Date(Date.UTC(y, m - 1, d));
};

const fromUTC = (date: Date) =>
  toISO(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

export const addDays = (iso: string, n: number) => {
  const date = toUTC(iso);
  date.setUTCDate(date.getUTCDate() + n);
  return fromUTC(date);
};

/** Adds / subtracts months; when the day of month exceeds the target month's days, the end of the month is used. */
export function addMonths(iso: string, n: number) {
  const [y, m, d] = parseISO(iso);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return toISO(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** 0 = Sunday. */
export const weekday = (iso: string) => toUTC(iso).getUTCDay();

export const monthOf = (iso: string) => iso.slice(0, 7);

/** Local today. */
export function todayISO() {
  const now = new Date();
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** The 6 rows × 7 columns of dates of a month, including filler days from adjacent months. */
export function monthGrid(month: string, weekStartsOn: number): string[][] {
  const first = `${month}-01`;
  const offset = (weekday(first) - weekStartsOn + 7) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
  );
}

export function formatMonthTitle(month: string, locale?: string) {
  const [y, m] = parseISO(`${month}-01`);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function formatWeekday(index: number, locale?: string) {
  // 2023-01-01 is a Sunday
  return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2023, 0, 1 + index)),
  );
}

export function formatDate(
  iso: string,
  locale?: string,
  dateStyle: "full" | "long" | "medium" | "short" = "medium",
) {
  return new Intl.DateTimeFormat(locale, { dateStyle, timeZone: "UTC" }).format(toUTC(iso));
}

/** The first day of the week containing the date (the week start day is decided by weekStartsOn). */
export function weekStartOf(iso: string, weekStartsOn = 0) {
  return addDays(iso, -((weekday(iso) - weekStartsOn + 7) % 7));
}
