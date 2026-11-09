import { useMemo, useState } from "react";
import { Button, DataTable, Tag, toast } from "@skeinui/ui";
import type { DataTableSort } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

interface Person {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  active: boolean;
}

const PEOPLE: Person[] = [
  { id: "1", name: "Ada Lin", email: "ada@example.com", role: "admin", active: true },
  { id: "2", name: "Ben Carter", email: "ben@example.com", role: "editor", active: true },
  { id: "3", name: "Chen Yu", email: "chen@example.com", role: "viewer", active: false },
  { id: "4", name: "Dana Wu", email: "dana@example.com", role: "editor", active: true },
];

const MANY: Person[] = Array.from({ length: 14 }, (_, i) => ({
  id: String(i + 1),
  name: `Person ${i + 1}`,
  email: `person${i + 1}@example.com`,
  role: "viewer",
  active: true,
}));

/** The fields of a column, and of an action; their descriptions are the page's `column.<key>` and `action.<key>` messages. */
const COLUMN_ROWS = [
  { key: "key", name: "key", type: "string" },
  { key: "titleField", name: "title", type: "ReactNode" },
  { key: "render", name: "render", type: "(row, index) => ReactNode" },
  { key: "align", name: "align / width / fixed", type: "—" },
  { key: "sortable", name: "sortable", type: "boolean" },
  { key: "nowrap", name: "nowrap", type: "boolean" },
];
const ACTION_ROWS = [
  { key: "key", name: "key", type: "string" },
  { key: "label", name: "label", type: "ReactNode" },
  { key: "color", name: "color", type: "primary | danger | neutral" },
  {
    key: "confirm",
    name: "confirm",
    type: "ReactNode | { title, description?, confirmLabel?, cancelLabel? }",
  },
  { key: "onClick", name: "onClick", type: "() => void | Promise<void>" },
];

/** The styling hooks the component relies on; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [{ key: "composed", name: "table / checkbox / button / popconfirm …" }];

const COLUMNS = (t: (key: string) => string) => [
  { key: "name", title: t("col.name"), sortable: true },
  { key: "email", title: t("col.email") },
  {
    key: "role",
    title: t("col.role"),
    render: (p: Person) => (
      <Tag size="sm" variant="soft" color={p.role === "admin" ? "primary" : "neutral"}>
        {p.role}
      </Tag>
    ),
  },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Usage() {
  const t = usePageT();
  return <DataTable rows={PEOPLE} rowKey="id" columns={COLUMNS(t)} />;
}

function Actions() {
  const t = usePageT();
  const [rows, setRows] = useState(PEOPLE);
  return (
    <DataTable
      rows={rows}
      rowKey="id"
      columns={COLUMNS(t)}
      actions={(p) => [
        {
          key: "edit",
          label: t("action.edit"),
          onClick: () => toast.info(t("action.editing", { name: p.name })),
        },
        // A falsy entry is skipped: an admin cannot be deleted
        p.role !== "admin" && {
          key: "delete",
          label: t("action.delete"),
          color: "danger",
          confirm: t("action.deleteConfirm", { name: p.name }),
          onClick: async () => {
            await wait(600);
            setRows((r) => r.filter((x) => x.id !== p.id));
          },
        },
      ]}
    />
  );
}

function Selection() {
  const t = usePageT();
  const [selected, setSelected] = useState<string[]>(["2"]);
  return (
    <div className="pg-stack">
      <DataTable
        rows={PEOPLE}
        rowKey="id"
        columns={COLUMNS(t)}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <span>{t("selection.count", { count: selected.length })}</span>
    </div>
  );
}

function Sorting() {
  const t = usePageT();
  const [sort, setSort] = useState<DataTableSort | null>({ key: "name", order: "desc" });
  const rows = useMemo(() => {
    const sorted = [...PEOPLE];
    if (sort) sorted.sort((a, b) => a.name.localeCompare(b.name) * (sort.order === "asc" ? 1 : -1));
    return sorted;
  }, [sort]);
  return (
    <DataTable rows={rows} rowKey="id" columns={COLUMNS(t)} sort={sort} onSortChange={setSort} />
  );
}

function States() {
  const t = usePageT();
  const [loading, setLoading] = useState(false);
  return (
    <div className="pg-stack">
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setLoading(true);
          void wait(1500).then(() => setLoading(false));
        }}
      >
        {t("states.load")}
      </Button>
      <DataTable rows={[]} rowKey="id" columns={COLUMNS(t)} loading={loading} />
      <DataTable rows={[]} rowKey="id" columns={COLUMNS(t)} empty={t("states.empty")} />
    </div>
  );
}

function RowClick() {
  const t = usePageT();
  const [active, setActive] = useState<string>();
  const person = PEOPLE.find((p) => p.id === active);
  return (
    <div className="pg-stack">
      <DataTable
        rows={PEOPLE}
        rowKey="id"
        columns={[
          { key: "name", title: t("col.name") },
          { key: "email", title: t("col.email"), nowrap: true },
        ]}
        activeKey={active}
        onRowClick={(row) => setActive(row.id)}
      />
      <p className="pg-desc">
        {person ? t("rowclick.open", { name: person.name }) : t("rowclick.none")}
      </p>
    </div>
  );
}

export default function DataTablePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Data Table</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { DataTable } from "@skeinui/ui";

<DataTable
  rows={people}
  rowKey="id"
  columns={[
    { key: "name", title: "Name", sortable: true },
    { key: "email", title: "Email" },
    { key: "role", title: "Role", render: (p) => <Tag>{p.role}</Tag> },
  ]}
/>`}
      >
        <Usage />
      </Example>

      <Example
        id="actions"
        code={`<DataTable
  rows={rows}
  rowKey="id"
  columns={columns}
  actions={(p) => [
    { key: "edit", label: "Edit", onClick: () => edit(p) },
    // a falsy entry is skipped: a permission reads naturally
    p.role !== "admin" && {
      key: "delete",
      label: "Delete",
      color: "danger",
      confirm: \`Delete \${p.name}?\`,
      onClick: () => remove(p.id), // a promise: the confirm button spins
    },
  ]}
/>`}
      >
        <Actions />
      </Example>

      <Example
        id="selection"
        code={`const [selected, setSelected] = useState<string[]>([]);

<DataTable
  rows={people}
  rowKey="id"
  columns={columns}
  selected={selected}
  onSelectedChange={setSelected}
/>`}
      >
        <Selection />
      </Example>

      <Example
        id="sorting"
        code={`const [sort, setSort] = useState<DataTableSort | null>(null);

// the button goes ascending, then descending, then null; sorting the rows is yours
<DataTable rows={sorted} rowKey="id" columns={columns} sort={sort} onSortChange={setSort} />`}
      >
        <Sorting />
      </Example>

      <Example
        id="states"
        code={`<DataTable rows={[]} rowKey="id" columns={columns} loading={loading} />
<DataTable rows={[]} rowKey="id" columns={columns} empty="Nobody here yet" />`}
      >
        <States />
      </Example>

      <Example
        id="rowclick"
        code={`<DataTable
  rows={people}
  rowKey="id"
  columns={columns}
  activeKey={openId}
  onRowClick={(row) => setOpenId(row.id)}
/>`}
      >
        <RowClick />
      </Example>

      <Example
        id="sticky"
        code={`<div style={{ height: 220 }}>
  <DataTable stickyHeader rows={people} rowKey="id" columns={columns} />
</div>`}
      >
        <div style={{ height: 220 }}>
          <DataTable
            stickyHeader
            rows={MANY}
            rowKey="id"
            columns={[
              { key: "name", title: t("col.name") },
              { key: "email", title: t("col.email") },
            ]}
          />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="DataTable" />
      </section>

      <section id="column" className="pg-example">
        <h3>{t("column.title")}</h3>
        <PropsTable
          first={t("column.field")}
          rows={COLUMN_ROWS.map((r) => ({
            name: r.name,
            type: r.type,
            description: t(`column.${r.key}`),
          }))}
        />
      </section>

      <section id="action" className="pg-example">
        <h3>{t("action.title")}</h3>
        <PropsTable
          first={t("column.field")}
          rows={ACTION_ROWS.map((r) => ({
            name: r.name,
            type: r.type,
            description: t(`action.${r.key}`),
          }))}
        />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: t("styling.existing"),
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
