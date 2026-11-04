import { describe, expect, test } from "vite-plus/test";
import { en } from "../src/locales/en.ts";
import { zhCN } from "../src/locales/zh-CN.ts";
import type { Messages } from "../src/locales/messages.ts";
import { mergeLabels } from "../src/locales/use-labels.ts";

/** Sample arguments: function-type strings are called with them to confirm every language returns non-empty text. */
const ARGS = ["Item", 2, 5];
/** Brand names and the like, which are the same in Chinese and English anyway. */
const SAME_IN_ALL_LANGUAGES = new Set(["mermaidBlock.title"]);

type Leaf = { path: string; value: unknown };

/** Flatten nested text into "path -> value"; strings and functions are leaves, objects (such as per-state name tables) are descended into. */
function leaves(value: unknown, path = ""): Leaf[] {
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      leaves(child, path ? `${path}.${key}` : key),
    );
  }
  return [{ path, value }];
}
const shape = (messages: Messages) =>
  Object.fromEntries(leaves(messages.labels).map((l) => [l.path, typeof l.value]));

describe("locales", () => {
  test("zh-CN and en have the same components, keys and types (string / function)", () => {
    expect(shape(zhCN)).toEqual(shape(en));
  });

  test("every text is non-empty; function texts return non-empty strings", () => {
    for (const messages of [en, zhCN]) {
      for (const { path, value } of leaves(messages.labels)) {
        const text =
          typeof value === "function" ? (value as (...a: unknown[]) => unknown)(...ARGS) : value;
        expect(String(text).trim(), `${messages.locale}.${path}`).not.toBe("");
      }
    }
  });

  test("zh-CN texts are actually translated (differ from English)", () => {
    const english = Object.fromEntries(leaves(en.labels).map((l) => [l.path, l.value]));
    for (const { path, value } of leaves(zhCN.labels)) {
      if (typeof value !== "string" || SAME_IN_ALL_LANGUAGES.has(path)) continue;
      expect(value, `zh-CN.${path}`).not.toBe(english[path]);
    }
  });
});

describe("mergeLabels", () => {
  const base = { a: "A", b: "B", nested: { x: "X", y: "Y" } };

  test("later layers override earlier ones, undefined doesn't count", () => {
    expect(mergeLabels(base, { a: "1" }, { a: undefined, b: "2" })).toEqual({
      a: "1",
      b: "2",
      nested: { x: "X", y: "Y" },
    });
  });

  test("object values merge one level deep; setting one state keeps the others", () => {
    expect(mergeLabels(base, { nested: { x: "1" } as typeof base.nested })).toEqual({
      a: "A",
      b: "B",
      nested: { x: "1", y: "Y" },
    });
  });

  test("doesn't mutate the given objects", () => {
    const copy = structuredClone(base);
    mergeLabels(base, { a: "1" });
    expect(base).toEqual(copy);
  });
});
