// @skeinui/themes/vite: a theme style's index.css imports the stylesheet of every component; this plugin keeps only
// those of the components the project imports from @skeinui/ui (and of the components they render), so a project
// bundles a few dozen KB of a theme style instead of all of it.
//
//   import { skeinThemes } from "@skeinui/themes/vite";
//   export default defineConfig({ plugins: [react(), skeinThemes()] });
//
// What each export needs comes from @skeinui/ui's manifest.json (`styles`, written by packages/ui/scripts/styles.ts).
// Whenever the imports can't be read (`import * as`, `import("@skeinui/ui")`), every stylesheet is kept.
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** This package's directory: the bundled theme styles are beside this file. */
const THEMES = dirname(fileURLToPath(import.meta.url));

const SOURCE = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".mts", ".cjs", ".cts"]);
const NAMED = /\b(?:import|export)\s+(type\s+)?\{([^}]*)\}\s*from\s*["']@skeinui\/ui["']/g;
// `import * as UI`, `import UI`, `import("@skeinui/ui")`: what is used can't be told
const WHOLE =
  /\bimport\s+(?:\*\s+as\s+\w+|\w+)\s+from\s*["']@skeinui\/ui["']|\bimport\s*\(\s*["']@skeinui\/ui["']\s*\)/;
const IMPORT_LINE = /^\s*@import\s+["']\.\/([\w-]+)\.css["']\s*;\s*$/;

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        if (name === "node_modules" || name.startsWith(".")) return [];
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : SOURCE.has(extname(name)) ? [path] : [];
      })
    : [];

/** The names a source file imports from @skeinui/ui; null when it imports the whole package. */
export function importsOf(code) {
  if (WHOLE.test(code)) return null;
  const names = [];
  for (const [, typeOnly, list] of code.matchAll(NAMED)) {
    // `import type { … }` names types only
    if (typeOnly) continue;
    for (const item of list.split(",")) {
      const name = item.trim();
      // `type X` names a type only; `A as B` imports A
      if (name && !name.startsWith("type ")) names.push(name.split(/\s+as\s+/)[0].trim());
    }
  }
  return names;
}

/** The stylesheets (names, no `.css`) to keep for these imports; null to keep them all. */
export function stylesFor(imports, styles) {
  if (imports === null) return null;
  const keep = new Set(styles.base);
  for (const name of imports) for (const sheet of styles.exports[name] ?? []) keep.add(sheet);
  return keep;
}

/** index.css with only the @imports of `keep` (other lines as they are). */
export function prune(css, keep) {
  return css
    .split("\n")
    .filter((line) => {
      const match = line.match(IMPORT_LINE);
      return !match || keep.has(match[1]);
    })
    .join("\n");
}

/**
 * @param {{ include?: string[]; themes?: string[] }} [options]
 *   `include`: the directories whose source files are scanned for imports (default `["src"]`);
 *   `themes`: directories of theme styles of your own to prune as well (`skein theme init` writes `src/theme`).
 */
export function skeinThemes(options = {}) {
  let root = process.cwd();
  let logger = console;
  let styles = null;
  let themeDirs = [];
  let keep = null;
  const served = new Set();
  let known = [];

  const scan = () => {
    const all = [];
    for (const dir of options.include ?? ["src"])
      for (const file of walk(resolve(root, dir))) {
        const names = importsOf(readFileSync(file, "utf8"));
        if (names === null) return null;
        all.push(...names);
      }
    known = [...new Set(all.filter((name) => name in styles.exports))];
    return stylesFor(known, styles);
  };
  const isThemeIndex = (id) => {
    const file = id.split("?")[0];
    return (
      file.endsWith("index.css") &&
      themeDirs.some((dir) => file.startsWith(dir)) &&
      existsSync(join(dirname(file), "tokens.css"))
    );
  };
  const sameSet = (a, b) =>
    a === null || b === null ? a === b : a.size === b.size && [...a].every((x) => b.has(x));

  return {
    name: "skein-themes",
    enforce: "pre",
    configResolved(config) {
      root = config.root;
      logger = config.logger;
      const require = createRequire(join(root, "package.json"));
      try {
        const manifest = JSON.parse(
          readFileSync(require.resolve("@skeinui/ui/manifest.json"), "utf8"),
        );
        styles = manifest.styles ?? null;
      } catch {
        styles = null;
      }
      if (!styles)
        logger.warn(
          "[skein-themes] @skeinui/ui has no styles map (update it): every stylesheet is kept",
        );
      // Real paths: a pnpm project reaches the package through a symlink, module ids are resolved
      themeDirs = [THEMES, ...(options.themes ?? []).map((dir) => resolve(root, dir))].map((dir) =>
        existsSync(dir) ? realpathSync(dir) : dir,
      );
    },
    buildStart() {
      if (!styles) return;
      keep = scan();
      const total = readFileSync(join(THEMES, "default", "index.css"), "utf8")
        .split("\n")
        .filter((line) => IMPORT_LINE.test(line)).length;
      if (keep)
        logger.info(
          `[skein-themes] ${keep.size} of ${total} stylesheets per theme style, for ${known.length} components`,
        );
      else
        logger.info(
          "[skein-themes] the whole of @skeinui/ui is imported: every stylesheet is kept",
        );
    },
    load(id) {
      if (!styles || !keep || !isThemeIndex(id)) return null;
      served.add(id.split("?")[0]);
      return prune(readFileSync(id.split("?")[0], "utf8"), keep);
    },
    configureServer(server) {
      // A source file added, changed or removed may import other components: reload the theme styles if so
      const update = (file) => {
        if (!styles || !SOURCE.has(extname(file))) return;
        const next = scan();
        if (sameSet(next, keep)) return;
        keep = next;
        for (const id of served)
          for (const mod of server.moduleGraph.getModulesByFile(id) ?? [])
            void server.reloadModule(mod);
      };
      server.watcher.on("add", update);
      server.watcher.on("change", update);
      server.watcher.on("unlink", update);
    },
  };
}

export default skeinThemes;
