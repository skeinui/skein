import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, test } from "vite-plus/test";

const SRC = join(import.meta.dirname, "..", "src");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
  });

/**
 * `scrollIntoView` also scrolls all ancestors, including the whole page: components call it on mount / state change, and when an instance of it
 * is off screen, opening the page scrolls it away (PageTabs and Command both had this problem). To scroll an item into its own list inside a component,
 * only touch that list's scrollTop / scrollLeft.
 * Exception: Tour exists to scroll the target being introduced into view (it only gets there after the user opens it).
 */
const ALLOWED = new Set(["components/tour/tour.tsx"]);

describe("scrolling", () => {
  test("components don't use scrollIntoView (except Tour)", () => {
    const used = files(SRC)
      .filter((f) => /\bscrollIntoView\b/.test(readFileSync(f, "utf8").replace(/\/\/.*$/gm, "")))
      // Relative, with `/` on Windows too
      .map((f) => f.slice(SRC.length + 1).split(sep).join("/"))
      .filter((f) => !ALLOWED.has(f));
    expect(used).toEqual([]);
  });
});
