// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { ConfigProvider, Kanban } from "../src/index.ts";
import type { KanbanCard, KanbanProps } from "../src/index.ts";
import { zhCN } from "../src/locales/zh-CN.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const COLUMNS = [
  { id: "todo", title: "To do", color: "warning" as const },
  { id: "doing", title: "Doing", color: "primary" as const },
  { id: "done", title: "Done", color: "success" as const },
];
const CARDS: KanbanCard[] = [
  {
    id: "a",
    columnId: "todo",
    title: "Write spec",
    description: "Draft it",
    labels: [{ label: "Docs", color: "primary" }],
    progress: 40,
    footer: "2 comments",
  },
  { id: "b", columnId: "todo", title: "Design" },
  { id: "c", columnId: "doing", title: "Build" },
];

async function mount(props: Partial<KanbanProps> = {}, pack?: boolean) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const board = createElement(Kanban, { columns: COLUMNS, cards: CARDS, ...props });
  await act(async () =>
    root!.render(pack ? createElement(ConfigProvider, { ...zhCN }, board) : board),
  );
  return host;
}
const q = (s: string) => host!.querySelector<HTMLElement>(s);
const qa = (s: string) => [...host!.querySelectorAll<HTMLElement>(s)];
const text = (el: Element | null) => el?.textContent ?? "";
const click = (el: Element) =>
  act(async () => void el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const idsIn = (columnId: string) =>
  qa(`[data-slot="kanban-column"][data-column-id="${columnId}"] [data-slot="kanban-card"]`).map(
    (c) => c.dataset.cardId,
  );

describe("<Kanban />", () => {
  test("SSR has no class / style", () => {
    const html = ssr(createElement(Kanban, { columns: COLUMNS, cards: CARDS }));
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    expect(html).toContain('data-slot="kanban"');
  });

  test("each column has a status dot, title and count, cards go to columns by columnId, empty columns show a hint", async () => {
    await mount();
    const columns = qa('[data-slot="kanban-column"]');
    expect(columns.map((c) => text(c.querySelector('[data-slot="kanban-title"]')))).toEqual([
      "To do",
      "Doing",
      "Done",
    ]);
    expect(columns.map((c) => text(c.querySelector('[data-slot="kanban-count"]')))).toEqual([
      "2",
      "1",
      "0",
    ]);
    expect(columns[0].getAttribute("aria-label")).toBe("To do, 2 cards");
    expect(columns[1].getAttribute("aria-label")).toBe("Doing, 1 card");
    expect(qa('[data-slot="kanban-indicator"]').map((i) => i.dataset.color)).toEqual([
      "warning",
      "primary",
      "success",
    ]);
    expect(idsIn("todo")).toEqual(["a", "b"]);
    expect(idsIn("doing")).toEqual(["c"]);
    expect(text(columns[2].querySelector('[data-slot="kanban-empty"]'))).toBe("No cards");
  });

  test("card content: description, labels, progress (variable + screen reader), footer", async () => {
    await mount();
    const card = q('[data-card-id="a"]')!;
    expect(text(card.querySelector('[data-slot="kanban-card-description"]'))).toBe("Draft it");
    expect(card.querySelector<HTMLElement>('[data-slot="kanban-label"]')?.dataset.color).toBe(
      "primary",
    );
    const bar = card.querySelector<HTMLElement>('[data-slot="kanban-card-progress-bar"]')!;
    expect(bar.style.getPropertyValue("--kanban-progress")).toBe("40%");
    const progress = card.querySelector('[role="progressbar"]')!;
    expect(progress.getAttribute("aria-valuenow")).toBe("40");
    expect(progress.getAttribute("aria-label")).toBe("Progress");
    expect(text(card.querySelector('[data-slot="kanban-card-footer"]'))).toBe("2 comments");
    expect(q('[data-card-id="b"] [data-slot="kanban-card-progress"]')).toBeNull();
  });

  test("onCardClick: cards are buttons, Enter opens; without it a named block", async () => {
    const onCardClick = vi.fn();
    await mount({ onCardClick });
    const card = q('[data-card-id="b"]')!;
    expect(card.getAttribute("role")).toBe("button");
    await click(card);
    expect(onCardClick).toHaveBeenCalledWith(CARDS[1]);
    await act(
      async () =>
        void card.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
        ),
    );
    expect(onCardClick).toHaveBeenCalledTimes(2);
    await mount();
    expect(q('[data-card-id="b"]')?.getAttribute("role")).toBe("group");
    expect(q('[data-card-id="b"]')?.getAttribute("aria-label")).toBe("Design");
  });

  test("without onAddCard / onAddColumn: no add buttons", async () => {
    await mount();
    expect(q('[data-slot="kanban-add"]')).toBeNull();
    expect(q('[data-slot="kanban-add-column"]')).toBeNull();
  });

  test("size on the root; no dragging or hints without onCardsChange / onCardMove", async () => {
    await mount({ size: "lg" });
    expect(q('[data-slot="kanban"]')?.dataset.size).toBe("lg");
    expect(q('[data-slot="kanban-status"]')).toBeNull();
    expect(q('[data-card-id="a"]')?.hasAttribute("data-draggable")).toBe(false);
  });
});

describe("<Kanban /> drag and keyboard", () => {
  const rect = (left: number, top: number, width: number, height: number) =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON() {},
    }) as DOMRect;
  /** Each column is 200 wide; each card is 80 tall with a spacing of 10, laid out downward from y = 50. */
  const stub = () => {
    qa('[data-slot="kanban-column"]').forEach((col, i) => {
      col.getBoundingClientRect = () => rect(i * 200, 0, 200, 600);
      [...col.querySelectorAll<HTMLElement>('[data-slot="kanban-card"]')].forEach((card, j) => {
        card.getBoundingClientRect = () => rect(i * 200 + 10, 50 + j * 90, 180, 80);
      });
    });
  };
  const down = (el: Element, x: number, y: number) =>
    act(
      async () =>
        void el.dispatchEvent(
          new MouseEvent("pointerdown", { bubbles: true, clientX: x, clientY: y, button: 0 }),
        ),
    );
  const moveTo = (x: number, y: number) =>
    act(
      async () =>
        void window.dispatchEvent(new MouseEvent("pointermove", { clientX: x, clientY: y })),
    );
  const release = () => act(async () => void window.dispatchEvent(new MouseEvent("pointerup")));

  test("dragging to a position in another column: live preview, notifies on release, no click after dragging", async () => {
    const onCardsChange = vi.fn();
    const onCardMove = vi.fn();
    const onCardClick = vi.fn();
    await mount({ onCardsChange, onCardMove, onCardClick });
    stub();
    const card = q('[data-card-id="a"]')!;
    await down(card, 50, 80);
    await moveTo(250, 60); // the Doing column, upper half of c -> first
    expect(q('[data-slot="kanban"]')?.hasAttribute("data-dragging")).toBe(true);
    expect(idsIn("doing")).toEqual(["a", "c"]);
    expect(
      q('[data-slot="kanban-column"][data-column-id="doing"]')?.hasAttribute("data-over"),
    ).toBe(true);
    expect(onCardsChange).not.toHaveBeenCalled();
    await moveTo(250, 200); // below c -> after c
    expect(idsIn("doing")).toEqual(["c", "a"]);
    await act(async () => {
      window.dispatchEvent(new MouseEvent("pointerup"));
      q('[data-card-id="a"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const next = onCardsChange.mock.calls[0][0] as KanbanCard[];
    expect(next.find((c) => c.id === "a")?.columnId).toBe("doing");
    expect(next.filter((c) => c.columnId === "doing").map((c) => c.id)).toEqual(["c", "a"]);
    expect(onCardMove).toHaveBeenCalledWith({
      card: CARDS[0],
      from: { columnId: "todo", index: 0 },
      to: { columnId: "doing", index: 1 },
    });
    expect(onCardClick).not.toHaveBeenCalled();
    expect(text(q('[data-slot="kanban-status"]'))).toBe(
      "Write spec moved to Doing, position 2 of 2",
    );
  });

  test("dragging into an empty column; beyond the right edge counts as the last column", async () => {
    const onCardsChange = vi.fn();
    await mount({ onCardsChange });
    stub();
    await down(q('[data-card-id="b"]')!, 50, 150);
    await moveTo(900, 50);
    expect(idsIn("done")).toEqual(["b"]);
    await release();
    expect(
      (onCardsChange.mock.calls[0][0] as KanbanCard[]).find((c) => c.id === "b")?.columnId,
    ).toBe("done");
  });

  test("Esc cancels; no movement is not a drag", async () => {
    const onCardsChange = vi.fn();
    const onCardClick = vi.fn();
    await mount({ onCardsChange, onCardClick });
    stub();
    await down(q('[data-card-id="a"]')!, 50, 80);
    await moveTo(450, 100);
    expect(idsIn("done")).toEqual(["a"]);
    await act(
      async () => void window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
    );
    expect(q('[data-slot="kanban"]')?.hasAttribute("data-dragging")).toBe(false);
    await release();
    expect(onCardsChange).not.toHaveBeenCalled();
    expect(idsIn("todo")).toEqual(["a", "b"]);
    const again = q('[data-card-id="a"]')!;
    await down(again, 50, 80);
    await release();
    await click(again);
    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(onCardsChange).not.toHaveBeenCalled();
  });

  test("buttons inside a card do not start a drag", async () => {
    const onCardsChange = vi.fn();
    const cards = [
      { ...CARDS[0], footer: createElement("button", { type: "button" }, "more") },
      CARDS[1],
    ];
    await mount({ cards, onCardsChange });
    stub();
    await down(q('[data-slot="kanban-card-footer"] button')!, 50, 80);
    await moveTo(450, 100);
    expect(q('[data-slot="kanban"]')?.hasAttribute("data-dragging")).toBe(false);
  });

  const key = (el: Element, k: string, extra: KeyboardEventInit = {}) =>
    act(
      async () =>
        void el.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: k,
            altKey: true,
            bubbles: true,
            cancelable: true,
            ...extra,
          }),
        ),
    );

  test("keyboard: Alt + Left / Right change column, Up / Down reorder, nothing at the edges, with announcements", async () => {
    const onCardsChange = vi.fn();
    await mount({ onCardsChange });
    await key(q('[data-card-id="b"]')!, "ArrowUp");
    let next = onCardsChange.mock.calls.at(-1)![0] as KanbanCard[];
    expect(next.filter((c) => c.columnId === "todo").map((c) => c.id)).toEqual(["b", "a"]);
    onCardsChange.mockClear();
    await key(q('[data-card-id="a"]')!, "ArrowUp"); // already at the top
    await key(q('[data-card-id="b"]')!, "ArrowDown"); // already at the bottom
    await key(q('[data-card-id="a"]')!, "ArrowLeft"); // already in the first column
    expect(onCardsChange).not.toHaveBeenCalled();
    await key(q('[data-card-id="b"]')!, "ArrowRight");
    next = onCardsChange.mock.calls.at(-1)![0] as KanbanCard[];
    expect(next.find((c) => c.id === "b")?.columnId).toBe("doing");
    expect(text(q('[data-slot="kanban-status"]'))).toBe("Design moved to Doing, position 2 of 2");
    // Without Alt it doesn't move
    onCardsChange.mockClear();
    await act(
      async () =>
        void q('[data-card-id="b"]')!.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        ),
    );
    expect(onCardsChange).not.toHaveBeenCalled();
  });

  test("focus stays on the card after a controlled update", async () => {
    function Controlled() {
      const [cards, setCards] = useState<readonly KanbanCard[]>(CARDS);
      return createElement(Kanban, { columns: COLUMNS, cards, onCardsChange: setCards });
    }
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root!.render(createElement(Controlled)));
    const card = q('[data-card-id="a"]') as HTMLElement;
    card.focus();
    await key(card, "ArrowRight");
    expect(idsIn("doing")).toEqual(["a", "c"]);
    expect((document.activeElement as HTMLElement).dataset.cardId).toBe("a");
  });
});

describe("<Kanban /> column keyboard", () => {
  test("focus on a column: Alt + Left / Right move it one place, announce, focus stays on it, nothing at the edges", async () => {
    const changes: string[][] = [];
    await mount({ onColumnsChange: (c) => changes.push(c.map((x) => x.id)) });
    const col = () => q('[data-column-id="todo"]')!;
    expect(col().getAttribute("tabindex")).toBe("0");
    expect(col().getAttribute("aria-describedby")).toBeTruthy();
    col().focus();
    const key = (k: string, alt = true) =>
      act(
        async () =>
          void col().dispatchEvent(
            new KeyboardEvent("keydown", { key: k, altKey: alt, bubbles: true, cancelable: true }),
          ),
      );
    await key("ArrowLeft"); // already the first column
    await key("ArrowRight", false); // without Alt
    expect(changes).toEqual([]);
    await key("ArrowRight");
    expect(changes).toEqual([["doing", "todo", "done"]]);
    expect(text(q('[data-slot="kanban-status"]'))).toBe("To do moved to position 2 of 3");
  });
});

describe("<Kanban /> column menu", () => {
  const rect = (left: number, top: number, width: number, height: number) =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON() {},
    }) as DOMRect;
  const trigger = (id: string) => q(`[data-column-id="${id}"] [data-slot="kanban-column-menu"]`);

  test("without onColumnRename / onColumnDelete / collapsible: no menu button in the column header", async () => {
    await mount();
    expect(trigger("todo")).toBeNull();
  });

  test("with any of them: the column header has a menu button named with the column; collapsed columns do not show it", async () => {
    await mount({ collapsible: true, defaultCollapsedColumns: ["done"] });
    expect(trigger("todo")?.getAttribute("aria-label")).toBe("Actions for To do");
    expect(trigger("done")).toBeNull();
  });

  test("collapse: a narrow column with just the header and an expand button, no cards, the count stays; the expand button expands and notifies (uncontrolled)", async () => {
    const changes: (readonly string[])[] = [];
    await mount({
      collapsible: true,
      defaultCollapsedColumns: ["todo"],
      onCollapsedColumnsChange: (ids) => changes.push(ids),
    });
    const col = q('[data-column-id="todo"]')!;
    expect(col.hasAttribute("data-collapsed")).toBe(true);
    expect(col.querySelector('[data-slot="kanban-body"]')).toBeNull();
    expect(text(col.querySelector('[data-slot="kanban-count"]'))).toBe("2");
    const expand = col.querySelector<HTMLElement>('[data-slot="kanban-expand"]')!;
    expect(expand.getAttribute("aria-label")).toBe("Expand To do");
    expect(expand.getAttribute("aria-expanded")).toBe("false");
    await click(expand);
    expect(q('[data-column-id="todo"]')?.hasAttribute("data-collapsed")).toBe(false);
    expect(idsIn("todo")).toEqual(["a", "b"]);
    expect(changes).toEqual([[]]);
    expect(text(q('[data-slot="kanban-status"]'))).toBe("To do expanded");
  });

  test("controlled collapse: collapsedColumns decides, expand only notifies", async () => {
    const onCollapsedColumnsChange = vi.fn();
    await mount({ collapsedColumns: ["doing"], onCollapsedColumnsChange });
    await click(q('[data-column-id="doing"] [data-slot="kanban-expand"]')!);
    expect(onCollapsedColumnsChange).toHaveBeenCalledWith([]);
    expect(q('[data-column-id="doing"]')?.hasAttribute("data-collapsed")).toBe(true);
  });

  test("double-click the title to rename: Enter commits, Esc discards, unchanged / empty titles do not notify; focus returns to the menu button", async () => {
    const onColumnRename = vi.fn();
    await mount({ onColumnRename });
    const dbl = (id: string) =>
      act(
        async () =>
          void q(`[data-column-id="${id}"] [data-slot="kanban-title"]`)!.dispatchEvent(
            new MouseEvent("dblclick", { bubbles: true }),
          ),
      );
    const input = () => q('[data-slot="kanban-rename"] input') as HTMLInputElement;
    const type = (v: string) =>
      act(async () => {
        Reflect.set(HTMLInputElement.prototype, "value", v, input());
        input().dispatchEvent(new Event("input", { bubbles: true }));
      });
    const submit = () =>
      act(
        async () =>
          void q('[data-slot="kanban-rename"]')!.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
          ),
      );

    await dbl("todo");
    expect(input().value).toBe("To do");
    expect(input().getAttribute("aria-label")).toBe("Rename To do");
    await type("  Backlog ");
    await submit();
    expect(onColumnRename).toHaveBeenCalledTimes(1);
    expect(onColumnRename.mock.calls[0][1]).toBe("Backlog");
    expect(q('[data-slot="kanban-rename"]')).toBeNull();
    expect(text(q('[data-slot="kanban-status"]'))).toBe("Renamed to Backlog");

    await dbl("todo"); // Esc discards
    await type("Nope");
    await act(
      async () =>
        void input().dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
    );
    expect(q('[data-slot="kanban-rename"]')).toBeNull();
    await dbl("todo"); // unchanged
    await submit();
    await dbl("todo"); // empty
    await type("   ");
    await submit();
    expect(onColumnRename).toHaveBeenCalledTimes(1);
  });

  test("dragging a card to a collapsed column: lands at its end", async () => {
    const changes: (readonly KanbanCard[])[] = [];
    await mount({
      onCardsChange: (c) => changes.push(c),
      collapsible: true,
      defaultCollapsedColumns: ["doing"],
    });
    qa('[data-slot="kanban-column"]').forEach((col, i) => {
      col.getBoundingClientRect = () => rect(i * 200, 0, 200, 600);
      [...col.querySelectorAll<HTMLElement>('[data-slot="kanban-card"]')].forEach((card, j) => {
        card.getBoundingClientRect = () => rect(i * 200 + 10, 50 + j * 90, 180, 80);
      });
    });
    const fire = (type: string, x: number, y: number, el: EventTarget = window) =>
      act(
        async () =>
          void el.dispatchEvent(
            new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 }),
          ),
      );
    await fire("pointerdown", 40, 70, q('[data-card-id="a"]')!);
    await fire("pointermove", 100, 70);
    await fire("pointermove", 300, 100); // column 2 (collapsed)
    await act(async () => void window.dispatchEvent(new MouseEvent("pointerup")));
    const next = changes.at(-1)!;
    expect(next.filter((c) => c.columnId === "doing").map((c) => c.id)).toEqual(["c", "a"]);
  });
});

describe("<Kanban /> card editing", () => {
  // The dialog renders into body
  const form = () =>
    document.body.querySelector<HTMLFormElement>('[data-slot="kanban-card-editor"]');
  const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]');
  const field = (name: string) =>
    form()!.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)!;
  const type = (name: string, value: string) =>
    act(async () => {
      const el = field(name);
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
      Reflect.set(proto.prototype, "value", value, el);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  const submit = () =>
    act(
      async () =>
        void form()!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
  const open = (id: string) => click(q(`[data-card-id="${id}"]`)!);
  const label = (name: string) => (field(name) as HTMLInputElement).labels?.[0]?.textContent;

  test("without onCardEdit: clicking a card opens no dialog, cards are not buttons", async () => {
    await mount();
    expect(q('[data-card-id="a"]')!.getAttribute("role")).toBe("group");
    await open("a");
    expect(dialog()).toBeNull();
  });

  test("with it: cards are buttons, clicking opens a dialog with the card's current title and description, and says which column it is in", async () => {
    await mount({ onCardEdit: () => {} });
    expect(q('[data-card-id="a"]')!.getAttribute("role")).toBe("button");
    await open("a");
    expect(dialog()).not.toBeNull();
    expect(text(dialog()!.querySelector('[data-slot="dialog-title"]'))).toBe("Edit card");
    expect(text(dialog())).toContain("in column To do");
    expect(field("title").value).toBe("Write spec");
    expect(field("description").value).toBe("Draft it");
    expect(label("title")).toBe("Card title");
    expect(label("description")).toBe("Description");
    expect(label("progress")).toBe("Progress (%)");
    expect(text(dialog()!.querySelector('[data-slot="kanban-label-editor"]'))).toContain("Labels");
  });

  test("Enter / Space open it too (when the card has focus)", async () => {
    await mount({ onCardEdit: () => {} });
    await act(
      async () =>
        void q('[data-card-id="b"]')!.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
        ),
    );
    expect(field("title").value).toBe("Design");
  });

  test("submit: reports the trimmed changes, closes the dialog, announces", async () => {
    const edits: Record<string, unknown>[] = [];
    await mount({ onCardEdit: (card, c) => edits.push({ id: card.id, ...c }) });
    await open("a");
    await type("title", "  Write the spec ");
    await type("description", " Draft it well ");
    await submit();
    expect(edits).toEqual([
      {
        id: "a",
        title: "Write the spec",
        description: "Draft it well",
        labels: [{ label: "Docs", color: "primary" }],
        progress: 40,
        footer: "2 comments",
      },
    ]);
    expect(text(q('[data-slot="kanban-status"]'))).toBe("Write the spec updated");
    await act(async () => void (await new Promise((r) => setTimeout(r, 50))));
    expect(form()).toBeNull();
  });

  test("an empty title cannot be saved (marked invalid, the dialog stays); unchanged does not notify; the description can be cleared", async () => {
    const onCardEdit = vi.fn();
    await mount({ onCardEdit });
    await open("a");
    await type("title", "   ");
    await submit();
    expect(form()).not.toBeNull();
    expect(field("title").getAttribute("aria-invalid")).toBe("true");
    await type("title", "Write spec");
    await submit();
    expect(onCardEdit).not.toHaveBeenCalled();
    await act(async () => void (await new Promise((r) => setTimeout(r, 50))));
    await open("a");
    await type("description", "");
    await submit();
    expect(onCardEdit.mock.calls[0][1]).toMatchObject({ title: "Write spec", description: "" });
  });

  test("the cancel button discards changes; reopening shows the card's current content, not the unsaved edit", async () => {
    const onCardEdit = vi.fn();
    await mount({ onCardEdit });
    await open("a");
    await type("title", "Typed but cancelled");
    const cancel = [...dialog()!.querySelectorAll("button")].find((b) => text(b) === "Cancel")!;
    await click(cancel);
    await act(async () => void (await new Promise((r) => setTimeout(r, 50))));
    expect(onCardEdit).not.toHaveBeenCalled();
    await open("a");
    expect(field("title").value).toBe("Write spec");
  });

  test("Ctrl + Enter in the description submits", async () => {
    await mount({ onCardEdit: () => {} });
    await open("a");
    const submitted = vi.fn((e: Event) => e.preventDefault());
    form()!.addEventListener("submit", submitted);
    await act(
      async () =>
        void field("description").dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          }),
        ),
    );
    expect(submitted).toHaveBeenCalledTimes(1);
  });

  test("with onCardClick too: both fire; the dialog text follows the locale", async () => {
    const onCardClick = vi.fn();
    await mount({ onCardEdit: () => {}, onCardClick }, true);
    await open("a");
    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(text(dialog()!.querySelector('[data-slot="dialog-title"]'))).toBe("编辑卡片");
    expect(text(form()!.querySelector('button[type="submit"]'))).toBe("保存");
  });
});

describe("<Kanban /> inline add", () => {
  const composer = () => q('[data-slot="kanban-composer"]') as HTMLFormElement | null;
  const input = () => composer()!.querySelector("textarea, input") as HTMLTextAreaElement;
  const typeIn = (el: HTMLInputElement | HTMLTextAreaElement, value: string) =>
    act(async () => {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
      Reflect.set(proto.prototype, "value", value, el);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  const keyIn = (el: Element, key: string, shiftKey = false) =>
    act(
      async () =>
        void el.dispatchEvent(
          new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }),
        ),
    );

  test("each column has an add card button at the bottom; clicking shows a focused input in place of the button", async () => {
    await mount({ onAddCard: () => {} });
    const buttons = qa('[data-slot="kanban-add"]');
    expect(buttons).toHaveLength(3);
    expect(text(buttons[1])).toBe("Add a card");
    await click(buttons[1]);
    expect(composer()).not.toBeNull();
    expect(q('[data-column-id="doing"]')!.contains(composer())).toBe(true);
    expect(input().getAttribute("aria-label")).toBe("New card title");
    expect(qa('[data-slot="kanban-add"]')).toHaveLength(2);
  });

  test("Enter adds (with column id and title), the input clears but stays; Shift + Enter does not submit; blank does not submit; announces", async () => {
    const onAddCard = vi.fn();
    await mount({ onAddCard });
    await click(qa('[data-slot="kanban-add"]')[1]);
    await keyIn(input(), "Enter"); // empty
    expect(onAddCard).not.toHaveBeenCalled();
    await typeIn(input(), "   ");
    expect(composer()!.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(
      true,
    );
    await typeIn(input(), "  Ship it ");
    await keyIn(input(), "Enter", true);
    expect(onAddCard).not.toHaveBeenCalled();
    await keyIn(input(), "Enter");
    expect(onAddCard).toHaveBeenCalledWith("doing", "Ship it");
    expect(input().value).toBe("");
    expect(composer()).not.toBeNull();
    expect(text(q('[data-slot="kanban-status"]'))).toBe("Ship it added to Doing");
    await typeIn(input(), "Second");
    await act(
      async () =>
        void composer()!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(onAddCard).toHaveBeenLastCalledWith("doing", "Second");
  });

  test("Esc and the cancel button close the input, the button comes back", async () => {
    await mount({ onAddCard: () => {} });
    await click(qa('[data-slot="kanban-add"]')[0]);
    await keyIn(input(), "Escape");
    expect(composer()).toBeNull();
    expect(qa('[data-slot="kanban-add"]')).toHaveLength(3);
    await click(qa('[data-slot="kanban-add"]')[0]);
    await click([...composer()!.querySelectorAll("button")].find((b) => text(b) === "Cancel")!);
    expect(composer()).toBeNull();
  });

  test("one at a time: clicking add card in another column closes the previous one", async () => {
    await mount({ onAddCard: () => {} });
    await click(qa('[data-slot="kanban-add"]')[0]);
    await click(qa('[data-slot="kanban-add"]')[0]); // [0] is now column 2's button
    expect(qa('[data-slot="kanban-composer"]')).toHaveLength(1);
    expect(q('[data-column-id="doing"]')!.contains(composer())).toBe(true);
  });

  test("add column: a button at the end of the board opens a single-line input, Enter reports the title; announces", async () => {
    const onAddColumn = vi.fn();
    await mount({ onAddColumn });
    const wrap = q('[data-slot="kanban-add-column"]')!;
    expect(wrap.parentElement).toBe(q('[data-slot="kanban"]'));
    expect(text(wrap.querySelector('[data-slot="kanban-add"]'))).toBe("Add another column");
    await click(wrap.querySelector('[data-slot="kanban-add"]')!);
    expect(input().tagName).toBe("INPUT");
    expect(input().getAttribute("aria-label")).toBe("New column title");
    await typeIn(input(), " Review ");
    await act(
      async () =>
        void composer()!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(onAddColumn).toHaveBeenCalledWith("Review");
    expect(text(q('[data-slot="kanban-status"]'))).toBe("Column Review added");
    await keyIn(input(), "Escape");
    expect(composer()).toBeNull();
  });

  test("text follows the locale", async () => {
    await mount({ onAddCard: () => {}, onAddColumn: () => {} }, true);
    await click(qa('[data-slot="kanban-add"]')[0]);
    expect(input().getAttribute("aria-label")).toBe("新卡片的标题");
    expect(text(composer()!.querySelector('button[type="submit"]'))).toBe("添加卡片");
    expect(text(q('[data-slot="kanban-add-column"]'))).toBe("添加另一列");
  });
});

describe("<Kanban /> card dialog fields", () => {
  const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]');
  const form = () =>
    document.body.querySelector<HTMLFormElement>('[data-slot="kanban-card-editor"]')!;
  const field = (name: string) =>
    form().querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)!;
  const byLabel = (label: string) =>
    form().querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;
  const typeIn = (el: HTMLInputElement | HTMLTextAreaElement, value: string) =>
    act(async () => {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
      Reflect.set(proto.prototype, "value", value, el);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  const submit = () =>
    act(
      async () =>
        void form().dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
  const open = (id: string) => click(q(`[data-card-id="${id}"]`)!);
  const chips = () => [
    ...document.body.querySelectorAll<HTMLElement>(
      '[data-slot="kanban-label-editor"] [data-slot="kanban-label"]',
    ),
  ];

  test("labels: existing ones have remove buttons; remove, add (with color), no duplicate names, all reported on save", async () => {
    const onCardEdit = vi.fn();
    await mount({ onCardEdit });
    await open("a");
    expect(chips().map((c) => c.getAttribute("data-color"))).toEqual(["primary"]);
    const remove = byLabel("Remove label Docs");
    expect(remove).not.toBeNull();
    await click(remove);
    expect(chips()).toHaveLength(0);
    // Pick a color: swatches are buttons, the selected one has aria-pressed
    const swatch = (name: string) =>
      form().querySelector<HTMLElement>(`[data-slot="kanban-swatch"][aria-label="${name}"]`)!;
    expect(swatch("Primary").getAttribute("aria-pressed")).toBe("true");
    await click(swatch("Danger"));
    expect(swatch("Danger").getAttribute("aria-pressed")).toBe("true");
    expect(swatch("Primary").getAttribute("aria-pressed")).toBe("false");
    await typeIn(byLabel("New label"), "  Urgent ");
    await click([...form().querySelectorAll("button")].find((b) => text(b) === "Add")!);
    expect(chips().map((c) => [text(c), c.getAttribute("data-color")])).toEqual([
      ["Urgent", "danger"],
    ]);
    await typeIn(byLabel("New label"), "Urgent"); // duplicate
    await click([...form().querySelectorAll("button")].find((b) => text(b) === "Add")!);
    expect(chips()).toHaveLength(1);
    await submit();
    expect(onCardEdit.mock.calls[0][1].labels).toEqual([{ label: "Urgent", color: "danger" }]);
  });

  test("Enter in the label input adds a label, not submitting the card; text not yet added counts on save", async () => {
    const onCardEdit = vi.fn();
    await mount({ onCardEdit });
    await open("b"); // no labels
    const input = byLabel("New label");
    await typeIn(input, "Bug");
    const submitted = vi.fn((e: Event) => e.preventDefault());
    form().addEventListener("submit", submitted);
    await act(
      async () =>
        void input.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
        ),
    );
    expect(submitted).not.toHaveBeenCalled();
    expect(chips().map(text)).toEqual(["Bug"]);
    await typeIn(input, "Pending");
    form().removeEventListener("submit", submitted);
    await submit();
    expect(onCardEdit.mock.calls[0][1].labels.map((l: { label: string }) => l.label)).toEqual([
      "Bug",
      "Pending",
    ]);
  });

  test("progress: a number 0-100, clamped beyond, empty means none (undefined)", async () => {
    const onCardEdit = vi.fn();
    await mount({ onCardEdit });
    await open("a");
    expect(field("progress").value).toBe("40");
    await typeIn(field("progress"), "150");
    await submit();
    expect(onCardEdit.mock.calls[0][1].progress).toBe(100);
    await act(async () => void (await new Promise((r) => setTimeout(r, 60))));
    await open("a");
    await typeIn(field("progress"), "");
    await submit();
    expect(onCardEdit.mock.calls[1][1].progress).toBeUndefined();
  });

  test("footer: a string can be edited, cleared becomes undefined; a node has no field and is kept as is", async () => {
    const onCardEdit = vi.fn();
    const node = createElement("em", null, "custom");
    await mount({
      onCardEdit,
      cards: [
        ...CARDS.slice(0, 1),
        { id: "n", columnId: "todo", title: "Node footer", footer: node },
        { id: "e", columnId: "todo", title: "No footer" },
      ],
    });
    await open("a");
    expect(field("footer").value).toBe("2 comments");
    await typeIn(field("footer"), "");
    await submit();
    expect(onCardEdit.mock.calls[0][1].footer).toBeUndefined();
    await act(async () => void (await new Promise((r) => setTimeout(r, 60))));
    await open("n");
    expect(form().querySelector('[name="footer"]')).toBeNull();
    await typeIn(field("title"), "Node footer 2");
    await submit();
    expect(onCardEdit.mock.calls[1][1].footer).toBe(node);
    await act(async () => void (await new Promise((r) => setTimeout(r, 60))));
    await open("e");
    expect(field("footer").value).toBe("");
    await typeIn(field("footer"), "Added");
    await submit();
    expect(onCardEdit.mock.calls[2][1].footer).toBe("Added");
    expect(dialog()).toBeDefined();
  });

  test("changing only labels / progress / footer counts as a change; nothing changed does not notify", async () => {
    const onCardEdit = vi.fn();
    await mount({ onCardEdit });
    await open("a");
    await submit();
    expect(onCardEdit).not.toHaveBeenCalled();
    await act(async () => void (await new Promise((r) => setTimeout(r, 60))));
    await open("a");
    await typeIn(field("progress"), "41");
    await submit();
    expect(onCardEdit).toHaveBeenCalledTimes(1);
  });
});

describe("<Kanban /> card delete", () => {
  const alert = () => document.body.querySelector<HTMLElement>('[role="alertdialog"]');
  const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]');
  const wait = () => act(async () => void (await new Promise((r) => setTimeout(r, 60))));
  const keyOn = (id: string, key: string) =>
    act(
      async () =>
        void q(`[data-card-id="${id}"]`)!.dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
        ),
    );
  const button = (root: ParentNode, label: string) =>
    [...root.querySelectorAll("button")].find((b) => text(b) === label)!;

  test("without onCardDelete: Delete does nothing, no delete button in the dialog", async () => {
    await mount({ onCardEdit: () => {} });
    await keyOn("a", "Delete");
    expect(alert()).toBeNull();
    await click(q('[data-card-id="a"]')!);
    expect(dialog()!.querySelector('[data-slot="kanban-card-delete"]')).toBeNull();
  });

  test("Delete: asks for confirmation first (with the card title), calls and announces after confirming; cancel does not call", async () => {
    const onCardDelete = vi.fn();
    await mount({ onCardDelete });
    await keyOn("a", "Delete");
    expect(text(alert())).toContain('Delete "Write spec"?');
    await click(button(alert()!, "Cancel"));
    await wait();
    expect(onCardDelete).not.toHaveBeenCalled();
    await keyOn("a", "Delete");
    await click(button(alert()!, "Delete"));
    await wait();
    expect(onCardDelete).toHaveBeenCalledTimes(1);
    expect(onCardDelete.mock.calls[0][0].id).toBe("a");
    expect(text(q('[data-slot="kanban-status"]'))).toBe("Write spec deleted");
  });

  test("the edit dialog has Delete: clicking closes the editor, asks for confirmation, calls after confirming", async () => {
    const onCardDelete = vi.fn();
    await mount({ onCardEdit: () => {}, onCardDelete });
    await click(q('[data-card-id="b"]')!);
    const del = dialog()!.querySelector('[data-slot="kanban-card-delete"] button') as HTMLElement;
    expect(text(del)).toBe("Delete");
    await click(del);
    await wait();
    expect(dialog()).toBeNull();
    expect(text(alert())).toContain('Delete "Design"?');
    await click(button(alert()!, "Delete"));
    await wait();
    expect(onCardDelete.mock.calls[0][0].id).toBe("b");
  });

  test("Alt + Delete does not count; text follows the locale", async () => {
    const onCardDelete = vi.fn();
    await mount({ onCardDelete }, true);
    await act(
      async () =>
        void q('[data-card-id="a"]')!.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Delete", altKey: true, bubbles: true }),
        ),
    );
    expect(alert()).toBeNull();
    await keyOn("a", "Delete");
    expect(text(alert())).toContain("删除「Write spec」？");
    expect(text(alert())).toContain("这张卡片将被删除。");
  });
});

describe("<Kanban /> i18n", () => {
  test("ConfigProvider's locale switches the whole language, the component's own labels win", async () => {
    await mount({ onAddCard: () => {}, onCardsChange: () => {} }, true);
    expect(q('[data-slot="kanban"]')?.getAttribute("aria-label")).toBe("看板");
    expect(qa('[data-slot="kanban-column"]')[0].getAttribute("aria-label")).toBe("To do，2 张卡片");
    expect(text(q('[data-slot="kanban-add"]'))).toBe("添加卡片");
    expect(text(qa('[data-slot="kanban-empty"]')[0])).toBe("暂无卡片");
    await mount({ labels: { add: "New" }, onAddCard: () => {} }, true);
    expect(text(q('[data-slot="kanban-add"]'))).toBe("New");
  });
});

describe("<Kanban /> drag feel", () => {
  const rect = (left: number, top: number, width: number, height: number) =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON() {},
    }) as DOMRect;
  const stub = () => {
    qa('[data-slot="kanban-column"]').forEach((col, i) => {
      col.getBoundingClientRect = () => rect(i * 200, 0, 200, 600);
      [...col.querySelectorAll<HTMLElement>('[data-slot="kanban-card"]')].forEach((card, j) => {
        card.getBoundingClientRect = () => rect(i * 200 + 10, 50 + j * 90, 180, 80);
      });
    });
  };
  const fire = (type: string, x: number, y: number, el: EventTarget = window) =>
    act(
      async () =>
        void el.dispatchEvent(
          new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 }),
        ),
    );
  const preview = () =>
    document.body.querySelector<HTMLElement>('[data-slot="kanban-drag-preview"]');

  test("lifted: a copy in body follows the pointer (variables), the original spot becomes a placeholder, the copy is hidden from screen readers and not focusable", async () => {
    await mount({ onCardsChange: () => {} });
    stub();
    const card = q('[data-card-id="a"]')!;
    await fire("pointerdown", 40, 70, card); // the card's top-left is (10, 50): grabbed at (30, 20)
    expect(preview()).toBeNull();
    await fire("pointermove", 100, 120);
    const pv = preview()!;
    expect(pv).not.toBeNull();
    expect(host!.contains(pv)).toBe(false);
    expect(pv.getAttribute("aria-hidden")).toBe("true");
    expect(pv.style.getPropertyValue("--drag-x")).toBe("70px"); // 100 - 30
    expect(pv.style.getPropertyValue("--drag-y")).toBe("100px"); // 120 - 20
    expect(pv.style.getPropertyValue("--drag-w")).toBe("180px");
    expect(pv.querySelector('[tabindex="0"]')).toBeNull();
    expect(pv.querySelector("[data-card-id]")).toBeNull();
    expect(text(pv)).toContain("Write spec");
    // The original card becomes a placeholder
    expect(q('[data-card-id="a"]')?.hasAttribute("data-dragging")).toBe(true);
    await fire("pointermove", 130, 150);
    expect(pv.style.getPropertyValue("--drag-x")).toBe("100px");
    await act(async () => void window.dispatchEvent(new MouseEvent("pointerup")));
    expect(preview()).toBeNull();
    expect(q('[data-card-id="a"]')?.hasAttribute("data-dragging")).toBe(false);
  });

  test("the copy disappears after Esc", async () => {
    await mount({ onCardsChange: () => {} });
    stub();
    await fire("pointerdown", 40, 70, q('[data-card-id="a"]')!);
    await fire("pointermove", 100, 120);
    expect(preview()).not.toBeNull();
    await act(
      async () => void window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
    );
    expect(preview()).toBeNull();
  });

  test("dragging a column header: a copy of the whole column floats, others make room, the new order is reported on release", async () => {
    const changes: string[][] = [];
    const moves: { from: number; to: number }[] = [];
    await mount({
      onColumnsChange: (c) => changes.push(c.map((x) => x.id)),
      onColumnMove: ({ from, to }) => moves.push({ from, to }),
    });
    stub();
    const header = q('[data-column-id="todo"] [data-slot="kanban-header"]')!;
    await fire("pointerdown", 40, 20, header);
    await fire("pointermove", 60, 30);
    const pv = preview()!;
    expect(pv.getAttribute("data-kind")).toBe("column");
    expect(pv.getAttribute("aria-hidden")).toBe("true");
    expect(pv.querySelector('[data-slot="kanban-card"]')?.hasAttribute("data-card-id")).toBe(false);
    expect(q('[data-column-id="todo"]')?.hasAttribute("data-dragging")).toBe(true);
    await fire("pointermove", 450, 30); // past column 2's middle (300), not yet at column 3 (500)
    expect(qa('[data-slot="kanban-column"]').map((c) => c.dataset.columnId)).toEqual([
      "doing",
      "todo",
      "done",
    ]);
    await fire("pointermove", 560, 30);
    await act(async () => void window.dispatchEvent(new MouseEvent("pointerup")));
    expect(preview()).toBeNull();
    expect(changes).toEqual([["doing", "done", "todo"]]);
    expect(moves).toEqual([{ from: 0, to: 2 }]);
  });

  test("dragging a column header: Esc cancels, no notification", async () => {
    const onColumnsChange = vi.fn();
    await mount({ onColumnsChange });
    stub();
    await fire("pointerdown", 40, 20, q('[data-column-id="todo"] [data-slot="kanban-header"]')!);
    await fire("pointermove", 450, 30);
    await act(
      async () => void window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
    );
    expect(preview()).toBeNull();
    expect(onColumnsChange).not.toHaveBeenCalled();
  });

  test("without onColumnsChange / onColumnMove: columns cannot be dragged or focused; card dragging is unaffected", async () => {
    await mount({ onCardsChange: () => {} });
    stub();
    const col = q('[data-column-id="todo"]')!;
    expect(col.hasAttribute("data-draggable")).toBe(false);
    expect(col.hasAttribute("tabindex")).toBe(false);
    await fire("pointerdown", 40, 20, col.querySelector('[data-slot="kanban-header"]')!);
    await fire("pointermove", 450, 30);
    expect(preview()).toBeNull();
  });

  test("with the pointer in a gap between columns, the placeholder stays in the nearest column, not jumping to the last", async () => {
    await mount({ onCardsChange: () => {} });
    stub();
    // A 20px gap between columns
    qa('[data-slot="kanban-column"]').forEach((col, i) => {
      col.getBoundingClientRect = () => rect(i * 220, 0, 200, 600);
    });
    const dragIn = (columnIndex: number) =>
      qa('[data-slot="kanban-column"]')[columnIndex].querySelector(
        '[data-slot="kanban-card"][data-dragging]',
      ) !== null;
    await fire("pointerdown", 40, 70, q('[data-card-id="a"]')!);
    await fire("pointermove", 100, 70);
    await fire("pointermove", 205, 70); // the gap between columns 1 and 2, closer to column 1
    expect(dragIn(2)).toBe(false);
    expect(dragIn(0)).toBe(true);
    await fire("pointermove", 215, 70); // closer to column 2
    expect(dragIn(2)).toBe(false);
    expect(dragIn(1)).toBe(true);
    await act(async () => void window.dispatchEvent(new MouseEvent("pointerup")));
  });

  test("with the pointer near the board's right edge and its column not fully visible, the board scrolls horizontally", async () => {
    await mount({ onCardsChange: () => {} });
    stub();
    const board = q('[data-slot="kanban"]') as HTMLElement;
    board.getBoundingClientRect = () => rect(0, 0, 500, 600); // column 3 (400-600) half visible
    board.scrollLeft = 0;
    await fire("pointerdown", 40, 70, q('[data-card-id="a"]')!);
    await fire("pointermove", 490, 100); // 10px from the right edge
    await act(async () => void (await new Promise((r) => setTimeout(r, 80))));
    expect(board.scrollLeft).toBeGreaterThan(0);
    await act(async () => void window.dispatchEvent(new MouseEvent("pointerup")));
  });

  test("when the pointer's column is fully visible, no scrolling even at the edge (other columns do not jump)", async () => {
    await mount({ onCardsChange: () => {} });
    stub();
    const board = q('[data-slot="kanban"]') as HTMLElement;
    board.getBoundingClientRect = () => rect(0, 0, 600, 600); // all 3 columns fully visible
    board.scrollLeft = 0;
    await fire("pointerdown", 40, 70, q('[data-card-id="a"]')!);
    await fire("pointermove", 590, 100);
    await act(async () => void (await new Promise((r) => setTimeout(r, 80))));
    expect(board.scrollLeft).toBe(0);
    await act(async () => void window.dispatchEvent(new MouseEvent("pointerup")));
  });
});
