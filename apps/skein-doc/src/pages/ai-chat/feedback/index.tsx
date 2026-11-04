import { Feedback } from "@skeinui/ui";
import type { FeedbackSubmit } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "feedback" },
  { key: "group", name: "feedback-group / feedback-button" },
  { key: "form", name: "feedback-form" },
  { key: "reasons", name: "feedback-reasons / feedback-legend / feedback-reason" },
  { key: "comment", name: "feedback-comment / feedback-submit" },
  { key: "thanks", name: "feedback-thanks" },
];

const REASONS = ["Inaccurate", "Not helpful", "Too long", "Unsafe or offensive"];

function Demo() {
  const t = usePageT();
  const [sent, setSent] = useState<FeedbackSubmit | null>(null);
  return (
    <div style={{ width: 360, maxWidth: "100%" }}>
      <Feedback reasons={REASONS} onSubmit={setSent} />
      <pre style={{ marginTop: 12, fontSize: 12 }}>
        {sent ? JSON.stringify(sent, null, 2) : t("reasons.notSent")}
      </pre>
    </div>
  );
}

export default function FeedbackPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Feedback</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Feedback } from "@skeinui/ui";

<Feedback onValueChange={(v) => save(messageId, v)} />`}
      >
        <Feedback />
      </Example>

      <Example
        id="reasons"
        code={`<Feedback reasons={["Inaccurate", "Not helpful", "Too long"]} onSubmit={(f) => send(messageId, f)} />`}
      >
        <Demo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Feedback" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
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
