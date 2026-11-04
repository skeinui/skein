import { COLORS, Progress, RADII } from "@skeinui/ui";
import { useEffect, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "circle", name: "progress-circle-body / progress-circle", type: "slot" },
  {
    key: "circleParts",
    name: "progress-circle-track / progress-circle-indicator / progress-circle-value",
    type: "slot",
  },
  { key: "root", name: "progress / progress-header", type: "slot" },
  { key: "text", name: "progress-label / progress-value", type: "slot" },
  { key: "track", name: "progress-track / progress-indicator", type: "slot" },
  { key: "states", name: "data-progressing / data-indeterminate / data-complete", type: "state" },
];

function LiveDemo() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setValue((v) => (v >= 100 ? 0 : v + 10)), 700);
    return () => clearInterval(id);
  }, []);
  return <Progress value={value} label="Uploading" showValue />;
}

export default function ProgressPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Progress</h1>
      <Lead />
      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Progress } from "@skeinui/ui";

<Progress value={60} aria-label="Loading" />`}
      >
        <Progress value={60} aria-label="Loading" />
      </Example>

      <Example id="label" code={`<Progress value={45} label="Storage" showValue />`}>
        <Progress value={45} label="Storage" showValue />
      </Example>

      <Example
        id="sizes"
        code={`<Progress size="sm" value={50} />
<Progress size="md" value={50} />
<Progress size="lg" value={50} />`}
      >
        <div className="pg-stack">
          <Progress size="sm" value={50} aria-label="Small" />
          <Progress size="md" value={50} aria-label="Medium" />
          <Progress size="lg" value={50} aria-label="Large" />
        </div>
      </Example>

      <Example id="colors" code={`<Progress color="success" value={70} />`}>
        <div className="pg-stack">
          {COLORS.map((c) => (
            <Progress key={c} color={c} value={70} label={c} aria-label={c} />
          ))}
        </div>
      </Example>

      <Example id="indeterminate" code={`<Progress value={null} label="Processing" />`}>
        <Progress value={null} label="Processing" />
      </Example>

      <Example id="radius" code={`<Progress radius="none" value={60} />`}>
        <div className="pg-stack">
          {RADII.map((r) => (
            <Progress key={r} radius={r} value={60} aria-label={r} />
          ))}
        </div>
      </Example>

      <Example
        id="circle"
        code={`<Progress type="circle" value={72} showValue label="Storage" />
<Progress type="dashboard" value={60} showValue color="success" />
<Progress type="circle" value={null} />`}
      >
        <div className="pg-flex pg-flex--loose" style={{ alignItems: "flex-start" }}>
          <Progress aria-label="Storage" type="circle" value={72} showValue label="Storage" />
          <Progress
            aria-label="Score"
            type="dashboard"
            value={60}
            showValue
            color="success"
            size="lg"
          />
          <Progress
            aria-label="Small"
            type="circle"
            value={35}
            showValue
            size="sm"
            color="warning"
          />
          <Progress aria-label="Loading" type="circle" value={null} color="secondary" />
          {COLORS.filter((c) => c !== "neutral")
            .slice(0, 2)
            .map((c) => (
              <Progress
                key={c}
                aria-label={c}
                type="dashboard"
                value={85}
                showValue
                color={c}
                size="sm"
              />
            ))}
        </div>
      </Example>

      <Example id="live" code={`<Progress value={value} label="Uploading" showValue />`}>
        <LiveDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Progress" />
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
