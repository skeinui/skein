import { Meter } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  {
    key: "shared",
    name: "progress / progress-header / progress-label / progress-value",
    type: "slot",
  },
  { key: "track", name: "progress-track / progress-indicator", type: "slot" },
  { key: "meter", name: "data-meter", type: "state" },
];

export default function MeterPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Meter</h1>
      <Lead />
      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Meter } from "@skeinui/ui";

<Meter value={64} label="Storage" showValue />`}
      >
        <Meter value={64} label="Storage" showValue />
      </Example>

      <Example
        id="range"
        code={`<Meter min={0} max={5} value={3.5} format={{ style: "decimal" }} />`}
      >
        <Meter
          min={0}
          max={5}
          value={3.5}
          label="Rating"
          showValue
          format={{ maximumFractionDigits: 1 }}
        />
      </Example>

      <Example id="colors" code={`<Meter color="warning" value={80} />`}>
        <div className="pg-stack">
          <Meter color="success" value={30} label="Healthy" />
          <Meter color="warning" value={72} label="Warning" />
          <Meter color="danger" value={94} label="Critical" />
        </div>
      </Example>

      <Example
        id="format"
        code={`<Meter value={1200} max={2000} format={{ style: "unit", unit: "megabyte" }} />`}
      >
        <Meter
          value={1200}
          max={2000}
          label="Memory"
          showValue
          format={{ style: "unit", unit: "megabyte" }}
        />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Meter" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
