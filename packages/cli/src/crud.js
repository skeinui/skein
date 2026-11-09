import { camel, kebab, pascal } from "./names.js";

/**
 * A CRUD page from an `analyzeResource` model, laid out like the admin template's users page: api/ (types,
 * requests, query keys), a filter form, a table, a create / edit dialog, translations and MSW mocks that
 * answer in the same shape as the real API.
 */

const IDENT = /^[A-Za-z_$][\w$]*$/;
const key = (name) => (IDENT.test(name) ? name : JSON.stringify(name));
const access = (obj, name) =>
  IDENT.test(name) ? `${obj}.${name}` : `${obj}[${JSON.stringify(name)}]`;
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
/** `obj?.name`, for a value that may not be loaded yet. */
const accessOpt = (obj, name) =>
  IDENT.test(name) ? `${obj}?.${name}` : `${obj}?.[${JSON.stringify(name)}]`;

function interfaceOf(name, fields, { allRequired = false } = {}) {
  const lines = fields.map(
    (f) => `  ${key(f.name)}${f.required || allRequired ? "" : "?"}: ${f.tsType};`,
  );
  return `export interface ${name} {\n${lines.join("\n")}\n}`;
}

/** Form control for a field. */
function formField(f, prefix) {
  const type =
    f.kind === "enum"
      ? "select"
      : f.kind === "boolean"
        ? "switch"
        : f.kind === "number"
          ? "number"
          : f.kind === "date"
            ? "date"
            : f.kind === "datetime"
              ? "datetime"
              : f.format === "email"
                ? "email"
                : f.format === "uri" || f.format === "url"
                  ? "url"
                  : f.format === "password"
                    ? "password"
                    : (f.maxLength ?? 0) > 200
                      ? "textarea"
                      : "text";
  const parts = [`name: ${JSON.stringify(f.name)}`, `label: t("${prefix}.${f.name}")`];
  if (type !== "text") parts.push(`type: "${type}"`);
  if (f.required && f.kind !== "boolean") parts.push("required: true");
  if (f.minLength !== undefined) parts.push(`minLength: ${f.minLength}`);
  if (f.maxLength !== undefined) parts.push(`maxLength: ${f.maxLength}`);
  if (f.min !== undefined) parts.push(`min: ${f.min}`);
  if (f.max !== undefined) parts.push(`max: ${f.max}`);
  if (f.pattern) parts.push(`pattern: ${JSON.stringify(f.pattern)}`);
  if (f.kind === "enum") {
    parts.push(
      `options: ${JSON.stringify(f.values)}.map((v) => ({ value: v, label: t(\`enum.${f.name}.\${v}\`) }))`,
    );
  }
  return `{ ${parts.join(", ")} }`;
}

function cellOf(f) {
  const v = access("row", f.name);
  switch (f.kind) {
    case "enum":
      return `{${v} ? <Tag variant="soft">{t(\`enum.${f.name}.\${${v}}\`)}</Tag> : null}`;
    case "boolean":
      return `<Tag variant="soft" color={${v} ? "success" : "neutral"}>{t(${v} ? "bool.yes" : "bool.no")}</Tag>`;
    case "date":
      return `{${v} ? date.format(new Date(${v})) : null}`;
    case "datetime":
      return `{${v} ? dateTime.format(new Date(${v})) : null}`;
    default:
      return `{${v}}`;
  }
}

/** A field's value on the detail page (a Descriptions item), `row` possibly not loaded yet. */
function valueOf(f) {
  const v = access("row", f.name);
  const opt = accessOpt("row", f.name);
  switch (f.kind) {
    case "enum":
      return `${opt} ? t(\`enum.${f.name}.\${${v}}\`) : undefined`;
    case "boolean":
      return `row ? (\n                    <Tag variant="soft" color={${v} ? "success" : "neutral"}>\n                      {t(${v} ? "bool.yes" : "bool.no")}\n                    </Tag>\n                  ) : undefined`;
    case "date":
      return `${opt} ? date.format(new Date(${v})) : undefined`;
    case "datetime":
      return `${opt} ? dateTime.format(new Date(${v})) : undefined`;
    default:
      return opt;
  }
}

const NAMES = [
  "Alice Chen",
  "Bob Li",
  "Carol Wang",
  "David Zhang",
  "Eve Liu",
  "Frank Yang",
  "Grace Zhao",
  "Henry Wu",
];

/** A mock value for row `i`, as a TS expression. */
function fakeOf(f, model) {
  if (f.name === model.idField)
    return f.tsType === "number" ? "i + 1" : "`" + kebab(model.entity) + "-${i + 1}`";
  switch (f.kind) {
    case "enum":
      return `(${JSON.stringify(f.values)} as const)[i % ${f.values.length}]`;
    case "boolean":
      return "i % 3 !== 0";
    case "number": {
      const min = f.min ?? 1;
      const span = Math.max(1, (f.max ?? min + 999) - min + 1);
      return `${min} + ((i * 37) % ${span})`;
    }
    case "date":
      return "new Date(Date.UTC(2026, 0, 1 + i * 5)).toISOString().slice(0, 10)";
    case "datetime":
      return "new Date(Date.UTC(2026, 0, 1 + i * 5, 9 + (i % 8))).toISOString()";
    case "string":
      if (f.format === "email") return "`user${i + 1}@example.com`";
      if (f.format === "uri" || f.format === "url") return "`https://example.com/${i + 1}`";
      if (/name|customer|owner|author|contact/i.test(f.name)) return `NAMES[i % NAMES.length]`;
      return `\`${f.label.replaceAll("`", "").replaceAll("${", "")} \${i + 1}\``;
    default:
      return "undefined";
  }
}

/**
 * @param {ReturnType<import("./openapi.js").analyzeResource>} model
 * @param {{ path: string; flags: Record<string, boolean>; guarded?: boolean }} options page path (orders, system/orders);
 *   `guarded`: the project has `src/modules/access`, so the page asks for `<resource>:create|update|delete|read`
 * @returns {Record<string, string>} files relative to the page directory
 */
export function crudFiles(model, { path, flags, guarded = false }) {
  const Name = pascal(path.replaceAll("/", "-"));
  const name = camel(path.replaceAll("/", "-"));
  const ns = path.replaceAll("/", "-");
  const leaf = kebab(path.split("/").pop());
  const {
    entity,
    fields,
    input,
    filters,
    keyword,
    pagination,
    sort,
    ops,
    list,
    idField,
    labelField,
  } = model;
  const Entity = entity;
  const entityKebab = kebab(entity);
  const entityVar = camel(entity);
  const keys = `${name}Keys`;
  const fetchList = `fetch${Name}`;
  const columns = fields.filter((f) => f.name !== idField && f.kind !== "other").slice(0, 6);
  const usesDate = columns.some((f) => f.kind === "date");
  const usesDateTime = columns.some((f) => f.kind === "datetime");
  const usesTag = columns.some((f) => f.kind === "enum" || f.kind === "boolean");
  const editable = Boolean(ops.update);
  const hasDialog = ops.create || editable;
  const label = (obj) => (labelField ? `String(${access(obj, labelField)})` : `""`);
  // A detail page when the API reads one row (GET /orders/{id}): /orders/42, under the tenant with tenant
  const detail = Boolean(ops.read && idField);
  const fetchOne = `fetch${Entity}`;
  const tenant = Boolean(flags.tenant);
  const files = {};

  // ---------- api
  const hasParams = Boolean(pagination || filters.length || keyword || sort);
  const adapter = `${name}Adapter`;
  // What the API does with a filter parameter: a text one looks for the text (what the mock does), an enum or a number is matched
  const opsOf = (f) => (f.kind === "string" ? ["contains"] : ["eq"]);
  const sortConfig = !sort
    ? null
    : sort.dir
      ? `{ by: ${JSON.stringify(sort.by)}, dir: ${JSON.stringify(sort.dir)}, asc: ${JSON.stringify(sort.asc)}, desc: ${JSON.stringify(sort.desc)} }`
      : `{ by: ${JSON.stringify(sort.by)} }`;
  const adapterConfig = [
    ...(pagination
      ? [
          `page: ${JSON.stringify(pagination.page)}`,
          `pageSize: ${JSON.stringify(pagination.pageSize)}`,
        ]
      : []),
    ...(keyword ? [`keyword: ${JSON.stringify(keyword.name)}`] : []),
    ...(sortConfig ? [`sort: ${sortConfig}`] : []),
    `fields: { ${filters.map((f) => `${key(f.name)}: { ops: ${JSON.stringify(opsOf(f))} }`).join(", ")} }`,
  ];
  const listType = list.itemsKey
    ? `{ ${key(list.itemsKey)}: ${Entity}[];${list.totalKey ? ` ${key(list.totalKey)}?: number;` : ""} }`
    : `${Entity}[]`;
  const itemsExpr = list.itemsKey ? access("res", list.itemsKey) : "res";
  const totalExpr = list.totalKey
    ? `${access("res", list.totalKey)} ?? ${itemsExpr}.length`
    : `${itemsExpr}.length`;
  const itemUrl = model.itemPath && `\`${model.itemPath.replace(":id", "${id}")}\``;
  files["api/index.ts"] = `import http from "@/lib/http";
${hasParams ? 'import { paramAdapter } from "@/lib/list-query";\n' : ""}import type { ListQuery } from "@/lib/list-query";

// Generated from the OpenAPI document by \`skein new page ${path} --from\`; edit freely.

${interfaceOf(Entity, fields)}

${interfaceOf(`${Entity}Input`, input)}

export interface ${Name}List {
  items: ${Entity}[];
  total: number;
}
${
  hasParams
    ? `
/**
 * What this API takes, from the parameters of its OpenAPI document: the search bar offers no more than this, and a
 * query the API can't take (an \`or\`, a field it has no parameter for) raises \`UnsupportedQueryError\`.
 */
export const ${adapter} = paramAdapter({
  ${adapterConfig.join(",\n  ")},
});
`
    : ""
}
/** Query keys: invalidate \`${keys}.all\` after a change and every list refetches. */
export const ${keys} = {
  all: [${JSON.stringify(ns)}] as const,
  list: (query: ListQuery) => [${JSON.stringify(ns)}, "list", query] as const,${detail ? `\n  detail: (id: ${model.idType}) => [${JSON.stringify(ns)}, "detail", id] as const,` : ""}
};

export async function ${fetchList}(${hasParams ? "query" : "_query"}: ListQuery): Promise<${Name}List> {
  const res = await http.get<${listType}>(${JSON.stringify(model.path)}${hasParams ? `, {\n    params: ${adapter}.toRequest(query).params,\n  }` : ""});
  return { items: ${itemsExpr}, total: ${totalExpr} };
}
${detail ? `\nexport const ${fetchOne} = (id: ${model.idType}) => http.get<${Entity}>(${itemUrl});\n` : ""}${ops.create ? `\nexport const create${Entity} = (input: ${Entity}Input) => http.post<${Entity}>(${JSON.stringify(model.path)}, input);\n` : ""}${
    editable
      ? `\nexport const update${Entity} = (id: ${model.idType}, input: ${Entity}Input) =>\n  http.${ops.update}<${Entity}>(${itemUrl}, input);\n`
      : ""
  }${ops.remove ? `\nexport const delete${Entity} = (id: ${model.idType}) => http.delete<unknown>(${itemUrl});\n` : ""}`;

  // ---------- page
  const perm = (action) => `${ns}:${action}`;
  // Ticking rows needs an id to tell them by
  const selectable = Boolean(idField);
  const removeMany = ops.remove && selectable;
  // The columns the API can sort by (all the shown ones unless its parameter lists some)
  const sortable = new Set(
    sort
      ? columns.filter((f) => !sort.fields || sort.fields.includes(f.name)).map((f) => f.name)
      : [],
  );
  const sorted = sortable.size > 0;
  const hasSearch = filters.length > 0 || Boolean(keyword);
  const usesAccess = guarded && (ops.create || removeMany);
  const colsConst = `${name}Columns`;
  const ColType = `${Name}Column`;
  const uiImports = [
    ...(ops.create || selectable ? ["Button"] : []),
    "Card",
    "Flex",
    ...(pagination ? ["Pagination"] : []),
    ...(removeMany ? ["Popconfirm"] : []),
    ...(selectable ? ["Text"] : []),
    "TableTools",
    ...(ops.remove ? ["toast"] : []),
    "useFixedHeader",
  ];
  const imports = [
    `import { ${uiImports.join(", ")} } from "@skeinui/ui";`,
    `import { keepPreviousData, ${ops.remove ? "useMutation, " : ""}useQuery${ops.remove ? ", useQueryClient" : ""} } from "@tanstack/react-query";`,
    ...(ops.create ? [`import { Plus } from "lucide-react";`] : []),
    `import { useState } from "react";`,
    `import { downloadCsv } from "@/lib/export-csv";`,
    `import type { ${sorted ? "ListQuery, Sort" : "ListQuery"} } from "@/lib/list-query";`,
    ...(usesAccess ? [`import { Access } from "@/modules/access";`] : []),
    `import { Page } from "@/skein-shell";`,
    `import { ${[...(ops.remove ? [`delete${Entity}`] : []), fetchList, keys].join(", ")} } from "./api";`,
    `import type { ${Entity} } from "./api";`,
    ...(hasSearch ? [`import { ${Name}Search } from "./components/${leaf}-search";`] : []),
    ...(hasDialog
      ? [`import { ${Entity}FormDialog } from "./components/${entityKebab}-form-dialog";`]
      : []),
    `import { ${colsConst}, ${Name}Table } from "./components/${leaf}-table";`,
    `import type { ${ColType} } from "./components/${leaf}-table";`,
    `import { use${Name}Translation } from "./locales";`,
  ];
  const rowId = (row) => access(row, idField);
  const idType = model.idType === "number" ? "number" : "string";
  const setQueryName = pagination || hasSearch || sorted ? ", setQuery" : "";
  const createButton = `<Button color="primary" startContent={<Plus size={16} />} onClick={() => setEditing(null)}>
            {t("create")}
          </Button>`;
  const deleteSelected = `<Popconfirm
                  tone="danger"
                  title={t("deleteManyConfirm", { count: selectedRows.length })}
                  confirmLabel={t("delete")}
                  cancelLabel={t("cancel")}
                  onConfirm={() => removeMany.mutateAsync(selectedRows).then(() => undefined, () => undefined)}
                >
                  <Button size="sm" variant="outline" color="danger" loading={removeMany.isPending}>
                    {t("deleteSelected")}
                  </Button>
                </Popconfirm>`;
  const wrapAccess = (action, jsx) =>
    guarded ? `<Access code="${perm(action)}">\n${jsx}\n</Access>` : jsx;
  // What a column reads as in the CSV: the texts the table shows for an enum and a boolean, the value else
  const exportLine = (f) => {
    const v = access("row", f.name);
    const value =
      f.kind === "enum"
        ? `${v} ? t(\`enum.${f.name}.\${${v}}\`) : ""`
        : f.kind === "boolean"
          ? `t(${v} ? "bool.yes" : "bool.no")`
          : v;
    return `    ${key(f.name)}: (row) => ${value},`;
  };
  files["index.tsx"] = `${imports.join("\n")}

export function ${Name}Page() {
  const { t } = use${Name}Translation();
${ops.remove ? "  const queryClient = useQueryClient();\n" : ""}  const [query${setQueryName}] = useState<ListQuery>({ page: 1, pageSize: 10 });
  /** The columns in their order, and the ones shown. */
  const [order, setOrder] = useState<${ColType}[]>([...${colsConst}]);
  const [visible, setVisible] = useState<string[]>([...${colsConst}]);
  /** The header fixed and the rows scrolling inside the card (the page fills the screen), or the whole page scrolling: the user's choice, fixed at first. */
  const [fixed, setFixed] = useFixedHeader(${JSON.stringify(leaf)});
  const shown = order.filter((c) => visible.includes(c));
${hasDialog ? `  /** undefined: closed; null: creating; a row: editing it. */\n  const [editing, setEditing] = useState<${Entity} | null | undefined>(undefined);\n` : ""}${selectable ? `  /** The ids of the ticked rows. */\n  const [selected, setSelected] = useState<readonly ${idType}[]>([]);\n` : ""}  const { data, isFetching, refetch } = useQuery({
    queryKey: ${keys}.list(query),
    queryFn: () => ${fetchList}(query),
    placeholderData: keepPreviousData,
  });
  const rows = data?.items ?? [];
${selectable ? `  // Only the rows on screen count: another page, a new search or a sort leaves the ticked ones out of what is exported or deleted\n  const selectedRows = rows.filter((row) => selected.includes(${rowId("row")}));\n` : ""}${
    ops.remove
      ? `  const remove = useMutation({
    mutationFn: (row: ${Entity}) => delete${Entity}(${access("row", idField)}),
    onSuccess: (_, row) => {
      toast.success(t("deleted", { item: ${label("row")} }));
      void queryClient.invalidateQueries({ queryKey: ${keys}.all });
    },
    onError: (error) => toast.danger(error.message),
  });
`
      : ""
  }${
    removeMany
      ? `  // The API deletes one row at a time: one request per ticked row, and the ones that failed are counted
  const removeMany = useMutation({
    mutationFn: (rows: ${Entity}[]) =>
      Promise.allSettled(rows.map((row) => delete${Entity}(${access("row", idField)}))),
    onSuccess: (results) => {
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed < results.length)
        toast.success(t("deletedMany", { count: results.length - failed }));
      if (failed > 0) toast.danger(t("deleteManyFailed", { count: failed }));
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ${keys}.all });
    },
  });
`
      : ""
  }
  /** What a column reads as in the CSV. */
  const exportCell: Record<${ColType}, (row: ${Entity}) => unknown> = {
${columns.map(exportLine).join("\n")}
  };
  /** The rows as a CSV file, in the columns shown: what is on screen (this page, with its search and sort) or the ticked ones. */
  const exportRows = (list: readonly ${Entity}[]) =>
    downloadCsv(
      ${JSON.stringify(`${leaf}.csv`)},
      shown.map((c) => t(\`fields.\${c}\`)),
      list.map((row) => shown.map((c) => exportCell[c](row))),
    );

  return (
    <Page
      fill={fixed}
      title={t("title")}
      description={t("description")}${ops.create ? `\n      actions={\n        ${wrapAccess("create", createButton)}\n      }` : ""}
    >
      <Card fill={fixed}>
        <Card.Body>
          <Flex direction="column" gap="md" grow={fixed}>
            <div className="table-bar">
              <div className="table-bar-main">${
                hasSearch
                  ? `
                <${Name}Search
                  onSearch={(search) => setQuery((q) => ({ page: 1, pageSize: q.pageSize, ${sorted ? "sort: q.sort, " : ""}...search }))}
                />
              `
                  : ""
              }</div>
              <TableTools
                onRefresh={() => void refetch()}
                refreshing={isFetching}
                columns={order.map((key) => ({ key, label: t(\`fields.\${key}\`) }))}
                visible={visible}
                onVisibleChange={setVisible}
                onOrderChange={(keys) => setOrder(keys as ${ColType}[])}
                fixed={fixed}
                onFixedChange={setFixed}
                onExport={() => exportRows(rows)}
              />
            </div>
${
  selectable
    ? `            {selectedRows.length > 0 ? (
              <Flex align="center" gap="md" wrap>
                <Text tone="secondary">{t("selected", { count: selectedRows.length })}</Text>
                <Button size="sm" variant="outline" onClick={() => exportRows(selectedRows)}>
                  {t("exportSelected")}
                </Button>${removeMany ? `\n                ${wrapAccess("delete", deleteSelected)}` : ""}
                <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                  {t("clear")}
                </Button>
              </Flex>
            ) : null}
`
    : ""
}            <${Name}Table
              rows={rows}
              columns={shown}
              stickyHeader={fixed}
              loading={isFetching}${selectable ? "\n              selected={selected}\n              onSelectedChange={setSelected}" : ""}${
                sorted
                  ? `\n              sort={query.sort?.[0]}\n              onSort={(field) => setQuery((q) => ({ ...q, page: 1, sort: nextSort(q.sort?.[0], field) }))}`
                  : ""
              }${editable ? "\n              onEdit={setEditing}" : ""}${
                ops.remove
                  ? "\n              onDelete={(row) => remove.mutateAsync(row).then(() => undefined, () => undefined)}"
                  : ""
              }
            />
${
  pagination
    ? `            <Flex justify="end">
              <Pagination
                variant="pages"
                page={query.page}
                pageSize={query.pageSize}
                total={data?.total ?? 0}
                pageSizeOptions={[10, 20, 50]}
                onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
                onPageSizeChange={(pageSize) => setQuery((q) => ({ ...q, pageSize, page: 1 }))}
              />
            </Flex>
`
    : ""
}          </Flex>
        </Card.Body>
      </Card>
${hasDialog ? `      <${Entity}FormDialog ${entityVar}={editing} onClose={() => setEditing(undefined)} />\n` : ""}    </Page>
  );
}
${
  sorted
    ? `
/** What a click on a column's header does: ascending, then descending, then not sorted. */
function nextSort(sort: Sort | undefined, field: string): ListQuery["sort"] {
  if (sort?.field !== field) return [{ field, order: "asc" }];
  return sort.order === "asc" ? [{ field, order: "desc" }] : undefined;
}
`
    : ""
}`;

  // ---------- search: the keyword and the conditions the API takes, as chips
  if (hasSearch) {
    const searchFields = filters.map((f) => {
      const type = f.kind === "enum" ? "enum" : f.kind === "number" ? "number" : "text";
      const options =
        f.kind === "enum"
          ? `, options: ${JSON.stringify(f.values)}.map((v) => ({ value: v, label: t(\`enum.${f.name}.\${v}\`) }))`
          : "";
      return `{ name: ${JSON.stringify(f.name)}, label: t("filters.${f.name}"), type: "${type}"${options} }`;
    });
    // What search() is given: the keyword and / or the filter as they are now
    const given = (filterExpr) =>
      `{ ${[keyword && "keyword", filters.length && `filter: ${filterExpr}`].filter(Boolean).join(", ")} }`;
    files[`components/${leaf}-search.tsx`] =
      `import { ${[...(filters.length ? ["Button"] : []), "Flex", ...(filters.length ? ["QueryBuilder"] : []), ...(keyword ? ["SearchInput"] : [])].join(", ")} } from "@skeinui/ui";
${filters.length ? 'import type { QueryField } from "@skeinui/ui";\n' : ""}import { useState } from "react";
${filters.length ? 'import type { Filter } from "@/lib/list-query";\n' : ""}${filters.length ? `import { ${adapter} } from "../api";\n` : ""}import { use${Name}Translation } from "../locales";

/** What the search asks for, as parts of a \`ListQuery\`. */
export interface ${Name}SearchValue {
${keyword ? "  keyword?: string;\n" : ""}${filters.length ? "  filter?: Filter;\n" : ""}}

/** ${keyword ? "A keyword (Enter searches)" : "The conditions"}${keyword && filters.length ? ", and the conditions" : ""}${filters.length ? " on the fields the API takes, as chips" : ""}. */
export function ${Name}Search({ onSearch }: { onSearch: (value: ${Name}SearchValue) => void }) {
  const { t } = use${Name}Translation();
${keyword ? '  const [keyword, setKeyword] = useState("");\n' : ""}${filters.length ? "  const [filter, setFilter] = useState<Filter | undefined>();\n" : ""}  const search = (next: ${Name}SearchValue) =>
    onSearch({ ${[keyword && "keyword: next.keyword?.trim() || undefined", filters.length && "filter: next.filter"].filter(Boolean).join(", ")} });
${
  filters.length
    ? `  const fields: QueryField[] = [
    ${searchFields.join(",\n    ")},
  ];
`
    : ""
}  return (
    <Flex gap="sm" align="center" wrap>
${
  keyword
    ? `      <div className="table-keyword">
        <SearchInput
          fullWidth
          size="sm"
          aria-label={t("filters.${keyword.name}")}
          placeholder={t("filters.${keyword.name}")}
          value={keyword}
          onValueChange={setKeyword}
          // Enter (not while an input method is composing), the button, and the clear button
          onSearch={(value) => search({ ${["keyword: value", filters.length && "filter"].filter(Boolean).join(", ")} })}
        />
      </div>
`
    : ""
}${
        filters.length
          ? `      <QueryBuilder
        fields={fields}
        value={filter}
        capabilities={${adapter}.capabilities}
        onChange={(next) => {
          setFilter(next);
          search(${given("next")});
        }}
      />
      {${[keyword && "keyword", "filter"].filter(Boolean).join(" || ")} ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
${keyword ? '            setKeyword("");\n' : ""}            setFilter(undefined);
            search({});
          }}
        >
          {t("filter.reset")}
        </Button>
      ) : null}
`
          : ""
      }    </Flex>
  );
}
`;
  }

  // ---------- table
  const actions = editable || ops.remove;
  const tableImports = ["DataTable", ...(usesTag ? ["Tag"] : [])];
  // The column that opens the detail page: the row's name, else the first plain one
  const plain = (f) => !["enum", "boolean", "date", "datetime"].includes(f.kind);
  const linkField = detail
    ? (columns.find((f) => f.name === labelField && plain(f)) ?? columns.find(plain))?.name
    : undefined;
  // A column's cell as an expression of `row`: what cellOf writes as children, without the braces around an expression
  const cellExpr = (f) => {
    const child = cellOf(f);
    if (f.name === linkField) {
      const id = `String(${access("row", idField)})`;
      // With tenant, from the list's address so the tenant is kept
      return tenant
        ? `<RouterLink from="/$tenant/${path}" to="/$tenant/${path}/$id" params={(prev) => ({ ...prev, id: ${id} })}>${child}</RouterLink>`
        : `<RouterLink to="/${path}/$id" params={{ id: ${id} }}>${child}</RouterLink>`;
    }
    return child.startsWith("{") ? child.slice(1, -1) : child;
  };
  // With the access module the edit / delete buttons (and their column) are only for who may; else for everyone
  const canVars = guarded && actions;
  const showActions = [editable && "canEdit", ops.remove && "canDelete"]
    .filter(Boolean)
    .join(" || ");
  // An action is listed only when the user may (a falsy entry is skipped by DataTable)
  const may = (cond, action) => (canVars ? `${cond} && ${action}` : action);
  const actionList = [
    editable && may("canEdit", `{ key: "edit", label: t("edit"), onClick: () => onEdit(row) }`),
    ops.remove &&
      may(
        "canDelete",
        `{
          key: "delete",
          label: t("delete"),
          color: "danger",
          confirm: { title: t("deleteConfirm", { item: ${label("row")} }), confirmLabel: t("delete"), cancelLabel: t("cancel") },
          onClick: () => onDelete(row),
        }`,
      ),
  ].filter(Boolean);
  const rowKey = idField ? access("row", idField) : "rows.indexOf(row)";
  files[`components/${leaf}-table.tsx`] = `import { ${tableImports.join(", ")} } from "@skeinui/ui";
${linkField ? 'import { RouterLink } from "@/skein-shell";\n' : ""}import type { ReactNode } from "react";
${sorted ? 'import type { Sort } from "@/lib/list-query";\n' : ""}${canVars ? 'import { useAccess } from "@/modules/access";\n' : ""}import type { ${Entity} } from "../api";
import { use${Name}Translation } from "../locales";

/** The columns that can be hidden or moved (the selection and the actions stay where they are). */
export const ${colsConst} = [${columns.map((f) => JSON.stringify(f.name)).join(", ")}] as const;
export type ${ColType} = (typeof ${colsConst})[number];
${sorted ? `\n/** The columns the API can sort by. */\nconst sortable: ReadonlySet<string> = new Set(${JSON.stringify([...sortable])});\n` : ""}
export function ${Name}Table({
  rows,
  columns = ${colsConst},
  stickyHeader,
  loading,${selectable ? "\n  selected,\n  onSelectedChange," : ""}${sorted ? "\n  sort,\n  onSort," : ""}${editable ? "\n  onEdit," : ""}${ops.remove ? "\n  onDelete," : ""}
}: {
  rows: readonly ${Entity}[];
  /** The columns shown, in order. */
  columns?: readonly ${ColType}[];
  /** Keep the header in view and scroll only the rows (in a parent with a height: \`Card fill\`). */
  stickyHeader?: boolean;
  loading: boolean;${selectable ? `\n  /** The ids of the ticked rows. */\n  selected: readonly ${idType}[];\n  onSelectedChange: (ids: readonly ${idType}[]) => void;` : ""}${sorted ? `\n  sort?: Sort;\n  /** A click on a sortable header, with the column's field name. */\n  onSort: (field: string) => void;` : ""}${editable ? `\n  onEdit: (row: ${Entity}) => void;` : ""}${ops.remove ? `\n  onDelete: (row: ${Entity}) => Promise<void>;` : ""}
}) {
  const { t${usesDate || usesDateTime ? ", i18n" : ""} } = use${Name}Translation();
${usesDate ? '  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" });\n' : ""}${usesDateTime ? '  const dateTime = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" });\n' : ""}${
    canVars
      ? `  const { can } = useAccess();\n${editable ? `  const canEdit = can(${JSON.stringify(perm("update"))});\n` : ""}${ops.remove ? `  const canDelete = can(${JSON.stringify(perm("delete"))});\n` : ""}  // Without either, there is nothing to put in the actions column\n  const showActions = ${showActions};\n`
      : ""
  }  const cell: Record<${ColType}, (row: ${Entity}) => ReactNode> = {
${columns.map((f) => `    ${key(f.name)}: (row) => ${cellExpr(f)},`).join("\n")}
  };
  return (
    <DataTable
      stickyHeader={stickyHeader}
      loading={loading}
      rows={rows}
      rowKey={(row) => String(${rowKey})}
      empty={t("empty")}
      columns={columns.map((c) => ({
        key: c,
        title: t(\`fields.\${c}\`),
        render: cell[c],${sorted ? "\n        sortable: sortable.has(c)," : ""}
      }))}${
        selectable
          ? `\n      selected={selected.map(String)}\n      onSelectedChange={(keys) => onSelectedChange(keys${idType === "number" ? ".map(Number)" : ""})}`
          : ""
      }${
        sorted
          ? `\n      sort={sort ? { key: sort.field, order: sort.order } : null}\n      // The page works out what a click on a header means; the table says which header\n      onSortChange={(next) => onSort(next?.key ?? sort?.field ?? "")}`
          : ""
      }${
        actions
          ? `\n      actions={${canVars ? "showActions\n        ? " : ""}(row) => [\n        ${actionList.join(",\n        ")},\n      ]${canVars ? "\n        : undefined" : ""}}`
          : ""
      }
    />
  );
}
`;

  // ---------- detail page
  if (detail) {
    const shown = fields.filter((f) => f.kind !== "other");
    const dDate = shown.some((f) => f.kind === "date");
    const dDateTime = shown.some((f) => f.kind === "datetime");
    const dTag = shown.some((f) => f.kind === "boolean");
    const listPath = `/${path}`;
    const items = shown
      .map(
        (f) =>
          `                {\n                  label: t("fields.${f.name}"),\n                  value: ${valueOf(f)},\n                },`,
      )
      .join("\n");
    files["detail.tsx"] =
      `import { ${["Button", "Card", "Descriptions", ...(dTag ? ["Tag"] : []), "Text"].join(", ")} } from "@skeinui/ui";
import { useQuery } from "@tanstack/react-query";
import { useNavigate${tenant ? ", useParams" : ""} } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Page } from "@/skein-shell";
import { ${fetchOne}, ${keys} } from "./api";
import { use${Name}Translation } from "./locales";

/** ${tenant ? "/<tenant>" : ""}${listPath}/<id>: one row${tenant ? " of the tenant; another tenant's" : "; one that doesn't exist"} is not found (404 from the API). */
export function ${Name}DetailPage({ id }: { id: ${model.idType} }) {
  const { t${dDate || dDateTime ? ", i18n" : ""} } = use${Name}Translation();
  const navigate = useNavigate();
${tenant ? "  const { tenant } = useParams({ strict: false });\n" : ""}  const { data: row, error } = useQuery({
    queryKey: ${keys}.detail(id),
    queryFn: () => ${fetchOne}(id),
  });
${dDate ? '  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" });\n' : ""}${dDateTime ? '  const dateTime = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" });\n' : ""}
  return (
    <Page
      title={${labelField ? `row ? ${label("row")} : ` : ""}error ? t("detail.notFound") : t("loading")}
      actions={
        <Button
          startContent={<ArrowLeft size={16} />}
          onClick={() => void navigate({ to: ${tenant ? `\`/\${tenant}${listPath}\`` : JSON.stringify(listPath)} })}
        >
          {t("detail.back")}
        </Button>
      }
    >
      <Card>
        <Card.Body>
          {error ? (
            <Text tone="secondary">{t("detail.notFoundHint", { id: String(id) })}</Text>
          ) : (
            <Descriptions
              column={2}
              items={[
${items}
              ]}
            />
          )}
        </Card.Body>
      </Card>
    </Page>
  );
}
`;
  }

  // ---------- form dialog
  if (hasDialog) {
    const defaults = Object.fromEntries(
      input
        .filter((f) => f.kind === "boolean" || (f.kind === "enum" && f.required))
        .map((f) => [f.name, f.kind === "boolean" ? false : f.values[0]]),
    );
    const mutation =
      editable && ops.create
        ? `(input: ${Entity}Input) =>\n      ${entityVar} ? update${Entity}(${access(entityVar, idField)}, input) : create${Entity}(input)`
        : editable
          ? `(input: ${Entity}Input) => update${Entity}(${access(`${entityVar}!`, idField)}, input)`
          : `(input: ${Entity}Input) => create${Entity}(input)`;
    files[`components/${entityKebab}-form-dialog.tsx`] =
      `import { FormDialog, toast } from "@skeinui/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ${[...(ops.create ? [`create${Entity}`] : []), ...(editable ? [`update${Entity}`] : []), keys].join(", ")} } from "../api";
import type { ${Entity}, ${Entity}Input } from "../api";
import { use${Name}Translation } from "../locales";

/** Creates a row (\`${entityVar}\` is null) or edits one; closed when \`${entityVar}\` is undefined. */
export function ${Entity}FormDialog({ ${entityVar}, onClose }: { ${entityVar}: ${Entity} | null | undefined; onClose: () => void }) {
  const { t } = use${Name}Translation();
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: ${mutation},
    onSuccess: (saved) => {
      toast.success(t(${entityVar} ? "updated" : "created", { item: ${labelField ? `String(${access("saved", labelField)} ?? "")` : '""'} }));
      void queryClient.invalidateQueries({ queryKey: ${keys}.all });
      onClose();
    },
    onError: (error) => toast.danger(error.message),
  });

  return (
    <FormDialog
      // A new form for every row, so the default values apply
      key={${entityVar} ? String(${access(entityVar, idField)}) : "new"}
      open={${entityVar} !== undefined}
      onOpenChange={(open) => !open && onClose()}
      title={${entityVar} ? t("editTitle") : t("createTitle")}
      defaultValues={${entityVar} ? { ...${entityVar} } : ${JSON.stringify(defaults)}}
      fields={[
        ${input.map((f) => formField(f, "fields")).join(",\n        ")},
      ]}
      submitLabel={t("save")}
      onSubmit={(values) => save.mutateAsync(values as unknown as ${Entity}Input).then(() => undefined, () => undefined)}
    />
  );
}
`;
  }

  // ---------- locales
  const enumLabels = (lang) =>
    Object.fromEntries(
      [...fields, ...input, ...filters]
        .filter((f) => f.kind === "enum")
        .map((f) => [
          f.name,
          Object.fromEntries(f.values.map((v) => [v, lang === "zh" ? v : v.replace(/[-_]/g, " ")])),
        ]),
    );
  const fieldLabels = Object.fromEntries([...fields, ...input].map((f) => [f.name, f.label]));
  const filterLabels = Object.fromEntries(
    [...filters, ...(keyword ? [keyword] : [])].map((f) => [f.name, f.label]),
  );
  // The texts of the export, the ticked rows and the batch delete; only those the page uses
  const extra = (lang) => {
    const en = lang === "en";
    return {
      ...(selectable
        ? {
            exportSelected: en ? "Export selected" : "导出选中",
            selected: en ? "Selected: {{count}}" : "已选 {{count}} 项",
            clear: en ? "Clear" : "清除",
          }
        : {}),
      ...(removeMany
        ? {
            deleteSelected: en ? "Delete selected" : "删除选中",
            deleteManyConfirm: en
              ? "Delete the {{count}} selected rows?"
              : "确定删除选中的 {{count}} 条？",
            deletedMany: en ? "Deleted: {{count}}" : "已删除 {{count}} 条",
            deleteManyFailed: en ? "Could not delete: {{count}}" : "{{count}} 条删除失败",
          }
        : {}),
    };
  };
  const messages = {
    en: {
      title: model.title,
      description: `${model.title}, generated from the OpenAPI document (${model.path})`,
      create: `New ${kebab(Entity).replaceAll("-", " ")}`,
      createTitle: `New ${kebab(Entity).replaceAll("-", " ")}`,
      editTitle: `Edit ${kebab(Entity).replaceAll("-", " ")}`,
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
      deleteConfirm: "Delete {{item}}?",
      created: "Created {{item}}",
      updated: "Saved {{item}}",
      deleted: "Deleted {{item}}",
      ...extra("en"),
      empty: "Nothing here yet",
      loading: "Loading…",
      filter: { all: "All", search: "Search", reset: "Reset" },
      bool: { yes: "Yes", no: "No" },
      fields: fieldLabels,
      filters: filterLabels,
      enum: enumLabels("en"),
      ...(detail
        ? {
            detail: {
              back: "Back to list",
              notFound: "Not found",
              notFoundHint: tenant
                ? "This tenant has no item with ID {{id}}."
                : "There is no item with ID {{id}}.",
            },
          }
        : {}),
    },
    zh: {
      title: model.title,
      description: `${model.title}（由 OpenAPI 文档生成：${model.path}）`,
      create: "新建",
      createTitle: "新建",
      editTitle: "编辑",
      edit: "编辑",
      delete: "删除",
      cancel: "取消",
      save: "保存",
      deleteConfirm: "确定删除 {{item}}？",
      created: "已新建 {{item}}",
      updated: "已保存 {{item}}",
      deleted: "已删除 {{item}}",
      ...extra("zh"),
      empty: "暂无数据",
      loading: "加载中…",
      filter: { all: "全部", search: "查询", reset: "重置" },
      bool: { yes: "是", no: "否" },
      fields: fieldLabels,
      filters: filterLabels,
      enum: enumLabels("zh"),
      ...(detail
        ? {
            detail: {
              back: "返回列表",
              notFound: "数据不存在",
              notFoundHint: tenant
                ? "这个租户下没有 ID 为 {{id}} 的数据。"
                : "没有 ID 为 {{id}} 的数据。",
            },
          }
        : {}),
    },
  };
  files["locales/messages/en.json"] = json(messages.en);
  files["locales/messages/zh.json"] = json(messages.zh);
  files["locales/index.ts"] = `import { useModuleTranslation } from "@/lib/use-module-translation";
import en from "./messages/en.json";
import zh from "./messages/zh.json";

export function use${Name}Translation() {
  return useModuleTranslation(${JSON.stringify(ns)}, { en, zh });
}
`;

  files["_meta.ts"] = `import { List } from "lucide-react";
import type { PageMeta } from "@/lib/page-meta";

export const meta: PageMeta = {
  icon: List,
  label: { zh: ${JSON.stringify(model.title)}, en: ${JSON.stringify(model.title)} },
  order: 100,
};
`;

  // ---------- mocks, in the API's own response shape
  if (flags.mock) {
    // With tenant, each tenant sees its own rows (by id, so it needs one)
    const scoped = tenant && Boolean(idField);
    const usesNames = fields.some((f) => fakeOf(f, model).includes("NAMES"));
    const rows = fields.map((f) => `  ${key(f.name)}: ${fakeOf(f, model)},`).join("\n");
    files[`mocks/${entityKebab}-data.ts`] = `import type { ${Entity} } from "../api";
${usesNames ? `\nconst NAMES = ${JSON.stringify(NAMES)};\n` : ""}
/** In-memory rows for the mocks; changes last until the page reloads. */
export const ${entityVar}Rows: ${Entity}[] = Array.from({ length: 24 }, (_, i) => ({
${rows}
}));
${
  scoped
    ? `
const TENANT_IDS = ["acme", "globex", "initech"];

/** Each tenant has rows of its own: which tenant a row belongs to (round-robin over the mock tenants). */
export const ${entityVar}Tenants = new Map(
  ${entityVar}Rows.map((r, i) => [${access("r", idField)}, TENANT_IDS[i % TENANT_IDS.length]]),
);

/** The tenant a request is for (lib/http.ts sends it). */
export const tenantOf = (request: Request) => request.headers.get("X-Tenant-Id") ?? "";
`
    : ""
}`;
    const wrap = (payload) => (list.envelope ? `{ data: ${payload} }` : payload);
    const listPayload = list.itemsKey
      ? `{ ${key(list.itemsKey)}: items${list.totalKey ? `, ${key(list.totalKey)}: matched.length` : ""} }`
      : "items";
    const filterLines = [...filters, ...(keyword ? [keyword] : [])].map((f) => {
      const field = fields.find((x) => x.name === f.name);
      const param = `url.searchParams.get(${JSON.stringify(f.name)})`;
      if (field)
        return `    const ${camel(`f-${f.name}`)} = ${param};\n    if (${camel(`f-${f.name}`)}) matched = matched.filter((r) => String(${access("r", f.name)}).toLowerCase().includes(${camel(`f-${f.name}`)}.toLowerCase()));`;
      // A search parameter that isn't a field: match any text of the row
      return `    const ${camel(`f-${f.name}`)} = ${param}?.toLowerCase();\n    if (${camel(`f-${f.name}`)}) matched = matched.filter((r) => JSON.stringify(Object.values(r)).toLowerCase().includes(${camel(`f-${f.name}`)}));`;
    });
    const idOf = (expr) => (model.idType === "number" ? `Number(${expr})` : `String(${expr})`);
    const itemRoute = model.itemPath && JSON.stringify(`*${model.itemPath}`);
    const newId = !idField
      ? ""
      : model.idType === "number"
        ? `Math.max(0, ...${entityVar}Rows.map((r) => ${access("r", idField)})) + 1`
        : `\`${entityKebab}-\${Date.now()}\``;
    const byId = itemRoute && (editable || ops.remove || detail);
    const findCall = (id) => (scoped ? `findIndex(request, ${id})` : `findIndex(${id})`);
    const itemWrap = (payload) => (model.itemEnvelope ? `{ data: ${payload} }` : payload);
    files["mocks/handlers.ts"] = `import { delay, http, HttpResponse } from "msw";
${sort ? 'import { str } from "@/lib/list-query";\n' : ""}import type { ${Entity}${ops.create || editable ? `, ${Entity}Input` : ""} } from "../api";
import { ${entityVar}Rows${scoped ? `, ${entityVar}Tenants, tenantOf` : ""} } from "./${entityKebab}-data";
${itemRoute ? `\nconst notFound = () => HttpResponse.json({ message: "Not found" }, { status: 404 });\n` : ""}${
      byId
        ? scoped
          ? `\n/** The row with this id, of the request's tenant (another tenant's is not found), else -1. */\nconst findIndex = (request: Request, id: unknown) =>\n  ${entityVar}Rows.findIndex(\n    (r) => ${access("r", idField)} === ${idOf("id")} && ${entityVar}Tenants.get(${access("r", idField)}) === tenantOf(request),\n  );\n`
          : `\n/** The row with this id, else -1. */\nconst findIndex = (id: unknown) => ${entityVar}Rows.findIndex((r) => ${access("r", idField)} === ${idOf("id")});\n`
        : ""
    }
${sort ? `/** Numbers by value, anything else as text. */\nconst compare = (a: unknown, b: unknown) =>\n  typeof a === "number" && typeof b === "number" ? a - b : str(a).localeCompare(str(b));\n\n` : ""}export const handlers = [
  http.get(${JSON.stringify(`*${model.path}`)}, async (${hasParams || scoped ? "{ request }" : ""}) => {
    await delay(200);${hasParams ? "\n    const url = new URL(request.url);" : ""}
    let matched: ${Entity}[] = ${scoped ? `${entityVar}Rows.filter((r) => ${entityVar}Tenants.get(${access("r", idField)}) === tenantOf(request))` : `[...${entityVar}Rows]`};
${filterLines.join("\n")}
${
  sort
    ? sort.dir
      ? `    // Sorted as asked (${sort.by}, ${sort.dir}) before the page is cut
    const sortKey = url.searchParams.get(${JSON.stringify(sort.by)});
    if (sortKey) {
      const sign = /^desc/i.test(url.searchParams.get(${JSON.stringify(sort.dir)}) ?? "") ? -1 : 1;
      matched = [...matched].sort((a, b) => sign * compare((a as unknown as Record<string, unknown>)[sortKey], (b as unknown as Record<string, unknown>)[sortKey]));
    }
`
      : `    // Sorted as asked (${sort.by}=name or -name for descending) before the page is cut
    const sortValue = url.searchParams.get(${JSON.stringify(sort.by)});
    if (sortValue) {
      const sortKey = sortValue.replace(/^-/, "");
      const sign = sortValue.startsWith("-") ? -1 : 1;
      matched = [...matched].sort((a, b) => sign * compare((a as unknown as Record<string, unknown>)[sortKey], (b as unknown as Record<string, unknown>)[sortKey]));
    }
`
    : ""
}${
      pagination
        ? `    const page = Number(url.searchParams.get(${JSON.stringify(pagination.page)}) ?? 1);
    const pageSize = Number(url.searchParams.get(${JSON.stringify(pagination.pageSize)}) ?? 10);
    const items = matched.slice((page - 1) * pageSize, page * pageSize);`
        : "    const items = matched;"
    }
    return HttpResponse.json(${wrap(listPayload)});
  }),${
    ops.create
      ? `
  http.post(${JSON.stringify(`*${model.path}`)}, async ({ request }) => {
    const input = (await request.json()) as ${Entity}Input;
    const row = { ...input${
      !idField
        ? ""
        : input.some((f) => f.name === idField)
          ? `, ${key(idField)}: ${access("input", idField)} || ${newId}`
          : `, ${key(idField)}: ${newId}`
    } } as ${Entity};
    ${entityVar}Rows.unshift(row);${scoped ? `\n    ${entityVar}Tenants.set(${access("row", idField)}, tenantOf(request));` : ""}
    return HttpResponse.json(${wrap("row")}, { status: 201 });
  }),`
      : ""
  }${
    detail
      ? `
  http.get(${itemRoute}, async ({ params${scoped ? ", request" : ""} }) => {
    await delay(150);
    const index = ${findCall("params.id")};
    return index < 0 ? notFound() : HttpResponse.json(${itemWrap(`${entityVar}Rows[index]`)});
  }),`
      : ""
  }${
    editable
      ? `
  http.${ops.update}(${itemRoute}, async ({ params, request }) => {
    const index = ${findCall("params.id")};
    if (index < 0) return notFound();
    ${entityVar}Rows[index] = { ...${entityVar}Rows[index], ...((await request.json()) as ${Entity}Input) };
    return HttpResponse.json(${wrap(`${entityVar}Rows[index]`)});
  }),`
      : ""
  }${
    ops.remove
      ? `
  http.delete(${itemRoute}, ({ params${scoped ? ", request" : ""} }) => {
    const index = ${findCall("params.id")};
    if (index < 0) return notFound();
    ${entityVar}Rows.splice(index, 1);
    return HttpResponse.json(${wrap("null")});
  }),`
      : ""
  }
];
`;
  }
  return files;
}
