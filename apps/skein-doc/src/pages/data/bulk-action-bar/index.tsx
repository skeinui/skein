import { useState } from "react";
import {
  BulkActionBar,
  Button,
  Card,
  DataTable,
  Flex,
  MenuButton,
  NumberField,
  Segmented,
  toast,
} from "@skeinui/ui";
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
  placement: initialPlacement,
  floating,
  switchable,
  initial = ["T-1016", "T-1013"],
}: {
  placement: NonNullable<BulkActionBarProps["placement"]>;
  floating?: boolean;
  /** A switch for the top / bottom placement. */
  switchable?: boolean;
  initial?: string[];
}) {
  const t = usePageT();
  const [selected, setSelected] = useState<string[]>(initial);
  const [placement, setPlacement] = useState(initialPlacement);
  const [floatingIn, setFloatingIn] = useState<"inside" | "outside">("inside");
  const [offset, setOffset] = useState(8);
  const bar = (
    <BulkActionBar
      placement={placement}
      floating={floating}
      floatingIn={floatingIn}
      offset={floating ? offset : undefined}
      count={selected.length}
      onClear={() => setSelected([])}
    >
      <Actions count={selected.length} />
    </BulkActionBar>
  );
  return (
    <Card>
      <Card.Body>
        <div className="pg-stack">
          {switchable ? (
            <Flex gap="md" align="center" wrap>
              <Segmented
                size="sm"
                aria-label={t("placement.label")}
                value={placement}
                onValueChange={(v) => setPlacement(v as typeof placement)}
                options={[
                  { value: "top", label: t("placement.top") },
                  { value: "bottom", label: t("placement.bottom") },
                ]}
              />
              {floating ? (
                <Segmented
                  size="sm"
                  aria-label={t("floating.in")}
                  value={floatingIn}
                  onValueChange={(v) => setFloatingIn(v as typeof floatingIn)}
                  options={[
                    { value: "inside", label: t("floating.inside") },
                    { value: "outside", label: t("floating.outside") },
                  ]}
                />
              ) : null}
              {floating ? (
                <NumberField
                  size="sm"
                  aria-label={t("floating.offset")}
                  value={offset}
                  min={-48}
                  max={96}
                  step={4}
                  onValueChange={(v) => setOffset(v ?? 0)}
                />
              ) : null}
            </Flex>
          ) : null}
          <div>
            {placement === "top" ? bar : null}
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
            {placement === "bottom" ? bar : null}
          </div>
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
        <Demo placement="bottom" switchable />
      </Example>

      <Example
        id="floating"
        code={`<BulkActionBar floating floatingIn="inside" placement="bottom" count={selected.length} onClear={clear}>…</BulkActionBar>`}
      >
        <Demo placement="bottom" floating switchable initial={[]} />
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
