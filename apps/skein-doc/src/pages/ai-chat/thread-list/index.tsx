import { ThreadList, type ThreadItem } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "thread-list" },
  { key: "items", name: "thread-list-items" },
  { key: "item", name: "thread-list-item" },
  { key: "icon", name: "thread-list-icon" },
  { key: "content", name: "thread-list-content / -title / -preview" },
  { key: "meta", name: "thread-list-meta" },
  { key: "emptyHint", name: "thread-list-empty" },
];

const Chat = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

function Demo() {
  const t = usePageT();
  const [value, setValue] = useState("1");
  const threads: ThreadItem[] = [
    {
      id: "1",
      title: t("usage.planning"),
      preview: t("usage.planningPreview"),
      meta: t("usage.today"),
      icon: Chat,
    },
    {
      id: "2",
      title: t("usage.recipes"),
      preview: t("usage.recipesPreview"),
      meta: t("usage.yesterday"),
      icon: Chat,
    },
    {
      id: "3",
      title: t("usage.debugging"),
      preview: t("usage.debuggingPreview"),
      meta: t("usage.monday"),
      icon: Chat,
    },
    { id: "4", title: t("usage.untitled"), icon: Chat },
  ];
  return (
    <div style={{ width: 320, maxWidth: "100%" }}>
      <ThreadList items={threads} value={value} onValueChange={setValue} />
    </div>
  );
}

export default function ThreadListPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Thread List</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ThreadList } from "@skeinui/ui";

<ThreadList
  items={[{ id: "1", title: "Project planning", preview: "…", meta: "Today" }]}
  value={current}
  onValueChange={setCurrent}
/>`}
      >
        <Demo />
      </Example>

      <Example
        id="empty"
        code={`<ThreadList items={[]} empty="No conversations yet" aria-label="Empty conversations" />`}
      >
        <div style={{ width: 320, maxWidth: "100%" }}>
          <ThreadList items={[]} empty={t("empty.text")} aria-label={t("empty.label")} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ThreadList" />
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
