import { daysInMonth, toISO } from "./dates.ts";

/**
 * The "period" used when selecting by month / quarter / year: the value is a serializable string, and lexicographic order is time order.
 *   month "YYYY-MM", quarter "YYYY-Qn", year "YYYY".
 */
export type PeriodUnit = "month" | "quarter" | "year";

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

export function parsePeriod(unit: PeriodUnit, key: string): { year: number; index: number } {
  if (unit === "year") return { year: Number(key), index: 0 };
  if (unit === "month") {
    const [y = 0, m = 1] = key.split("-").map(Number);
    return { year: y, index: m - 1 };
  }
  const [y = "0", q = "Q1"] = key.split("-");
  return { year: Number(y), index: Number(q.slice(1)) - 1 };
}

export function periodKey(unit: PeriodUnit, year: number, index: number): string {
  if (unit === "year") return pad(year, 4);
  if (unit === "month") return `${pad(year, 4)}-${pad(index + 1)}`;
  return `${pad(year, 4)}-Q${index + 1}`;
}

const MONTHS_PER: Record<PeriodUnit, number> = { month: 1, quarter: 3, year: 12 };

/** First / last day of a period ("YYYY-MM-DD"), for comparing with min / max. */
export function periodStart(unit: PeriodUnit, key: string): string {
  const { year, index } = parsePeriod(unit, key);
  return toISO(year, unit === "year" ? 1 : index * MONTHS_PER[unit] + 1, 1);
}
export function periodEnd(unit: PeriodUnit, key: string): string {
  const { year, index } = parsePeriod(unit, key);
  const lastMonth = unit === "year" ? 12 : (index + 1) * MONTHS_PER[unit];
  return toISO(year, lastMonth, daysInMonth(year, lastMonth));
}

/** Shifts forward / backward by n periods. */
export function shiftPeriod(unit: PeriodUnit, key: string, n: number): string {
  const { year, index } = parsePeriod(unit, key);
  if (unit === "year") return periodKey(unit, year + n, 0);
  const per = unit === "month" ? 12 : 4;
  const total = year * per + index + n;
  return periodKey(unit, Math.floor(total / per), ((total % per) + per) % per);
}

/** The period containing a date ("YYYY-MM-DD"). */
export function periodOf(unit: PeriodUnit, iso: string): string {
  const [y = 0, m = 1] = iso.split("-").map(Number);
  if (unit === "year") return periodKey(unit, y, 0);
  if (unit === "month") return periodKey(unit, y, m - 1);
  return periodKey(unit, y, Math.floor((m - 1) / 3));
}

/** The "page number" of each page's first period: months / quarters page by year, years page by decade. */
export const pageOf = (unit: PeriodUnit, key: string) => {
  const { year } = parsePeriod(unit, key);
  return unit === "year" ? Math.floor(year / 10) * 10 : year;
};

/** The periods in one page: 12 months, 4 quarters, 12 years (a decade plus one filler on each side, with fillers marked outside). */
export function pageKeys(unit: PeriodUnit, page: number): { key: string; outside: boolean }[] {
  if (unit === "month") {
    return Array.from({ length: 12 }, (_, i) => ({
      key: periodKey(unit, page, i),
      outside: false,
    }));
  }
  if (unit === "quarter") {
    return Array.from({ length: 4 }, (_, i) => ({ key: periodKey(unit, page, i), outside: false }));
  }
  return Array.from({ length: 12 }, (_, i) => ({
    key: periodKey(unit, page - 1 + i, 0),
    outside: i === 0 || i === 11,
  }));
}

export function formatPeriod(unit: PeriodUnit, key: string, locale?: string): string {
  const { year, index } = parsePeriod(unit, key);
  if (unit === "year") return String(year);
  if (unit === "quarter") return `${year} Q${index + 1}`;
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, index, 1)));
}

export function formatMonthShort(index: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2023, index, 1)),
  );
}
