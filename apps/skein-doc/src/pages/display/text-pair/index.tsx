import { DataTable, Tag, TextPair } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

const PEOPLE = [
  { id: "1", name: "Maya Brooks", email: "maya@northwind.example", vip: true },
  { id: "2", name: "Lucas Meyer", email: "lucas@kiln.example", vip: false },
  { id: "3", name: "Priya Nair", email: "priya@lumen.example", vip: false },
];

export default function TextPairPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Text Pair</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<TextPair title="Maya Brooks" description="maya@northwind.example" />`}
      >
        <TextPair title="Maya Brooks" description="maya@northwind.example" />
      </Example>

      <Example
        id="extra"
        code={`<TextPair
  title="Maya Brooks"
  description="maya@northwind.example"
  extra={<Tag size="sm" variant="soft" color="warning">VIP</Tag>}
/>`}
      >
        <TextPair
          title="Maya Brooks"
          description="maya@northwind.example"
          extra={
            <Tag size="sm" variant="soft" color="warning">
              VIP
            </Tag>
          }
        />
      </Example>

      <Example
        id="link"
        code={`<TextPair
  strong={false}
  title={<RouterLink to="/companies/$id" params={{ id }}>Northwind</RouterLink>}
  description="northwind.example"
/>`}
      >
        <TextPair
          strong={false}
          title={<a href="#link">Northwind</a>}
          description="northwind.example"
        />
      </Example>

      <Example
        id="table"
        code={`<DataTable
  rows={people}
  rowKey="id"
  columns={[
    {
      key: "name",
      title: "Customer",
      render: (p) => <TextPair title={p.name} description={p.email} />,
    },
  ]}
/>`}
      >
        <DataTable
          rows={PEOPLE}
          rowKey="id"
          columns={[
            {
              key: "name",
              title: t("table.customer"),
              render: (p) => <TextPair title={p.name} description={p.email} />,
            },
          ]}
        />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="TextPair" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
