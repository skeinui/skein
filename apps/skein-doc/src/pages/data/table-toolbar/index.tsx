import { useState } from "react";
import { Button, Card, DataTable, Flex, TableTools, TableToolbar } from "@skeinui/ui";
import type { QueryField, QueryFilter } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

const ROWS = [
  { id: "T-1016", title: "Invite a teammate", status: "open" },
  { id: "T-1014", title: "Export fails with 500", status: "pending" },
  { id: "T-1013", title: "Charged twice", status: "open" },
  { id: "T-1009", title: "Bulk edit", status: "resolved" },
];

function Demo({ full }: { full?: boolean }) {
  const t = usePageT();
  const [keyword, setKeyword] = useState("");
  const [applied, setApplied] = useState("");
  const [filter, setFilter] = useState<QueryFilter | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const fields: QueryField[] = [
    { name: "title", label: t("fields.title"), type: "text" },
    {
      name: "status",
      label: t("fields.status"),
      type: "enum",
      options: [
        { value: "open", label: t("status.open") },
        { value: "pending", label: t("status.pending") },
        { value: "resolved", label: t("status.resolved") },
      ],
    },
  ];
  const rows = ROWS.filter(
    (r) =>
      (!applied || r.title.toLowerCase().includes(applied.toLowerCase())) &&
      (!filter ||
        !("field" in filter) ||
        filter.field !== "status" ||
        filter.op !== "eq" ||
        r.status === filter.value),
  );
  return (
    <Card>
      <Card.Body>
        <Flex direction="column" gap="md">
          <TableToolbar
            keyword={full ? keyword : undefined}
            onKeywordChange={full ? setKeyword : undefined}
            onSearch={(value) => setApplied(value)}
            searchPlaceholder={t("usage.placeholder")}
            fields={full ? fields : undefined}
            filter={filter}
            onFilterChange={full ? setFilter : undefined}
            onReset={() => {
              setKeyword("");
              setApplied("");
              setFilter(undefined);
            }}
            below={
              full ? (
                <Flex>
                  <Button size="sm" variant="ghost" disabled={!applied && !filter}>
                    {t("parts.saveView")}
                  </Button>
                </Flex>
              ) : undefined
            }
            tools={
              <TableTools
                onRefresh={() => {
                  setRefreshing(true);
                  setTimeout(() => setRefreshing(false), 800);
                }}
                refreshing={refreshing}
              />
            }
          />
          {/* Searching leaves fewer rows: the table keeps its room, so the page below the example does not jump */}
          <div className="pg-table-slot">
            <DataTable
              rows={rows}
              rowKey="id"
              columns={[
                { key: "id", title: t("fields.id"), nowrap: true },
                { key: "title", title: t("fields.title") },
                { key: "status", title: t("fields.status") },
              ]}
            />
          </div>
        </Flex>
      </Card.Body>
    </Card>
  );
}

export default function TableToolbarPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Table Toolbar</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`// The box keeps what is typed itself; pass keyword / onKeywordChange to set it from outside
<TableToolbar
  onSearch={(value) => search({ keyword: value, filter })}
  searchPlaceholder="Search…"
  onReset={reset}
  tools={<TableTools onRefresh={refresh} refreshing={isFetching} />}
/>
<DataTable … />`}
      >
        <Demo />
      </Example>

      <Example
        id="parts"
        code={`<TableToolbar
  keyword={keyword}
  onKeywordChange={setKeyword}
  onSearch={…}
  fields={fields}
  filter={filter}
  onFilterChange={setFilter}
  onReset={reset}
  below={<Button size="sm" variant="ghost">Save as a view</Button>}
  tools={<TableTools … />}
/>`}
      >
        <Demo full />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="TableToolbar" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
