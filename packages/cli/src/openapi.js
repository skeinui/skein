import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { kebab, pascal } from "./names.js";

/**
 * Reads one REST resource out of an OpenAPI 3 document: the collection path and its operations, the item
 * and input fields, how the list is paginated, filtered and wrapped. `skein new page --from` turns the
 * result into a CRUD page; everything here is plain data so it can be tested on its own.
 */

export function loadSpec(file) {
  const text = readFileSync(file, "utf8");
  const spec = /^\s*\{/.test(text) ? JSON.parse(text) : parseYaml(text);
  if (!spec?.openapi?.startsWith?.("3")) throw new Error(`${file} is not an OpenAPI 3 document`);
  return spec;
}

const METHODS = ["get", "post", "put", "patch", "delete"];
const PAGE_NAMES = ["page", "pageNum", "pageNo", "current", "pageIndex"];
const SIZE_NAMES = ["pageSize", "size", "limit", "perPage", "per_page", "page_size"];
/** Query parameters that name the sort column, and the ones that give its direction (`sortBy=name&order=desc`). */
const SORT_BY_NAMES = ["sortBy", "sort_by", "orderBy", "order_by"];
const SORT_DIR_NAMES = ["order", "sortOrder", "sort_order", "direction", "dir", "sortDirection"];
/** One parameter holding both: `sort=name` / `sort=-name` (descending). */
const SORT_PREFIX_NAMES = ["sort", "ordering"];
/** Parameters that hold a full-text search: the search bar's keyword box, not a condition on a field. */
const KEYWORD_NAMES = ["q", "keyword", "search", "query"];
const ITEMS_KEYS = ["items", "list", "records", "rows", "content", "results", "data"];
const TOTAL_KEYS = ["total", "totalCount", "count", "totalElements", "total_count"];
const LABEL_KEYS = ["name", "title", "label", "username"];

function resolveRef(spec, schema) {
  let current = schema;
  const seen = new Set();
  while (current?.$ref) {
    if (seen.has(current.$ref)) throw new Error(`circular $ref ${current.$ref}`);
    seen.add(current.$ref);
    const path = current.$ref.replace(/^#\//, "").split("/");
    current = path.reduce(
      (node, key) => node?.[decodeURIComponent(key.replaceAll("~1", "/"))],
      spec,
    );
    if (!current) throw new Error(`unresolved $ref ${[...seen].pop()}`);
  }
  return current;
}

/** A schema with $refs resolved and allOf merged (enough for object shapes). */
function schemaOf(spec, schema) {
  const s = resolveRef(spec, schema ?? {});
  if (!s.allOf) return s;
  const parts = s.allOf.map((p) => schemaOf(spec, p));
  return {
    ...s,
    type: "object",
    properties: Object.assign({}, ...parts.map((p) => p.properties ?? {}), s.properties ?? {}),
    required: [...new Set(parts.flatMap((p) => p.required ?? []).concat(s.required ?? []))],
  };
}

/** The `$ref` name of a schema, e.g. `#/components/schemas/Order` → `Order`. */
const refName = (schema) => schema?.$ref?.split("/").pop();

const jsonSchemaOf = (content) =>
  content?.["application/json"]?.schema ?? Object.values(content ?? {})[0]?.schema;

function successSchema(operation) {
  const responses = operation?.responses ?? {};
  const code = ["200", "201", "2XX", "default"].find((c) => responses[c]);
  return code ? jsonSchemaOf(responses[code].content) : undefined;
}

const humanize = (name) =>
  kebab(name)
    .split("-")
    .map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

/** One property as a field: its kind decides the table cell, the form control and the mock value. */
function fieldOf(spec, name, raw, required) {
  const s = schemaOf(spec, raw);
  const type = Array.isArray(s.type) ? s.type.find((t) => t !== "null") : s.type;
  let kind = "other";
  if (s.enum?.every((v) => typeof v === "string")) kind = "enum";
  else if (type === "boolean") kind = "boolean";
  else if (type === "integer" || type === "number") kind = "number";
  else if (type === "string" && s.format === "date") kind = "date";
  else if (type === "string" && s.format === "date-time") kind = "datetime";
  else if (type === "string") kind = "string";
  const tsType =
    kind === "enum"
      ? s.enum.map((v) => JSON.stringify(v)).join(" | ")
      : kind === "number"
        ? "number"
        : kind === "boolean"
          ? "boolean"
          : ["string", "date", "datetime"].includes(kind)
            ? "string"
            : type === "array"
              ? "unknown[]"
              : "unknown";
  return {
    name,
    kind,
    tsType,
    label: s.title ?? humanize(name),
    required: Boolean(required),
    ...(s.enum && kind === "enum" ? { values: s.enum } : {}),
    ...(s.format ? { format: s.format } : {}),
    ...(s.readOnly ? { readOnly: true } : {}),
    ...(s.minLength !== undefined ? { minLength: s.minLength } : {}),
    ...(s.maxLength !== undefined ? { maxLength: s.maxLength } : {}),
    ...(s.minimum !== undefined ? { min: s.minimum } : {}),
    ...(s.maximum !== undefined ? { max: s.maximum } : {}),
    ...(s.pattern ? { pattern: s.pattern } : {}),
    ...(s.example !== undefined ? { example: s.example } : {}),
  };
}

const fieldsOf = (spec, schema) => {
  const s = schemaOf(spec, schema);
  const required = new Set(s.required ?? []);
  return Object.entries(s.properties ?? {}).map(([name, raw]) =>
    fieldOf(spec, name, raw, required.has(name)),
  );
};

/**
 * Where the items are in the list response: `{ data: … }` is unwrapped by the app's http client (so it is
 * noted, not followed into), then either an array or an object with an array (`items`, `list`…) and a total.
 */
function listShape(spec, schema) {
  let s = schemaOf(spec, schema);
  const envelope =
    s.type === "object" && s.properties?.data && !s.properties?.items ? "data" : null;
  if (envelope) s = schemaOf(spec, s.properties.data);
  if (s.type === "array" || s.items) {
    return { envelope, itemsKey: null, totalKey: null, itemSchema: s.items };
  }
  const props = s.properties ?? {};
  const itemsKey =
    ITEMS_KEYS.find((k) => schemaOf(spec, props[k] ?? {}).type === "array") ??
    Object.keys(props).find((k) => schemaOf(spec, props[k]).type === "array");
  if (!itemsKey) throw new Error("the list response has no array of items");
  const totalKey = TOTAL_KEYS.find((k) => props[k]) ?? null;
  return { envelope, itemsKey, totalKey, itemSchema: schemaOf(spec, props[itemsKey]).items };
}

/** The path of the collection: `--resource`, else the one whose last segment is the page's name. */
function findCollection(spec, { resource, name }) {
  const paths = Object.keys(spec.paths ?? {});
  if (resource) {
    const match = paths.find((p) => p === resource || p.endsWith(resource));
    if (!match)
      throw new Error(`no path "${resource}" in the OpenAPI document; paths: ${paths.join(", ")}`);
    return match;
  }
  const leaf = kebab(name.split("/").pop());
  const candidates = paths.filter(
    (p) => !p.includes("{") && kebab(p.split("/").pop()) === leaf && spec.paths[p].get,
  );
  if (candidates.length === 1) return candidates[0];
  const collections = paths.filter((p) => !p.includes("{") && spec.paths[p].get);
  throw new Error(
    `can't tell which path is "${name}": pass --resource <path> (one of: ${collections.join(", ")})`,
  );
}

/**
 * How the list is sorted, when the API says so: `{ by, dir }` for a column parameter and a direction one
 * (`sortBy=name&order=desc`), `{ by, dir: null }` for one that takes `name` / `-name`. `fields` are the columns it
 * lists (an enum), else null; `asc` / `desc` the direction values. Null when the list has no sort parameter.
 */
function sortOf(spec, params) {
  const enumOf = (p) => {
    const values = schemaOf(spec, p.schema ?? {}).enum;
    return Array.isArray(values) ? values.map(String) : null;
  };
  const dirParam = params.find((p) => SORT_DIR_NAMES.includes(p.name));
  const pair = dirParam && params.find((p) => SORT_BY_NAMES.includes(p.name));
  if (pair) {
    const values = enumOf(dirParam) ?? [];
    return {
      by: pair.name,
      dir: dirParam.name,
      fields: enumOf(pair),
      asc: values.find((v) => /^asc/i.test(v)) ?? "asc",
      desc: values.find((v) => /^desc/i.test(v)) ?? "desc",
    };
  }
  const prefix = params.find((p) => SORT_PREFIX_NAMES.includes(p.name));
  if (!prefix) return null;
  // `-name` is how a value says descending: an enum of the columns lists them with and without it
  const values = enumOf(prefix)?.map((v) => v.replace(/^-/, ""));
  return {
    by: prefix.name,
    dir: null,
    fields: values ? [...new Set(values)] : null,
    asc: "",
    desc: "-",
  };
}

/**
 * @param {object} spec an OpenAPI 3 document
 * @param {{ name: string; resource?: string }} options `name` is the page path (orders, system/users)
 */
export function analyzeResource(spec, { name, resource }) {
  const collection = findCollection(spec, { resource, name });
  const ops = spec.paths[collection];
  const itemPath = Object.keys(spec.paths).find((p) =>
    new RegExp(`^${collection.replace(/[.*+?^$()|[\]\\]/g, "\\$&")}/\\{[^/}]+\\}$`).test(p),
  );
  const itemOps = itemPath ? spec.paths[itemPath] : {};
  const idParam = itemPath?.match(/\{([^}]+)\}$/)?.[1] ?? null;

  const shape = listShape(spec, successSchema(ops.get));
  const fields = fieldsOf(spec, shape.itemSchema).filter(
    (f) => f.kind !== "other" || f.tsType !== "unknown",
  );
  if (fields.length === 0) throw new Error(`can't read the item fields of GET ${collection}`);
  const idField =
    fields.find((f) => f.name === idParam)?.name ??
    fields.find((f) => f.name === "id")?.name ??
    fields.find((f) => /id$/i.test(f.name))?.name ??
    null;
  // What names a row in messages ("Deleted …"): a name-like field, else the first required text, else any text
  const strings = fields.filter((f) => f.kind === "string" && f.name !== idField);
  const labelField =
    LABEL_KEYS.find((k) => strings.some((f) => f.name === k)) ??
    strings.find((f) => f.required && f.format !== "email")?.name ??
    strings[0]?.name ??
    idField;

  const params = (ops.get.parameters ?? [])
    .map((p) => resolveRef(spec, p))
    .filter((p) => p.in === "query");
  const page = params.find((p) => PAGE_NAMES.includes(p.name))?.name ?? null;
  const pageSize = params.find((p) => SIZE_NAMES.includes(p.name))?.name ?? null;
  const sort = sortOf(spec, params);
  const searchable = params
    .filter(
      (p) => p.name !== page && p.name !== pageSize && p.name !== sort?.by && p.name !== sort?.dir,
    )
    .map((p) => fieldOf(spec, p.name, p.schema ?? {}, false))
    .map((f) => ({ ...f, label: f.label }))
    .filter((f) => f.kind === "string" || f.kind === "enum" || f.kind === "number");
  // The full-text search: a text parameter named like one (`q`, `keyword`…), not a field to condition on
  const keyword = searchable.find((f) => f.kind === "string" && KEYWORD_NAMES.includes(f.name));
  const filters = searchable.filter((f) => f !== keyword);

  const update = itemOps.put ? "put" : itemOps.patch ? "patch" : null;
  // GET /orders/{id}: one row, for a detail page; `{ data }` around it like the list's
  const readSchema = idParam && itemOps.get ? schemaOf(spec, successSchema(itemOps.get)) : null;
  const itemEnvelope = Boolean(
    readSchema?.type === "object" && readSchema.properties?.data && !readSchema.properties?.id,
  );
  const createBody = jsonSchemaOf(
    ops.post?.requestBody && resolveRef(spec, ops.post.requestBody).content,
  );
  const updateBody =
    update && jsonSchemaOf(resolveRef(spec, itemOps[update].requestBody ?? {}).content);
  const inputSchema = createBody ?? updateBody;
  // The id stays in the form only when the request body asks for it (e.g. a sku chosen by the user)
  const input = (
    inputSchema ? fieldsOf(spec, inputSchema) : fields.filter((f) => f.name !== idField)
  ).filter((f) => !f.readOnly && f.kind !== "other");

  const server = spec.servers?.[0]?.url ?? "";
  const basePath = server ? new URL(server, "http://x").pathname.replace(/\/$/, "") : "";
  const entity = pascal(
    refName(shape.itemSchema) ?? name.split("/").pop().replace(/ies$/, "y").replace(/s$/, ""),
  );

  return {
    title: spec.paths[collection].get.summary ?? humanize(name.split("/").pop()),
    entity,
    path: basePath + collection,
    itemPath: idParam ? `${basePath}${itemPath}`.replace(`{${idParam}}`, ":id") : null,
    idField,
    idType: fields.find((f) => f.name === idField)?.tsType ?? "string",
    labelField,
    fields,
    input,
    filters,
    keyword: keyword ? { name: keyword.name, label: "Keyword" } : null,
    pagination: page && pageSize ? { page, pageSize } : null,
    sort,
    list: { envelope: shape.envelope, itemsKey: shape.itemsKey, totalKey: shape.totalKey },
    itemEnvelope,
    ops: {
      create: Boolean(ops.post),
      read: Boolean(idParam && itemOps.get && idField),
      update: idParam ? update : null,
      remove: Boolean(idParam && itemOps.delete),
    },
  };
}

export { METHODS };
