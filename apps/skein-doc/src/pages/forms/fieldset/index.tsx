import { Field, Fieldset, Input, Radio, RadioGroup } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

const HOOKS = [
  { key: "slot", name: "fieldset / fieldset-legend", type: "slot" },
  { key: "disabled", name: "data-disabled", type: "state" },
];

export default function FieldsetPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Fieldset</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Fieldset, Field, Input } from "@skeinui/ui";

<Fieldset legend="Account">
  <Field><Field.Label>Name</Field.Label><Input /></Field>
  <Field><Field.Label>Email</Field.Label><Input type="email" /></Field>
</Fieldset>`}
      >
        <Fieldset legend="Account">
          <Field>
            <Field.Label>Name</Field.Label>
            <Input placeholder="Ann Lee" />
          </Field>
          <Field>
            <Field.Label>Email</Field.Label>
            <Input type="email" placeholder="ann@example.com" />
          </Field>
        </Fieldset>
      </Example>

      <Example id="radio" code={`<Fieldset legend="Plan"><RadioGroup>…</RadioGroup></Fieldset>`}>
        <Fieldset legend="Plan">
          <RadioGroup defaultValue="free">
            <Radio value="free">Free</Radio>
            <Radio value="pro">Pro</Radio>
          </RadioGroup>
        </Fieldset>
      </Example>

      <Example id="disabled" code={`<Fieldset legend="Locked" disabled>…</Fieldset>`}>
        <Fieldset legend="Locked" disabled>
          <Field disabled>
            <Field.Label>Name</Field.Label>
            <Input defaultValue="Read only" disabled />
          </Field>
        </Fieldset>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Fieldset" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({ ...h, description: t(`styling.${h.key}`) }))}
        />
      </section>
    </article>
  );
}
