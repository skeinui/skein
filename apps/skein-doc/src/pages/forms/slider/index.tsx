import { COLORS, Slider } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "slider / slider-header / slider-label / slider-value", type: "slot" },
  { key: "control", name: "slider-control / slider-track / slider-indicator", type: "slot" },
  { key: "thumb", name: "slider-thumb", type: "slot" },
];

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState<number | readonly number[]>(30);
  return (
    <div className="pg-stack">
      <Slider value={value} onValueChange={setValue} aria-label="Controlled" />
      <p className="pg-desc">
        {t("controlled.value")} <code>{JSON.stringify(value)}</code>
      </p>
    </div>
  );
}

export default function SliderPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Slider</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Slider } from "@skeinui/ui";

<Slider defaultValue={40} aria-label="Volume" />`}
      >
        <Slider defaultValue={40} aria-label="Volume" />
      </Example>

      <Example id="range" code={`<Slider defaultValue={[20, 70]} />`}>
        <Slider defaultValue={[20, 70]} aria-label="Range" />
      </Example>

      <Example id="sizes" code={`<Slider size="sm" defaultValue={50} />`}>
        <div className="pg-stack">
          <Slider size="sm" defaultValue={50} aria-label="Small" />
          <Slider size="md" defaultValue={50} aria-label="Medium" />
          <Slider size="lg" defaultValue={50} aria-label="Large" />
        </div>
      </Example>

      <Example id="colors" code={`<Slider color="success" defaultValue={60} />`}>
        <div className="pg-stack">
          {COLORS.map((c) => (
            <Slider key={c} color={c} defaultValue={60} aria-label={c} />
          ))}
        </div>
      </Example>

      <Example id="label" code={`<Slider label="Volume" showValue defaultValue={30} />`}>
        <Slider label={t("label.volume")} showValue defaultValue={30} />
      </Example>

      <Example
        id="controlled"
        code={`const [value, setValue] = useState(30);

<Slider value={value} onValueChange={setValue} />`}
      >
        <ControlledDemo />
      </Example>

      <Example id="disabled" code={`<Slider disabled defaultValue={40} />`}>
        <Slider disabled defaultValue={40} aria-label="Disabled" />
      </Example>

      <Example
        id="step"
        code={`<Slider step={10} min={0} max={100} showValue defaultValue={30} />`}
      >
        <Slider step={10} min={0} max={100} label={t("step.label")} showValue defaultValue={30} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Slider" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
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
