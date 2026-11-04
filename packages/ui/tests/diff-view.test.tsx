// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { DiffView, collapse, diffLines, parsePatch } from "../src/index.ts";

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
async function mount(el: React.ReactElement) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(el));
  return host;
}

const summary = (lines: ReturnType<typeof diffLines>) =>
  lines.map((l) => `${l.type === "add" ? "+" : l.type === "del" ? "-" : " "}${l.text}`);

describe("diffLines", () => {
  test("identical content is all ctx with matching line numbers", () => {
    const out = diffLines("a\nb", "a\nb");
    expect(summary(out)).toEqual([" a", " b"]);
    expect(out.map((l) => [l.oldNo, l.newNo])).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  test("changing a line = removing one + adding one; additions have only the new line number, removals only the old", () => {
    const out = diffLines("a\nb\nc", "a\nB\nc");
    expect(summary(out)).toEqual([" a", "-b", "+B", " c"]);
    expect([out[1]!.oldNo, out[1]!.newNo]).toEqual([2, undefined]);
    expect([out[2]!.oldNo, out[2]!.newNo]).toEqual([undefined, 2]);
    expect(out[3]).toMatchObject({ oldNo: 3, newNo: 3 });
  });

  test("inserting and removing in the middle; LCS keeps common lines", () => {
    expect(summary(diffLines("a\nc", "a\nb\nc"))).toEqual([" a", "+b", " c"]);
    expect(summary(diffLines("a\nb\nc", "a\nc"))).toEqual([" a", "-b", " c"]);
    expect(summary(diffLines("x\ny\nz", "y\nz\nw"))).toEqual(["-x", " y", " z", "+w"]);
  });

  test("empty text, line ending styles, trailing newline", () => {
    expect(diffLines("", "")).toEqual([]);
    expect(summary(diffLines("", "a\nb"))).toEqual(["+a", "+b"]);
    expect(summary(diffLines("a\nb", ""))).toEqual(["-a", "-b"]);
    expect(summary(diffLines("a\r\nb\n", "a\nb"))).toEqual([" a", " b"]);
  });
});

describe("parsePatch", () => {
  const patch = [
    "diff --git a/f.ts b/f.ts",
    "index 1..2 100644",
    "--- a/f.ts",
    "+++ b/f.ts",
    "@@ -10,3 +10,3 @@ fn",
    " keep",
    "-old",
    "+new",
    " tail",
    "\\ No newline at end of file",
    "@@ -40,1 +40,2 @@",
    " x",
    "+y",
    "",
  ].join("\n");

  test("ignores file headers, numbers lines from @@, several hunks", () => {
    const out = parsePatch(patch);
    expect(summary(out)).toEqual([" keep", "-old", "+new", " tail", " x", "+y"]);
    expect(out.map((l) => [l.oldNo, l.newNo])).toEqual([
      [10, 10],
      [11, undefined],
      [undefined, 11],
      [12, 12],
      [40, 40],
      [undefined, 41],
    ]);
  });

  test("--- / +++ in file headers are not taken as removals / additions", () => {
    expect(parsePatch("--- a\n+++ b\n").length).toBe(0);
  });
});

describe("collapse", () => {
  const lines = diffLines(
    Array.from({ length: 20 }, (_, i) => `l${i}`).join("\n"),
    Array.from({ length: 20 }, (_, i) => (i === 10 ? "CHANGED" : `l${i}`)).join("\n"),
  );

  test("keeps context lines around changes, folds the rest into gaps with their line count", () => {
    const items = collapse(lines, 2);
    expect(items.map((i) => i.type)).toEqual([
      "gap",
      "ctx",
      "ctx",
      "del",
      "add",
      "ctx",
      "ctx",
      "gap",
    ]);
    const [first, , , , , , , last] = items;
    expect(first).toMatchObject({ type: "gap", count: 8 });
    expect(last).toMatchObject({ type: "gap", count: 7 });
  });

  test("no folding when the gap between changes is too small", () => {
    const l = diffLines("a\nb\nc\nd", "A\nb\nc\nD");
    expect(collapse(l, 3).some((i) => i.type === "gap")).toBe(false);
  });
});

describe("<DiffView />", () => {
  test("SSR has no class / style, file name and stats in the header", () => {
    const html = ssr(
      createElement(DiffView, { fileName: "a.ts", oldText: "a\nb", newText: "a\nc" }),
    );
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    expect(html).toContain('data-slot="diff-view"');
    expect(html).toContain("a.ts");
    expect(html).toContain("+1");
    expect(html).toContain("−1");
  });

  test("each line has data-type and a screen reader prefix, the sign is aria-hidden, not relying on color", async () => {
    const el = await mount(createElement(DiffView, { oldText: "a\nb", newText: "a\nc" }));
    const rows = [...el.querySelectorAll('[data-slot="diff-row"]')];
    expect(rows.map((r) => r.getAttribute("data-type"))).toEqual(["ctx", "del", "add"]);
    expect(rows[1]!.querySelector('[data-slot="diff-label"]')?.textContent).toBe("Removed: ");
    expect(rows[2]!.querySelector('[data-slot="diff-label"]')?.textContent).toBe("Added: ");
    expect(rows[1]!.querySelector('[data-slot="diff-sign"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  test("the code area is focusable and named; a notice when there are no changes", async () => {
    const el = await mount(
      createElement(DiffView, { fileName: "x.ts", oldText: "a", newText: "b" }),
    );
    const scroll = el.querySelector('[data-slot="diff-scroll"]')!;
    expect(scroll.getAttribute("tabindex")).toBe("0");
    expect(scroll.getAttribute("role")).toBe("region");
    expect(scroll.getAttribute("aria-label")).toBe("x.ts");
    await act(async () => root!.render(createElement(DiffView, { oldText: "a", newText: "a" })));
    expect(el.querySelector('[data-slot="diff-empty"]')?.textContent).toBe("No changes");
    expect(el.querySelector('[data-slot="diff-scroll"]')).toBeNull();
  });

  test("the fold bar is a button that expands those lines", async () => {
    const old = Array.from({ length: 30 }, (_, i) => `l${i}`).join("\n");
    const el = await mount(
      createElement(DiffView, { oldText: old, newText: old.replace("l15", "X"), context: 1 }),
    );
    const btn = el.querySelector<HTMLButtonElement>('[data-slot="diff-expand"]')!;
    expect(btn.textContent).toBe("Show 14 unchanged lines");
    const before = el.querySelectorAll('[data-slot="diff-row"]').length;
    await act(async () => btn.click());
    expect(el.querySelectorAll('[data-slot="diff-row"]').length).toBe(before - 1 + 14);
  });

  test("patch mode, language highlighting, labels", async () => {
    const el = await mount(
      createElement(DiffView, {
        patch: "@@ -1,1 +1,1 @@\n-const a = 1\n+const a = 2",
        language: "ts",
        labels: { added: "Plus", removed: "Minus" },
      }),
    );
    expect(el.querySelector('[data-token="keyword"]')?.textContent).toBe("const");
    expect(el.textContent).toContain("Plus: ");
    expect(el.textContent).toContain("Minus: ");
  });
});
