import { ScrollArea } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "scroll-area / scroll-area-viewport", type: "slot" },
  { key: "scrollbar", name: "scroll-area-scrollbar / scroll-area-thumb", type: "slot" },
  { key: "corner", name: "scroll-area-corner", type: "slot" },
  { key: "states", name: "data-hovering / data-scrolling", type: "boolean attribute" },
];

export default function ScrollAreaPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Scroll Area</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ScrollArea } from "@skeinui/ui";

<div style={{ height: 200 }}>
  <ScrollArea>…long content…</ScrollArea>
</div>`}
      >
        <div style={{ height: 200, maxWidth: 360 }}>
          <ScrollArea>
            <div style={{ padding: 12 }}>
              {Array.from({ length: 20 }, (_, i) => (
                <p key={i} style={{ margin: "0 0 8px" }}>
                  {t("usage.item", { n: i + 1 })}
                </p>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Example>

      <Example id="horizontal" code={`<ScrollArea orientation="horizontal">…</ScrollArea>`}>
        <div style={{ height: 72, maxWidth: 360 }}>
          <ScrollArea orientation="horizontal">
            <div style={{ display: "flex", gap: 8, padding: 12, width: "max-content" }}>
              {Array.from({ length: 16 }, (_, i) => (
                <span
                  key={i}
                  style={{
                    padding: "4px 12px",
                    border: "1px solid var(--ui-border)",
                    borderRadius: 8,
                  }}
                >
                  {t("horizontal.tag", { n: i + 1 })}
                </span>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Example>

      <Example id="both" code={`<ScrollArea orientation="both">…</ScrollArea>`}>
        <div style={{ height: 160, maxWidth: 360 }}>
          <ScrollArea orientation="both">
            <div style={{ width: 640, padding: 12 }}>
              {Array.from({ length: 14 }, (_, i) => (
                <p key={i} style={{ margin: "0 0 8px" }}>
                  {t("both.line", { n: i + 1 })}
                </p>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ScrollArea" />
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
