import { ShimmerText } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "shimmer-text" },
  { key: "label", name: "shimmer-text-label" },
  { key: "highlight", name: "shimmer-text-highlight" },
];

export default function ShimmerTextPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Shimmer Text</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { ShimmerText } from "@skeinui/ui";

<ShimmerText>Thinking…</ShimmerText>`}
      >
        <ShimmerText>{t("basic.text")}</ShimmerText>
      </Example>

      <Example
        id="states"
        code={`<ShimmerText>Searching the web…</ShimmerText>
<ShimmerText active={false}>Thought for 4s</ShimmerText>`}
      >
        <div className="pg-stack pg-stack--start">
          <ShimmerText>{t("states.searching")}</ShimmerText>
          <ShimmerText active={false}>{t("states.finished")}</ShimmerText>
        </div>
      </Example>

      <Example
        id="speed"
        code={`<ShimmerText duration={1}>Fast</ShimmerText>
<ShimmerText duration={4}>Slow</ShimmerText>`}
      >
        <div className="pg-stack pg-stack--start">
          <ShimmerText duration={1}>{t("speed.fast")}</ShimmerText>
          <ShimmerText duration={4}>{t("speed.slow")}</ShimmerText>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ShimmerText" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
