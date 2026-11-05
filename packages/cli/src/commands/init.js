import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { loadFeatures } from "../features.js";
import { VERSION } from "../paths.js";
import { MARKER, json } from "../project.js";
import { isTheme } from "../themes.js";

/**
 * `skein init`: writes the `.skein.json` of a project that lacks one (deleted, or a project `skein create` didn't
 * make), so `new page`, `check`, `theme` and `preview` work in it.
 *
 * Features are recognised by the structure the commands rely on, not by dependencies: a project with
 * @tanstack/react-router but code-based routes is not `router`, because `new page` would write route files nothing
 * reads. Every finding comes with its evidence; `dryRun` only reports.
 */

const read = (root, file) => {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
};

/** What each feature's files look like; all of a feature's markers must be there. */
const MARKERS = {
  router: [
    { file: "src/routes/__root.tsx" },
    {
      file: "vite.config.ts",
      contains: "tanstackRouter(",
      why: "file routes (TanStack Router plugin)",
    },
  ],
  query: [{ file: "src/lib/http.ts" }, { file: "src/lib/query-client.ts" }],
  i18n: [{ file: "src/lib/i18n.ts" }, { file: "src/lib/use-module-translation.ts" }],
  mock: [{ file: "src/mocks/index.ts" }],
  auth: [{ file: "src/routes/_auth.tsx" }, { file: "src/store/auth-store.ts" }],
  shell: [{ file: "src/skein-shell/index.ts" }, { file: "src/lib/page-meta.ts" }],
  tenant: [
    { file: "src/store/tenant-store.ts" },
    { file: "src/modules/tenant-switcher/index.tsx" },
  ],
  mcp: [{ file: ".mcp.json", contains: '"skein"', why: "a skein MCP server" }],
  preview: [
    { file: "package.json", contains: '"playwright-core"', why: "playwright-core installed" },
  ],
};

function detectFeature(root, name) {
  const evidence = [];
  for (const marker of MARKERS[name] ?? []) {
    const text = read(root, marker.file);
    if (!existsSync(join(root, marker.file))) return null;
    if (marker.contains && !text.includes(marker.contains)) return null;
    evidence.push(marker.why ? `${marker.file}: ${marker.why}` : marker.file);
  }
  return evidence.length > 0 ? evidence : null;
}

/** The theme style in use: settings.ts's default (admin shell), the import of skein.theme.ts, or src/theme/. */
function detectTheme(root) {
  const settings = read(root, "src/settings.ts").match(/\bthemeStyle: "([^"]+)"/)?.[1];
  const imported = read(root, "src/skein.theme.ts").match(/@skeinui\/themes\/([\w-]+)\//)?.[1];
  const style = settings ?? imported;
  if (style && isTheme(style) && style !== "none")
    return {
      theme: style,
      evidence: settings ? "src/settings.ts themeStyle" : "src/skein.theme.ts",
    };
  const custom = read(root, "src/theme/tokens.css").match(/\[data-skein-theme="([^"]+)"\]/)?.[1];
  if (custom) return { theme: "none", themeStyle: custom, evidence: "src/theme/tokens.css" };
  return {
    theme: null,
    evidence: "no theme style found (skein.theme.ts, settings.ts or src/theme/)",
  };
}

/**
 * @param {{ cwd?: string; force?: boolean; dryRun?: boolean }} options
 */
export function init({ cwd = process.cwd(), force, dryRun } = {}) {
  const root = resolve(cwd);
  if (!existsSync(join(root, "package.json")))
    throw new Error("no package.json here: run skein init in the project's root directory");
  if (existsSync(join(root, MARKER)) && !force)
    throw new Error(`${MARKER} already exists (--force to write it again from what is detected)`);

  const pkg = JSON.parse(read(root, "package.json"));
  const all = loadFeatures();
  const found = Object.fromEntries(
    all.map((f) => [f.name, detectFeature(root, f.name)]).filter(([, evidence]) => evidence),
  );
  // A feature whose requirements were not found is left out: new page would assume what is missing
  const warnings = [];
  let features = all.filter((f) => found[f.name]);
  for (let changed = true; changed;) {
    changed = false;
    for (const f of features) {
      const missing = f.requires.filter((r) => !features.some((x) => x.name === r));
      if (missing.length > 0) {
        warnings.push(
          `${f.name} looks present but needs ${missing.join(", ")}, which wasn't found: left out`,
        );
        features = features.filter((x) => x !== f);
        changed = true;
      }
    }
  }
  const names = features.map((f) => f.name);
  const theme = detectTheme(root);
  if (!theme.theme) warnings.push(theme.evidence);
  const template = names.includes("shell") ? "admin" : "basic";
  const local = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }).some(
    ([name, version]) => name.startsWith("@skeinui/") && String(version).startsWith("file:"),
  );

  const project = {
    name: pkg.name ?? basename(root),
    cli: VERSION,
    template,
    theme: theme.theme ?? "default",
    ...(theme.themeStyle ? { themeStyle: theme.themeStyle } : {}),
    features: names,
    ...(local ? { local: true } : {}),
  };
  if (!dryRun) writeFileSync(join(root, MARKER), json(project));
  return {
    root,
    file: MARKER,
    written: !dryRun,
    project,
    evidence: {
      ...Object.fromEntries(names.map((n) => [n, found[n]])),
      theme: theme.evidence,
    },
    notFound: all.map((f) => f.name).filter((n) => !names.includes(n) && !found[n]),
    warnings,
  };
}
