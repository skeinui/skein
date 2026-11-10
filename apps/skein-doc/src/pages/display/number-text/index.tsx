import { NumberText, formatNumberText } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

export default function NumberTextPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Number Text</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<NumberText value={12500} />
formatNumberText(12500) // "12,500"`}
      >
        <div className="pg-stack pg-stack--start">
          <NumberText value={12500} />
          <span>{formatNumberText(12500)}</span>
        </div>
      </Example>

      <Example
        id="percent"
        code={`<NumberText value={0.974} format="percent" />                 // 97%
<NumberText value={97.4} format="unit" unit="percent" />       // 97%
<NumberText value={0.974} format="percent" precision={1} />    // 97.4%`}
      >
        <div className="pg-stack pg-stack--start">
          <NumberText value={0.974} format="percent" />
          <NumberText value={97.4} format="unit" unit="percent" />
          <NumberText value={0.974} format="percent" precision={1} />
        </div>
      </Example>

      <Example
        id="money"
        code={`<NumberText value={4.5} format="currency" currency="USD" />
<NumberText value={1280} format="currency" currency="CNY" />`}
      >
        <div className="pg-stack pg-stack--start">
          <NumberText value={4.5} format="currency" currency="USD" />
          <NumberText value={1280} format="currency" currency="CNY" />
        </div>
      </Example>

      <Example
        id="compact"
        code={`<NumberText value={12500} notation="compact" />
<NumberText value={3.2e6} notation="compact" />`}
      >
        <div className="pg-stack pg-stack--start">
          <NumberText value={12500} notation="compact" />
          <NumberText value={3.2e6} notation="compact" />
        </div>
      </Example>

      <Example
        id="empty"
        code={`<NumberText value={null} />
<NumberText value={undefined} fallback="No data" />`}
      >
        <div className="pg-stack pg-stack--start">
          <NumberText value={null} />
          <NumberText value={undefined} fallback={t("empty.none")} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="NumberText" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
