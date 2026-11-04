import { useState } from "react";
import { Avatar, Link, List, Switch, Tag } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "list", type: "slot" },
  { key: "parts", name: "list-header / list-footer / list-empty / list-loading", type: "slot" },
  { key: "items", name: "list-items / list-item", type: "slot" },
  {
    key: "meta",
    name: "list-meta / list-avatar / list-content / list-title / list-description",
    type: "slot",
  },
  { key: "extra", name: "list-extra / list-actions", type: "slot" },
];

const DATA = [
  { key: "1", name: "Ada Lovelace" },
  { key: "2", name: "Alan Turing" },
  { key: "3", name: "Grace Hopper" },
];

type PageT = ReturnType<typeof usePageT>;

const people = (t: PageT, extra?: (d: (typeof DATA)[number]) => Record<string, unknown>) =>
  DATA.map((d) => ({
    key: d.key,
    avatar: <Avatar fallback={d.name.slice(0, 1)} size="sm" />,
    title: <Link href="#list">{d.name}</Link>,
    description: t(`basic.note${d.key}`),
    ...extra?.(d),
  }));

function StateDemo() {
  const t = usePageT();
  const [loading, setLoading] = useState(true);
  return (
    <div className="pg-stack">
      <Switch checked={loading} onCheckedChange={setLoading} aria-label={t("state.loading")} />
      <List bordered loading={loading} items={people(t)} />
      <List bordered items={[]} empty={t("state.empty")} />
    </div>
  );
}

export default function ListPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">List</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { List } from "@skeinui/ui";

<List items={[
  { key: "1", avatar: <Avatar … />, title: "Ada", description: "Wrote the first program" },
]} />`}
      >
        <List items={people(t)} />
      </Example>

      <Example
        id="bordered"
        code={`<List bordered header="Pioneers" footer="3 people" items={…} />`}
      >
        <List
          bordered
          header={t("bordered.header")}
          footer={t("bordered.footer")}
          items={people(t)}
        />
      </Example>

      <Example id="sizes" code={`<List size="sm" bordered items={…} />`}>
        <div className="pg-stack">
          {(["sm", "md", "lg"] as const).map((size) => (
            <List
              key={size}
              bordered
              size={size}
              header={`size="${size}"`}
              items={people(t).slice(0, 2)}
            />
          ))}
        </div>
      </Example>

      <Example
        id="actions"
        code={`{ key, title, extra: <Tag>New</Tag>, actions: [<Link>edit</Link>, <Link>more</Link>] }`}
      >
        <List
          bordered
          items={people(t, (d) => ({
            extra:
              d.key === "1" ? (
                <Tag color="success">{t("actions.new")}</Tag>
              ) : (
                t(`actions.time${d.key}`)
              ),
            actions: [
              <Link key="e" href="#list">
                {t("actions.edit")}
              </Link>,
              <Link key="m" href="#list">
                {t("actions.more")}
              </Link>,
            ],
          }))}
        />
      </Example>

      <Example
        id="state"
        code={`<List loading items={…} />
<List items={[]} empty="Nothing here yet" />`}
      >
        <StateDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="List" />
        <h4>List.Item</h4>
        <ApiReference component="List.Item" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
