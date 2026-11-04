import { DatePicker, Field } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "trigger", name: "select-trigger / select-value / select-icon" },
  { key: "popup", name: "popover-positioner / popover[data-picker]" },
  { key: "calendar", name: "calendar …" },
];

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState<string | null>("2026-10-19");
  return (
    <div className="pg-stack pg-stack--start">
      <DatePicker aria-label="Controlled" value={value} onValueChange={setValue} />
      <p className="pg-desc">
        {t("controlled.value")} <code>{String(value)}</code>
      </p>
    </div>
  );
}

export default function DatePickerPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Date Picker</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { DatePicker } from "@skeinui/ui";

<DatePicker placeholder="Pick a date" />`}
      >
        <DatePicker aria-label="Date" placeholder="Pick a date" />
      </Example>

      <Example id="range" code={`<DatePicker mode="range" placeholder="Pick a range" />`}>
        <DatePicker aria-label="Range" mode="range" placeholder="Pick a range" />
      </Example>

      <Example
        id="time"
        code={`<DatePicker showTime />
<DatePicker showTime={{ seconds: true, hour12: true }} />`}
      >
        <div className="pg-row">
          <DatePicker aria-label="Date and time" showTime placeholder="Pick date and time" />
          <DatePicker
            aria-label="Date and time with seconds"
            showTime={{ seconds: true, hour12: true }}
            defaultValue="2024-05-01T15:04:09"
            placeholder="With seconds, 12-hour"
          />
        </div>
      </Example>

      <Example
        id="picker"
        code={`<DatePicker picker="week" weekStartsOn={1} />
<DatePicker picker="month" />
<DatePicker picker="quarter" />
<DatePicker picker="year" />
<DatePicker mode="range" picker="month" />`}
      >
        <div className="pg-flex pg-flex--center">
          <DatePicker aria-label="Week" picker="week" weekStartsOn={1} />
          <DatePicker aria-label="Month" picker="month" defaultValue="2026-03" />
          <DatePicker aria-label="Quarter" picker="quarter" />
          <DatePicker aria-label="Year" picker="year" />
          <DatePicker aria-label="Month range" mode="range" picker="month" />
        </div>
      </Example>

      <Example
        id="editable"
        code={`<DatePicker editable />
<DatePicker editable mode="range" />
<DatePicker editable picker="month" />
<DatePicker editable showTime />`}
      >
        <div className="pg-flex pg-flex--center">
          <DatePicker aria-label="Editable date" editable defaultValue="2026-10-23" />
          <DatePicker aria-label="Editable range" editable mode="range" />
          <DatePicker aria-label="Editable month" editable picker="month" />
          <DatePicker aria-label="Editable week" editable picker="week" weekStartsOn={1} />
          <DatePicker aria-label="Editable date and time" editable showTime />
          <DatePicker
            aria-label="Editable with limits"
            editable
            min="2026-10-10"
            max="2026-10-20"
            placeholder="2026-10-10 ~ 2026-10-20"
          />
        </div>
      </Example>

      <Example id="variants" code={`<DatePicker variant="filled" size="lg" />`}>
        <div className="pg-stack pg-stack--start">
          <DatePicker aria-label="Small" size="sm" />
          <DatePicker aria-label="Filled" variant="filled" />
          <DatePicker aria-label="Large" size="lg" />
        </div>
      </Example>

      <Example
        id="in-field"
        code={`<Field><Field.Label>Birthday</Field.Label><DatePicker /></Field>`}
      >
        <Field>
          <Field.Label>Birthday</Field.Label>
          <DatePicker placeholder="Select" />
          <Field.Description>Used for age verification.</Field.Description>
        </Field>
      </Example>

      <Example id="limits" code={`<DatePicker min="2026-10-05" max="2026-10-25" />`}>
        <DatePicker
          aria-label="Limited"
          min="2026-10-05"
          max="2026-10-25"
          defaultValue="2026-10-15"
        />
      </Example>

      <Example
        id="controlled"
        code={`const [value, setValue] = useState<string | null>("2026-10-19");`}
      >
        <ControlledDemo />
      </Example>

      <Example
        id="disabled"
        code={`<DatePicker disabled />
<DatePicker invalid />`}
      >
        <div className="pg-stack pg-stack--start">
          <DatePicker aria-label="Disabled" disabled />
          <DatePicker aria-label="Invalid" invalid />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="DatePicker" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
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
