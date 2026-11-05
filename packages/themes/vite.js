// @skeinui/themes/vite: a theme style's index.css imports the stylesheet of every component; this plugin keeps only
// those of the components the project imports from @skeinui/ui (and of the components they render), so a project
// bundles a few dozen KB of a theme style instead of all of it.
//
//   import { skeinThemes } from "@skeinui/themes/vite";
//   export default defineConfig({ plugins: [react(), skeinThemes()] });
//
// What each export needs comes from @skeinui/ui's manifest.json (`styles`, written by packages/ui/scripts/styles.ts).
// The imports are read with Vite's own parser (oxc, Vite 8) from src/ and from the dependencies that depend on
// @skeinui/ui, before the theme style is loaded. Every module the app then transforms is checked against that: a
// component imported from somewhere else is added in dev, and fails a build (rather than ship unstyled). Whenever the
// imports can't be told (`import * as`, `export *`, `import("@skeinui/ui")`), every stylesheet is kept.
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const UI = "@skeinui/ui";
/** This package's directory: the bundled theme styles are beside this file. */
const THEMES = dirname(fileURLToPath(import.meta.url));
const SOURCE = /\.[cm]?[jt]sx?$/;
const IMPORT_LINE = /^\s*@import\s+["']\.\/([\w-]+)\.css["']\s*;\s*$/;
const DYNAMIC_UI = /^\s*(["'`])@skeinui\/ui\1\s*$/;

/** A file path as Vite writes module ids: forward slashes, no query. */
export const toPosix = (path) => path.replace(/[?#].*$/, "").replace(/\\/g, "/");

/** The key the paths of one file share: on Windows, paths compare case-insensitively (drive letters, folders). */
export const pathKey = (path, platform = process.platform) =>
  platform === "win32" ? toPosix(path).toLowerCase() : toPosix(path);

/** Whether `file` is inside `dir`, whatever the separators. */
export const isInside = (file, dir, platform = process.platform) =>
  pathKey(file, platform).startsWith(`${pathKey(dir, platform).replace(/\/+$/, "")}/`);

const real = (path) => {
  try {
    return toPosix(realpathSync(path));
  } catch {
    return toPosix(path);
  }
};

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

/** `node_modules/<name>` as Node finds it from `dir` (up the tree); package.json needn't be in its exports. */
const findPackage = (dir, name) => {
  for (let up = dir; ; up = dirname(up)) {
    const candidate = join(up, "node_modules", name);
    if (existsSync(join(candidate, "package.json"))) return real(candidate);
    if (dirname(up) === up) return null;
  }
};

/**
 * The names a module imports or re-exports from @skeinui/ui, read with `parse` (Vite's `parseSync`): `[]` for none,
 * null when it takes the whole package (what is used can't be told), undefined when the code doesn't parse.
 */
export function importsOf(code, filename, parse) {
  if (!code.includes(UI)) return [];
  let result;
  try {
    result = parse(filename, code);
  } catch {
    return undefined;
  }
  if (result.errors.length) return undefined;
  const { staticImports, staticExports, dynamicImports } = result.module;
  const names = [];
  for (const { moduleRequest, entries } of staticImports) {
    if (moduleRequest.value !== UI) continue;
    for (const { importName, isType } of entries) {
      if (isType) continue;
      // `import * as UI`, `import UI`
      if (importName.kind !== "Name") return null;
      names.push(importName.name);
    }
  }
  for (const { entries } of staticExports)
    for (const { moduleRequest, importName, isType } of entries) {
      if (moduleRequest?.value !== UI || isType) continue;
      // `export *`, `export * as UI`
      if (importName.kind !== "Name") return null;
      names.push(importName.name);
    }
  for (const { moduleRequest } of dynamicImports)
    if (DYNAMIC_UI.test(code.slice(moduleRequest.start, moduleRequest.end))) return null;
  return names;
}

/** The stylesheets (names, no `.css`) to keep for these imports; null to keep them all. */
export function stylesFor(imports, styles) {
  if (imports === null) return null;
  const keep = new Set(styles.base);
  for (const name of imports) for (const sheet of styles.exports[name] ?? []) keep.add(sheet);
  return keep;
}

/** index.css with only the @imports of `keep` (other lines as they are, line endings included). */
export function prune(css, keep) {
  return css
    .split("\n")
    .filter((line) => {
      const match = line.match(IMPORT_LINE);
      return !match || keep.has(match[1]);
    })
    .join("\n");
}

/** Source files under `dir`: no node_modules, no dot directories, no symlinked directories (no loops). */
function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory())
      return entry.name === "node_modules" || entry.name.startsWith(".") ? [] : walk(path);
    return entry.isFile() && SOURCE.test(entry.name) ? [path] : [];
  });
}

const dependsOnUi = (pkg) =>
  Boolean(
    pkg && (pkg.dependencies?.[UI] || pkg.peerDependencies?.[UI] || pkg.devDependencies?.[UI]),
  );

/**
 * The directories of the packages among the project's dependencies that depend on @skeinui/ui themselves (a
 * workspace package, a component library of your own), and of theirs: they may render Skein components too.
 */
export function dependencyDirs(root) {
  const found = [];
  const seen = new Set();
  const visit = (dir, dev) => {
    const pkg = readJson(join(dir, "package.json"));
    if (!pkg) return;
    const names = Object.keys({
      ...pkg.dependencies,
      ...pkg.peerDependencies,
      ...(dev ? pkg.devDependencies : {}),
    });
    for (const name of names) {
      if (name.startsWith("@skeinui/")) continue;
      const at = findPackage(dir, name);
      if (!at || seen.has(pathKey(at))) continue;
      seen.add(pathKey(at));
      if (!dependsOnUi(readJson(join(at, "package.json")))) continue;
      found.push(at);
      visit(at, false);
    }
  };
  visit(root, true);
  return found;
}

/**
 * @param {import("./vite.d.ts").SkeinThemesOptions} [options]
 * @returns {import("vite").Plugin}
 */
export function skeinThemes(options = {}) {
  if (options.prune === false) return { name: "skein-themes" };

  let logger = console;
  /** Vite's parseSync; null before Vite 8 (then every stylesheet is kept) */
  let parse = null;
  let styles = null;
  let uiDir = null;
  let themeDirs = [];
  let scanDirs = [];
  let server = null;
  /** What each file imports from @skeinui/ui, by pathKey: the files scanned, and in dev the modules met in transform */
  const files = new Map();
  /** The stylesheets kept; null: all of them */
  let keep = null;
  let active = false;
  /** The theme styles' index.css served in dev, to reload when `keep` changes */
  const served = new Set();
  /** In a build: the modules importing components the scan didn't see */
  const missed = new Map();

  const read = (path) => {
    const key = pathKey(path);
    let mtime;
    try {
      mtime = statSync(path).mtimeMs;
    } catch {
      files.delete(key);
      return;
    }
    const known = files.get(key);
    if (known?.mtime === mtime) return;
    const names = importsOf(readFileSync(path, "utf8"), path, parse);
    // A file that doesn't parse (in the middle of an edit) keeps what it imported before; the build reports it
    files.set(key, { mtime, names: names === undefined ? (known?.names ?? []) : names });
  };
  const compute = () => {
    const all = [];
    for (const { names } of files.values()) {
      if (names === null) return null;
      all.push(...names);
    }
    return stylesFor(all, styles);
  };
  const sameSet = (a, b) =>
    a === null || b === null ? a === b : a.size === b.size && [...a].every((x) => b.has(x));
  /** In dev: the stylesheets to keep may have changed, reload the theme styles if so */
  const update = () => {
    const next = compute();
    if (sameSet(next, keep)) return;
    keep = next;
    // Invalidated first: with HMR off (or no page connected) the next request still gets the new stylesheets
    for (const file of served)
      for (const mod of server?.moduleGraph.getModulesByFile(file) ?? []) {
        server.moduleGraph.invalidateModule(mod);
        void server.reloadModule(mod);
      }
  };
  /** The imports of `names` whose stylesheets aren't kept */
  const unstyled = (names) =>
    keep === null
      ? []
      : names === null
        ? ["*"]
        : names.filter((name) => (styles.exports[name] ?? []).some((sheet) => !keep.has(sheet)));
  const isThemeIndex = (file) =>
    file.endsWith("/index.css") &&
    themeDirs.some((dir) => isInside(file, dir)) &&
    existsSync(join(dirname(file), "tokens.css"));

  return {
    name: "skein-themes",
    enforce: "pre",
    async configResolved(config) {
      const root = toPosix(config.root);
      logger = config.logger;
      try {
        ({ parseSync: parse = null } = await import("vite"));
      } catch {
        parse = null;
      }
      uiDir = findPackage(root, UI);
      styles = (uiDir && readJson(join(uiDir, "manifest.json"))?.styles) ?? null;
      if (!parse) logger.warn("[skein-themes] needs Vite 8 (its parser): every stylesheet is kept");
      else if (!styles)
        logger.warn(`[skein-themes] ${UI} has no styles map (update it): every stylesheet is kept`);
      active = Boolean(parse && styles);
      // Real paths: a pnpm project reaches the packages through symlinks, and module ids are resolved
      themeDirs = [THEMES, ...(options.themes ?? []).map((dir) => resolve(root, dir))].map(real);
      scanDirs = [
        ...(options.include ?? ["src"]).map((dir) => real(resolve(root, dir))),
        ...dependencyDirs(root),
      ];
    },
    buildStart() {
      if (!active) return;
      for (const dir of scanDirs) for (const file of walk(dir)) read(file);
      keep = compute();
      const total = readFileSync(join(THEMES, "default", "index.css"), "utf8")
        .split("\n")
        .filter((line) => IMPORT_LINE.test(line)).length;
      logger.info(
        keep
          ? `[skein-themes] ${keep.size} of ${total} stylesheets per theme style`
          : `[skein-themes] the whole of ${UI} is imported: every stylesheet is kept`,
      );
    },
    load(id) {
      const file = toPosix(id);
      if (!active || !keep || !isThemeIndex(file)) return null;
      served.add(file);
      return prune(readFileSync(file, "utf8"), keep);
    },
    // The safety net: each module of the app, wherever it is, against what the scan found
    transform(code, id) {
      if (!active || !code.includes(UI)) return null;
      const file = toPosix(id);
      if (!SOURCE.test(file) || (uiDir && isInside(file, uiDir))) return null;
      const names = importsOf(code, file, parse);
      if (names === undefined) return null;
      const lacking = unstyled(names);
      if (lacking.length === 0) return null;
      if (server) {
        // Served with its styles now; a build would fail on it, so say so already
        logger.warn(
          `[skein-themes] ${file} imports ${lacking.join(", ")} from outside the directories scanned: ` +
            `add its directory to skeinThemes({ include }), or the build fails`,
        );
        files.set(pathKey(file), { mtime: -1, names });
        update();
      } else missed.set(file, lacking);
      return null;
    },
    buildEnd() {
      if (missed.size === 0) return;
      const list = [...missed].map(([file, names]) => `  ${file}: ${names.join(", ")}`).join("\n");
      missed.clear();
      this.error(
        `[skein-themes] these modules import components whose stylesheets were left out, being outside the ` +
          `directories scanned (${(options.include ?? ["src"]).join(", ")}, and the dependencies on ${UI}):\n` +
          `${list}\nAdd their directories to skeinThemes({ include }), or turn pruning off: ` +
          `skeinThemes({ prune: false }).`,
      );
    },
    configureServer(devServer) {
      server = devServer;
      // A source file added, changed or removed may import other components
      const onFile = (path) => {
        if (!active || !SOURCE.test(path) || !scanDirs.some((dir) => isInside(path, dir))) return;
        read(toPosix(path));
        update();
      };
      devServer.watcher.on("add", onFile);
      devServer.watcher.on("change", onFile);
      devServer.watcher.on("unlink", onFile);
    },
  };
}

export default skeinThemes;
