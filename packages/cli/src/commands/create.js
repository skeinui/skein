import { existsSync, readdirSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { DEFAULT_TEMPLATE, TEMPLATES, loadFeatures, resolveFeatures } from "../features.js";
import { pascal, title, toPackageName, toThemeStyleName } from "../names.js";
import { TEMPLATES_DIR, VERSION } from "../paths.js";
import { blankThemeFiles, loadContract } from "../theme/index.js";
import { MARKER, json, packageJson, pnpmWorkspace, renderDir } from "../project.js";
import {
  CUSTOM_THEME_DIR,
  DEFAULT_THEME,
  isTheme,
  THEMES,
  themeImportPath,
  themeLabel,
} from "../themes.js";
import { Writer } from "../writer.js";

export const isEmptyDir = (dir) => !existsSync(dir) || readdirSync(dir).length === 0;

/** The mock feature's public/mockServiceWorker.js: committed, rewritten by scripts/msw-worker.ts after an msw upgrade. */
const MOCK_WORKER = join(
  TEMPLATES_DIR,
  "features",
  "mock",
  "files",
  "public",
  "mockServiceWorker.js",
);

/**
 * The features a project gets: the template's preset, plus `add`, minus `remove`.
 * Removing something another chosen feature requires is an error.
 *
 * @param {{ template?: string; add?: string[]; remove?: string[] }} options
 */
export function featuresFor({ template = DEFAULT_TEMPLATE, add = [], remove = [] }) {
  const preset = TEMPLATES[template];
  if (!preset) {
    throw new Error(
      `unknown template "${template}", choose one of: ${Object.keys(TEMPLATES).join(", ")}`,
    );
  }
  const all = loadFeatures();
  const chosen = [...new Set([...preset.features, ...add])].filter((f) => !remove.includes(f));
  const features = resolveFeatures(chosen, all);
  for (const name of remove) {
    const needer = features.find((f) => f.requires.includes(name));
    if (needer) throw new Error(`"${needer.name}" requires "${name}", it can't be left out`);
  }
  return features;
}

/** Variables and flags templates are rendered with. */
export function contextFor({ packageName, theme, themeStyle, features, local }) {
  const flags = Object.fromEntries(features.map((f) => [f.name, true]));
  flags.local = Boolean(local);
  flags.customTheme = theme === "none";
  return {
    flags,
    vars: {
      name: packageName,
      Name: pascal(packageName.replace(/^@[^/]+\//, "")),
      title: title(packageName),
      themeStyle,
      themeImport: theme === "none" ? "./theme/index.css" : themeImportPath(theme),
      themeLabel: themeLabel(theme, themeStyle),
      storageKey: packageName.replace(/^@[^/]+\//, ""),
    },
  };
}

/**
 * Creates a project in `dir`. Returns what was written plus what the caller needs for its message.
 *
 * @param {{ dir: string; name?: string; template?: string; theme?: string; add?: string[];
 *   remove?: string[]; local?: boolean; force?: boolean; dryRun?: boolean }} options
 */
export function createProject(options) {
  const { dir, template = DEFAULT_TEMPLATE, theme = DEFAULT_THEME, local = false } = options;
  if (!isTheme(theme)) {
    throw new Error(
      `unknown theme "${theme}", choose one of: ${THEMES.map((t) => t.id).join(", ")}`,
    );
  }
  const root = resolve(dir);
  if (!options.force && !isEmptyDir(root)) throw new Error(`${dir} is not empty`);
  const packageName = toPackageName(options.name ?? basename(root));
  const features = featuresFor({ template, add: options.add, remove: options.remove });
  const blank = theme === "none";
  const themeStyle = blank ? toThemeStyleName(packageName) : theme;

  if (features.some((f) => f.name === "mock") && !existsSync(MOCK_WORKER))
    throw new Error(
      "mockServiceWorker.js is missing from the mock template: restore it from git, or run `pnpm --filter @skeinui/cli msw-worker`",
    );

  const writer = new Writer(root, { force: options.force, dryRun: options.dryRun });
  const context = contextFor({ packageName, theme, themeStyle, features, local });
  renderDir(writer, join(TEMPLATES_DIR, "_base"), context);
  for (const feature of features) renderDir(writer, feature.dir, context);
  if (blank) {
    // Nothing is installed yet: the contract comes with the CLI
    for (const [file, css] of Object.entries(blankThemeFiles(themeStyle, loadContract(root)))) {
      writer.write(join(CUSTOM_THEME_DIR, file), css);
    }
  }
  writer.write("package.json", json(packageJson({ name: packageName, theme, features, local })));
  const pnpm = pnpmWorkspace({ features, local });
  if (pnpm) writer.write("pnpm-workspace.yaml", pnpm);
  writer.write(
    MARKER,
    json({
      name: packageName,
      cli: VERSION,
      template,
      theme,
      features: features.map((f) => f.name),
      ...(local ? { local: true } : {}),
    }),
  );
  const result = writer.commit();
  return {
    ...result,
    root,
    // A path climbing out of the cwd reads worse than the absolute one
    relativeRoot: relative(process.cwd(), root).startsWith("..")
      ? root
      : relative(process.cwd(), root) || ".",
    packageName,
    themeStyle,
    features: features.map((f) => f.name),
  };
}
