import { Queue } from "@skeinui/ui";
import type { QueueItem } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "queue" },
  { key: "header", name: "queue-header / queue-title / queue-count" },
  { key: "empty", name: "queue-empty" },
  { key: "item", name: "queue-item / queue-text" },
  { key: "remove", name: "queue-remove" },
  { key: "sortable", name: "sortable-*" },
];

const INITIAL: QueueItem[] = [
  { id: "1", text: "Summarize the report" },
  { id: "2", text: "Translate it to French" },
  { id: "3", text: "Draft an email to the team with the key points" },
];

function Demo() {
  const t = usePageT();
  const [items, setItems] = useState(INITIAL);
  return (
    <div style={{ width: 420, maxWidth: "100%" }}>
      <Queue items={items} onChange={setItems} />
      <p style={{ marginTop: 12 }}>
        <button type="button" onClick={() => setItems(INITIAL)}>
          {t("usage.reset")}
        </button>
      </p>
    </div>
  );
}

export default function QueuePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Queue</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Queue } from "@skeinui/ui";

const [items, setItems] = useState(initial);

<Queue items={items} onChange={setItems} />`}
      >
        <Demo />
      </Example>

      <Example id="empty" code={`<Queue items={[]} onChange={setItems} />`}>
        <div style={{ width: 420, maxWidth: "100%" }}>
          <Queue items={[]} onChange={() => {}} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Queue" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
