import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import { render, isEmpty } from "./engine.js";
import { REPO_PACKAGES_DIR, TEMPLATES_DIR, VERSION } from "./paths.js";
import { THEMES_PACKAGE } from "./themes.js";

export const MARKER = ".skein.json";

/** The nearest directory at or above `from` that has a `.skein.json`, or null. */
export function findProjectRoot(from = process.cwd()) {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(join(dir, MARKER))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function readProject(root) {
  return JSON.parse(readFileSync(join(root, MARKER), "utf8"));
}

/** Oxfmt's line width (Vite+'s default): `vp check` expects the files the CLI writes formatted as it would. */
const PRINT_WIDTH = 100;
const SCALAR = String.raw`(?:"(?:[^"\\]|\\.)*"|-?\d[\d.eE+-]*|true|false|null)`;
/** An array of plain values that JSON.stringify spread over lines: its indent, key, items, and trailing comma */
const SPREAD_ARRAY = new RegExp(
  String.raw`^( *)((?:"(?:[^"\\]|\\.)*": )?)\[\n((?: *${SCALAR},?\n)+) *\](,?)$`,
  "gm",
);

/** The path of command `name` of package `pkg` installed in the project at `root` (a Node script); throws if absent. */
export function packageBin(root, pkg, name) {
  const require = createRequire(join(root, "package.json"));
  const pkgFile = require.resolve(`${pkg}/package.json`);
  const { bin } = JSON.parse(readFileSync(pkgFile, "utf8"));
  const path = typeof bin === "string" ? bin : bin?.[name];
  if (!path) throw new Error(`${pkg} has no ${name} command`);
  return join(dirname(pkgFile), path);
}

/** package.json as Oxfmt writes it (json-stringify, as Prettier: every array spread over lines). */
export const manifest = (value) => `${JSON.stringify(value, null, 2)}\n`;

/**
 * Any other JSON as Oxfmt writes it: 2 spaces, and an array of plain values on one line when that line fits
 * (`"features": ["router", "query"]`), objects one key per line.
 */
export const json = (value) =>
  `${JSON.stringify(value, null, 2).replace(SPREAD_ARRAY, (whole, indent, key, items, comma) => {
    const line = `${indent}${key}[${items
      .trim()
      .split("\n")
      .map((item) => item.trim().replace(/,$/, ""))
      .join(", ")}]${comma}`;
    return line.length <= PRINT_WIDTH ? line : whole;
  })}\n`;

/** A relative path with `/`, whatever the platform's separator (what commands report, --json and MCP). */
export const toPosix = (path) => path.split(sep).join("/");

/** Every file under `dir`, as paths relative to it, with `/` on every platform (`public/…` below). */
function walk(dir, base = dir) {
  return readdirSync(dir).flatMap((entry) => {
    const file = join(dir, entry);
    return statSync(file).isDirectory() ? walk(file, base) : [toPosix(relative(base, file))];
  });
}

/**
 * Renders every file of a template directory into `writer`, under `into`. Files under `public/` are
 * copied as they are; `_gitignore` becomes `.gitignore` (npm drops .gitignore from packages); files that
 * render to nothing are skipped (their whole content is behind an `{{#if}}`).
 */
export function renderDir(writer, dir, context, into = "") {
  if (!existsSync(dir)) return;
  for (const path of walk(dir)) {
    const source = readFileSync(join(dir, path), "utf8");
    const verbatim = path.startsWith("public/");
    const content = verbatim ? source : render(source, context);
    if (!verbatim && isEmpty(content)) continue;
    const target = path.replace(/(^|\/)_gitignore$/, "$1.gitignore");
    writer.write(join(into, target), content);
  }
}

/** `src/skein.theme.ts`: rendered from the base template, so `theme use` and `create` write the same file. */
export function themeFile(context) {
  return render(
    readFileSync(join(TEMPLATES_DIR, "_base", "src", "skein.theme.ts"), "utf8"),
    context,
  );
}

/**
 * The Vite+ release generated projects use (`vp`: Vite, Rolldown, Vitest, Oxlint, Oxfmt): the one this repository
 * builds with, a test keeps them equal. `vite` itself is its core, so plugins that import vite get the same one.
 */
export const VITE_PLUS_VERSION = "1.5.0";
const VITE_CORE = `npm:@voidzero-dev/vite-plus-core@${VITE_PLUS_VERSION}`;

/** Where `@skeinui/*` come from: the registry, or this checkout (`--local`). */
export function skeinVersion(name, local) {
  return local ? `file:${join(REPO_PACKAGES_DIR, name.replace("@skeinui/", ""))}` : `^${VERSION}`;
}

/**
 * pnpm-workspace.yaml (pnpm's project settings; npm and bun read `overrides` in package.json instead):
 * - vite is Vite+'s core for every package that depends on it, as `vp migrate` sets it up
 * - msw's install script is allowed (pnpm blocks install scripts and fails the install otherwise)
 * - with --local, every @skeinui/* package of this checkout is linked: they depend on each other with
 *   `workspace:*`, which pnpm can only resolve through overrides outside the monorepo
 */
export function pnpmWorkspace({ features, local }) {
  const lines = [];
  // Vite+: every package that depends on vite (plugins, Vitest) gets its core, without peer warnings
  const overrides = [`  vite@*: "${VITE_CORE}"`];
  if (features.some((f) => f.name === "mock")) {
    lines.push(
      "# msw's install script keeps public/mockServiceWorker.js in step with the installed msw; pnpm blocks",
      "# install scripts unless they are allowed here.",
      "allowBuilds:",
      "  msw: true",
    );
  }
  if (local) {
    const packages = readdirSync(REPO_PACKAGES_DIR)
      .map((dir) => join(REPO_PACKAGES_DIR, dir, "package.json"))
      .filter((file) => existsSync(file))
      .map((file) => JSON.parse(readFileSync(file, "utf8")).name)
      .filter((name) => name?.startsWith("@skeinui/"))
      .sort((a, b) => a.localeCompare(b));
    overrides.push(
      "  # --local: the @skeinui/* packages of the Skein checkout (they refer to each other with workspace:*)",
      ...packages.map(
        (name) => `  "${name}": "link:${join(REPO_PACKAGES_DIR, name.replace("@skeinui/", ""))}"`,
      ),
    );
  }
  if (lines.length > 0) lines.push("");
  lines.push(
    "# Vite+: vite is its core (vite-plus-core) for every package, plugins and Vitest included",
    "overrides:",
    ...overrides,
    "peerDependencyRules:",
    "  allowAny:",
    "    - vite",
  );
  return `# pnpm settings for this project.\n${lines.join("\n")}\n`;
}

const sorted = (deps) =>
  Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b)));

/** The project's package.json: the base, plus each feature's dependencies. */
export function packageJson({ name, theme, features, local }) {
  const blank = theme === "none";
  const has = (f) => features.some((x) => x.name === f);
  const dependencies = {
    "@skeinui/ui": skeinVersion("@skeinui/ui", local),
    // Every built-in theme style; only the imported one is bundled. A blank theme style needs none
    ...(blank ? {} : { [THEMES_PACKAGE]: skeinVersion(THEMES_PACKAGE, local) }),
    react: "^19.2.0",
    "react-dom": "^19.2.0",
  };
  const devDependencies = {
    // The `skein` command: new page, docs, check (which also checks a theme style of the app's own);
    // `skein mcp` needs the mcp feature's packages
    "@skeinui/cli": skeinVersion("@skeinui/cli", local),
    "@types/node": "^24.0.0",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.0",
    typescript: "^6.0.2",
    vite: VITE_CORE,
    "vite-plus": VITE_PLUS_VERSION,
  };
  const scripts = {
    dev: "vp dev",
    build: "vp build",
    preview: "vp preview",
    typecheck: "tsc",
    // skein check first: it generates the route tree (src/routeTree.gen.ts) that the type check needs
    check: "skein check && vp check",
    // Installs the git hook that runs `vp check --fix` on the staged files (vite.config.ts `staged`)
    prepare: "vp config",
  };
  for (const feature of features) {
    Object.assign(dependencies, feature.dependencies);
    for (const name of feature.skeinDependencies ?? [])
      dependencies[name] = skeinVersion(name, local);
    Object.assign(devDependencies, feature.devDependencies);
    Object.assign(scripts, feature.scripts);
  }
  // Keys in package.json's usual order (Oxfmt sorts them so)
  return {
    name,
    version: "0.0.0",
    private: true,
    type: "module",
    scripts,
    dependencies: sorted(dependencies),
    devDependencies: sorted(devDependencies),
    // npm and bun: the packages that depend on vite (plugins, Vitest) get the Vite+ core too
    overrides: { vite: VITE_CORE },
    // MSW keeps public/mockServiceWorker.js in step with the installed version (where install scripts run)
    ...(has("mock") ? { msw: { workerDirectory: ["public"] } } : {}),
    // bun runs dependencies' install scripts only for these (pnpm: pnpm-workspace.yaml allowBuilds)
    ...(has("mock") ? { trustedDependencies: ["msw"] } : {}),
  };
}
