import { Button, Descriptions, Tag } from "@skeinui/ui";
import type { DescriptionsItem } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "descriptions" },
  { key: "header", name: "descriptions-header / -title / -extra" },
  { key: "list", name: "descriptions-list / -item" },
  { key: "cell", name: "descriptions-label / -value" },
];

const USER: DescriptionsItem[] = [
  { label: "Name", value: "Ada Lovelace" },
  { label: "Telephone", value: "1810000000" },
  { label: "Live", value: "Hangzhou, Zhejiang" },
  { label: "Remark", value: "empty" },
  { label: "Address", value: "No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China" },
];

const SPANS: DescriptionsItem[] = [
  { label: "Product", value: "Cloud Database" },
  { label: "Billing", value: "Prepaid" },
  { label: "Time", value: "18:00:00" },
  { label: "Amount", value: "$80.00", span: 2 },
  { label: "Discount", value: "$20.00" },
  { label: "Status", value: <Tag color="success">Running</Tag>, span: 3 },
  {
    label: "Config Info",
    value: "Data disk type: MongoDB — Database version: 3.4 — Package: dds-mongo-mid",
    span: 3,
  },
];

export default function DescriptionsPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Descriptions</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Descriptions } from "@skeinui/ui";

<Descriptions
  extra={<Button size="sm">Edit</Button>}
  title="User info"
  items={[{ label: "Name", value: "Ada" }, { label: "Telephone", value: "1810000000" }]}
/>`}
      >
        <Descriptions
          title="User info"
          extra={
            <Button size="sm" variant="outline">
              Edit
            </Button>
          }
          items={USER}
        />
      </Example>

      <Example id="bordered" code={`<Descriptions bordered items={items} />`}>
        <Descriptions bordered title="User info" items={USER} />
      </Example>

      <Example
        id="span"
        code={`items={[{ label: "Amount", value: "$80.00", span: 2 }, { label: "Status", value: <Tag />, span: 3 }]}`}
      >
        <Descriptions bordered title="Order" items={SPANS} />
      </Example>

      <Example id="vertical" code={`<Descriptions layout="vertical" bordered items={items} />`}>
        <div className="pg-stack">
          <Descriptions layout="vertical" title="Plain" items={USER.slice(0, 4)} column={4} />
          <Descriptions layout="vertical" bordered items={USER.slice(0, 4)} column={4} />
        </div>
      </Example>

      <Example id="sizes" code={`<Descriptions size="sm" bordered … />`}>
        <div className="pg-stack">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Descriptions
              key={size}
              bordered
              size={size}
              column={2}
              title={`size ${size}`}
              items={USER.slice(0, 4)}
            />
          ))}
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Descriptions" />
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
