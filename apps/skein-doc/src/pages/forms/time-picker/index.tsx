import { Field, TimePicker } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "column", name: "timepanel / timepanel-column", type: "slot" },
  { key: "option", name: "timepanel-option", type: "slot" },
  { key: "footer", name: "timepanel-footer / -footer-end", type: "slot" },
  { key: "datetime", name: "datetime / datetime-time", type: "slot" },
];

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState<string | null>("09:30");
  return (
    <div className="pg-stack pg-stack--start">
      <TimePicker aria-label="Controlled" value={value} onValueChange={setValue} />
      <p className="pg-desc">
        {t("controlled.value")} <code>{String(value)}</code>
      </p>
    </div>
  );
}

export default function TimePickerPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Time Picker</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { TimePicker } from "@skeinui/ui";

<TimePicker aria-label="Time" placeholder="Pick a time" />`}
      >
        <TimePicker aria-label="Time" />
      </Example>

      <Example
        id="seconds"
        code={`<TimePicker seconds /> <TimePicker hour12 defaultValue="15:04" />`}
      >
        <div className="pg-row">
          <TimePicker aria-label="With seconds" seconds defaultValue="10:20:30" />
          <TimePicker aria-label="12-hour" hour12 defaultValue="15:04" />
        </div>
      </Example>

      <Example id="steps" code={`<TimePicker minuteStep={15} hourStep={2} />`}>
        <TimePicker aria-label="Steps" minuteStep={15} hourStep={2} defaultValue="08:15" />
      </Example>

      <Example
        id="limits"
        code={`<TimePicker min="09:00" max="17:30" /> // options out of range are disabled`}
      >
        <TimePicker aria-label="Office hours" min="09:00" max="17:30" defaultValue="12:00" />
      </Example>

      <Example id="controlled" code={`<TimePicker value={value} onValueChange={setValue} />`}>
        <ControlledDemo />
      </Example>

      <Example id="in-field" code={`<Field><Field.Label>Start</Field.Label><TimePicker /></Field>`}>
        <Field>
          <Field.Label>{t("in-field.label")}</Field.Label>
          <TimePicker />
        </Field>
      </Example>

      <Example id="states" code={`<TimePicker disabled /> <TimePicker invalid />`}>
        <div className="pg-row">
          <TimePicker aria-label="Disabled" disabled defaultValue="08:00" />
          <TimePicker aria-label="Invalid" invalid />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="TimePicker" />
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
