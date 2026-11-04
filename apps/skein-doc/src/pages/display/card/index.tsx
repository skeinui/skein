import { Button, CARD_VARIANTS, Card, RADII } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "card", name: "card" },
  { key: "header", name: "card-header / card-title / card-description" },
  { key: "body", name: "card-body / card-footer" },
];

export default function CardPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Card</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<Card>
  <Card.Header>
    <Card.Title>Card title</Card.Title>
    <Card.Description>Short description</Card.Description>
  </Card.Header>
  <Card.Body>Body content</Card.Body>
  <Card.Footer>
    <Button size="sm">Action</Button>
  </Card.Footer>
</Card>`}
      >
        <Card>
          <Card.Header>
            <Card.Title>{t("usage.cardTitle")}</Card.Title>
            <Card.Description>{t("usage.cardDescription")}</Card.Description>
          </Card.Header>
          <Card.Body>{t("usage.body")}</Card.Body>
          <Card.Footer>
            <Button size="sm">{t("usage.action")}</Button>
          </Card.Footer>
        </Card>
      </Example>

      <Example
        id="variants"
        code={`<Card variant="outline">…</Card>
<Card variant="filled">…</Card>
<Card variant="elevated">…</Card>`}
      >
        <div className="pg-grid">
          {CARD_VARIANTS.map((v) => (
            <Card key={v} variant={v}>
              <Card.Header>
                <Card.Title>{v}</Card.Title>
                <Card.Description>variant</Card.Description>
              </Card.Header>
              <Card.Body>{t("variants.content")}</Card.Body>
            </Card>
          ))}
        </div>
      </Example>

      <Example id="radius" code={`<Card radius="none">…</Card>`}>
        <div className="pg-grid">
          {RADII.map((r) => (
            <Card key={r} radius={r}>
              <Card.Body>{r}</Card.Body>
            </Card>
          ))}
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Card" />
        <p className="pg-desc">{t.rich("api.parts")}</p>
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
