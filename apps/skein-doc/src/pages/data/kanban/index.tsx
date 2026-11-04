import { Avatar, Kanban } from "@skeinui/ui";
import type { KanbanCard, KanbanColumn, KanbanProps } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";
import { useSettings } from "@/site/settings.ts";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "kanban" },
  {
    key: "column",
    name: "kanban-column / kanban-header / kanban-indicator / kanban-title / kanban-count",
  },
  { key: "body", name: "kanban-body / kanban-list / kanban-item / kanban-empty / kanban-add" },
  { key: "card", name: "kanban-card" },
  { key: "cardParts", name: "kanban-card-title / kanban-card-description / kanban-card-footer" },
  { key: "labels", name: "kanban-card-labels / kanban-label" },
  { key: "progress", name: "kanban-card-progress / -track / -bar / -text" },
  { key: "status", name: "kanban-status" },
];

function useBoard() {
  const t = usePageT();
  const d = (key: string) => t(`demo.${key}`);
  const columns: KanbanColumn[] = [
    { id: "open", title: d("open"), color: "success" },
    { id: "doing", title: d("doing"), color: "warning" },
    { id: "done", title: d("done"), color: "danger" },
  ];
  const people = (names: string[]) => (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {names.map((n) => (
        <Avatar key={n} size="sm" alt={n} fallback={n.slice(0, 1)} />
      ))}
    </span>
  );
  const cards: KanbanCard[] = [
    {
      id: "1",
      columnId: "open",
      title: d("c1.title"),
      description: d("c1.description"),
      labels: [{ label: d("low"), color: "success" }],
      progress: 0,
      footer: (
        <>
          {people(["A", "B"])}
          <span>{d("comments")}</span>
        </>
      ),
    },
    {
      id: "2",
      columnId: "open",
      title: d("c2.title"),
      description: d("c2.description"),
      labels: [{ label: d("high"), color: "danger" }],
    },
    {
      id: "3",
      columnId: "open",
      title: d("c3.title"),
      description: d("c3.description"),
      labels: [{ label: d("feature"), color: "primary" }],
      progress: 20,
    },
    {
      id: "4",
      columnId: "doing",
      title: d("c4.title"),
      description: d("c4.description"),
      labels: [
        { label: d("design"), color: "primary" },
        { label: d("doing"), color: "warning" },
      ],
      progress: 45,
      footer: people(["C", "D"]),
    },
    {
      id: "5",
      columnId: "doing",
      title: d("c5.title"),
      description: d("c5.description"),
      labels: [
        { label: "Bug", color: "danger" },
        { label: d("high"), color: "danger" },
      ],
      progress: 70,
    },
    {
      id: "6",
      columnId: "done",
      title: d("c6.title"),
      description: d("c6.description"),
      labels: [{ label: d("doneLabel"), color: "success" }],
      progress: 100,
      footer: people(["E"]),
    },
  ];
  return { columns, cards, t };
}

/** Column order is held by the page: column titles change when the language switches, and the order is tracked by id. */
function useColumnOrder(columns: KanbanColumn[]) {
  const [order, setOrder] = useState<string[] | null>(null);
  const ordered = order
    ? [...columns].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    : columns;
  return [ordered, (next: readonly KanbanColumn[]) => setOrder(next.map((c) => c.id))] as const;
}

const wrap = { width: "100%", maxWidth: 960 } as const;

function UsageDemo(props: Partial<KanbanProps> & { initial?: readonly KanbanCard[] }) {
  const { columns: base, cards: initial, t } = useBoard();
  const [columns, setColumns] = useColumnOrder(base);
  const [cards, setCards] = useState<readonly KanbanCard[]>(props.initial ?? initial);
  const [last, setLast] = useState(t("usage.hint"));
  return (
    <div style={wrap}>
      <Kanban
        aria-label={t("usage.board")}
        {...props}
        columns={columns}
        cards={cards}
        onCardsChange={setCards}
        onCardMove={({ card, from, to }) =>
          setLast(`${card.title}: ${from.columnId}#${from.index} → ${to.columnId}#${to.index}`)
        }
        onColumnsChange={setColumns}
        onColumnMove={({ column, from, to }) =>
          setLast(`${column.title}: column ${from + 1} → ${to + 1}`)
        }
      />
      <p style={{ marginTop: 12 }}>{last}</p>
    </div>
  );
}

/** Column menu: rename / collapse / delete; columns and cards are both held by the page (deleting also removes the cards). Reset when the language switches. */
function ColumnMenuDemo() {
  const { columns: base, cards: initial, t } = useBoard();
  const [columns, setColumns] = useState<readonly KanbanColumn[]>(base);
  const [cards, setCards] = useState<readonly KanbanCard[]>(initial);
  const [note, setNote] = useState(t("column-menu.hint"));
  return (
    <div style={wrap}>
      <Kanban
        aria-label={t("column-menu.board")}
        columns={columns}
        cards={cards}
        onCardsChange={setCards}
        onColumnsChange={setColumns}
        collapsible
        onCardDelete={(card) => {
          setCards((all) => all.filter((c) => c.id !== card.id));
          setNote(t("column-menu.deleted", { title: card.title }));
        }}
        onCardEdit={(card, changes) => {
          setCards((all) =>
            all.map((c) =>
              c.id === card.id
                ? { ...c, ...changes, description: changes.description || undefined }
                : c,
            ),
          );
          setNote(`${card.title} → ${changes.title}`);
        }}
        onAddCard={(columnId, title) => {
          setCards((all) => [...all, { id: `n${all.length}-${Date.now()}`, columnId, title }]);
          setNote(`+ ${title}`);
        }}
        onAddColumn={(title) => {
          setColumns((all) => [...all, { id: `col-${all.length}-${Date.now()}`, title }]);
          setNote(`+ ${title}`);
        }}
        onCollapsedColumnsChange={(ids) => setNote(`collapsed: ${ids.join(", ") || "-"}`)}
        onColumnRename={(column, title) => {
          setColumns((all) => all.map((c) => (c.id === column.id ? { ...c, title } : c)));
          setNote(`${column.title} → ${title}`);
        }}
        onColumnDelete={(column) => {
          setColumns((all) => all.filter((c) => c.id !== column.id));
          setCards((all) => all.filter((c) => c.columnId !== column.id));
          setNote(t("column-menu.deleted", { title: column.title }));
        }}
      />
      <p style={{ marginTop: 12 }}>{note}</p>
    </div>
  );
}

function ActionsDemo() {
  const { columns, cards: initial, t } = useBoard();
  const [cards, setCards] = useState<readonly KanbanCard[]>(initial);
  const [note, setNote] = useState(t("actions.hint"));
  return (
    <div style={wrap}>
      <Kanban
        aria-label={t("actions.board")}
        columns={columns}
        cards={cards}
        onCardsChange={setCards}
        onCardClick={(card) => setNote(t("actions.opened", { title: card.title }))}
        onAddCard={(columnId, title) => {
          setCards((all) => [...all, { id: `n${all.length}`, columnId, title }]);
          setNote(t("actions.added", { column: columnId, title }));
        }}
      />
      <p style={{ marginTop: 12 }}>{note}</p>
    </div>
  );
}

export default function KanbanPage() {
  const { columns, cards, t } = useBoard();
  const { lang } = useSettings();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Kanban</h1>
      <Lead />
      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Kanban } from "@skeinui/ui";

const [cards, setCards] = useState(initial);

<Kanban
  columns={[{ id: "open", title: "Open", color: "success" }, …]}
  cards={cards} // [{ id, columnId, title, description?, labels?, progress?, footer? }]
  onCardsChange={setCards}
/>`}
      >
        <UsageDemo />
      </Example>

      <Example
        id="actions"
        code={`<Kanban
  columns={columns}
  cards={cards}
  onCardsChange={setCards}
  onCardClick={(card) => open(card)}
  onAddCard={(columnId, title) => add(columnId, title)}
/>`}
      >
        <ActionsDemo />
      </Example>

      <Example id="sizes" code={`<Kanban size="sm" columns={columns} cards={cards} />`}>
        <div style={wrap}>
          <UsageDemo size="sm" initial={cards.slice(0, 4)} aria-label={t("sizes.board")} />
        </div>
      </Example>

      <Example
        id="column-menu"
        code={`<Kanban
  columns={columns}
  cards={cards}
  collapsible
  onColumnRename={(column, title) => rename(column.id, title)}
  onColumnDelete={(column) => remove(column.id)}
/>`}
      >
        <ColumnMenuDemo key={lang} />
      </Example>

      <Example id="height" code={`<Kanban height={420} columns={columns} cards={cards} />`}>
        <UsageDemo
          height={420}
          initial={[
            ...cards,
            ...cards.map((c) => ({ ...c, id: `${c.id}-b` })),
            ...cards.map((c) => ({ ...c, id: `${c.id}-c` })),
          ]}
        />
      </Example>

      <Example id="readonly" code={`<Kanban columns={columns} cards={cards} />`}>
        <div style={wrap}>
          <Kanban
            aria-label={t("readonly.board")}
            columns={columns}
            cards={cards.filter((c) => c.columnId !== "done")}
          />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Kanban" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "data-slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
