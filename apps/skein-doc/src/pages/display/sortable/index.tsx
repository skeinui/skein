import { useState } from "react";
import { Sortable, Tag, arrayMove } from "@skeinui/ui";
import type { SortableItem } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "sortable-root / sortable", type: "slot" },
  { key: "item", name: "sortable-item", type: "slot" },
  { key: "handle", name: "sortable-handle / sortable-content", type: "slot" },
  { key: "status", name: "sortable-status", type: "slot" },
];

type T = ReturnType<typeof usePageT>;

const tasks = (t: T): SortableItem[] => [
  { id: "design", label: t("demo.design") },
  { id: "build", label: t("demo.build") },
  { id: "test", label: t("demo.test") },
  { id: "ship", label: t("demo.ship") },
];

function Demo({
  initial,
  orientation,
  variant,
}: {
  initial: SortableItem[];
  orientation?: "vertical" | "horizontal";
  variant?: "tile" | "list";
}) {
  const t = usePageT();
  const [items, setItems] = useState(initial);
  return (
    <div className="pg-stack">
      <Sortable
        aria-label={t("demo.list")}
        orientation={orientation}
        variant={variant}
        items={items}
        onReorder={(_, { from, to }) => setItems((list) => arrayMove(list, from, to))}
      />
      <p className="pg-desc">{items.map((i) => i.label).join(" → ")}</p>
    </div>
  );
}

const rich = (t: T): SortableItem[] => [
  {
    id: "a",
    label: "Release 1.0",
    content: (
      <span>
        Release 1.0 <Tag color="success">{t("demo.done")}</Tag>
      </span>
    ),
  },
  {
    id: "b",
    label: "Release 1.1",
    content: (
      <span>
        Release 1.1 <Tag color="primary">{t("demo.progress")}</Tag>
      </span>
    ),
  },
  { id: "c", label: t("demo.pinned"), disabled: true },
];

export default function SortablePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Sortable</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`const [items, setItems] = useState(tasks);

<Sortable
  aria-label="Tasks"
  items={items}
  onReorder={(_, { from, to }) => setItems((list) => arrayMove(list, from, to))}
/>`}
      >
        <Demo initial={tasks(t)} />
      </Example>

      <Example id="horizontal" code={`<Sortable orientation="horizontal" … />`}>
        <Demo initial={tasks(t)} orientation="horizontal" />
      </Example>

      <Example id="list" code={`<Sortable variant="list" items={columns} … />`}>
        <Demo initial={tasks(t)} variant="list" />
      </Example>

      <Example
        id="rich"
        code={`{ id, label: "Release 1.0", content: <span>…<Tag /></span> }
{ id, label: "Pinned", disabled: true }`}
      >
        <Demo initial={rich(t)} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Sortable" />
        <h4>{t("helpers.title")}</h4>
        <PropsTable
          first={t("helpers.name")}
          rows={[
            {
              name: "arrayMove(list, from, to)",
              type: "<T>(list: readonly T[], from: number, to: number) => T[]",
              description: t("helpers.arrayMove"),
            },
          ]}
        />
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
