import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  ComponentPropsWithoutRef,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { UIColor, UISize } from "../../contract.ts";
import { useVars } from "../../internal/use-vars.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { ConfirmDialog } from "../confirm-dialog/index.ts";
import { Input } from "../input/index.ts";
import { Menu } from "../menu/index.ts";
import { KanbanCardDialog, KanbanComposer, sameCard } from "./editors.tsx";
import { cardsOf, moveCard, moveColumn, positionOf } from "./move.ts";
import type {
  KanbanCard,
  KanbanCardChanges,
  KanbanColumn,
  KanbanColumnMove,
  KanbanMove,
  KanbanPosition,
} from "./move.ts";

type Without<T> = Omit<T, "className" | "style" | "children" | "onSelect">;

export interface KanbanLabels {
  /** Name of the board, default "Kanban board". */
  board: string;
  /** Name of each column: title and card count. */
  column: (title: string, count: number) => string;
  /** Name of the progress bar. */
  progress: string;
  /** Message in a column with no cards. */
  empty: string;
  /** Text of the "Add" button at the bottom of a column. */
  add: string;
  /** Hint for keyboard moves (read by screen readers on the card). */
  hint: string;
  /** Inline "add card" input: name, placeholder, submit button, and the announcement after adding. */
  addCardLabel: string;
  addCardPlaceholder: string;
  addCardSubmit: string;
  cardAdded: (title: string, column: string) => string;
  /** "Add column" at the end of the board: button text, plus the inline input's name, placeholder, submit button and the announcement after adding. */
  addColumn: string;
  addColumnLabel: string;
  addColumnPlaceholder: string;
  addColumnSubmit: string;
  columnAdded: (title: string) => string;
  /** Names of the tags, progress and footer items in the edit dialog. */
  editLabels: string;
  labelPlaceholder: string;
  labelAdd: string;
  removeLabel: (label: string) => string;
  colorGroup: string;
  /** Names of tag colors (screen reader names of the swatches). */
  colors: Record<UIColor, string>;
  editProgress: string;
  editProgressHint: string;
  editFooter: string;
  /** Announcement after a card is moved: the new column, which card, and how many in total. */
  moved: (title: string, column: string, position: number, total: number) => string;
  /** Hint for keyboard moves of a column (read by screen readers on the column). */
  columnHint: string;
  /** Announcement after a column is moved: which column, and how many in total. */
  columnMoved: (title: string, position: number, total: number) => string;
  /** Name of the column header menu button. */
  columnMenu: (title: string) => string;
  rename: string;
  /** Name of the rename input. */
  renameLabel: (title: string) => string;
  collapse: string;
  /** Name of the "expand" button on the narrow strip of a collapsed column. */
  expand: (title: string) => string;
  delete: string;
  deleteTitle: (title: string) => string;
  /** Description for the delete confirmation: the column name and the number of cards in it. */
  deleteDescription: (title: string, count: number) => string;
  columnRenamed: (title: string) => string;
  columnCollapsed: (title: string) => string;
  columnExpanded: (title: string) => string;
  columnDeleted: (title: string) => string;
  /** Title of the edit dialog, and the "which column" description under the title. */
  editCardTitle: string;
  editInColumn: (column: string) => string;
  /** Names of the two inputs in the edit box. */
  editTitleLabel: string;
  editDescriptionLabel: string;
  save: string;
  /** Announcement after saving. */
  cardEdited: (title: string) => string;
  /** Confirmation for deleting a card: title, description, and the announcement after deleting. Button text uses `delete`. */
  deleteCardTitle: (title: string) => string;
  deleteCardDescription: string;
  cardDeleted: (title: string) => string;
}

export interface KanbanProps extends Without<ComponentPropsWithoutRef<"section">> {
  /** The columns, left to right (`KanbanColumn`: `id`, `title`, `color`); owned by the caller. */
  columns: readonly KanbanColumn[];
  /** Flat cards, each with a `columnId`; the array order is the order within the column. */
  cards: readonly KanbanCard[];
  /** After a card is dragged / moved by keyboard, gives the whole array after the move; just update `cards` with it. It must be passed for dragging to work. */
  onCardsChange?: (cards: readonly KanbanCard[]) => void;
  /** Same as above, but gives the before and after positions of this move (for syncing to a backend). */
  onCardMove?: (move: KanbanMove) => void;
  /** After a column is dragged / moved by keyboard, gives the whole array after the move; just update `columns` with it. If passed, dragging a column header reorders the columns. */
  onColumnsChange?: (columns: readonly KanbanColumn[]) => void;
  /** Same as above, but gives the before and after positions of this move. */
  onColumnMove?: (move: KanbanColumnMove) => void;
  /** If given, the column header menu has "Rename" (double-clicking the column title also works): after editing it gives the new title, and the caller updates `columns`. */
  onColumnRename?: (column: KanbanColumn, title: string) => void;
  /**
   * If given, the column header menu has "Delete": clicking first shows a confirmation, and after confirming it is called. **The caller must remove both the column and its cards**
   * (remove the column from `columns` and its cards from `cards`); the component does not delete them for you.
   */
  onColumnDelete?: (column: KanbanColumn) => void;
  /**
   * The column header menu has "Collapse": a collapsed column is a narrow strip with a vertical title, click the button on it to expand; cards can still be dragged in (landing at the end).
   * @default false
   */
  collapsible?: boolean;
  /** Ids of collapsed columns (controlled). */
  collapsedColumns?: readonly string[];
  defaultCollapsedColumns?: readonly string[];
  onCollapsedColumnsChange?: (ids: readonly string[]) => void;
  /**
   * If given, clicking a card (Enter / Space also work) opens an edit dialog (like Trello): edit title and description, Enter / Save submits, Esc / Cancel discards.
   * An empty title cannot be saved, and no notification if nothing changed. The caller updates `cards`. If `onCardClick` is also given, both are triggered.
   */
  onCardEdit?: (card: KanbanCard, changes: KanbanCardChanges) => void;
  /**
   * If given, pressing the `Delete` key while a card is focused, or clicking "Delete" in the edit dialog (requires `onCardEdit` as well), first shows a confirmation, and after confirming it is called.
   * **The caller must remove the card** (remove it from `cards`); the component does not delete it for you.
   */
  onCardDelete?: (card: KanbanCard) => void;
  /** If given, a card is a button (Enter opens it); if not given (and `onCardEdit` is not given either) it is a plain block. */
  onCardClick?: (card: KanbanCard) => void;
  /**
   * If given, an "Add card" appears at the bottom of each column: clicking shows an input in place at the bottom of the column, Enter adds (the input stays so you can keep typing), Esc collapses it.
   * The callback gives which column and what the title is; the caller creates the card (id, etc.) and adds it to `cards`.
   */
  onAddCard?: (columnId: string, title: string) => void;
  /** If given, "Add another column" appears at the end of the board: clicking shows an input in place, Enter adds; the caller creates the column and adds it to `columns`. */
  onAddColumn?: (title: string) => void;
  /**
   * Levels for column width and gap: sm 240px, md 280px, lg 320px (decided by the theme style).
   * @default "md"
   */
  size?: UISize;
  /**
   * Height of the board (a number is px, or a length such as `"calc(100vh - 12rem)"`). If given: each column is at most this tall,
   * the column header and "Add" are fixed, the cards in between scroll within the column, and the whole board only scrolls horizontally (like Trello); if not given: columns grow with their content.
   */
  height?: number | string;
  labels?: Partial<KanbanLabels>;
}

/** The amount the element is currently translated by animation (0 when there is no animation). */
function animatedOffset(el: HTMLElement) {
  if (typeof el.getAnimations !== "function" || el.getAnimations().length === 0)
    return { x: 0, y: 0 };
  const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(el).transform);
  if (!m) return { x: 0, y: 0 };
  const v = m[1].split(",").map(Number);
  return { x: v[4] || 0, y: v[5] || 0 };
}

/**
 * The position where the element is actually laid out, after removing animation translation (its own and its ancestors': when a whole column makes way, the cards inside translate with it):
 * drop target detection and the drop animation are both computed from it, so they do not jitter with the make-way animation.
 */
function layoutRect(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  let x = 0;
  let y = 0;
  for (let n: HTMLElement | null = el; n && n.dataset.slot !== "kanban"; n = n.parentElement) {
    const o = animatedOffset(n);
    x += o.x;
    y += o.y;
  }
  return { left: r.left - x, top: r.top - y, width: r.width, height: r.height };
}

const EllipsisIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.75" />
    <circle cx="12" cy="12" r="1.75" />
    <circle cx="19" cy="12" r="1.75" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m9 6 6 6-6 6" />
  </svg>
);

/** Rename input for a column title: Enter / blur commits, Esc discards. */
function KanbanRename({
  title,
  label,
  onSubmit,
  onCancel,
}: {
  title: string;
  label: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const done = useRef(false);
  const finish = (fn: () => void) => {
    // After Enter the input unmounts and fires blur once more, count it only once
    if (done.current) return;
    done.current = true;
    fn();
  };
  return (
    <form
      data-slot="kanban-rename"
      onSubmit={(e) => {
        e.preventDefault();
        finish(() => onSubmit(new FormData(e.currentTarget).get("title") as string));
      }}
    >
      <Input
        name="title"
        size="sm"
        fullWidth
        autoFocus
        defaultValue={title}
        aria-label={label}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={(e) => finish(() => onSubmit(e.currentTarget.value))}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            finish(onCancel);
          }
        }}
      />
    </form>
  );
}

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** Fill of the progress bar: the width is a runtime number, written as a CSS variable. */
function ProgressFill({ value }: { value: number }) {
  const ref = useVars<HTMLSpanElement>({
    "--kanban-progress": `${Math.min(100, Math.max(0, value))}%`,
  });
  return <span ref={ref} data-slot="kanban-card-progress-bar" />;
}

/**
 * Kanban board: several columns of cards, and cards can be dragged between columns and reordered within a column. The data is flat `columns` + `cards` (cards have a `columnId`,
 * and the array order is the order within the column), the state is held by the caller: after a drag the new array is handed back via `onCardsChange`.
 * While dragging, the card lands at its new position live (preview), and the notification comes only on release, Esc cancels; keyboard: after focusing a card, Alt + Left / Right changes column, Alt + Up / Down changes order,
 * each announced with `role="status"`, with focus staying on this card. Card content is a fixed set of items (title, description, tags, progress, footer).
 */
export function Kanban({
  columns,
  cards,
  onCardsChange,
  onCardMove,
  onCardClick,
  onAddCard,
  onAddColumn,
  onColumnsChange,
  onColumnMove,
  onCardEdit,
  onCardDelete,
  onColumnRename,
  onColumnDelete,
  collapsible = false,
  collapsedColumns,
  defaultCollapsedColumns,
  onCollapsedColumnsChange,
  size = "md",
  height,
  labels: labelsProp,
  "aria-label": ariaLabel,
  ...rest
}: KanbanProps) {
  const labels = useLabels("kanban", labelsProp);
  const common = useLabels("common");
  const hintId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const heightValue = typeof height === "number" ? `${height}px` : height;
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (heightValue === undefined) el.style.removeProperty("--kanban-height");
    else el.style.setProperty("--kanban-height", heightValue);
  }, [heightValue]);
  const [preview, setPreview] = useState<({ id: string } & KanbanPosition) | null>(null);
  const [status, setStatus] = useState("");
  /** The column being dragged: the drop position (which index) and the column that was picked up. */
  const [columnPreview, setColumnPreview] = useState<{ id: string; index: number } | null>(null);
  const [liftedColumn, setLiftedColumn] = useState<{ id: string } | null>(null);
  const columnHintId = useId();
  const [innerCollapsed, setInnerCollapsed] = useState<readonly string[]>(
    defaultCollapsedColumns ?? [],
  );
  const collapsedIds = collapsedColumns ?? innerCollapsed;
  const [renaming, setRenaming] = useState<string | null>(null);
  /** The card being edited (still needed during the dialog's closing animation, so it is stored separately from the open flag). */
  const [editTarget, setEditTarget] = useState<KanbanCard | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const editVersion = useRef(0);
  /** Which column has its "add card" input open; whether the "add column" input at the end of the board is open. */
  const [composing, setComposing] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  /** A card / column was just added: scroll it into view after layout completes. */
  const scrollTo = useRef<{ card: string } | { column: true } | null>(null);
  const [cardDeleteTarget, setCardDeleteTarget] = useState<KanbanCard | null>(null);
  const [cardDeleteOpen, setCardDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ column: KanbanColumn; count: number } | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  /** After renaming ends, which column's menu button focus returns to. */
  const returnFocus = useRef<string | null>(null);
  const menuEnabled = onColumnRename !== undefined || onColumnDelete !== undefined || collapsible;
  const pendingColumnFocus = useRef<string | null>(null);
  const columnsDraggable = onColumnsChange !== undefined || onColumnMove !== undefined;
  /** The card being picked up: a copy that floats under the pointer and follows it. */
  const [lifted, setLifted] = useState<{ id: string } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  /** Position of the copy: where the pointer is now, where on the card the pointer grabbed it, and the card's size. */
  const dragGeometry = useRef({ px: 0, py: 0, gx: 0, gy: 0, w: 0, h: 0 });
  const rects = useRef(new Map<string, { x: number; y: number; columnId?: string }>());
  const suppressClick = useRef(false);
  const pendingFocus = useRef<string | null>(null);
  const draggable = onCardsChange !== undefined || onCardMove !== undefined;
  const liftedCard = lifted ? cards.find((c) => c.id === lifted.id) : undefined;
  const shown = preview ? moveCard(cards, preview.id, preview.columnId, preview.index) : cards;
  const liftedColumnData = liftedColumn ? columns.find((c) => c.id === liftedColumn.id) : undefined;
  const shownColumns = columnPreview
    ? moveColumn(columns, columnPreview.id, columnPreview.index)
    : columns;
  const anyDragging = preview !== null || columnPreview !== null;

  const commit = (card: KanbanCard, to: KanbanPosition) => {
    const from = positionOf(cards, card.id);
    if (!from) return;
    const next = moveCard(cards, card.id, to.columnId, to.index);
    if (next === cards) return;
    const now = positionOf(next, card.id)!;
    onCardsChange?.(next);
    onCardMove?.({ card, from, to: now });
    const column = columns.find((c) => c.id === now.columnId);
    setStatus(
      labels.moved(
        card.title,
        column?.title ?? now.columnId,
        now.index + 1,
        cardsOf(next, now.columnId).length,
      ),
    );
  };

  const commitColumn = (column: KanbanColumn, to: number) => {
    const from = columns.findIndex((c) => c.id === column.id);
    if (from < 0) return;
    const next = moveColumn(columns, column.id, to);
    if (next === columns) return;
    const now = next.findIndex((c) => c.id === column.id);
    onColumnsChange?.(next);
    onColumnMove?.({ column, from, to: now });
    setStatus(labels.columnMoved(column.title, now + 1, next.length));
  };

  const setCollapsed = (column: KanbanColumn, collapse: boolean) => {
    const next = collapse
      ? [...collapsedIds.filter((id) => id !== column.id), column.id]
      : collapsedIds.filter((id) => id !== column.id);
    setInnerCollapsed(next);
    onCollapsedColumnsChange?.(next);
    setStatus(
      collapse ? labels.columnCollapsed(column.title) : labels.columnExpanded(column.title),
    );
  };
  const submitRename = (column: KanbanColumn, value: string) => {
    const title = value.trim();
    setRenaming(null);
    returnFocus.current = column.id;
    if (!title || title === column.title) return;
    onColumnRename?.(column, title);
    setStatus(labels.columnRenamed(title));
  };
  const openEdit = (card: KanbanCard) => {
    editVersion.current += 1;
    setEditTarget(card);
    setEditOpen(true);
  };
  /** Click / Enter: calls `onCardClick`, and with `onCardEdit` opens the edit dialog. */
  const activate = (card: KanbanCard) => {
    onCardClick?.(card);
    if (onCardEdit) openEdit(card);
  };
  const addCard = (column: KanbanColumn, title: string) => {
    scrollTo.current = { card: column.id };
    onAddCard?.(column.id, title);
    setStatus(labels.cardAdded(title, column.title));
  };
  const addColumn = (title: string) => {
    scrollTo.current = { column: true };
    onAddColumn?.(title);
    setStatus(labels.columnAdded(title));
  };
  // After adding a card: scroll the list to the bottom (in a height-limited column the new card is at the bottom); after adding a column: scroll the board all the way right so the input comes into view too
  useLayoutEffect(() => {
    const target = scrollTo.current;
    const root = rootRef.current;
    if (!target || !root) return;
    scrollTo.current = null;
    if ("card" in target) {
      const list = [...root.querySelectorAll<HTMLElement>('[data-slot="kanban-column"]')]
        .find((c) => c.dataset.columnId === target.card)
        ?.querySelector<HTMLElement>('[data-slot="kanban-list"]');
      if (list) list.scrollTop = list.scrollHeight;
    } else root.scrollLeft = root.scrollWidth;
  }, [cards, columns]);
  const askDeleteCard = (card: KanbanCard) => {
    setCardDeleteTarget(card);
    setCardDeleteOpen(true);
  };
  const submitCard = (card: KanbanCard, changes: KanbanCardChanges) => {
    setEditOpen(false);
    if (sameCard(card, changes)) return;
    onCardEdit?.(card, changes);
    setStatus(labels.cardEdited(changes.title));
  };

  // After renaming ends (Enter, blur, Esc): focus returns to this column's menu button
  useLayoutEffect(() => {
    if (renaming !== null || returnFocus.current === null) return;
    const id = returnFocus.current;
    returnFocus.current = null;
    [...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="kanban-column"]') ?? [])]
      .find((el) => el.dataset.columnId === id)
      ?.querySelector<HTMLElement>('[data-slot="kanban-column-menu"]')
      ?.focus();
  }, [renaming]);

  // After a column changes position, give focus back to it (the browser drops focus when a node is moved)
  useLayoutEffect(() => {
    const id = pendingColumnFocus.current;
    if (id === null) return;
    pendingColumnFocus.current = null;
    [...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="kanban-column"]') ?? [])]
      .find((el) => el.dataset.columnId === id)
      ?.focus();
  }, [columns]);

  // After changing column the card remounts, so give focus back to it
  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (id === null) return;
    pendingFocus.current = null;
    [...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="kanban-card"]') ?? [])]
      .find((el) => el.dataset.cardId === id)
      ?.focus();
  }, [cards]);

  /** Place the copy under the pointer: position and size are written as CSS variables, bypassing rendering (they must update on every pointer move). */
  const placePreview = () => {
    const el = previewRef.current;
    if (!el) return;
    const g = dragGeometry.current;
    el.style.setProperty("--drag-x", `${g.px - g.gx}px`);
    el.style.setProperty("--drag-y", `${g.py - g.gy}px`);
    el.style.setProperty("--drag-w", `${g.w}px`);
    el.style.setProperty("--drag-h", `${g.h}px`);
  };
  // When the clone has just been attached, place it first to avoid a flash
  useLayoutEffect(() => {
    if (lifted) placePreview();
  }, [lifted]);

  /**
   * Layout positions of columns and cards in the board (computed from board content; scrolling does not change them). A card also remembers which column it is in:
   * when a whole column makes way, its cards move with the column and must not animate again on their own.
   */
  const measure = () => {
    const root = rootRef.current;
    const items: {
      el: HTMLElement;
      key: string;
      x: number;
      y: number;
      columnId?: string;
    }[] = [];
    if (!root) return items;
    const box = root.getBoundingClientRect();
    for (const el of root.querySelectorAll<HTMLElement>(
      '[data-slot="kanban-column"], [data-slot="kanban-card"]',
    )) {
      const isCard = el.dataset.slot === "kanban-card";
      const id = isCard ? el.dataset.cardId : el.dataset.columnId;
      if (!id) continue;
      const r = layoutRect(el);
      items.push({
        el,
        key: `${isCard ? "c" : "k"}:${id}`,
        x: r.left - box.left + root.scrollLeft,
        y: r.top - box.top,
        columnId: isCard ? el.dataset.columnId : undefined,
      });
    }
    return items;
  };
  const snapshot = () =>
    new Map(measure().map((m) => [m.key, { x: m.x, y: m.y, columnId: m.columnId }]));

  // A column / card changed position (dragged over by someone else, or making way): slide smoothly from the old position to the new one (FLIP). Positions are computed from board content, so scrolling does not trigger it
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = measure();
    const columnShift = new Map<string, { x: number; y: number }>();
    for (const m of items) {
      const before = rects.current.get(m.key);
      if (!before) continue;
      // What is recorded is the layout position; when an animation in progress is interrupted, continue from where it currently appears, without snapping back
      let moveX = before.x - m.x;
      let moveY = before.y - m.y;
      if (m.key.startsWith("k:")) columnShift.set(m.key.slice(2), { x: moveX, y: moveY });
      else if (m.columnId !== undefined && before.columnId === m.columnId) {
        // The card did not change column: the part its column slid is animated by the column
        const shift = columnShift.get(m.columnId);
        if (shift) {
          moveX -= shift.x;
          moveY -= shift.y;
        }
      }
      if (reduced || typeof m.el.animate !== "function") continue;
      if (Math.abs(moveX) < 1 && Math.abs(moveY) < 1) continue;
      const now = animatedOffset(m.el);
      for (const a of m.el.getAnimations()) a.cancel();
      const slide = m.el.animate(
        [
          { transform: `translate(${moveX + now.x}px, ${moveY + now.y}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
      // Mark the board while sliding: transform temporarily enlarges the scrollable area, and the theme style uses this to suppress the vertical scrollbar
      root.setAttribute("data-settling", "");
      const done = () => {
        if (
          root.isConnected &&
          !root
            .getAnimations({ subtree: true })
            .some((x) => x !== slide && x.playState === "running")
        )
          root.removeAttribute("data-settling");
      };
      slide.addEventListener("finish", done);
      slide.addEventListener("cancel", done);
    }
    rects.current = new Map(items.map((m) => [m.key, { x: m.x, y: m.y, columnId: m.columnId }]));
    // While dragging, the board height only grows and never shrinks: when a card is lifted out of the tallest column, content below the page does not jump up and down, and the scroll anchor needs no compensation
    if (anyDragging) {
      const h = Math.ceil(box.height);
      const locked = parseFloat(root.style.getPropertyValue("--kanban-lock")) || 0;
      if (h > locked) root.style.setProperty("--kanban-lock", `${h}px`);
    } else root.style.removeProperty("--kanban-lock");
  });

  /** The column under the pointer (horizontal range; clamped to the two ends when outside) and the insertion index (how many cards are above its midline). */
  const targetAt = (x: number, y: number, draggedId: string): KanbanPosition | null => {
    const cols = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="kanban-column"]') ?? []),
    ];
    if (cols.length === 0) return null;
    // When the pointer is in the gap between columns, take the horizontally nearest column (it must not fall back to the last column: that makes the placeholder flash in other columns)
    const gap = (c: HTMLElement) => {
      const r = layoutRect(c);
      return x < r.left ? r.left - x : x >= r.left + r.width ? x - (r.left + r.width) + 1 : 0;
    };
    const hit = cols.reduce((best, c) => (gap(c) < gap(best) ? c : best), cols[0]);
    const columnId = hit.dataset.columnId;
    if (!columnId) return null;
    // A collapsed column renders no cards: land at the end
    if (hit.hasAttribute("data-collapsed"))
      return {
        columnId,
        index: cardsOf(cards, columnId).filter((c) => c.id !== draggedId).length,
      };
    const index = [...hit.querySelectorAll<HTMLElement>('[data-slot="kanban-card"]')]
      .filter((el) => el.dataset.cardId !== draggedId)
      .filter((el) => {
        const r = layoutRect(el);
        return r.top + r.height / 2 < y;
      }).length;
    return { columnId, index };
  };

  /** The horizontal slot the pointer falls in: how many other columns have their midline to the left of the pointer. */
  const columnTargetAt = (x: number, draggedId: string): number =>
    [...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="kanban-column"]') ?? [])]
      .filter((el) => el.dataset.columnId !== draggedId)
      .filter((el) => {
        const r = layoutRect(el);
        return r.left + r.width / 2 < x;
      }).length;

  /**
   * Shared drag flow (cards and columns both use it): the pointer must move more than 4px to count as a pick-up; after that the clone follows the pointer and the drop target is recomputed;
   * auto-scroll near the edges; on release the clone settles into the placeholder and commits once settled; Esc / cancel abandons it. `hooks` describes what is being dragged this time.
   */
  function drag<T>(
    down: ReactPointerEvent<HTMLElement>,
    origin: HTMLElement,
    hooks: {
      lift: () => void;
      target: (x: number, y: number) => T | null;
      show: (to: T) => void;
      same: (a: T, b: T) => boolean;
      /** Placeholder: the element the clone settles into on release. */
      slot: () => HTMLElement | undefined;
      commit: (to: T) => void;
      /** Dragging a card: while the pointer is in a column, near the top / bottom edge of the list it also scrolls the list; if the target column is already fully visible, no horizontal scroll. */
      scrollList: boolean;
    },
  ) {
    const box0 = origin.getBoundingClientRect();
    // The clone keeps the same relative position as where the pointer grabbed it
    dragGeometry.current = {
      px: down.clientX,
      py: down.clientY,
      gx: down.clientX - box0.left,
      gy: down.clientY - box0.top,
      w: box0.width,
      h: box0.height,
    };
    let started = false;
    let released = false;
    let latest: T | null = null;
    let pointer = { x: down.clientX, y: down.clientY };
    let frame = 0;

    const place = () => {
      dragGeometry.current.px = pointer.x;
      dragGeometry.current.py = pointer.y;
      placePreview();
    };
    const retarget = () => {
      const to = hooks.target(pointer.x, pointer.y);
      if (to === null) return;
      if (latest !== null && hooks.same(latest, to)) return;
      latest = to;
      hooks.show(to);
    };
    /** When the pointer is near the left / right edge of the board it scrolls horizontally, near the top / bottom edge of the viewport it scrolls the page; after scrolling, the drop target must be recomputed. */
    const autoScroll = () => {
      const root = rootRef.current;
      if (!root) return;
      const EDGE = 48;
      // The closer to the edge, the faster: slow just inside the trigger zone (so a graze does not fly off), fastest right at the edge
      const speed = (dist: number) => {
        const t = Math.min(1, Math.max(0, 1 - dist / EDGE));
        return Math.max(1, Math.round(2 + 14 * t * t));
      };
      const box = root.getBoundingClientRect();
      const before = [root.scrollLeft, window.scrollY];
      const under = hooks.scrollList
        ? [...root.querySelectorAll<HTMLElement>('[data-slot="kanban-column"]')].find((c) => {
            const r = c.getBoundingClientRect();
            return pointer.x >= r.left && pointer.x < r.right;
          })
        : undefined;
      const hit = under?.getBoundingClientRect();
      // When dragging a card, if the column under the pointer is already fully visible, stop scrolling horizontally: the target is already in view, and scrolling would only jostle other columns
      if (pointer.x < box.left + EDGE) {
        if (!hit || hit.left < box.left) root.scrollLeft -= speed(pointer.x - box.left);
      } else if (pointer.x > box.right - EDGE) {
        if (!hit || hit.right > box.right) root.scrollLeft += speed(box.right - pointer.x);
      }
      // Card list inside a column: when the pointer is in the column and near the top / bottom edge of the list, scroll the list
      const list = under?.querySelector<HTMLElement>('[data-slot="kanban-list"]');
      if (list && list.scrollHeight > list.clientHeight) {
        const r = list.getBoundingClientRect();
        const listBefore = list.scrollTop;
        if (pointer.y < r.top + EDGE) list.scrollTop -= speed(pointer.y - r.top);
        else if (pointer.y > r.bottom - EDGE) list.scrollTop += speed(r.bottom - pointer.y);
        if (list.scrollTop !== listBefore) retarget();
      }
      if (pointer.y < EDGE) window.scrollBy(0, -speed(pointer.y));
      else if (pointer.y > window.innerHeight - EDGE)
        window.scrollBy(0, speed(window.innerHeight - pointer.y));
      if (before[0] !== root.scrollLeft || before[1] !== window.scrollY) retarget();
    };
    const tick = () => {
      if (started && !released) autoScroll();
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key);
      setPreview(null);
      setLifted(null);
      setColumnPreview(null);
      setLiftedColumn(null);
    };
    const move = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      if (!started) {
        if (Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) < 4) return;
        started = true;
        // Lock to the height at the moment of pick-up first, so the first make-way afterwards does not shrink the board
        rootRef.current?.style.setProperty(
          "--kanban-lock",
          `${Math.ceil(rootRef.current.getBoundingClientRect().height)}px`,
        );
        hooks.lift();
      }
      place();
      retarget();
    };
    const finish = (to: T | null) => {
      stop();
      // The click that follows immediately is not a real click
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      if (to !== null) hooks.commit(to);
    };
    const up = () => {
      if (!started) return stop();
      released = true;
      const to = latest;
      const el = previewRef.current;
      const slot = hooks.slot();
      const reduced =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!el || !slot || reduced || typeof el.animate !== "function") return finish(to);
      // Release: the clone settles into the placeholder, and is swapped for the real one once settled
      const target = layoutRect(slot);
      const settle = el.animate(
        [
          {
            transform: `translate(${pointer.x - dragGeometry.current.gx}px, ${pointer.y - dragGeometry.current.gy}px) rotate(3deg)`,
          },
          { transform: `translate(${target.left}px, ${target.top}px) rotate(0deg)` },
        ],
        { duration: 140, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "forwards" },
      );
      settle.onfinish = () => finish(to);
      settle.oncancel = () => finish(to);
    };
    const cancel = () => stop();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key);
    frame = requestAnimationFrame(tick);
  }

  const begin = (down: ReactPointerEvent<HTMLElement>, card: KanbanCard) => {
    if (down.pointerType === "mouse" && down.button !== 0) return;
    // Buttons, links and inputs inside a card are not drag starting points
    if ((down.target as HTMLElement).closest("a, button, input, textarea, select")) return;
    drag<KanbanPosition>(down, down.currentTarget, {
      lift: () => setLifted({ id: card.id }),
      target: (x, y) => targetAt(x, y, card.id),
      show: (to) => setPreview({ id: card.id, ...to }),
      same: (a, b) => a.columnId === b.columnId && a.index === b.index,
      slot: () =>
        [
          ...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="kanban-card"]') ?? []),
        ].find((c) => c.dataset.cardId === card.id),
      commit: (to) => commit(card, to),
      scrollList: true,
    });
  };

  /** Pick up the whole column from the column header. */
  const beginColumn = (down: ReactPointerEvent<HTMLElement>, column: KanbanColumn) => {
    if (down.pointerType === "mouse" && down.button !== 0) return;
    if ((down.target as HTMLElement).closest("a, button, input, textarea, select")) return;
    const origin = down.currentTarget.closest<HTMLElement>('[data-slot="kanban-column"]');
    if (!origin) return;
    drag<number>(down, origin, {
      lift: () => setLiftedColumn({ id: column.id }),
      target: (x) => columnTargetAt(x, column.id),
      show: (index) => setColumnPreview({ id: column.id, index }),
      same: (a, b) => a === b,
      slot: () =>
        [
          ...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="kanban-column"]') ?? []),
        ].find((c) => c.dataset.columnId === column.id),
      commit: (index) => commitColumn(column, index),
      scrollList: false,
    });
  };

  /** Focused on a column: Alt + Left/Right moves this column one slot earlier / later. */
  const columnKeyDown = (e: ReactKeyboardEvent<HTMLElement>, column: KanbanColumn) => {
    if (e.target !== e.currentTarget || !e.altKey || !columnsDraggable) return;
    const at = columns.findIndex((c) => c.id === column.id);
    const to = e.key === "ArrowLeft" ? at - 1 : e.key === "ArrowRight" ? at + 1 : null;
    if (to === null) return;
    e.preventDefault();
    if (to < 0 || to >= columns.length) return;
    pendingColumnFocus.current = column.id;
    commitColumn(column, to);
  };

  const keyDown = (e: ReactKeyboardEvent<HTMLElement>, card: KanbanCard) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Delete" && onCardDelete && !e.altKey) {
      e.preventDefault();
      askDeleteCard(card);
      return;
    }
    if (!e.altKey) {
      if ((e.key === "Enter" || e.key === " ") && (onCardClick || onCardEdit)) {
        e.preventDefault();
        activate(card);
      }
      return;
    }
    if (!draggable) return;
    const at = positionOf(cards, card.id);
    if (!at) return;
    const col = columns.findIndex((c) => c.id === at.columnId);
    let to: KanbanPosition | null = null;
    if (e.key === "ArrowLeft" && col > 0) to = { columnId: columns[col - 1].id, index: at.index };
    else if (e.key === "ArrowRight" && col < columns.length - 1)
      to = { columnId: columns[col + 1].id, index: at.index };
    else if (e.key === "ArrowUp") to = { columnId: at.columnId, index: at.index - 1 };
    else if (e.key === "ArrowDown") to = { columnId: at.columnId, index: at.index + 1 };
    if (
      !to ||
      (to.columnId === at.columnId &&
        (to.index < 0 || to.index >= cardsOf(cards, at.columnId).length))
    ) {
      if (to || e.key.startsWith("Arrow")) e.preventDefault();
      return;
    }
    e.preventDefault();
    pendingFocus.current = card.id;
    commit(card, to);
  };

  return (
    <section
      {...rest}
      ref={rootRef}
      data-slot="kanban"
      data-size={size}
      data-bounded={heightValue === undefined ? undefined : ""}
      data-dragging={anyDragging ? "" : undefined}
      // The card list inside a column scrolled: the cards' on-screen positions changed but they did not move, so update the records, otherwise the next time it would be treated as making way
      onScrollCapture={() => (rects.current = snapshot())}
      aria-label={ariaLabel ?? labels.board}
    >
      {shownColumns.map((column) => {
        const list = cardsOf(shown, column.id);
        const collapsed = collapsedIds.includes(column.id);
        return (
          <div
            key={column.id}
            data-slot="kanban-column"
            data-column-id={column.id}
            data-over={preview?.columnId === column.id ? "" : undefined}
            data-draggable={columnsDraggable ? "" : undefined}
            data-collapsed={collapsed ? "" : undefined}
            data-dragging={columnPreview?.id === column.id ? "" : undefined}
            // The whole column is focusable: Alt + Left/Right moves it; dragging starts from the column header
            tabIndex={columnsDraggable ? 0 : undefined}
            role="group"
            aria-label={labels.column(column.title, list.length)}
            aria-describedby={columnsDraggable ? columnHintId : undefined}
            onKeyDown={(e) => columnKeyDown(e, column)}
          >
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
              data-slot="kanban-header"
              onPointerDown={(e) => columnsDraggable && beginColumn(e, column)}
            >
              {collapsed ? (
                <button
                  type="button"
                  data-slot="kanban-expand"
                  aria-expanded={false}
                  aria-label={labels.expand(column.title)}
                  onClick={() => setCollapsed(column, false)}
                >
                  <ChevronIcon />
                </button>
              ) : null}
              <span
                data-slot="kanban-indicator"
                data-color={column.color ?? "neutral"}
                aria-hidden="true"
              />
              {renaming === column.id ? (
                <KanbanRename
                  title={column.title}
                  label={labels.renameLabel(column.title)}
                  onSubmit={(value) => submitRename(column, value)}
                  onCancel={() => submitRename(column, column.title)}
                />
              ) : (
                <h3
                  data-slot="kanban-title"
                  onDoubleClick={onColumnRename ? () => setRenaming(column.id) : undefined}
                >
                  {column.title}
                </h3>
              )}
              <span data-slot="kanban-count">{list.length}</span>
              {menuEnabled && !collapsed && renaming !== column.id ? (
                <Menu>
                  <Menu.Trigger
                    data-slot="kanban-column-menu"
                    aria-label={labels.columnMenu(column.title)}
                  >
                    <EllipsisIcon />
                  </Menu.Trigger>
                  <Menu.Content
                    align="end"
                    // Clicked "Rename": after the menu closes, focus goes to the input, not back to the menu button
                    finalFocus={() =>
                      rootRef.current?.querySelector<HTMLElement>(
                        '[data-slot="kanban-rename"] input',
                      ) ?? true
                    }
                  >
                    {onColumnRename ? (
                      <Menu.Item onClick={() => setRenaming(column.id)}>{labels.rename}</Menu.Item>
                    ) : null}
                    {collapsible ? (
                      <Menu.Item onClick={() => setCollapsed(column, true)}>
                        {labels.collapse}
                      </Menu.Item>
                    ) : null}
                    {onColumnDelete ? (
                      <>
                        {onColumnRename || collapsible ? <Menu.Separator /> : null}
                        <Menu.Item
                          color="danger"
                          onClick={() => {
                            setDeleteTarget({ column, count: cardsOf(cards, column.id).length });
                            setDeleteOpen(true);
                          }}
                        >
                          {labels.delete}
                        </Menu.Item>
                      </>
                    ) : null}
                  </Menu.Content>
                </Menu>
              ) : null}
            </div>
            {collapsed ? null : (
              <div data-slot="kanban-body">
                {list.length > 0 ? (
                  <ul data-slot="kanban-list">
                    {list.map((card) => (
                      <li key={card.id} data-slot="kanban-item">
                        <KanbanCardView
                          card={card}
                          columnId={column.id}
                          draggable={draggable}
                          dragging={preview?.id === card.id}
                          interactive={onCardClick !== undefined || onCardEdit !== undefined}
                          hintId={hintId}
                          progressLabel={labels.progress}
                          onPointerDown={(e) => draggable && begin(e, card)}
                          onKeyDown={(e) => keyDown(e, card)}
                          onClick={() => (suppressClick.current ? undefined : activate(card))}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div data-slot="kanban-empty">{labels.empty}</div>
                )}
                {onAddCard ? (
                  composing === column.id ? (
                    <KanbanComposer
                      multiline
                      label={labels.addCardLabel}
                      placeholder={labels.addCardPlaceholder}
                      submitLabel={labels.addCardSubmit}
                      cancelLabel={common.cancel}
                      onSubmit={(title) => addCard(column, title)}
                      onClose={() => setComposing(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      data-slot="kanban-add"
                      onClick={() => setComposing(column.id)}
                    >
                      <PlusIcon />
                      <span>{labels.add}</span>
                    </button>
                  )
                ) : null}
              </div>
            )}
          </div>
        );
      })}
      {onAddColumn ? (
        <div data-slot="kanban-add-column">
          {addingColumn ? (
            <KanbanComposer
              label={labels.addColumnLabel}
              placeholder={labels.addColumnPlaceholder}
              submitLabel={labels.addColumnSubmit}
              cancelLabel={common.cancel}
              onSubmit={addColumn}
              onClose={() => setAddingColumn(false)}
            />
          ) : (
            <button type="button" data-slot="kanban-add" onClick={() => setAddingColumn(true)}>
              <PlusIcon />
              <span>{labels.addColumn}</span>
            </button>
          )}
        </div>
      ) : null}
      {onCardEdit && editTarget ? (
        <KanbanCardDialog
          // Every open is a fresh form: the inputs hold the card's current content
          key={editVersion.current}
          open={editOpen}
          onOpenChange={setEditOpen}
          card={editTarget}
          columnTitle={columns.find((c) => c.id === editTarget.columnId)?.title ?? ""}
          labels={labels}
          cancelLabel={common.cancel}
          deleteLabel={labels.delete}
          onSubmit={(changes) => submitCard(editTarget, changes)}
          onDelete={
            onCardDelete
              ? () => {
                  setEditOpen(false);
                  askDeleteCard(editTarget);
                }
              : undefined
          }
        />
      ) : null}
      {onCardDelete && cardDeleteTarget ? (
        <ConfirmDialog
          open={cardDeleteOpen}
          onOpenChange={setCardDeleteOpen}
          tone="danger"
          title={labels.deleteCardTitle(cardDeleteTarget.title)}
          description={labels.deleteCardDescription}
          confirmLabel={labels.delete}
          onConfirm={() => {
            onCardDelete(cardDeleteTarget);
            setStatus(labels.cardDeleted(cardDeleteTarget.title));
          }}
        />
      ) : null}
      {onColumnDelete && deleteTarget ? (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          tone="danger"
          title={labels.deleteTitle(deleteTarget.column.title)}
          description={labels.deleteDescription(deleteTarget.column.title, deleteTarget.count)}
          confirmLabel={labels.delete}
          onConfirm={() => {
            onColumnDelete(deleteTarget.column);
            setStatus(labels.columnDeleted(deleteTarget.column.title));
          }}
        />
      ) : null}
      {liftedCard
        ? // into body: with a transform / filter on an ancestor, fixed positioning follows it and is clipped by its overflow
          createPortal(
            <KanbanDragPreview
              ref={previewRef}
              card={liftedCard}
              progressLabel={labels.progress}
            />,
            document.body,
          )
        : null}
      {liftedColumnData
        ? createPortal(
            <KanbanColumnPreview
              ref={previewRef}
              column={liftedColumnData}
              cards={cardsOf(shown, liftedColumnData.id)}
              count={labels.column}
              collapsed={collapsedIds.includes(liftedColumnData.id)}
              progressLabel={labels.progress}
            />,
            document.body,
          )
        : null}
      {draggable ||
      columnsDraggable ||
      menuEnabled ||
      onCardEdit ||
      onCardDelete ||
      onAddCard ||
      onAddColumn ? (
        <>
          {draggable ? (
            <span id={hintId} hidden>
              {labels.hint}
            </span>
          ) : null}
          {columnsDraggable ? (
            <span id={columnHintId} hidden>
              {labels.columnHint}
            </span>
          ) : null}
          <span data-slot="kanban-status" role="status" aria-live="polite">
            {status}
          </span>
        </>
      ) : null}
    </section>
  );
}

/** The picked-up column: a tilted clone of the whole column (header + cards), floating under the pointer. Size and position are CSS variables; screen readers and focus ignore it. */
function KanbanColumnPreview({
  ref,
  column,
  cards,
  count,
  collapsed,
  progressLabel,
}: {
  ref: React.Ref<HTMLDivElement>;
  column: KanbanColumn;
  cards: readonly KanbanCard[];
  count: (title: string, count: number) => string;
  collapsed: boolean;
  progressLabel: string;
}) {
  return (
    <div ref={ref} data-slot="kanban-drag-preview" data-kind="column" aria-hidden="true">
      <div
        data-slot="kanban-column"
        data-floating=""
        data-collapsed={collapsed ? "" : undefined}
        aria-label={count(column.title, cards.length)}
      >
        <div data-slot="kanban-header">
          <span
            data-slot="kanban-indicator"
            data-color={column.color ?? "neutral"}
            aria-hidden="true"
          />
          <h3 data-slot="kanban-title">{column.title}</h3>
          <span data-slot="kanban-count">{cards.length}</span>
        </div>
        {collapsed ? null : (
          <div data-slot="kanban-body">
            <ul data-slot="kanban-list">
              {cards.map((card) => (
                <li key={card.id} data-slot="kanban-item">
                  <KanbanCardView
                    card={card}
                    columnId={column.id}
                    draggable={false}
                    dragging={false}
                    interactive={false}
                    floating
                    hintId=""
                    progressLabel={progressLabel}
                    onPointerDown={() => {}}
                    onKeyDown={() => {}}
                    onClick={() => {}}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/** The picked-up card: a slightly tilted clone floating under the pointer. Position and size are CSS variables; it is only for the eyes, and screen readers and focus ignore it. */
function KanbanDragPreview({
  ref,
  card,
  progressLabel,
}: {
  ref: React.Ref<HTMLDivElement>;
  card: KanbanCard;
  progressLabel: string;
}) {
  return (
    <div ref={ref} data-slot="kanban-drag-preview" aria-hidden="true">
      <KanbanCardView
        card={card}
        columnId={card.columnId}
        draggable={false}
        dragging={false}
        interactive={false}
        floating
        hintId=""
        progressLabel={progressLabel}
        onPointerDown={() => {}}
        onKeyDown={() => {}}
        onClick={() => {}}
      />
    </div>
  );
}

function KanbanCardView({
  card,
  columnId,
  draggable,
  dragging,
  interactive,
  floating = false,
  hintId,
  progressLabel,
  onPointerDown,
  onKeyDown,
  onClick,
}: {
  card: KanbanCard;
  columnId: string;
  draggable: boolean;
  dragging: boolean;
  interactive: boolean;
  /** The clone that floats up while dragging: not focusable, not exposed to screen readers. */
  floating?: boolean;
  hintId: string;
  progressLabel: string;
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => void;
  onClick: () => void;
}) {
  return (
    // The whole card is focusable: with onCardClick it is a button (Enter opens), otherwise a named block; Alt + arrow keys move it
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      data-slot="kanban-card"
      data-card-id={floating ? undefined : card.id}
      data-column-id={floating ? undefined : columnId}
      data-draggable={draggable ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      data-floating={floating ? "" : undefined}
      tabIndex={floating ? undefined : 0}
      role={interactive ? "button" : "group"}
      aria-label={card.title}
      aria-describedby={draggable ? hintId : undefined}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onClick={onClick}
    >
      <span data-slot="kanban-card-title">{card.title}</span>
      {card.description ? (
        <span data-slot="kanban-card-description">{card.description}</span>
      ) : null}
      {card.labels?.length ? (
        <ul data-slot="kanban-card-labels">
          {card.labels.map((l) => (
            <li key={l.label} data-slot="kanban-label" data-color={l.color ?? "neutral"}>
              {l.label}
            </li>
          ))}
        </ul>
      ) : null}
      {card.progress !== undefined ? (
        <div
          data-slot="kanban-card-progress"
          role="progressbar"
          aria-label={progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(card.progress)}
        >
          <span data-slot="kanban-card-progress-track">
            <ProgressFill value={card.progress} />
          </span>
          <span data-slot="kanban-card-progress-text" aria-hidden="true">
            {Math.round(card.progress)}%
          </span>
        </div>
      ) : null}
      {card.footer ? <div data-slot="kanban-card-footer">{card.footer}</div> : null}
    </div>
  );
}
