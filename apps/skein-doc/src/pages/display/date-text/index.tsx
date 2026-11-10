import { DateText, formatDateText } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

const MOMENT = "2026-11-10T10:37:00Z";

export default function DateTextPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Date Text</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<DateText value={ticket.createdAt} />
formatDateText(ticket.createdAt) // "Nov 10, 2026"`}
      >
        <div className="pg-stack pg-stack--start">
          <DateText value={MOMENT} />
          <span>{formatDateText(MOMENT)}</span>
        </div>
      </Example>

      <Example
        id="styles"
        code={`<DateText value={at} dateStyle="short" />
<DateText value={at} dateStyle="long" timeStyle="short" />
<DateText value={at} timeStyle="short" />
<DateText value={at} weekday="long" />`}
      >
        <div className="pg-stack pg-stack--start">
          <DateText value={MOMENT} dateStyle="short" />
          <DateText value={MOMENT} dateStyle="long" timeStyle="short" />
          <DateText value={MOMENT} timeStyle="short" />
          <DateText value={MOMENT} weekday="long" />
        </div>
      </Example>

      <Example
        id="empty"
        code={`<DateText value={null} />
<DateText value={undefined} fallback="Not set" />`}
      >
        <div className="pg-stack pg-stack--start">
          <DateText value={null} />
          <DateText value={undefined} fallback={t("empty.none")} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="DateText" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
