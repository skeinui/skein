import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
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

export const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

/** Every file under `dir`, as paths relative to it. */
function walk(dir, base = dir) {
  return readdirSync(dir).flatMap((entry) => {
    const file = join(dir, entry);
    return statSync(file).isDirectory() ? walk(file, base) : [relative(base, file)];
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

/** Where `@skeinui/*` come from: the registry, or this checkout (`--local`). */
export function skeinVersion(name, local) {
  return local ? `file:${join(REPO_PACKAGES_DIR, name.replace("@skeinui/", ""))}` : `^${VERSION}`;
}

/**
 * pnpm-workspace.yaml (pnpm's project settings), or null when there is nothing to set:
 * - msw's install script is allowed (pnpm blocks install scripts and fails the install otherwise)
 * - with --local, every @skeinui/* package of this checkout is linked: they depend on each other with
 *   `workspace:*`, which pnpm can only resolve through overrides outside the monorepo
 */
export function pnpmWorkspace({ features, local }) {
  const lines = [];
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
    if (lines.length > 0) lines.push("");
    lines.push(
      "# --local: the @skeinui/* packages of the Skein checkout (they refer to each other with workspace:*)",
      "overrides:",
      ...packages.map(
        (name) => `  "${name}": "link:${join(REPO_PACKAGES_DIR, name.replace("@skeinui/", ""))}"`,
      ),
    );
  }
  return lines.length > 0 ? `# pnpm settings for this project.\n${lines.join("\n")}\n` : null;
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
    vite: "^8.0.0",
  };
  const scripts = {
    dev: "vite",
    build: "tsc && vite build",
    preview: "vite preview",
    typecheck: "tsc",
    check: "skein check",
  };
  for (const feature of features) {
    Object.assign(dependencies, feature.dependencies);
    for (const name of feature.skeinDependencies ?? [])
      dependencies[name] = skeinVersion(name, local);
    Object.assign(devDependencies, feature.devDependencies);
    Object.assign(scripts, feature.scripts);
  }
  return {
    name,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts,
    dependencies: sorted(dependencies),
    devDependencies: sorted(devDependencies),
    // MSW keeps public/mockServiceWorker.js in step with the installed version (where install scripts run)
    ...(has("mock") ? { msw: { workerDirectory: ["public"] } } : {}),
    // bun runs dependencies' install scripts only for these (pnpm: pnpm-workspace.yaml allowBuilds)
    ...(has("mock") ? { trustedDependencies: ["msw"] } : {}),
  };
}
