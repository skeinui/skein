import { Button, Flex, PageHeader, Segmented, toast } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

export default function PageHeaderPage() {
  const t = usePageT();
  const [level, setLevel] = useState("3");
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Page Header</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<PageHeader title="Tickets" description="Every request that became a ticket" />`}
      >
        <PageHeader title={t("usage.title")} description={t("usage.description")} />
      </Example>

      <Example
        id="actions"
        code={`<PageHeader
  title="Customers"
  description="…"
  actions={<Button color="primary">New</Button>}
/>`}
      >
        <PageHeader
          title={t("actions.title")}
          description={t("actions.description")}
          actions={
            <>
              <Button variant="outline">{t("actions.import")}</Button>
              <Button color="primary" onClick={() => toast(t("actions.clicked"))}>
                {t("actions.new")}
              </Button>
            </>
          }
        />
      </Example>

      <Example id="levels" code={`<PageHeader title="Tickets" level={1} />`}>
        <Flex direction="column" gap="md">
          <Segmented
            size="sm"
            aria-label={t("levels.label")}
            value={level}
            onValueChange={setLevel}
            options={["1", "2", "3", "4", "5"].map((v) => ({ value: v, label: `h${v}` }))}
          />
          <PageHeader
            title={t("usage.title")}
            description={t("usage.description")}
            level={Number(level) as 1 | 2 | 3 | 4 | 5}
          />
        </Flex>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="PageHeader" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
