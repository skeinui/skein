import type { ReactNode } from "react";
import type { UIColor } from "../../contract.ts";

export interface KanbanColumn {
  /** Unique id; cards point to it with `columnId`. */
  id: string;
  /** Column heading. */
  title: string;
  /** Color of the status dot in the column header; neutral if not given. */
  color?: UIColor;
}

export interface KanbanLabel {
  /** Tag text. */
  label: string;
  color?: UIColor;
}

export interface KanbanCard {
  /** Unique id across the board, stable while the card moves. */
  id: string;
  /** Which column it is in. The order in the array is the order within that column. */
  columnId: string;
  /** Card heading. */
  title: string;
  /** Secondary text under the title. */
  description?: string;
  /** A row of small tags below the title. */
  labels?: readonly KanbanLabel[];
  /** Progress (0–100): the progress bar is shown if given. */
  progress?: number;
  /** Custom content at the bottom of the card (avatars, comment count, ...). Do not put buttons / links in it: the whole card is one focusable, draggable block. */
  footer?: ReactNode;
}

/**
 * Changes produced by editing a card: each entry is the complete value after editing, so you can use `{ ...card, ...changes }` directly.
 * `title` has leading and trailing whitespace removed and is never empty; no description is an empty string; no progress is `undefined`;
 * `footer` can only be changed when it was originally a string (or absent); if it was a node it is handed back unchanged.
 */
export interface KanbanCardChanges {
  title: string;
  description: string;
  labels: readonly KanbanLabel[];
  progress: number | undefined;
  footer: ReactNode;
}

/** A card's position in the board. */
export interface KanbanPosition {
  columnId: string;
  index: number;
}

export interface KanbanMove {
  card: KanbanCard;
  from: KanbanPosition;
  to: KanbanPosition;
}

/** One column move: which column, from which index to which (0-based). */
export interface KanbanColumnMove {
  column: KanbanColumn;
  from: number;
  to: number;
}

/** The cards in a given column (keeping their relative order in the array). */
export const cardsOf = <T extends { columnId: string }>(cards: readonly T[], columnId: string) =>
  cards.filter((c) => c.columnId === columnId);

/** A card's current position: the column it is in, and its index within that column (0-based). */
export function positionOf(cards: readonly KanbanCard[], id: string): KanbanPosition | null {
  const card = cards.find((c) => c.id === id);
  if (!card) return null;
  return {
    columnId: card.columnId,
    index: cardsOf(cards, card.columnId).findIndex((c) => c.id === id),
  };
}

/**
 * Move a card to position `index` of a column (0-based; beyond the end puts it last). Returns a new array without modifying the input;
 * the relative order of other cards is unchanged. Returns the original array if the card does not exist or the position did not change.
 */
export function moveCard(
  cards: readonly KanbanCard[],
  id: string,
  columnId: string,
  index: number,
): readonly KanbanCard[] {
  const from = positionOf(cards, id);
  if (!from) return cards;
  const card = cards.find((c) => c.id === id)!;
  const rest = cards.filter((c) => c.id !== id);
  const target = cardsOf(rest, columnId);
  const at = Math.min(Math.max(index, 0), target.length);
  if (from.columnId === columnId && from.index === at) return cards;
  const moved = { ...card, columnId };
  // Insert before the card at index `at` in the target column; to put it last, insert after the column's last card; an empty column goes at the end of the whole array
  const before = target[at];
  const after = target[target.length - 1];
  const insertAt = before ? rest.indexOf(before) : after ? rest.indexOf(after) + 1 : rest.length;
  return [...rest.slice(0, insertAt), moved, ...rest.slice(insertAt)];
}

/** Move a column to position `index` (0-based; beyond the end puts it last). Returns a new array without modifying the input; returns the original array if the column does not exist or the position did not change. */
export function moveColumn(
  columns: readonly KanbanColumn[],
  id: string,
  index: number,
): readonly KanbanColumn[] {
  const from = columns.findIndex((c) => c.id === id);
  if (from < 0) return columns;
  const rest = columns.filter((c) => c.id !== id);
  const at = Math.min(Math.max(index, 0), rest.length);
  if (at === from) return columns;
  return [...rest.slice(0, at), columns[from], ...rest.slice(at)];
}
