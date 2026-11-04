import { Typing } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "typing" },
  { key: "dots", name: "typing-dots / typing-dot" },
  { key: "pulse", name: "typing-pulse" },
  { key: "spinner", name: "typing-spinner" },
  { key: "skeleton", name: "typing-avatar / typing-lines / typing-line" },
];

export default function TypingPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Typing</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="variants"
        code={`import { Typing } from "@skeinui/ui";

<Typing />
<Typing variant="pulse" />
<Typing variant="spinner" />
<Typing variant="skeleton" />`}
      >
        <div className="pg-stack pg-stack--start" style={{ width: 420, maxWidth: "100%" }}>
          <Typing />
          <Typing variant="pulse" />
          <Typing variant="spinner" />
          <Typing variant="skeleton" />
        </div>
      </Example>

      <Example id="label" code={`<Typing label="Assistant is typing" />`}>
        <Typing label={t("label.text")} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Typing" />
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
