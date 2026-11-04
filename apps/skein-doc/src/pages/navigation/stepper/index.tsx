import { Stepper } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "step", name: "stepper / stepper-step" },
  { key: "parts", name: "stepper-trigger / stepper-indicator / stepper-content" },
  { key: "text", name: "stepper-title / stepper-description / stepper-connector" },
];

const STEPS = [
  { title: "Account", description: "Create your login" },
  { title: "Profile", description: "Tell us about you" },
  { title: "Done", description: "Start using the app" },
];

function ClickableDemo() {
  const t = usePageT();
  const [current, setCurrent] = useState(2);
  return (
    <div className="pg-stack pg-stack--start">
      <Stepper current={current} steps={STEPS} onStepClick={setCurrent} />
      <p className="pg-desc">{t.rich("clickable.current", { current })}</p>
    </div>
  );
}

export default function StepperPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Stepper</h1>
      <Lead />
      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Stepper } from "@skeinui/ui";

<Stepper current={1} steps={[{ title: "Account" }, { title: "Profile" }, { title: "Done" }]} />`}
      >
        <Stepper current={1} steps={STEPS} />
      </Example>

      <Example id="vertical" code={`<Stepper orientation="vertical" … />`}>
        <Stepper orientation="vertical" current={1} steps={STEPS} />
      </Example>

      <Example id="error" code={`steps={[…, { title: "Payment", status: "error" }]}`}>
        <Stepper
          current={2}
          steps={[
            { title: "Account", description: "Create login" },
            { title: "Payment", description: "Card declined", status: "error" },
            { title: "Done" },
          ]}
        />
      </Example>

      <Example id="clickable" code={`<Stepper onStepClick={setCurrent} … />`}>
        <ClickableDemo />
      </Example>

      <Example id="colors" code={`<Stepper color="success" … />`}>
        <div className="pg-stack">
          <Stepper color="success" current={1} steps={STEPS} />
          <Stepper color="secondary" current={2} steps={STEPS} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Stepper" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
