/**
 * The list query contract: what a list page asks for, independent of any backend. A page (and the search
 * component) only builds a `ListQuery`; a `QueryAdapter` turns it into what one backend understands.
 */
export const OPS = [
  "eq",
  "ne",
  "contains",
  "startsWith",
  "endsWith",
  "in",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "blank",
  "notBlank",
] as const;
export type Op = (typeof OPS)[number];

/** `value` is a string / number / boolean; an array for `in`; `[from, to]` for `between`; none for `blank` and `notBlank`. */
/** A value as text: a string, number, boolean or bigint as itself, an object as JSON (never "[object Object]"), anything else (nothing, a function) as "". */
export const str = (value: unknown) =>
  typeof value === "string"
    ? value
    : typeof value === "number" || typeof value === "boolean" || typeof value === "bigint"
      ? String(value)
      : typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : "";

export interface Condition {
  field: string;
  op: Op;
  value?: unknown;
}

export interface Group {
  logic: "and" | "or";
  items: Filter[];
}

export type Filter = Condition | Group;

export interface Sort {
  field: string;
  order: "asc" | "desc";
}

export interface ListQuery {
  page: number;
  pageSize: number;
  sort?: Sort[];
  filter?: Filter;
  /** Full-text search: which fields it looks at is the server's business. */
  keyword?: string;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}

/** What a backend can do; the search component hides what it can't, an adapter refuses what it can't translate. */
export interface Capabilities {
  ops: readonly Op[];
  /** `or` groups. */
  or: boolean;
  /** Groups inside groups. */
  nested: boolean;
  multiSort: boolean;
  keyword: boolean;
  /** A field can be in the filter once (the backend has one parameter for it). */
  uniqueFields?: boolean;
}

/** The request one backend takes: `params` go to the query string, `body` is JSON. */
export interface RequestParts {
  params?: Record<string, string>;
  body?: unknown;
}

export interface QueryAdapter {
  /** `POST` sends `body` (to the list path + `/search` unless the adapter says otherwise); `GET` sends `params`. */
  method: "GET" | "POST";
  /** Appended to the list path (default: "" for GET, "/search" for POST). */
  path?: string;
  capabilities: Capabilities;
  /** Throws `UnsupportedQueryError` for what the backend can't express. */
  toRequest: (query: ListQuery) => RequestParts;
}

/** A query the backend can't take (an `or` it has no way to say, an operator it lacks): raised, never silently dropped. */
export class UnsupportedQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedQueryError";
  }
}

export const isGroup = (filter: Filter): filter is Group => "logic" in filter;

/** The conditions of a filter that is one level deep (a condition, or a group of conditions); null for anything nested. */
export function flatConditions(
  filter: Filter | undefined,
): { logic: "and" | "or"; items: Condition[] } | null {
  if (!filter) return { logic: "and", items: [] };
  if (!isGroup(filter)) return { logic: "and", items: [filter] };
  const items: Condition[] = [];
  for (const item of filter.items) {
    if (isGroup(item)) return null;
    items.push(item);
  }
  return { logic: filter.logic, items };
}
