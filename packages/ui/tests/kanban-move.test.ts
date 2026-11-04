import { describe, expect, it } from "vite-plus/test";
import { cardsOf, moveCard, moveColumn, positionOf } from "../src/components/kanban/move.ts";
import type { KanbanCard } from "../src/components/kanban/move.ts";

const card = (id: string, columnId: string): KanbanCard => ({ id, columnId, title: id });
const ids = (cards: readonly KanbanCard[], columnId: string) =>
  cardsOf(cards, columnId).map((c) => c.id);

const BOARD = [
  card("a", "todo"),
  card("b", "todo"),
  card("c", "doing"),
  card("d", "todo"),
  card("e", "done"),
];

describe("positionOf", () => {
  it("returns the column and the index inside that column", () => {
    expect(positionOf(BOARD, "d")).toEqual({ columnId: "todo", index: 2 });
    expect(positionOf(BOARD, "e")).toEqual({ columnId: "done", index: 0 });
    expect(positionOf(BOARD, "zzz")).toBeNull();
  });
});

describe("moveCard", () => {
  it("reorders inside a column without touching the other columns", () => {
    const next = moveCard(BOARD, "d", "todo", 0);
    expect(ids(next, "todo")).toEqual(["d", "a", "b"]);
    expect(ids(next, "doing")).toEqual(["c"]);
    expect(ids(next, "done")).toEqual(["e"]);
  });

  it("moves to another column at a given index", () => {
    const next = moveCard(BOARD, "a", "doing", 0);
    expect(ids(next, "todo")).toEqual(["b", "d"]);
    expect(ids(next, "doing")).toEqual(["a", "c"]);
    expect(next.find((c) => c.id === "a")?.columnId).toBe("doing");
  });

  it("an index past the end goes to the bottom; into an empty column works too", () => {
    expect(ids(moveCard(BOARD, "a", "doing", 99), "doing")).toEqual(["c", "a"]);
    const next = moveCard(
      BOARD.filter((c) => c.id !== "e"),
      "a",
      "done",
      0,
    );
    expect(ids(next, "done")).toEqual(["a"]);
  });

  it("clamps a negative index to the top", () => {
    expect(ids(moveCard(BOARD, "b", "todo", -3), "todo")).toEqual(["b", "a", "d"]);
  });

  it("returns the same array when nothing changes or the card is unknown", () => {
    expect(moveCard(BOARD, "b", "todo", 1)).toBe(BOARD);
    expect(moveCard(BOARD, "nope", "todo", 0)).toBe(BOARD);
  });

  it("does not mutate its input and keeps every card exactly once", () => {
    const copy = structuredClone(BOARD);
    const next = moveCard(BOARD, "c", "todo", 1);
    expect(BOARD).toEqual(copy);
    expect(next).toHaveLength(BOARD.length);
    expect(new Set(next.map((c) => c.id)).size).toBe(BOARD.length);
  });
});

describe("moveColumn", () => {
  const cols = [
    { id: "x", title: "X" },
    { id: "y", title: "Y" },
    { id: "z", title: "Z" },
  ];
  const order = (c: readonly { id: string }[]) => c.map((v) => v.id).join("");

  it("moves a column to the given index", () => {
    expect(order(moveColumn(cols, "x", 2))).toBe("yzx");
    expect(order(moveColumn(cols, "z", 0))).toBe("zxy");
    expect(order(moveColumn(cols, "y", 0))).toBe("yxz");
  });
  it("clamps the index and returns the same array when nothing changes", () => {
    expect(order(moveColumn(cols, "x", 99))).toBe("yzx");
    expect(order(moveColumn(cols, "x", -5))).toBe("xyz");
    expect(moveColumn(cols, "x", 0)).toBe(cols);
    expect(moveColumn(cols, "nope", 1)).toBe(cols);
  });
  it("does not mutate the input", () => {
    moveColumn(cols, "x", 2);
    expect(order(cols)).toBe("xyz");
  });
});
