import { useState } from "react";
import { DataTable, Flex, TableTools, Tag, toast, useFixedHeader } from "@skeinui/ui";
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
  const [order, setOrder] = useState<string[]>([...KEYS]);
  const [visible, setVisible] = useState<string[]>([...KEYS]);
  const [refreshing, setRefreshing] = useState(false);
  const shown = order.filter((k) => visible.includes(k));
  return (
    <Flex direction="column" gap="sm">
      <Flex justify="end">
        <TableTools
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void wait(900).then(() => setRefreshing(false));
          }}
          columns={order.map((key) => ({ key, label: t(`col.${key}`) }))}
          visible={visible}
          onVisibleChange={setVisible}
          onOrderChange={setOrder}
          onExport={() => toast.success(t("usage.exported", { count: PEOPLE.length }))}
        />
      </Flex>
      <DataTable
        rows={PEOPLE.slice(0, 4)}
        rowKey="id"
        loading={refreshing}
        columns={shown.map((key) => ({
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
        code={`<TableTools
  onRefresh={() => refetch()}
  refreshing={isFetching}
  columns={order.map((key) => ({ key, label: t(\`col.\${key}\`) }))}
  visible={visible}
  onVisibleChange={setVisible}
  onOrderChange={setOrder}
  onExport={() => downloadCsv("people.csv", header, rows)}
/>`}
      >
        <Usage />
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
