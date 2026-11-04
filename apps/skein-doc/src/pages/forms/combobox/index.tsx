import { Combobox, Field } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "input", name: "input-group / input-group-input / input-group-suffix" },
  { key: "trigger", name: "combobox-trigger" },
  { key: "popup", name: "select-positioner / select / select-list / select-item …" },
  { key: "empty", name: "combobox-empty" },
];

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "durian", label: "Durian", disabled: true },
  { value: "grape", label: "Grape" },
];

const GROUPS = [
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
];

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState<string | null>("banana");
  return (
    <div className="pg-stack pg-stack--start">
      <Combobox aria-label="Fruit" options={FRUITS} value={value} onValueChange={setValue} />
      <p className="pg-desc">
        {t("controlled.selected")} <code>{String(value)}</code>
      </p>
    </div>
  );
}

export default function ComboboxPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Combobox</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Combobox } from "@skeinui/ui";

<Combobox
  aria-label="Fruit"
  placeholder="Search fruit"
  options={[
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
  ]}
/>`}
      >
        <Combobox aria-label="Fruit" placeholder="Search fruit" options={FRUITS} />
      </Example>

      <Example id="groups" code={`options={[{ label: "Fruits", options: […] }, …]}`}>
        <Combobox aria-label="Food" placeholder="Search food" options={GROUPS} />
      </Example>

      <Example
        id="controlled"
        code={`const [value, setValue] = useState<string | null>("banana");

<Combobox value={value} onValueChange={setValue} … />`}
      >
        <ControlledDemo />
      </Example>

      <Example id="variants" code={`<Combobox variant="filled" size="lg" … />`}>
        <div className="pg-stack pg-stack--start">
          <Combobox aria-label="Small" size="sm" placeholder="Small" options={FRUITS} />
          <Combobox aria-label="Filled" variant="filled" placeholder="Filled" options={FRUITS} />
          <Combobox aria-label="Large" size="lg" placeholder="Large" options={FRUITS} />
        </div>
      </Example>

      <Example id="in-field" code={`<Field><Field.Label>Fruit</Field.Label><Combobox … /></Field>`}>
        <Field>
          <Field.Label>Favorite fruit</Field.Label>
          <Combobox placeholder="Search" options={FRUITS} />
          <Field.Description>Type to filter.</Field.Description>
        </Field>
      </Example>

      <Example id="empty" code={`<Combobox emptyText="Nothing found" … />`}>
        <Combobox
          aria-label="Empty"
          emptyText="Nothing found"
          placeholder="Type zzz"
          options={FRUITS}
        />
      </Example>

      <Example
        id="disabled"
        code={`<Combobox disabled … />
<Combobox invalid … />`}
      >
        <div className="pg-stack pg-stack--start">
          <Combobox aria-label="Disabled" disabled placeholder="Disabled" options={FRUITS} />
          <Combobox aria-label="Invalid" invalid placeholder="Invalid" options={FRUITS} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Combobox" />
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
