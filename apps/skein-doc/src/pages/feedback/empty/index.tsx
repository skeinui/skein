import { Button, Empty, Table } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "empty" },
  { key: "parts", name: "empty-icon / empty-title / empty-description / empty-actions" },
];

const InboxIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
  </svg>
);

export default function EmptyPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Empty</h1>
      <Lead />
      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Empty } from "@skeinui/ui";

<Empty icon={<InboxIcon />} title="No messages" description="You are all caught up." />`}
      >
        <Empty icon={<InboxIcon />} title="No messages" description="You are all caught up." />
      </Example>

      <Example
        id="actions"
        code={`<Empty title="No projects" actions={<Button>Create project</Button>} />`}
      >
        <Empty
          icon={<InboxIcon />}
          title="No projects yet"
          description="Create your first project to get started."
          actions={
            <>
              <Button>Create project</Button>
              <Button variant="outline">Import</Button>
            </>
          }
        />
      </Example>

      <Example id="sizes" code={`<Empty size="sm" … />`}>
        <div className="pg-stack">
          <Empty size="sm" title="Small" description="Compact placeholder." />
          <Empty size="lg" title="Large" description="Roomier placeholder." />
        </div>
      </Example>

      <Example
        id="in-table"
        code={`<Table.Empty colSpan={2}><Empty size="sm" title="No data" /></Table.Empty>`}
      >
        <Table bordered>
          <Table.Header>
            <Table.Row>
              <Table.Head>Name</Table.Head>
              <Table.Head>Email</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Empty colSpan={2}>
              <Empty size="sm" title="No results" description="Try a different filter." />
            </Table.Empty>
          </Table.Body>
        </Table>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Empty" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
