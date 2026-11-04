import { RADII, Skeleton } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "skeleton", name: "skeleton", type: "slot" },
  { key: "group", name: "skeleton-group", type: "slot" },
  { key: "states", name: "data-shape / data-size / data-radius / data-last", type: "state" },
];

export default function SkeletonPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Skeleton</h1>
      <Lead />
      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Skeleton } from "@skeinui/ui";

<Skeleton />`}
      >
        <Skeleton />
      </Example>

      <Example id="lines" code={`<Skeleton lines={3} />`}>
        <Skeleton lines={3} />
      </Example>

      <Example
        id="card"
        code={`<div style={{ display: "flex", gap: 12 }}>
  <Skeleton shape="circle" />
  <div style={{ flex: 1 }}><Skeleton lines={2} /></div>
</div>`}
      >
        <div className="pg-flex pg-flex--loose" style={{ alignItems: "center" }}>
          <Skeleton shape="circle" />
          <div style={{ flex: 1 }}>
            <Skeleton lines={2} />
          </div>
          <div style={{ width: 96, height: 64 }}>
            <Skeleton shape="rect" />
          </div>
        </div>
      </Example>

      <Example id="radius" code={`<Skeleton shape="rect" radius="full" />`}>
        <div className="pg-flex pg-flex--loose">
          {RADII.map((r) => (
            <div key={r} style={{ width: 72, height: 48 }}>
              <Skeleton shape="rect" radius={r} />
            </div>
          ))}
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Skeleton" />
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
