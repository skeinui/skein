import { isGroup, str } from "./types";
import type { Condition, Filter, ListQuery, ListResult } from "./types";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const blank = (v: unknown) => v === undefined || v === null || v === "";
const text = (v: unknown) => str(v).toLowerCase();

/** Numbers compare as numbers (also "100" against 100), everything else (ISO dates, words) as text. */
function compare(a: unknown, b: unknown) {
  // A day against a moment of that day ("2026-02-01" and "2026-02-01T09:00:00Z") is compared by the day
  if (typeof a === "string" && typeof b === "string" && DAY.test(a) !== DAY.test(b))
    return a.slice(0, 10).localeCompare(b.slice(0, 10));
  const x =
    typeof a === "number"
      ? a
      : a !== "" && a !== null && !Number.isNaN(Number(a))
        ? Number(a)
        : NaN;
  const y =
    typeof b === "number"
      ? b
      : b !== "" && b !== null && !Number.isNaN(Number(b))
        ? Number(b)
        : NaN;
  if (!Number.isNaN(x) && !Number.isNaN(y)) return x - y;
  return str(a).localeCompare(str(b));
}

/** For a day against a moment (either way round): whether they are the same day; undefined for anything else. */
const sameDay = (a: unknown, b: unknown) =>
  typeof a === "string" && typeof b === "string" && DAY.test(a) !== DAY.test(b)
    ? a.slice(0, 10) === b.slice(0, 10)
    : undefined;

function matches(value: unknown, { op, value: want }: Condition) {
  switch (op) {
    case "eq":
      return sameDay(value, want) ?? text(value) === text(want);
    case "ne":
      return !(sameDay(value, want) ?? text(value) === text(want));
    case "contains":
      return text(value).includes(text(want));
    case "startsWith":
      return text(value).startsWith(text(want));
    case "endsWith":
      return text(value).endsWith(text(want));
    case "in":
      return Array.isArray(want) && want.some((w) => text(w) === text(value));
    case "gt":
      return !blank(value) && compare(value, want) > 0;
    case "gte":
      return !blank(value) && compare(value, want) >= 0;
    case "lt":
      return !blank(value) && compare(value, want) < 0;
    case "lte":
      return !blank(value) && compare(value, want) <= 0;
    case "between": {
      const [from, to] = Array.isArray(want) ? want : [];
      return (
        !blank(value) &&
        (blank(from) || compare(value, from) >= 0) &&
        (blank(to) || compare(value, to) <= 0)
      );
    }
    case "blank":
      return blank(value);
    case "notBlank":
      return !blank(value);
  }
}

function test<T>(row: T, filter: Filter): boolean {
  if (!isGroup(filter)) return matches((row as Record<string, unknown>)[filter.field], filter);
  if (filter.items.length === 0) return true;
  return filter.logic === "and"
    ? filter.items.every((f) => test(row, f))
    : filter.items.some((f) => test(row, f));
}

/**
 * Runs a `ListQuery` over rows in memory: what a mock backend (and a test) does with the contract.
 * `keywordFields`: the fields the full-text `keyword` looks at.
 */
export function applyListQuery<T>(
  rows: readonly T[],
  query: ListQuery,
  { keywordFields = [] as string[] } = {},
): ListResult<T> {
  const keyword = query.keyword?.trim().toLowerCase();
  let matched = rows.filter(
    (row) =>
      (!query.filter || test(row, query.filter)) &&
      (!keyword ||
        keywordFields.some((f) => text((row as Record<string, unknown>)[f]).includes(keyword))),
  );
  if (query.sort?.length) {
    const sorts = query.sort;
    matched = [...matched].sort((a, b) => {
      for (const { field, order } of sorts) {
        const r = compare(
          (a as Record<string, unknown>)[field] ?? "",
          (b as Record<string, unknown>)[field] ?? "",
        );
        if (r !== 0) return order === "desc" ? -r : r;
      }
      return 0;
    });
  }
  const start = (query.page - 1) * query.pageSize;
  return { items: matched.slice(start, start + query.pageSize), total: matched.length };
}
