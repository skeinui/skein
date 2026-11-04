import { ScrollShadow } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "scroll-shadow", type: "slot" },
  { key: "content", name: "scroll-shadow-content", type: "slot" },
];

const ROWS = Array.from({ length: 16 }, (_, i) => i + 1);
const CHIPS = Array.from({ length: 18 }, (_, i) => i + 1);

export default function ScrollShadowPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Scroll Shadow</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { ScrollShadow } from "@skeinui/ui";

<div style={{ height: 220 }}>
  <ScrollShadow aria-label="Notifications">…long content…</ScrollShadow>
</div>`}
      >
        <div style={{ height: 220, maxWidth: 420 }}>
          <ScrollShadow aria-label="Notifications">
            {ROWS.map((r) => (
              <p key={r} style={{ margin: 0, padding: "0.5rem 0.25rem" }}>
                {t("basic.row", { n: r })}
              </p>
            ))}
          </ScrollShadow>
        </div>
      </Example>

      <Example
        id="horizontal"
        code={`<ScrollShadow orientation="horizontal" aria-label="Tags">…</ScrollShadow>`}
      >
        <div style={{ maxWidth: 420 }}>
          <ScrollShadow orientation="horizontal" aria-label="Tags">
            <div className="pg-flex" style={{ flexWrap: "nowrap", padding: "0.25rem 0" }}>
              {CHIPS.map((c) => (
                <span
                  key={c}
                  style={{
                    whiteSpace: "nowrap",
                    padding: "0.25rem 0.75rem",
                    border: "1px solid var(--ui-border)",
                    borderRadius: 999,
                  }}
                >
                  {t("horizontal.tag", { n: c })}
                </span>
              ))}
            </div>
          </ScrollShadow>
        </div>
      </Example>

      <Example id="size" code={`<ScrollShadow size={80} hideScrollbar>…</ScrollShadow>`}>
        <div style={{ height: 180, maxWidth: 420 }}>
          <ScrollShadow size={80} hideScrollbar aria-label="Long fade">
            {ROWS.map((r) => (
              <p key={r} style={{ margin: 0, padding: "0.5rem 0.25rem" }}>
                {t("basic.row", { n: r })}
              </p>
            ))}
          </ScrollShadow>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ScrollShadow" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
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
