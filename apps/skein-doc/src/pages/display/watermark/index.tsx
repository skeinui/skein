import { Watermark } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "watermark", type: "slot" },
  { key: "layer", name: "watermark-layer", type: "slot" },
];

/** Sample content under the watermark, titled with the example's title. */
function Panel({ id }: { id: string }) {
  const t = usePageT();
  return (
    <div className="pg-wm-panel">
      <h4>{t(`${id}.title`)}</h4>
      <p>{t("panel.p1")}</p>
      <p>{t("panel.p2")}</p>
    </div>
  );
}

/** A simple SVG icon, converted to a data URI for use as an image watermark (same origin, no cross-origin involved). */
const LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="64" viewBox="0 0 120 64"><rect x="1" y="1" width="118" height="62" rx="12" fill="none" stroke="#888" stroke-width="2"/><text x="60" y="40" font-family="sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#888">SKEIN</text></svg>',
  );

export default function WatermarkPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Watermark</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Watermark } from "@skeinui/ui";

<Watermark content="Skein UI">…</Watermark>`}
      >
        <Watermark content="Skein UI">
          <Panel id="usage" />
        </Watermark>
      </Example>

      <Example
        id="multiline"
        code={`<Watermark content={["Skein UI", "Confidential"]}>…</Watermark>`}
      >
        <Watermark content={["Skein UI", "Confidential"]}>
          <Panel id="multiline" />
        </Watermark>
      </Example>

      <Example
        id="custom"
        code={`<Watermark
  content="Draft"
  rotate={-10}
  gap={[40, 40]}
  font={{ fontSize: 20, fontWeight: 700, color: "rgba(255, 0, 0, 0.18)" }}
>…</Watermark>`}
      >
        <Watermark
          content="Draft"
          rotate={-10}
          gap={[40, 40]}
          font={{ fontSize: 20, fontWeight: 700, color: "rgba(255, 0, 0, 0.18)" }}
        >
          <Panel id="custom" />
        </Watermark>
      </Example>

      <Example
        id="image"
        code={`<Watermark image="/logo.png" width={120} height={64}>…</Watermark>`}
      >
        <Watermark image={LOGO} width={96} height={52} gap={[60, 60]}>
          <Panel id="image" />
        </Watermark>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Watermark" />
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
