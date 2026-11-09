import { RelativeTime, formatRelativeTime } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

const MOMENTS = [30, 5 * 60, 3 * 3600, 2 * 86400, 60 * 86400];

export default function RelativeTimePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Relative Time</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<RelativeTime value={ticket.updatedAt} />
formatRelativeTime(ticket.updatedAt) // "3 hours ago"`}
      >
        <div className="pg-stack pg-stack--start">
          {MOMENTS.map((m) => (
            <div key={m}>
              <RelativeTime value={Date.now() - m * 1000} />
              {" · "}
              {formatRelativeTime(Date.now() + m * 1000)}
            </div>
          ))}
        </div>
      </Example>

      <Example
        id="numeric"
        code={`<RelativeTime value={yesterday} />                     // yesterday
<RelativeTime value={yesterday} numeric="always" />    // 1 day ago`}
      >
        <div className="pg-stack pg-stack--start">
          <RelativeTime value={Date.now() - 86_400_000} />
          <RelativeTime value={Date.now() - 86_400_000} numeric="always" />
        </div>
      </Example>

      <Example id="refresh" code={`<RelativeTime value={createdAt} refresh={30} />`}>
        <RelativeTime value={Date.now() - 20_000} refresh={5} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="RelativeTime" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
