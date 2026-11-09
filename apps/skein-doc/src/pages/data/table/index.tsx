import { Checkbox, Pagination, Table, Tag, type TableEditValue, type TableSort } from "@skeinui/ui";
import { useMemo, useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

interface Row {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending" | "disabled";
  logins: number;
}

const NAMES = [
  "Ann Lee",
  "Bob Chen",
  "Cara Diaz",
  "Dan Evans",
  "Eve Foster",
  "Finn Gray",
  "Gia Hart",
  "Hal Ito",
  "Ivy Jones",
  "Jon Kim",
  "Kai Liu",
  "Lena Moss",
  "Max Ng",
  "Nia Ortiz",
  "Omar Park",
  "Pia Quinn",
  "Raj Shah",
  "Sue Tran",
  "Tom Ueda",
  "Uma Vega",
  "Vic Wong",
  "Wen Xu",
  "Xi Yang",
  "Yan Zhou",
  "Zed Abel",
];
const ROLES = ["Owner", "Admin", "Developer", "Viewer"];
const STATUSES = ["active", "pending", "disabled"] as const;
const ROWS: Row[] = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
  role: ROLES[i % ROLES.length],
  status: STATUSES[i % STATUSES.length],
  logins: (i * 37) % 120,
}));

const FIXED_COLUMNS = ["email", "role", "team", "region", "plan"] as const;

const STATUS_COLOR = { active: "success", pending: "warning", disabled: "neutral" } as const;

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "table-container / table" },
  { key: "sections", name: "table-header / table-body / table-footer / table-caption" },
  { key: "cells", name: "table-row / table-head / table-cell" },
  { key: "sort", name: "table-sort-button / table-head-content / table-sort-icon" },
  { key: "empty", name: "table-empty" },
];

/** The parts with props of their own, each with its API table. */
const PARTS = [
  "Table.Row",
  "Table.Head",
  "Table.Cell",
  "Table.EditableCell",
  "Table.ExpandButton",
  "Table.ExpandedRow",
  "Table.Empty",
];

function SimpleTable({
  rows,
  ...props
}: { rows: Row[] } & Omit<React.ComponentProps<typeof Table>, "children">) {
  const t = usePageT();
  return (
    <Table {...props}>
      <Table.Header>
        <Table.Row>
          <Table.Head>{t("demo.name")}</Table.Head>
          <Table.Head>{t("demo.email")}</Table.Head>
          <Table.Head>{t("demo.role")}</Table.Head>
          <Table.Head>{t("demo.status")}</Table.Head>
          <Table.Head align="end">{t("demo.logins")}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((r) => (
          <Table.Row key={r.id}>
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>{r.email}</Table.Cell>
            <Table.Cell>{r.role}</Table.Cell>
            <Table.Cell>
              <Tag color={STATUS_COLOR[r.status]} size="sm">
                {r.status}
              </Tag>
            </Table.Cell>
            <Table.Cell align="end">{r.logins}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

function SortingDemo() {
  const t = usePageT();
  const [sort, setSort] = useState<{ key: keyof Row; dir: TableSort } | null>({
    key: "logins",
    dir: "desc",
  });
  const rows = useMemo(() => {
    const data = ROWS.slice(0, 6);
    if (!sort) return data;
    return [...data].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      const r =
        typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? r : -r;
    });
  }, [sort]);
  const next = (key: keyof Row) =>
    setSort((s) =>
      s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null,
    );
  const head = (key: keyof Row, label: string, align?: "end") => (
    <Table.Head
      sortable
      align={align}
      sort={sort?.key === key ? sort.dir : undefined}
      onSort={() => next(key)}
    >
      {label}
    </Table.Head>
  );
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          {head("name", t("demo.name"))}
          {head("role", t("demo.role"))}
          {head("status", t("demo.status"))}
          {head("logins", t("demo.logins"), "end")}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((r) => (
          <Table.Row key={r.id}>
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>{r.role}</Table.Cell>
            <Table.Cell>{r.status}</Table.Cell>
            <Table.Cell align="end">{r.logins}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

function SelectionDemo() {
  const t = usePageT();
  const rows = ROWS.slice(0, 5);
  const [selected, setSelected] = useState<Set<number>>(new Set([2]));
  const all = selected.size === rows.length;
  const some = selected.size > 0 && !all;
  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head kind="select">
            <Checkbox
              aria-label={t("demo.selectAll")}
              checked={all}
              indeterminate={some}
              onCheckedChange={(c) => setSelected(c ? new Set(rows.map((r) => r.id)) : new Set())}
            />
          </Table.Head>
          <Table.Head>{t("demo.name")}</Table.Head>
          <Table.Head>{t("demo.email")}</Table.Head>
          <Table.Head>{t("demo.role")}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((r) => (
          <Table.Row key={r.id} selected={selected.has(r.id)}>
            <Table.Cell kind="select">
              <Checkbox
                aria-label={t("demo.selectRow", { name: r.name })}
                checked={selected.has(r.id)}
                onCheckedChange={() => toggle(r.id)}
              />
            </Table.Cell>
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>{r.email}</Table.Cell>
            <Table.Cell>{r.role}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

const RESIZE_COLUMNS = [
  { key: "name", min: 100 },
  { key: "email", min: 140 },
  { key: "role", min: 80 },
] as const;

function ResizeDemo() {
  const t = usePageT();
  const [widths, setWidths] = useState<Record<string, number>>({
    name: 160,
    email: 240,
    role: 120,
  });
  return (
    <Table aria-label={t("resize.title")} bordered>
      <Table.Header>
        <Table.Row>
          {RESIZE_COLUMNS.map((c) => (
            <Table.Head
              key={c.key}
              resizable
              width={widths[c.key]}
              minWidth={c.min}
              maxWidth={420}
              onResize={(w) => setWidths((prev) => ({ ...prev, [c.key]: w }))}
            >
              {t(`demo.${c.key}`)}
            </Table.Head>
          ))}
          <Table.Head>{t("demo.status")}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {ROWS.slice(0, 5).map((r) => (
          <Table.Row key={r.id}>
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>{r.email}</Table.Cell>
            <Table.Cell>{r.role}</Table.Cell>
            <Table.Cell>
              <Tag color={STATUS_COLOR[r.status]}>{r.status}</Tag>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

function ExpandDemo() {
  const t = usePageT();
  const [open, setOpen] = useState<number[]>([2]);
  const toggle = (id: number) =>
    setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const rows = ROWS.slice(0, 4);
  const ids = rows.map((r) => r.id);
  const allOpen = ids.every((id) => open.includes(id));
  return (
    <Table aria-label={t("expand.title")} bordered striped>
      <Table.Header>
        <Table.Row>
          <Table.Head kind="expand">
            <Table.ExpandButton
              expanded={allOpen}
              aria-label={t(allOpen ? "demo.collapseAll" : "demo.expandAll")}
              onToggle={() => setOpen(allOpen ? [] : ids)}
            />
          </Table.Head>
          <Table.Head>{t("demo.name")}</Table.Head>
          <Table.Head>{t("demo.role")}</Table.Head>
          <Table.Head>{t("demo.status")}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.flatMap((r) => {
          const expanded = open.includes(r.id);
          return [
            <Table.Row key={r.id} expanded={expanded}>
              <Table.Cell kind="expand">
                <Table.ExpandButton
                  expanded={expanded}
                  aria-controls={`detail-${r.id}`}
                  aria-label={t(expanded ? "demo.collapseRow" : "demo.expandRow", { name: r.name })}
                  onToggle={() => toggle(r.id)}
                />
              </Table.Cell>
              <Table.Cell>{r.name}</Table.Cell>
              <Table.Cell>{r.role}</Table.Cell>
              <Table.Cell>
                <Tag color={STATUS_COLOR[r.status]}>{r.status}</Tag>
              </Table.Cell>
            </Table.Row>,
            expanded ? (
              <Table.ExpandedRow key={`${r.id}-detail`} id={`detail-${r.id}`} colSpan={4}>
                {r.email} · {t("demo.loginCount", { n: r.logins })}
              </Table.ExpandedRow>
            ) : null,
          ];
        })}
      </Table.Body>
    </Table>
  );
}

function EditDemo() {
  const t = usePageT();
  const [rows, setRows] = useState(() => ROWS.slice(0, 4));
  const update = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const roles = ROLES.map((r) => ({ value: r, label: r }));
  return (
    <Table aria-label={t("editable.title")} bordered>
      <Table.Header>
        <Table.Row>
          <Table.Head>{t("demo.name")}</Table.Head>
          <Table.Head>{t("demo.role")}</Table.Head>
          <Table.Head align="end">{t("demo.logins")}</Table.Head>
          <Table.Head>{t("demo.status")}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((r) => (
          <Table.Row key={r.id}>
            <Table.EditableCell
              label={t("demo.name")}
              value={r.name}
              validate={(v) => (v === "" ? t("demo.nameRequired") : null)}
              onCommit={(v) => update(r.id, { name: String(v) })}
            />
            <Table.EditableCell
              label={t("demo.role")}
              type="select"
              options={roles}
              value={r.role}
              onCommit={(v) => update(r.id, { role: String(v) })}
            />
            <Table.EditableCell
              label={t("demo.logins")}
              type="number"
              align="end"
              value={r.logins}
              validate={(v: TableEditValue) =>
                typeof v === "number" && (v < 0 || v > 999) ? "0 – 999" : null
              }
              onCommit={(v) => update(r.id, { logins: Number(v ?? 0) })}
            />
            <Table.Cell>
              <Tag color={STATUS_COLOR[r.status]}>{r.status}</Tag>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

function PaginationDemo() {
  const [page, setPage] = useState(2);
  const [pageSize, setPageSize] = useState(5);
  const rows = ROWS.slice((page - 1) * pageSize, page * pageSize);
  return (
    <div className="pg-stack">
      <SimpleTable rows={rows} />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={ROWS.length}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        pageSizeOptions={[5, 10, 20]}
      />
    </div>
  );
}

export default function TablePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Table</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Table } from "@skeinui/ui";

<Table>
  <Table.Header>
    <Table.Row>
      <Table.Head>Name</Table.Head>
      <Table.Head align="end">Logins</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>Ann Lee</Table.Cell>
      <Table.Cell align="end">42</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>`}
      >
        <SimpleTable rows={ROWS.slice(0, 5)} />
      </Example>

      <DocHeading id="examples" />

      <Example
        id="sorting"
        code={`<Table.Head sortable sort={sort?.key === "name" ? sort.dir : undefined} onSort={() => toggle("name")}>
  Name
</Table.Head>`}
      >
        <SortingDemo />
      </Example>

      <Example
        id="resize"
        code={`const [widths, setWidths] = useState({ name: 160, email: 240 });

<Table.Head
  resizable
  width={widths.name}
  minWidth={100}
  maxWidth={420}
  onResize={(w) => setWidths((p) => ({ ...p, name: w }))}
>
  Name
</Table.Head>
<Table.Head>Status</Table.Head> {/* no width */}`}
      >
        <ResizeDemo />
      </Example>

      <Example
        id="selection"
        code={`<Table.Head kind="select"><Checkbox aria-label="Select all" … /></Table.Head>
…
<Table.Row selected={selected.has(id)}>
  <Table.Cell kind="select"><Checkbox … /></Table.Cell>
</Table.Row>`}
      >
        <SelectionDemo />
      </Example>

      <Example
        id="pagination"
        code={`<Table>…</Table>
<Pagination page={page} pageSize={pageSize} total={total}
  onPageChange={setPage} onPageSizeChange={setPageSize} />`}
      >
        <PaginationDemo />
      </Example>

      <Example id="striped" code={`<Table striped bordered>…</Table>`}>
        <SimpleTable rows={ROWS.slice(0, 5)} striped bordered />
      </Example>

      <Example id="sizes" code={`<Table size="sm">…</Table>`}>
        <div className="pg-stack">
          <SimpleTable rows={ROWS.slice(0, 3)} size="sm" bordered />
          <SimpleTable rows={ROWS.slice(0, 3)} size="md" bordered />
          <SimpleTable rows={ROWS.slice(0, 3)} size="lg" bordered />
        </div>
      </Example>

      <Example
        id="sticky"
        code={`<div style={{ height: 240 }}>
  <Table stickyHeader>…</Table>
</div>`}
      >
        <div style={{ height: 240 }}>
          <SimpleTable rows={ROWS} stickyHeader bordered />
        </div>
      </Example>

      <Example
        id="fixed"
        code={`<Table>
  <Table.Head fixed="start">Name</Table.Head> … <Table.Head fixed="end">Actions</Table.Head>
  <Table.Cell fixed="start">…</Table.Cell> … <Table.Cell fixed="end">…</Table.Cell>
</Table>
// Pinned columns go first / last; the table scrolls only when it is wider than its container (columns get a min width here, pinned ones too, or they get squeezed and wrap)`}
      >
        <Table aria-label={t("fixed.title")} bordered>
          <Table.Header>
            <Table.Row>
              <Table.Head fixed="start">
                <span style={{ display: "inline-block", minWidth: 120 }}>{t("demo.name")}</span>
              </Table.Head>
              {FIXED_COLUMNS.map((h) => (
                <Table.Head key={h}>
                  <span style={{ display: "inline-block", minWidth: 140 }}>{t(`demo.${h}`)}</span>
                </Table.Head>
              ))}
              <Table.Head fixed="end" align="end">
                <span style={{ display: "inline-block", minWidth: 80 }}>{t("demo.actions")}</span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {ROWS.slice(0, 4).map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell fixed="start">{r.name}</Table.Cell>
                {FIXED_COLUMNS.map((h) => (
                  <Table.Cell key={h}>
                    {h === "email" ? r.email : `${t(`demo.${h}`)} ${r.id}`}
                  </Table.Cell>
                ))}
                <Table.Cell fixed="end" align="end">
                  {t("demo.edit")}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Example>

      <Example
        id="expand"
        code={`// header: expand all / collapse all
<Table.Head kind="expand">
  <Table.ExpandButton
    expanded={allOpen}
    aria-label={allOpen ? "Collapse all rows" : "Expand all rows"}
    onToggle={() => setOpen(allOpen ? [] : ids)}
  />
</Table.Head>

<Table.Row expanded={expanded}>
  <Table.Cell kind="expand">
    <Table.ExpandButton expanded={expanded} aria-controls={\`detail-\${id}\`} onToggle={toggle} />
  </Table.Cell>
  …
</Table.Row>
{expanded ? <Table.ExpandedRow id={\`detail-\${id}\`} colSpan={4}>…</Table.ExpandedRow> : null}`}
      >
        <ExpandDemo />
      </Example>

      <Example
        id="editable"
        code={`<Table.EditableCell
  label="Name"
  value={row.name}
  validate={(v) => (v === "" ? "Name is required" : null)}
  onCommit={(v) => update(row.id, { name: String(v) })}
/>
<Table.EditableCell label="Role" type="select" options={roles} value={row.role} onCommit={…} />
<Table.EditableCell label="Logins" type="number" align="end" value={row.logins} onCommit={…} />`}
      >
        <EditDemo />
      </Example>

      <Example
        id="empty"
        code={`<Table.Empty colSpan={5}>No data</Table.Empty>
<Table loading>…</Table>`}
      >
        <div className="pg-stack">
          <Table bordered>
            <Table.Header>
              <Table.Row>
                <Table.Head>{t("demo.name")}</Table.Head>
                <Table.Head>{t("demo.email")}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Empty colSpan={2}>{t("demo.noData")}</Table.Empty>
            </Table.Body>
          </Table>
          <SimpleTable rows={ROWS.slice(0, 3)} loading bordered />
        </div>
      </Example>

      <Example
        id="footer"
        code={`<Table.Footer>…</Table.Footer>
<Table.Caption>A list of users.</Table.Caption>`}
      >
        <Table bordered>
          <Table.Caption>{t("demo.caption")}</Table.Caption>
          <Table.Header>
            <Table.Row>
              <Table.Head>{t("demo.name")}</Table.Head>
              <Table.Head align="end">{t("demo.logins")}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {ROWS.slice(0, 3).map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell>{r.name}</Table.Cell>
                <Table.Cell align="end">{r.logins}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.Cell>{t("demo.total")}</Table.Cell>
              <Table.Cell align="end">
                {ROWS.slice(0, 3).reduce((a, r) => a + r.logins, 0)}
              </Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Table" />
        <p className="pg-desc">{t.rich("api.sections")}</p>
        {PARTS.map((part) => (
          <div key={part}>
            <h4>{part}</h4>
            <ApiReference component={part} />
          </div>
        ))}
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "data-slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
