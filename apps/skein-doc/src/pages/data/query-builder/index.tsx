import { useState } from "react";
import { QueryBuilder, Text } from "@skeinui/ui";
import type { QueryField, QueryFilter } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

function useFields(): QueryField[] {
  const t = usePageT();
  return [
    { name: "name", label: t("fields.name"), type: "text" },
    {
      name: "status",
      label: t("fields.status"),
      type: "enum",
      options: [
        { value: "paid", label: t("fields.paid") },
        { value: "shipped", label: t("fields.shipped") },
        { value: "refunded", label: t("fields.refunded") },
      ],
    },
    { name: "amount", label: t("fields.amount"), type: "number" },
    { name: "created", label: t("fields.created"), type: "date" },
    { name: "vip", label: t("fields.vip"), type: "boolean" },
  ];
}

const PRESET: QueryFilter = {
  logic: "and",
  items: [
    { field: "status", op: "in", value: ["paid", "shipped"] },
    {
      logic: "or",
      items: [
        { field: "amount", op: "gte", value: 100 },
        { field: "vip", op: "eq", value: true },
      ],
    },
  ],
};

function Demo({
  initial,
  capabilities,
}: {
  initial?: QueryFilter;
  capabilities?: { or?: boolean; nested?: boolean };
}) {
  const fields = useFields();
  const [filter, setFilter] = useState<QueryFilter | undefined>(initial);
  return (
    <div className="pg-stack pg-stack--start">
      <QueryBuilder
        fields={fields}
        value={filter}
        onChange={setFilter}
        capabilities={capabilities}
      />
      <Text tone="secondary">
        <code>{filter ? JSON.stringify(filter) : "undefined"}</code>
      </Text>
    </div>
  );
}

export default function QueryBuilderPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Query Builder</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`const [filter, setFilter] = useState<QueryFilter>();

<QueryBuilder
  fields={[
    { name: "name", label: "Name", type: "text" },
    { name: "status", label: "Status", type: "enum", options: [{ value: "paid", label: "Paid" }] },
    { name: "amount", label: "Amount", type: "number" },
  ]}
  value={filter}
  onChange={setFilter}
/>`}
      >
        <Demo />
      </Example>

      <Example
        id="preset"
        code={`value = {
  logic: "and",
  items: [
    { field: "status", op: "in", value: ["paid", "shipped"] },
    { logic: "or", items: [{ field: "amount", op: "gte", value: 100 }, { field: "vip", op: "eq", value: true }] },
  ],
}`}
      >
        <Demo initial={PRESET} />
      </Example>

      <Example
        id="capabilities"
        code={`<QueryBuilder fields={fields} value={filter} onChange={setFilter} capabilities={{ or: false, nested: false }} />`}
      >
        <Demo capabilities={{ or: false, nested: false }} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="QueryBuilder" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
