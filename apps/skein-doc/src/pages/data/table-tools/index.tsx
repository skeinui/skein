import { useState } from "react";
import {
  DataTable,
  Flex,
  TableTools,
  Tag,
  toast,
  useFixedHeader,
  useTableColumns,
} from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "table-tools" },
  { key: "columns", name: "table-tools-columns" },
];

interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
}
const PEOPLE: Person[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `Person ${i + 1}`,
  email: `person${i + 1}@example.com`,
  role: i % 3 === 0 ? "admin" : "viewer",
}));
const KEYS = ["name", "email", "role"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Usage() {
  const t = usePageT();
  const cols = useTableColumns(KEYS, (key) => t(`col.${key}`));
  const [refreshing, setRefreshing] = useState(false);
  return (
    <Flex direction="column" gap="sm">
      <Flex justify="end">
        <TableTools
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void wait(900).then(() => setRefreshing(false));
          }}
          {...cols.tools}
          onExport={() => toast.success(t("usage.exported", { count: PEOPLE.length }))}
        />
      </Flex>
      <DataTable
        rows={PEOPLE.slice(0, 4)}
        rowKey="id"
        loading={refreshing}
        columns={cols.shown.map((key) => ({
          key,
          title: t(`col.${key}`),
          render:
            key === "role"
              ? (p: Person) => (
                  <Tag size="sm" variant="soft" color={p.role === "admin" ? "primary" : "neutral"}>
                    {p.role}
                  </Tag>
                )
              : undefined,
        }))}
      />
    </Flex>
  );
}

function Csv() {
  return (
    <Flex justify="end">
      <TableTools
        exportCsv={() => ({
          filename: "people.csv",
          headers: ["Name", "Email", "Role"],
          rows: PEOPLE.map((p) => [p.name, p.email, p.role]),
        })}
      />
    </Flex>
  );
}

function Fixed() {
  const t = usePageT();
  const [fixed, setFixed] = useFixedHeader("docs-table-tools");
  return (
    <Flex direction="column" gap="sm">
      <Flex justify="end">
        <TableTools fixed={fixed} onFixedChange={setFixed} />
      </Flex>
      <div style={fixed ? { height: 200 } : undefined}>
        <DataTable
          stickyHeader={fixed}
          rows={PEOPLE}
          rowKey="id"
          columns={[
            { key: "name", title: t("col.name") },
            { key: "email", title: t("col.email") },
          ]}
        />
      </div>
    </Flex>
  );
}

export default function TableToolsPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Table Tools</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`// useTableColumns holds which columns are shown and in which order
const cols = useTableColumns(["name", "email", "role"], (key) => t(\`col.\${key}\`));

<TableTools
  onRefresh={() => refetch()}
  refreshing={isFetching}
  {...cols.tools}
  onExport={() => toast.success("exported")}
/>`}
      >
        <Usage />
      </Example>

      <Example
        id="csv"
        code={`<TableTools
  exportCsv={() => ({
    filename: "people.csv",
    headers: ["Name", "Email", "Role"],
    rows: people.map((p) => [p.name, p.email, p.role]),
  })}
/>`}
      >
        <Csv />
      </Example>

      <Example
        id="fixed"
        code={`const [fixed, setFixed] = useFixedHeader("people");

<TableTools fixed={fixed} onFixedChange={setFixed} />
<DataTable stickyHeader={fixed} … />`}
      >
        <Fixed />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="TableTools" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: t("styling.slot"),
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
