import { DueTag } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

const HOUR = 3_600_000;

export default function DueTagPage() {
  const t = usePageT();
  const soon = Date.now() + 5 * HOUR;
  const late = Date.now() - 3 * HOUR;
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Due Tag</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<DueTag value={ticket.dueAt} done={ticket.status === "resolved"} />`}
      >
        <div className="pg-stack pg-stack--start">
          <DueTag value={soon} />
          <DueTag value={late} />
        </div>
      </Example>

      <Example
        id="states"
        code={`<DueTag value={dueAt} />               // in 5 hours
<DueTag value={dueAt} />               // Overdue · 3 hours ago
<DueTag value={dueAt} paused />        // Paused
<DueTag value={dueAt} done />          // —`}
      >
        <div className="pg-stack pg-stack--start">
          <DueTag value={soon} />
          <DueTag value={late} />
          <DueTag value={soon} paused />
          <DueTag value={late} done />
        </div>
      </Example>

      <Example
        id="labels"
        code={`<DueTag value={dueAt} labels={{ overdue: "Late" }} hoursUntil={24} />`}
      >
        <DueTag value={late} labels={{ overdue: t("labels.late") }} hoursUntil={1} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="DueTag" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
