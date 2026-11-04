import { Field, Select } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "durian", label: "Durian", disabled: true },
  { value: "grape", label: "Grape" },
];

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "trigger", name: "select-trigger" },
  { key: "value", name: "select-value" },
  { key: "icon", name: "select-icon" },
  { key: "popup", name: "select-positioner / select / select-list" },
  { key: "item", name: "select-item / item-text / item-indicator" },
  { key: "group", name: "select-group / select-group-label" },
];

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState<string | null>("banana");
  return (
    <div className="pg-stack pg-stack--start">
      <Select
        aria-label="Fruit"
        options={FRUITS}
        value={value}
        onValueChange={(v) => setValue(v)}
      />
      <p className="pg-desc">
        {t("controlled.selected")} <code>{String(value)}</code>
      </p>
    </div>
  );
}

export default function SelectPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Select</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Select } from "@skeinui/ui";

<Select
  aria-label="Fruit"
  placeholder="Select a fruit"
  options={[
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
  ]}
/>`}
      >
        <Select aria-label="Fruit" placeholder={t("usage.placeholder")} options={FRUITS} />
      </Example>

      <DocHeading id="examples" />

      <Example
        id="variants"
        code={`<Select variant="outline" … />
<Select variant="filled" … />`}
      >
        <div className="pg-flex pg-flex--loose">
          <Select aria-label="Outline" variant="outline" placeholder="Outline" options={FRUITS} />
          <Select aria-label="Filled" variant="filled" placeholder="Filled" options={FRUITS} />
        </div>
      </Example>

      <Example
        id="sizes"
        code={`<Select size="sm" … />
<Select size="md" … />
<Select size="lg" … />`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Select aria-label="Small" size="sm" placeholder="Small" options={FRUITS} />
          <Select aria-label="Medium" size="md" placeholder="Medium" options={FRUITS} />
          <Select aria-label="Large" size="lg" placeholder="Large" options={FRUITS} />
        </div>
      </Example>

      <Example
        id="groups"
        code={`<Select
  options={[
    { label: "Fruits", options: [{ value: "apple", label: "Apple" }] },
    { label: "Vegetables", options: [{ value: "carrot", label: "Carrot" }] },
  ]}
/>`}
      >
        <Select
          aria-label="Food"
          placeholder="Select food"
          options={[
            {
              label: "Fruits",
              options: [
                { value: "apple", label: "Apple" },
                { value: "banana", label: "Banana" },
              ],
            },
            {
              label: "Vegetables",
              options: [
                { value: "carrot", label: "Carrot" },
                { value: "potato", label: "Potato" },
              ],
            },
          ]}
        />
      </Example>

      <Example
        id="controlled"
        code={`const [value, setValue] = useState("banana");

<Select value={value} onValueChange={setValue} options={options} />`}
      >
        <ControlledDemo />
      </Example>

      <Example
        id="in-field"
        code={`<Field>
  <Field.Label>Favorite fruit</Field.Label>
  <Select placeholder="Select" options={options} />
  <Field.Description>Pick one.</Field.Description>
</Field>`}
      >
        <Field>
          <Field.Label>{t("in-field.label")}</Field.Label>
          <Select placeholder={t("in-field.placeholder")} options={FRUITS} />
          <Field.Description>{t("in-field.hint")}</Field.Description>
        </Field>
      </Example>

      <Example
        id="disabled"
        code={`<Select disabled … />
<Select invalid … />`}
      >
        <div className="pg-flex pg-flex--loose">
          <Select aria-label="Disabled" disabled placeholder="Disabled" options={FRUITS} />
          <Select aria-label="Invalid" invalid placeholder="Invalid" options={FRUITS} />
        </div>
      </Example>

      <Example id="full-width" code={`<Select fullWidth … />`}>
        <Select aria-label="Full width" fullWidth placeholder="Full width" options={FRUITS} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Select" />
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
