import { Field, NumberField } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "number-field" },
  { key: "input", name: "input-group / input-group-input" },
  { key: "buttons", name: "number-field-decrement / number-field-increment" },
];

export default function NumberFieldPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Number Field</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { NumberField } from "@skeinui/ui";

<NumberField defaultValue={1} aria-label="Quantity" />`}
      >
        <NumberField defaultValue={1} aria-label="Quantity" />
      </Example>

      <Example id="range" code={`<NumberField min={0} max={10} step={2} defaultValue={4} />`}>
        <NumberField min={0} max={10} step={2} defaultValue={4} aria-label="Step 2" />
      </Example>

      <Example
        id="format"
        code={`<NumberField format={{ style: "currency", currency: "USD" }} defaultValue={1200} />`}
      >
        <NumberField
          format={{ style: "currency", currency: "USD" }}
          defaultValue={1200}
          aria-label="Price"
        />
      </Example>

      <Example id="variants" code={`<NumberField variant="filled" size="lg" />`}>
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <NumberField variant="outline" size="sm" defaultValue={1} aria-label="Small" />
          <NumberField variant="filled" size="md" defaultValue={2} aria-label="Filled" />
          <NumberField variant="outline" size="lg" defaultValue={3} aria-label="Large" />
        </div>
      </Example>

      <Example id="no-stepper" code={`<NumberField stepper={false} />`}>
        <NumberField stepper={false} defaultValue={5} aria-label="No stepper" />
      </Example>

      <Example
        id="in-field"
        code={`<Field><Field.Label>Seats</Field.Label><NumberField … /></Field>`}
      >
        <Field>
          <Field.Label>Seats</Field.Label>
          <NumberField defaultValue={3} min={1} />
          <Field.Description>Between 1 and 100.</Field.Description>
        </Field>
      </Example>

      <Example
        id="invalid"
        code={`<NumberField disabled />
<NumberField invalid />`}
      >
        <div className="pg-flex pg-flex--loose">
          <NumberField disabled defaultValue={1} aria-label="Disabled" />
          <NumberField invalid defaultValue={1} aria-label="Invalid" />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="NumberField" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
