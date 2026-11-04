import { Field, Radio, RadioGroup } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  {
    key: "slot",
    name: "data-slot",
    type: "radio-group | radio | radio-control | radio-indicator | radio-content | radio-label | radio-description",
  },
  { key: "group", name: "data-orientation / data-variant" },
  {
    key: "states",
    name: "data-checked / data-unchecked / data-disabled / data-invalid",
    type: "boolean attribute",
  },
];

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState("pro");
  return (
    <div className="pg-stack pg-stack--start">
      <RadioGroup aria-label="Plan" value={value} onValueChange={setValue}>
        <Radio value="free">Free</Radio>
        <Radio value="pro">Pro</Radio>
        <Radio value="team">Team</Radio>
      </RadioGroup>
      <p className="pg-desc">
        {t("controlled.selected")} <code>{value}</code>
      </p>
    </div>
  );
}

export default function RadioPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Radio Group</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Radio, RadioGroup } from "@skeinui/ui";

<RadioGroup aria-label="Plan" defaultValue="premium">
  <Radio value="basic">Basic Plan</Radio>
  <Radio value="premium">Premium Plan</Radio>
  <Radio value="business">Business Plan</Radio>
</RadioGroup>`}
      >
        <RadioGroup aria-label="Plan" defaultValue="premium">
          <Radio value="basic">Basic Plan</Radio>
          <Radio value="premium">Premium Plan</Radio>
          <Radio value="business">Business Plan</Radio>
        </RadioGroup>
      </Example>

      <DocHeading id="examples" />

      <Example
        id="horizontal"
        code={`<RadioGroup orientation="horizontal" defaultValue="sun">
  <Radio value="sun">Sunny</Radio>
  <Radio value="cloud">Cloudy</Radio>
  <Radio value="rain">Rainy</Radio>
</RadioGroup>`}
      >
        <RadioGroup aria-label="Weather" orientation="horizontal" defaultValue="sun">
          <Radio value="sun">Sunny</Radio>
          <Radio value="cloud">Cloudy</Radio>
          <Radio value="rain">Rainy</Radio>
        </RadioGroup>
      </Example>

      <Example
        id="with-description"
        code={`<RadioGroup defaultValue="premium">
  <Radio value="basic" description="Includes 100 messages per month">Basic Plan</Radio>
  <Radio value="premium" description="Includes 200 messages per month">Premium Plan</Radio>
  <Radio value="business" description="Includes 400 messages per month">Business Plan</Radio>
</RadioGroup>`}
      >
        <RadioGroup aria-label="Plan" defaultValue="premium">
          <Radio value="basic" description="Includes 100 messages per month">
            Basic Plan
          </Radio>
          <Radio value="premium" description="Includes 200 messages per month">
            Premium Plan
          </Radio>
          <Radio value="business" description="Includes 400 messages per month">
            Business Plan
          </Radio>
        </RadioGroup>
      </Example>

      <Example
        id="controlled"
        code={`const [value, setValue] = useState("pro");

<RadioGroup value={value} onValueChange={setValue}>…</RadioGroup>`}
      >
        <ControlledDemo />
      </Example>

      <Example
        id="disabled"
        code={`<RadioGroup disabled defaultValue="a">…</RadioGroup>

<RadioGroup defaultValue="a">
  <Radio value="a">Available</Radio>
  <Radio value="b" disabled>Disabled option</Radio>
</RadioGroup>`}
      >
        <div className="pg-flex pg-flex--start pg-flex--loose">
          <RadioGroup aria-label="Disabled group" disabled defaultValue="a">
            <Radio value="a">Whole group disabled</Radio>
            <Radio value="b">Second option</Radio>
          </RadioGroup>
          <RadioGroup aria-label="One disabled" defaultValue="a">
            <Radio value="a">Available</Radio>
            <Radio value="b" disabled>
              Disabled option
            </Radio>
          </RadioGroup>
        </div>
      </Example>

      <Example
        id="invalid"
        code={`<Field invalid>
  <RadioGroup>
    <Radio value="a">Option A</Radio>
    <Radio value="b">Option B</Radio>
  </RadioGroup>
  <Field.Error match>Please select an option.</Field.Error>
</Field>`}
      >
        <div style={{ width: "min(320px, 100%)" }}>
          <Field invalid>
            <RadioGroup aria-label="Options">
              <Radio value="a">Option A</Radio>
              <Radio value="b">Option B</Radio>
            </RadioGroup>
            <Field.Error match>Please select an option.</Field.Error>
          </Field>
        </div>
      </Example>

      <Example id="variants" code={`<RadioGroup variant="filled" defaultValue="b">…</RadioGroup>`}>
        <div className="pg-flex pg-flex--start pg-flex--loose">
          <RadioGroup aria-label="Outline" defaultValue="b">
            <Radio value="a">Outline A</Radio>
            <Radio value="b">Outline B</Radio>
          </RadioGroup>
          <RadioGroup aria-label="Filled" variant="filled" defaultValue="b">
            <Radio value="a">Filled A</Radio>
            <Radio value="b">Filled B</Radio>
          </RadioGroup>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>RadioGroup</h4>
        <ApiReference component="RadioGroup" />
        <h4>Radio</h4>
        <ApiReference component="Radio" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type ?? t("styling.sameAsProps"),
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
