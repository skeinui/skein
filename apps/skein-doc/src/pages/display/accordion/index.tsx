import { ACCORDION_VARIANTS, Accordion, type AccordionProps } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "accordion / accordion-item" },
  { key: "header", name: "accordion-header / accordion-trigger / accordion-icon" },
  { key: "panel", name: "accordion-panel / accordion-content" },
];

function Demo({
  disabledThird = false,
  ...props
}: Omit<AccordionProps, "children"> & { disabledThird?: boolean }) {
  const t = usePageT();
  return (
    <Accordion {...props}>
      <Accordion.Item value="a">
        <Accordion.Trigger>{t("demo.q1")}</Accordion.Trigger>
        <Accordion.Panel>{t("demo.a1")}</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Trigger>{t("demo.q2")}</Accordion.Trigger>
        <Accordion.Panel>{t("demo.a2")}</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="c" disabled={disabledThird}>
        <Accordion.Trigger>{t("demo.q3")}</Accordion.Trigger>
        <Accordion.Panel>{t("demo.a3")}</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

export default function AccordionPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Accordion</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Accordion } from "@skeinui/ui";

<Accordion>
  <Accordion.Item value="a">
    <Accordion.Trigger>Question</Accordion.Trigger>
    <Accordion.Panel>Answer</Accordion.Panel>
  </Accordion.Item>
</Accordion>`}
      >
        <Demo />
      </Example>

      <Example
        id="variants"
        code={`<Accordion variant="divided" />
<Accordion variant="bordered" />
<Accordion variant="filled" />`}
      >
        <div className="pg-stack">
          {ACCORDION_VARIANTS.map((v) => (
            <Demo key={v} variant={v} />
          ))}
        </div>
      </Example>

      <Example id="multiple" code={`<Accordion multiple>…</Accordion>`}>
        <Demo multiple />
      </Example>

      <Example id="default-open" code={`<Accordion defaultValue={["b"]}>…</Accordion>`}>
        <Demo defaultValue={["b"]} />
      </Example>

      <Example id="disabled" code={`<Accordion.Item value="c" disabled>…</Accordion.Item>`}>
        <Demo disabledThird />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Accordion" />
        <h4>Accordion.Item</h4>
        <ApiReference component="Accordion.Item" />
        <h4>Accordion.Trigger</h4>
        <ApiReference component="Accordion.Trigger" />
        <h4>Accordion.Panel</h4>
        <ApiReference component="Accordion.Panel" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "data-slot",
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
