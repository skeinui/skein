import { OPS, UnsupportedQueryError, flatConditions, str } from "./types";
import type { Capabilities, Condition, ListQuery, Op, QueryAdapter, RequestParts } from "./types";

/** The contract itself: a backend that takes a `ListQuery` as the JSON body of `POST <path>/search`. */
export const standardAdapter: QueryAdapter = {
  method: "POST",
  capabilities: { ops: OPS, or: true, nested: true, multiSort: true, keyword: true },
  toRequest: (query) => ({ body: query }),
};

/** `a,b` of a list value; each element escaped, so a comma inside one survives. */
const list = (value: unknown) =>
  (Array.isArray(value) ? value : [value]).map((v) => encodeURIComponent(str(v))).join(",");

export interface FlatOptions {
  /** `status.gt=100` (default) or `status_gt=100`. A plain `status=paid` is `eq` either way. */
  separator?: "." | "_";
  /** Parameter names, for a backend that calls them something else. */
  names?: { page?: string; pageSize?: string; sort?: string; keyword?: string };
  /** The operators the backend knows (default: all). */
  ops?: readonly Op[];
}

/**
 * A backend with one plain query parameter per field: `?status=paid&amount.gt=100&sort=-amount,name`.
 * It can't say `or` or nested groups, and says so: such a query raises `UnsupportedQueryError`.
 */
export function flatAdapter({
  separator = ".",
  names = {},
  ops = OPS,
}: FlatOptions = {}): QueryAdapter {
  const name = { page: "page", pageSize: "pageSize", sort: "sort", keyword: "keyword", ...names };
  const capabilities: Capabilities = {
    ops,
    or: false,
    nested: false,
    multiSort: true,
    keyword: true,
  };
  return {
    method: "GET",
    capabilities,
    toRequest(query) {
      const params: Record<string, string> = {
        [name.page]: String(query.page),
        [name.pageSize]: String(query.pageSize),
      };
      if (query.keyword) params[name.keyword] = query.keyword;
      if (query.sort?.length)
        params[name.sort] = query.sort
          .map((s) => (s.order === "desc" ? "-" : "") + s.field)
          .join(",");
      const flat = flatConditions(query.filter);
      if (!flat) throw new UnsupportedQueryError("This backend can't take groups inside groups.");
      if (flat.logic === "or" && flat.items.length > 1)
        throw new UnsupportedQueryError("This backend can't take `or`.");
      for (const c of flat.items) {
        if (!ops.includes(c.op)) throw new UnsupportedQueryError(`This backend has no "${c.op}".`);
        if (c.op === "eq") params[c.field] = str(c.value);
        else
          params[`${c.field}${separator}${c.op}`] =
            c.op === "in" || c.op === "between" ? list(c.value) : str(c.value);
      }
      return { params };
    },
  };
}

/**
 * A custom adapter is a function: this one speaks the authxo console's own shape, `?name=foo&nameOp=contains&logics=and,or`
 * (one value and one operator per field, the logic between the conditions in order).
 */
export const authxoAdapter: QueryAdapter = {
  method: "GET",
  capabilities: {
    ops: ["eq", "contains"],
    or: true,
    nested: false,
    multiSort: false,
    keyword: false,
  },
  toRequest(query: ListQuery): RequestParts {
    const flat = flatConditions(query.filter);
    if (!flat) throw new UnsupportedQueryError("Groups inside groups can't be sent.");
    const params: Record<string, string> = {
      page: String(query.page),
      pageSize: String(query.pageSize),
    };
    const bad = flat.items.find((c: Condition) => c.op !== "eq" && c.op !== "contains");
    if (bad) throw new UnsupportedQueryError(`There is no "${bad.op}".`);
    for (const c of flat.items) {
      params[c.field] = str(c.value);
      params[`${c.field}Op`] = c.op === "eq" ? "equals" : "contains";
    }
    if (flat.items.length > 1)
      params.logics = flat.items
        .slice(1)
        .map(() => flat.logic)
        .join(",");
    if (query.sort?.[0]) params.sort = `${query.sort[0].field}:${query.sort[0].order}`;
    return { params };
  },
};

export interface ParamAdapterConfig {
  /** The page parameters, when the API pages. */
  page?: string;
  pageSize?: string;
  /** The parameter of the full-text search. */
  keyword?: string;
  /** How the API sorts: a column and a direction parameter (`sortBy=amount&order=desc`), or one holding `name` / `-name`. */
  sort?: { by: string; dir?: string; asc?: string; desc?: string };
  /** The fields the API filters by: its parameter (the field's name when it is the same) and the operators it means. */
  fields: Record<string, { param?: string; ops: readonly Op[] }>;
}

/**
 * An API with one plain query parameter per field and names of its own (the ones in its OpenAPI document): says what
 * it takes and refuses the rest with `UnsupportedQueryError`, which is how a search bar knows what to offer: one
 * condition per field, all of them and'ed, one sort column. Generated pages use it for the API they were made from.
 */
export function paramAdapter(config: ParamAdapterConfig): QueryAdapter {
  const { page, pageSize, keyword, sort, fields } = config;
  const ops = [...new Set(Object.values(fields).flatMap((f) => f.ops))];
  return {
    method: "GET",
    capabilities: {
      ops,
      or: false,
      nested: false,
      multiSort: false,
      keyword: Boolean(keyword),
      uniqueFields: true,
    },
    toRequest(query: ListQuery): RequestParts {
      const params: Record<string, string> = {};
      if (page) params[page] = String(query.page);
      if (pageSize) params[pageSize] = String(query.pageSize);
      if (query.keyword) {
        if (!keyword) throw new UnsupportedQueryError("This API has no full-text search.");
        params[keyword] = query.keyword;
      }
      if (query.sort?.length) {
        if (!sort) throw new UnsupportedQueryError("This API can't sort.");
        if (query.sort.length > 1) throw new UnsupportedQueryError("This API sorts by one column.");
        const [{ field, order }] = query.sort;
        if (sort.dir) {
          params[sort.by] = field;
          params[sort.dir] = order === "asc" ? (sort.asc ?? "asc") : (sort.desc ?? "desc");
        } else {
          params[sort.by] = `${order === "desc" ? "-" : ""}${field}`;
        }
      }
      const flat = flatConditions(query.filter);
      if (!flat) throw new UnsupportedQueryError("This API can't take groups inside groups.");
      if (flat.logic === "or" && flat.items.length > 1)
        throw new UnsupportedQueryError("This API can't take `or`.");
      const seen = new Set<string>();
      for (const c of flat.items) {
        const spec = fields[c.field];
        if (!spec) throw new UnsupportedQueryError(`This API doesn't filter by "${c.field}".`);
        if (!spec.ops.includes(c.op))
          throw new UnsupportedQueryError(`This API has no "${c.op}" for "${c.field}".`);
        if (seen.has(c.field)) throw new UnsupportedQueryError(`This API takes "${c.field}" once.`);
        seen.add(c.field);
        params[spec.param ?? c.field] = str(c.value);
      }
      return { params };
    },
  };
}
