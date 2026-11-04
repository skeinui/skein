import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vite-plus/test";

const SRC = join(import.meta.dirname, "../src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/**
 * The baseline for separating style from behavior: no appearance may appear in component source.
 * This only scans JSX attributes and style file imports; mentioning className in types (such as Omit) doesn't count.
 */
describe("styles are separate from Base UI code", () => {
  const files = walk(SRC);
  const components = files.filter((f) => f.endsWith(".tsx"));

  test("no style files under src", () => {
    expect(files.filter((f) => /\.(css|scss|less)$/.test(f))).toEqual([]);
  });

  test.each(components)("%s writes no className / style and imports no styles", (file) => {
    const code = readFileSync(file, "utf8");
    expect(code, "no className= in JSX").not.toMatch(/\bclassName\s*=/);
    expect(code, "no style= in JSX").not.toMatch(/\bstyle\s*=/);
    expect(code, "no style file imports").not.toMatch(/import\s+["'][^"']+\.(css|scss|less)["']/);
    expect(code, "no Tailwind utility helpers").not.toMatch(/\bclsx\b|\btwMerge\b|\bcva\b|\btv\(/);
  });
});
