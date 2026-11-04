import { COLORS, TAG_VARIANTS, Tag } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "tag / tag-label", type: "slot" },
  { key: "remove", name: "tag-remove", type: "slot" },
];

function RemovableDemo() {
  const t = usePageT();
  const [tags, setTags] = useState(["react", "vite", "base-ui", "tailwind"]);
  return (
    <div className="pg-flex pg-flex--center">
      {tags.map((tag) => (
        <Tag key={tag} color="primary" onRemove={() => setTags((l) => l.filter((x) => x !== tag))}>
          {tag}
        </Tag>
      ))}
      {tags.length === 0 ? <span className="pg-desc">{t("removable.empty")}</span> : null}
    </div>
  );
}

export default function TagPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Tag</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Tag } from "@skeinui/ui";

<Tag>react</Tag>`}
      >
        <Tag>react</Tag>
      </Example>

      <Example id="variants" code={`<Tag variant="outline" color="success">ok</Tag>`}>
        <div className="pg-stack pg-stack--start">
          {TAG_VARIANTS.map((v) => (
            <div key={v} className="pg-flex pg-flex--center">
              {COLORS.map((c) => (
                <Tag key={c} variant={v} color={c}>
                  {c}
                </Tag>
              ))}
            </div>
          ))}
        </div>
      </Example>

      <Example id="sizes" code={`<Tag size="sm">Small</Tag>`}>
        <div className="pg-flex pg-flex--center">
          <Tag size="sm" color="primary">
            {t("sizes.sm")}
          </Tag>
          <Tag size="md" color="primary">
            {t("sizes.md")}
          </Tag>
          <Tag size="lg" color="primary">
            {t("sizes.lg")}
          </Tag>
        </div>
      </Example>

      <Example id="removable" code={`<Tag onRemove={() => remove(id)}>react</Tag>`}>
        <RemovableDemo />
      </Example>

      <Example id="disabled" code={`<Tag disabled onRemove={…}>locked</Tag>`}>
        <Tag disabled onRemove={() => undefined}>
          {t("disabled.locked")}
        </Tag>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Tag" />
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
