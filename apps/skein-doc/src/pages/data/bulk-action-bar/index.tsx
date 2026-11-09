import { useState } from "react";
import { BulkActionBar, Button, Card, DataTable, MenuButton, toast } from "@skeinui/ui";
import type { BulkActionBarProps } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

const ROWS = [
  { id: "T-1016", title: "Invite a teammate", status: "open" },
  { id: "T-1014", title: "Export fails with 500", status: "pending" },
  { id: "T-1013", title: "Charged twice", status: "open" },
  { id: "T-1009", title: "Bulk edit", status: "resolved" },
];

function Demo({
  placement,
  floating,
}: {
  placement: BulkActionBarProps["placement"];
  floating?: boolean;
}) {
  const t = usePageT();
  const [selected, setSelected] = useState<string[]>(["T-1016", "T-1013"]);
  return (
    <Card>
      <Card.Body>
        <div className="pg-stack pg-stack--start">
          {placement === "top" ? (
            <BulkActionBar
              floating={floating}
              count={selected.length}
              onClear={() => setSelected([])}
            >
              <Actions count={selected.length} />
            </BulkActionBar>
          ) : null}
          <DataTable
            rows={ROWS}
            rowKey="id"
            selected={selected}
            onSelectedChange={(keys) => setSelected(keys.map(String))}
            columns={[
              { key: "id", title: t("cols.id"), nowrap: true },
              { key: "title", title: t("cols.title") },
              { key: "status", title: t("cols.status") },
            ]}
          />
          {placement === "bottom" ? (
            <BulkActionBar
              placement="bottom"
              floating={floating}
              count={selected.length}
              onClear={() => setSelected([])}
            >
              <Actions count={selected.length} />
            </BulkActionBar>
          ) : null}
        </div>
      </Card.Body>
    </Card>
  );
}

function Actions({ count }: { count: number }) {
  const t = usePageT();
  return (
    <>
      <MenuButton
        size="sm"
        items={[
          { key: "ada", label: "Ada Lin" },
          { key: "ben", label: "Ben Carter" },
        ]}
        onSelect={(key) => toast.success(t("usage.assigned", { count, key }))}
      >
        {t("usage.assign")}
      </MenuButton>
      <Button
        size="sm"
        variant="outline"
        color="danger"
        onClick={() => toast(t("usage.deleted", { count }))}
      >
        {t("usage.delete")}
      </Button>
    </>
  );
}

export default function BulkActionBarPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Bulk Action Bar</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`const [selected, setSelected] = useState<string[]>([]);

<BulkActionBar
              floating={floating}
              count={selected.length}
              onClear={() => setSelected([])}
            >
  <MenuButton size="sm" items={agents} onSelect={assign}>Assign to</MenuButton>
  <Button size="sm" variant="outline" color="danger" onClick={remove}>Delete</Button>
</BulkActionBar>
<DataTable rows={rows} rowKey="id" selected={selected} onSelectedChange={setSelected} columns={columns} />`}
      >
        <Demo placement="top" />
      </Example>

      <Example
        id="placement"
        code={`<DataTable … />
<BulkActionBar placement="bottom" count={selected.length} onClear={clear}>…</BulkActionBar>`}
      >
        <Demo placement="bottom" />
      </Example>

      <Example
        id="floating"
        code={`<BulkActionBar floating placement="bottom" count={selected.length} onClear={clear}>…</BulkActionBar>`}
      >
        <Demo placement="bottom" floating />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="BulkActionBar" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
