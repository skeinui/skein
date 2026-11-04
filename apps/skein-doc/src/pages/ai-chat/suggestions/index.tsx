import { Suggestions } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "suggestions" },
  { key: "header", name: "suggestions-header / -title / -description" },
  { key: "items", name: "suggestions-items" },
  { key: "item", name: "suggestions-item" },
  { key: "itemParts", name: "suggestions-item-icon / -text / -title / -description" },
];

/** The demo's suggestions: `grid.<key>` and `grid.<key>Text`. */
const ITEMS = ["summarize", "explain", "write", "plan"];

const Spark = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
  </svg>
);

function Demo({ layout }: { layout: "grid" | "list" | "chips" }) {
  const t = usePageT();
  const [picked, setPicked] = useState<string>("");
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <Suggestions
        layout={layout}
        title={t("grid.heading")}
        description={t("grid.description")}
        items={ITEMS.map((key) => ({
          id: key,
          title: t(`grid.${key}`),
          description: t(`grid.${key}Text`),
          icon: Spark,
        }))}
        onSelect={(item) => setPicked(item.prompt ?? item.title)}
      />
      <p>{picked ? t("grid.picked", { text: picked }) : t("grid.none")}</p>
    </div>
  );
}

export default function SuggestionsPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Suggestions</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="grid"
        code={`import { Suggestions } from "@skeinui/ui";

<Suggestions
  title="What can I help with?"
  items={[{ title: "Summarize this document", description: "…" }]}
  onSelect={(item) => send(item.prompt ?? item.title)}
/>`}
      >
        <Demo layout="grid" />
      </Example>

      <Example id="list" code={`<Suggestions layout="list" … />`}>
        <Demo layout="list" />
      </Example>

      <Example id="chips" code={`<Suggestions layout="chips" … />`}>
        <Demo layout="chips" />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Suggestions" />
        <p className="pg-desc">{t.rich("api.item")}</p>
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
