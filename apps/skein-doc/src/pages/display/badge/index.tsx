import { BADGE_VARIANTS, Badge, COLORS, RADII } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "slot", name: "data-slot", type: "badge" },
  { key: "variants", name: "data-variant / data-color / data-size / data-radius" },
];

export default function BadgePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Badge</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="variants"
        code={`<Badge variant="solid">Solid</Badge>
<Badge variant="soft">Soft</Badge>
<Badge variant="outline">Outline</Badge>`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          {BADGE_VARIANTS.map((v) => (
            <Badge key={v} variant={v} color="primary">
              {v}
            </Badge>
          ))}
        </div>
      </Example>

      <Example id="colors" code={`<Badge color="success">Success</Badge>`}>
        <div className="pg-stack pg-stack--start">
          {BADGE_VARIANTS.map((v) => (
            <div key={v} className="pg-flex pg-flex--center pg-flex--loose">
              {COLORS.map((c) => (
                <Badge key={c} variant={v} color={c}>
                  {c}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      </Example>

      <Example
        id="sizes"
        code={`<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Badge size="sm" color="primary">
            Small
          </Badge>
          <Badge size="md" color="primary">
            Medium
          </Badge>
          <Badge size="lg" color="primary">
            Large
          </Badge>
        </div>
      </Example>

      <Example id="radius" code={`<Badge radius="none">none</Badge>`}>
        <div className="pg-flex pg-flex--center pg-flex--loose">
          {RADII.map((r) => (
            <Badge key={r} radius={r} color="primary">
              {r}
            </Badge>
          ))}
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Badge" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type ?? t("styling.sameAsProps"),
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
