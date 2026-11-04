import { Checkbox, CheckboxGroup, Field } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  {
    key: "slot",
    name: "data-slot",
    type: "checkbox | checkbox-control | checkbox-indicator | checkbox-checkmark | checkbox-indeterminate | checkbox-content | checkbox-label | checkbox-description | checkbox-group",
  },
  { key: "variant", name: "data-variant", type: "outline | filled" },
  {
    key: "states",
    name: "data-checked / data-unchecked / data-indeterminate / data-disabled / data-invalid / data-readonly",
    type: "boolean attribute",
  },
  { key: "orientation", name: "data-orientation", type: "horizontal | vertical" },
];

function ControlledDemo() {
  const [checked, setChecked] = useState(false);
  return (
    <div className="pg-stack pg-stack--start">
      <Checkbox checked={checked} onCheckedChange={setChecked}>
        Subscribe to newsletter
      </Checkbox>
      <p className="pg-desc">
        Selected: <code>{String(checked)}</code>
      </p>
    </div>
  );
}

const FRUITS = ["apple", "banana", "cherry"];

function SelectAllDemo() {
  const [selected, setSelected] = useState<string[]>(["banana"]);
  const all = selected.length === FRUITS.length;
  const some = selected.length > 0 && !all;
  return (
    <div className="pg-stack pg-stack--start">
      <Checkbox
        checked={all}
        indeterminate={some}
        onCheckedChange={(checked) => setSelected(checked ? FRUITS : [])}
      >
        Select all
      </Checkbox>
      <CheckboxGroup value={selected} onValueChange={setSelected}>
        {FRUITS.map((fruit) => (
          <Checkbox key={fruit} value={fruit}>
            {fruit[0].toUpperCase() + fruit.slice(1)}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </div>
  );
}

export default function CheckboxPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Checkbox</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Checkbox } from "@skeinui/ui";

<Checkbox>Accept terms and conditions</Checkbox>`}
      >
        <Checkbox>Accept terms and conditions</Checkbox>
      </Example>

      <DocHeading id="examples" />

      <Example
        id="default-selected"
        code={`<Checkbox defaultChecked>Subscribe to newsletter</Checkbox>`}
      >
        <Checkbox defaultChecked>Subscribe to newsletter</Checkbox>
      </Example>

      <Example id="indeterminate" code={`<Checkbox indeterminate>Select all</Checkbox>`}>
        <Checkbox indeterminate>Select all</Checkbox>
      </Example>

      <Example
        id="disabled"
        code={`<Checkbox disabled>Unchecked</Checkbox>
<Checkbox disabled defaultChecked>Checked</Checkbox>
<Checkbox disabled indeterminate>Indeterminate</Checkbox>`}
      >
        <div className="pg-stack pg-stack--start">
          <Checkbox disabled>Unchecked</Checkbox>
          <Checkbox disabled defaultChecked>
            Checked
          </Checkbox>
          <Checkbox disabled indeterminate>
            Indeterminate
          </Checkbox>
        </div>
      </Example>

      <Example
        id="with-description"
        code={`<Checkbox defaultChecked description="You can unsubscribe at any time.">
  Subscribe to newsletter
</Checkbox>`}
      >
        <div className="pg-stack pg-stack--start">
          <Checkbox defaultChecked description="You can unsubscribe at any time.">
            Subscribe to newsletter
          </Checkbox>
          <Checkbox description="Please read the full text before accepting.">
            Accept terms and conditions
          </Checkbox>
        </div>
      </Example>

      <Example
        id="controlled"
        code={`const [checked, setChecked] = useState(false);

<Checkbox checked={checked} onCheckedChange={setChecked}>Subscribe to newsletter</Checkbox>`}
      >
        <ControlledDemo />
      </Example>

      <Example
        id="invalid"
        code={`<Checkbox invalid>Accept terms and conditions</Checkbox>
<Checkbox invalid defaultChecked>Accept terms and conditions</Checkbox>`}
      >
        <div className="pg-stack pg-stack--start">
          <Checkbox invalid>Accept terms and conditions</Checkbox>
          <Checkbox invalid defaultChecked>
            Accept terms and conditions
          </Checkbox>
        </div>
      </Example>

      <Example
        id="variants"
        code={`<Checkbox>Outline</Checkbox>
<Checkbox variant="filled">Filled</Checkbox>`}
      >
        <div className="pg-flex pg-flex--loose">
          <div className="pg-stack pg-stack--start">
            <Checkbox>Outline</Checkbox>
            <Checkbox defaultChecked>Outline checked</Checkbox>
          </div>
          <div className="pg-stack pg-stack--start">
            <Checkbox variant="filled">Filled</Checkbox>
            <Checkbox variant="filled" defaultChecked>
              Filled checked
            </Checkbox>
          </div>
        </div>
      </Example>

      <Example
        id="checkbox-group"
        code={`<CheckboxGroup defaultValue={["dogs"]}>
  <Checkbox value="dogs">Dogs</Checkbox>
  <Checkbox value="cats">Cats</Checkbox>
  <Checkbox value="birds">Birds</Checkbox>
</CheckboxGroup>

<CheckboxGroup orientation="horizontal">…</CheckboxGroup>`}
      >
        <div className="pg-flex pg-flex--start pg-flex--loose">
          <CheckboxGroup defaultValue={["dogs"]}>
            <Checkbox value="dogs">Dogs</Checkbox>
            <Checkbox value="cats">Cats</Checkbox>
            <Checkbox value="birds">Birds</Checkbox>
          </CheckboxGroup>
          <CheckboxGroup orientation="horizontal" defaultValue={["cats"]}>
            <Checkbox value="dogs">Dogs</Checkbox>
            <Checkbox value="cats">Cats</Checkbox>
            <Checkbox value="birds">Birds</Checkbox>
          </CheckboxGroup>
        </div>
      </Example>

      <Example
        id="select-all"
        code={`const all = selected.length === FRUITS.length;
const some = selected.length > 0 && !all;

<Checkbox checked={all} indeterminate={some} onCheckedChange={(c) => setSelected(c ? FRUITS : [])}>
  Select all
</Checkbox>
<CheckboxGroup value={selected} onValueChange={setSelected}>…</CheckboxGroup>`}
      >
        <SelectAllDemo />
      </Example>

      <Example
        id="in-field"
        code={`<Field invalid>
  <Checkbox>I agree to the terms</Checkbox>
  <Field.Error match>You must accept the terms.</Field.Error>
</Field>`}
      >
        <div style={{ width: "min(320px, 100%)" }}>
          <Field invalid>
            <Checkbox>I agree to the terms</Checkbox>
            <Field.Error match>You must accept the terms.</Field.Error>
          </Field>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>Checkbox</h4>
        <ApiReference component="Checkbox" />
        <h4>CheckboxGroup</h4>
        <ApiReference component="CheckboxGroup" />
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
