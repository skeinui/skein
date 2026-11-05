// Which stylesheets of a theme style each export of @skeinui/ui needs, for @skeinui/themes/vite (which keeps only
// those of the components a project imports): the files its entry imports, followed through value imports (`import
// type` renders nothing), the `data-slot` values they write, and the stylesheet each slot belongs to.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const SRC = join(import.meta.dirname, "..", "src");
/** The theme style the file names are taken from: every bundled style has the same files (packages/cli tests). */
const THEME = join(import.meta.dirname, "..", "..", "themes", "default");
/** A theme style's files every page needs: tokens, dark mode, the scrollbars. */
export const BASE_STYLES = ["tokens", "dark", "scrollbar"];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) =>
    statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)],
  );

export function stylesOf(): Record<string, string[]> {
  const files = walk(SRC).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f));
  const text = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

  // Value imports only: `import type` / `export type` are erased (locales/messages.ts imports every component's
  // label types, which would otherwise pull in the whole library)
  const deps = (file: string) =>
    [
      ...text
        .get(file)!
        .matchAll(
          /^(?!\s*(?:import|export)\s+type\b)[^\n]*?(?:\bfrom|\bimport)\s*\(?\s*"(\.{1,2}\/[^"]+)"/gm,
        ),
    ]
      .map((m) => resolve(dirname(file), m[1]))
      .filter((path) => text.has(path));
  // data-slot="x", data-slot={"x"}, "data-slot": "x", and slot="x" passed to a part that writes it
  const slotsIn = (file: string) =>
    [...text.get(file)!.matchAll(/\b(?:data-)?slot"?\s*[=:]\s*\{?\s*"([a-z][a-z0-9-]*)"/g)].map(
      (m) => m[1],
    );

  const sheets = readdirSync(THEME)
    .filter((f) => f.endsWith(".css"))
    .map((f) => f.slice(0, -4))
    .filter((f) => f !== "index" && !BASE_STYLES.includes(f));
  const css = new Map(sheets.map((f) => [f, readFileSync(join(THEME, `${f}.css`), "utf8")]));
  // A slot belongs to the stylesheet named like it ("dialog-backdrop": dialog.css; the longest name, so
  // "input-group-x" is input.css), else to the stylesheets that select it
  const owners = (slot: string) => {
    const named = sheets
      .filter((f) => slot === f || slot.startsWith(`${f}-`))
      .sort((a, b) => b.length - a.length)[0];
    return named ? [named] : sheets.filter((f) => css.get(f)!.includes(`[data-slot="${slot}"]`));
  };

  const needs = (entry: string) => {
    const seen = new Set<string>();
    const queue = [entry];
    for (let file = queue.shift(); file; file = queue.shift()) {
      if (seen.has(file)) continue;
      seen.add(file);
      queue.push(...deps(file));
    }
    const out = new Set<string>();
    for (const file of seen)
      for (const slot of slotsIn(file)) for (const f of owners(slot)) out.add(f);
    return [...out].sort();
  };

  // `export { A, B as C } from "./x"` statements of a file (value exports): [names as exported, local names, path]
  const reexports = (file: string) =>
    [...text.get(file)!.matchAll(/^export\s+\{([^}]+)\}\s+from\s+"(\.{1,2}\/[^"]+)"/gm)].map(
      (m) => {
        const pairs = m[1]
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n && !n.startsWith("type "))
          .map((n) => n.split(/\s+as\s+/));
        return { pairs, path: resolve(dirname(file), m[2]) };
      },
    );
  // The file that defines an export, through barrels (a component's index.ts): a hook exported beside its component
  // then needs only what its own file renders
  const definedIn = (name: string, file: string): string => {
    for (const { pairs, path } of reexports(file)) {
      const pair = pairs.find((p) => (p[1] ?? p[0]) === name);
      if (pair && text.has(path)) return definedIn(pair[0], path);
    }
    return file;
  };

  // Every value export of src/index.ts (`export { Button } from "./components/button/index.ts"`)
  const styles: Record<string, string[]> = {};
  for (const { pairs, path } of reexports(join(SRC, "index.ts")))
    for (const [local, exported = local] of pairs) styles[exported] = needs(definedIn(local, path));
  return Object.fromEntries(Object.entries(styles).sort(([a], [b]) => a.localeCompare(b)));
}
