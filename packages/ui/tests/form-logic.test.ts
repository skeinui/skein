import { describe, expect, test } from "vite-plus/test";
import { DEFAULT_MESSAGES, getIn, isEmpty, setIn, validateValue } from "../src/index.ts";

const v = (value: unknown, rules: Parameters<typeof validateValue>[2], values = {}) =>
  validateValue(value, values, rules);

describe("getIn / setIn", () => {
  test("reads a dot path, undefined when the path breaks", () => {
    const values = { a: { b: { c: 1 } }, list: [1, 2] };
    expect(getIn(values, "a.b.c")).toBe(1);
    expect(getIn(values, "a.x.c")).toBeUndefined();
    expect(getIn(values, "name")).toBeUndefined();
    expect(getIn({ a: null }, "a.b")).toBeUndefined();
  });

  test("setIn does not mutate, creates each level along the path, keeps siblings", () => {
    const values = { a: { b: 1, keep: true }, other: 1 };
    const next = setIn(values, "a.b", 2);
    expect(next).toEqual({ a: { b: 2, keep: true }, other: 1 });
    expect(values.a.b).toBe(1);
    expect(next.a).not.toBe(values.a);
    expect(next.other).toBe(1);
    expect(setIn({}, "x.y.z", 1)).toEqual({ x: { y: { z: 1 } } });
    expect(setIn({ x: 5 }, "x.y", 1)).toEqual({ x: { y: 1 } });
  });
});

describe("isEmpty", () => {
  test("the various empty values", () => {
    for (const empty of [
      undefined,
      null,
      "",
      false,
      [],
      { start: null, end: null },
      { start: "", end: undefined },
    ]) {
      expect(isEmpty(empty), JSON.stringify(empty)).toBe(true);
    }
    for (const filled of ["a", 0, true, [0], { start: "2024-01-01", end: null }, { a: 1 }]) {
      expect(isEmpty(filled), JSON.stringify(filled)).toBe(false);
    }
  });
});

describe("validateValue", () => {
  test("required: empty fails, true uses the default message, a string is the message; filled passes; 0 counts as filled", async () => {
    expect(await v("", { required: true })).toBe(DEFAULT_MESSAGES.required);
    expect(await v(null, { required: "Name please" })).toBe("Name please");
    expect(await v([], { required: true })).toBe(DEFAULT_MESSAGES.required);
    expect(await v(false, { required: true })).toBe(DEFAULT_MESSAGES.required);
    expect(await v("x", { required: true })).toBeUndefined();
    expect(await v(0, { required: true })).toBeUndefined();
  });

  test("required: a text of only spaces is no answer, but it is still a value for the other rules", async () => {
    expect(await v("   ", { required: true })).toBe(DEFAULT_MESSAGES.required);
    expect(await v(" \t\n", { required: "Name please" })).toBe("Name please");
    expect(await v("   ", {})).toBeUndefined();
    expect(await v("   ", { format: "email" })).toBe(DEFAULT_MESSAGES.email);
  });

  test("empty and not required: built-in rules are skipped", async () => {
    expect(await v("", { minLength: 3, format: "email", pattern: /x/ })).toBeUndefined();
    expect(await v(null, { min: 5 })).toBeUndefined();
  });

  test("format: email / url", async () => {
    expect(await v("a@b.co", { format: "email" })).toBeUndefined();
    for (const bad of ["a", "a@b", "a b@c.d", "@b.c"]) {
      expect(await v(bad, { format: "email" }), bad).toBe(DEFAULT_MESSAGES.email);
    }
    expect(await v("https://example.com/a?b=1", { format: "url" })).toBeUndefined();
    for (const bad of ["example.com", "ftp://x.y", "javascript:alert(1)", "http//x"]) {
      expect(await v(bad, { format: "url" }), bad).toBe(DEFAULT_MESSAGES.url);
    }
  });

  test("length (strings and arrays), range, pattern", async () => {
    expect(await v("ab", { minLength: 3 })).toBe("Must be at least 3 characters");
    expect(await v("abcd", { maxLength: 3 })).toBe("Must be at most 3 characters");
    expect(await v("abc", { minLength: 3, maxLength: 3 })).toBeUndefined();
    expect(await v(["a"], { minLength: 2 })).toBe("Must be at least 2 characters");
    expect(await v(2, { min: 3 })).toBe("Must be at least 3");
    expect(await v(11, { max: 10 })).toBe("Must be at most 10");
    expect(await v(0, { min: 0 })).toBeUndefined();
    expect(await v("abc1", { pattern: /^[a-z]+$/ })).toBe(DEFAULT_MESSAGES.pattern);
    expect(await v("abc", { pattern: "^[a-z]+$" })).toBeUndefined();
  });

  test("a pattern with the g flag is not flaky because of lastIndex", async () => {
    const regex = /^a$/g;
    for (let i = 0; i < 4; i++) expect(await v("a", { pattern: regex })).toBeUndefined();
  });

  test("order: required -> format -> length -> range -> pattern -> custom, returns the first", async () => {
    expect(await v("x", { format: "email", minLength: 5, pattern: /^\d+$/ })).toBe(
      DEFAULT_MESSAGES.email,
    );
    expect(await v("a@b.c", { minLength: 10, pattern: /^\d+$/ })).toBe(
      "Must be at least 10 characters",
    );
    expect(await v("abcdef", { pattern: /^\d+$/, validate: () => "custom" })).toBe(
      DEFAULT_MESSAGES.pattern,
    );
  });

  test("custom validation: sync / async, gets all form values, an empty string or undefined passes; called when empty too", async () => {
    expect(await v("a", { validate: () => "bad" })).toBe("bad");
    expect(await v("a", { validate: async () => "later" })).toBe("later");
    expect(await v("a", { validate: () => undefined })).toBeUndefined();
    expect(await v("a", { validate: () => "" })).toBeUndefined();
    expect(
      await v(
        "x",
        {
          validate: (value, all) => (value === (all as { pw: string }).pw ? undefined : "mismatch"),
        },
        { pw: "y" },
      ),
    ).toBe("mismatch");
    let called = 0;
    await v("", { validate: () => void called++ });
    expect(called).toBe(1);
  });

  test("messages: field-level and Form-level overrides; {n} is replaced", async () => {
    expect(await v("", { required: true, messages: { required: "Needed" } })).toBe("Needed");
    expect(await v("a", { minLength: 5, messages: { minLength: "At least {n} characters" } })).toBe(
      "At least 5 characters",
    );
    expect(
      await validateValue(
        "",
        {},
        { required: true },
        { ...DEFAULT_MESSAGES, required: "Needed (global)" },
      ),
    ).toBe("Needed (global)");
    // Field level takes precedence over Form level
    expect(
      await validateValue(
        "",
        {},
        { required: true, messages: { required: "Field" } },
        { ...DEFAULT_MESSAGES, required: "Global" },
      ),
    ).toBe("Field");
  });
});
