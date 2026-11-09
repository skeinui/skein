import { MentionText, Paragraph } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

export default function MentionTextPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Mention Text</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<Paragraph>
  <MentionText text={message} mentions={["Ada Lin", "Ben Carter"]} />
</Paragraph>`}
      >
        <Paragraph>
          <MentionText text={t("usage.message")} mentions={["Ada Lin", "Ben Carter"]} />
        </Paragraph>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="MentionText" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
