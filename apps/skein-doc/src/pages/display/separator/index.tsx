import { Separator } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [{ key: "slot", name: "separator", type: "slot" }];

export default function SeparatorPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Separator</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example id="usage" code={`<Separator />`}>
        <div className="pg-stack">
          <span>{t("usage.above")}</span>
          <Separator />
          <span>{t("usage.below")}</span>
        </div>
      </Example>

      <Example
        id="vertical"
        code={`<div style={{ display: "flex", gap: 12 }}>
  <span>Docs</span>
  <Separator orientation="vertical" />
  <span>Blog</span>
</div>`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <span>{t("vertical.docs")}</span>
          <Separator orientation="vertical" />
          <span>{t("vertical.blog")}</span>
          <Separator orientation="vertical" />
          <span>{t("vertical.about")}</span>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Separator" />
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
