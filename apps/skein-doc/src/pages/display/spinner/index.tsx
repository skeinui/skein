import { COLORS, Spinner } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [{ key: "slot", name: "spinner", type: "slot" }];

export default function SpinnerPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Spinner</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example id="usage" code={`<Spinner />`}>
        <Spinner />
      </Example>

      <Example
        id="sizes"
        code={`<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </Example>

      <Example id="colors" code={`<Spinner color="success" />`}>
        <div className="pg-flex pg-flex--center pg-flex--loose">
          {COLORS.map((c) => (
            <Spinner key={c} color={c} />
          ))}
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Spinner" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
