import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { REPO_PACKAGES_DIR } from "../paths.js";
import { findProjectRoot, json, readProject, skeinVersion, themeFile, MARKER } from "../project.js";
import { contextFor } from "./create.js";
import {
  CUSTOM_THEME_DIR,
  isTheme,
  THEMES,
  THEMES_PACKAGE,
  themeImportPath,
  themeLabel,
} from "../themes.js";
import { checkTheme, initTheme } from "../theme/index.js";
import { Writer } from "../writer.js";

const SETTINGS = "src/settings.ts";
const BUILT_IN = THEMES.filter((t) => t.id !== "none").map((t) => t.id);
/** `skein` is the brand style's other name (its package directory is `default`). */
const normalize = (id) => (id === "skein" ? "default" : id);

function builtIn(id) {
  const theme = normalize(id);
  if (!BUILT_IN.includes(theme))
    throw new Error(`unknown theme "${id}", choose from: ${BUILT_IN.join(", ")} (or skein)`);
  return theme;
}

function projectAt(cwd) {
  const root = findProjectRoot(cwd);
  if (!root) throw new Error("not inside a Skein project (no .skein.json found here or above)");
  return { root, project: readProject(root) };
}

const hasShell = (project) => project.features.includes("shell");

/**
 * The `themeStyles` list of src/settings.ts (shell projects): one line per theme style,
 * `"antd": { label: "…", load: () => import("…") },`. Edited in place, the rest of the file is left as it is.
 */
const LIST = /(themeStyles: \{\n)([\s\S]*?)(\n\s*\})/;
const entryLine = (id, label, from) =>
  `    "${id}": { label: "${label}", load: () => import("${from}") },`;

function themeList(source) {
  const match = source.match(LIST);
  if (!match)
    throw new Error(`could not find the themeStyles list in ${SETTINGS}; edit it by hand`);
  return [...match[2].matchAll(/^\s*"?([\w-]+)"?\s*:/gm)].map((m) => m[1]);
}

function addToList(source, entries) {
  const listed = themeList(source);
  const lines = entries
    .filter((e) => !listed.includes(e.id))
    .map((e) => entryLine(e.id, e.label, e.from));
  if (lines.length === 0) return source;
  return source.replace(
    LIST,
    (_, open, body, close) => `${open}${body}\n${lines.join("\n")}${close}`,
  );
}

function removeFromList(source, id) {
  return source.replace(LIST, (_, open, body, close) => {
    const kept = body.split("\n").filter((line) => !new RegExp(`^\\s*"?${id}"?\\s*:`).test(line));
    return `${open}${kept.join("\n")}${close}`;
  });
}

const setDefault = (source, id) => source.replace(/(\bthemeStyle: )"[^"]*"/, `$1"${id}"`);

/** The entry of a theme style in the list: a bundled one, or the app's own in src/theme/. */
const entryFor = (theme, themeStyle = theme) => ({
  id: themeStyle,
  label: themeLabel(theme, themeStyle),
  from: theme === "none" ? "./theme/index.css" : themeImportPath(theme),
});

/** Adds @skeinui/themes when a project doesn't have it (it started with a blank theme style of its own). */
function ensureThemesPackage(writer, project) {
  const pkg = JSON.parse(writer.read("package.json"));
  if (pkg.dependencies?.[THEMES_PACKAGE]) return false;
  pkg.dependencies = Object.fromEntries(
    Object.entries({
      ...pkg.dependencies,
      [THEMES_PACKAGE]: skeinVersion(THEMES_PACKAGE, Boolean(project.local)),
    }).sort(([a], [b]) => a.localeCompare(b)),
  );
  writer.write("package.json", json(pkg));
  return true;
}

const setHtmlThemeStyle = (writer, id) => {
  const html = writer.read("index.html");
  if (html)
    writer.write(
      "index.html",
      // data-theme-style: a project made before 0.0.4
      html.replace(
        /(<html\b[^>]*\bdata-)(?:skein-theme|theme-style)="[^"]*"/,
        `$1skein-theme="${id}"`,
      ),
    );
};

/**
 * `skein theme use <name>`: makes a bundled theme style the app's. In a project with the admin shell it is added to
 * settings.ts's `themeStyles` (if missing) and made the default `themeStyle`; otherwise src/skein.theme.ts imports
 * it instead of the previous one. index.html and .skein.json follow. A theme style in src/theme/ is left where it is.
 *
 * @param {{ theme: string; cwd?: string; dryRun?: boolean }} options
 */
export function useTheme({ theme: requested, cwd = process.cwd(), dryRun }) {
  const theme = builtIn(requested);
  const { root, project } = projectAt(cwd);
  const writer = new Writer(root, { dryRun });
  const needsInstall = ensureThemesPackage(writer, project);

  let themeEdit;
  if (hasShell(project)) {
    themeEdit = SETTINGS;
    writer.write(SETTINGS, setDefault(addToList(writer.read(SETTINGS), [entryFor(theme)]), theme));
  } else {
    themeEdit = "src/skein.theme.ts";
    const context = contextFor({
      packageName: project.name,
      theme,
      themeStyle: theme,
      features: project.features.map((name) => ({ name })),
      local: Boolean(project.local),
    });
    writer.write(themeEdit, themeFile(context));
  }
  setHtmlThemeStyle(writer, theme);
  writer.write(MARKER, json({ ...project, theme, themeStyle: undefined }));

  const result = writer.commit({ edits: ["package.json", themeEdit, "index.html", MARKER] });
  return {
    ...result,
    root,
    needsInstall,
    previous: project.theme === "none" ? project.themeStyle : project.theme,
    // With the shell it stays in the list of theme styles to pick from
    keptCustom: project.theme === "none" && !hasShell(project) ? CUSTOM_THEME_DIR : null,
  };
}

/**
 * `skein theme add <name…>`: more theme styles the user can switch to in the preferences drawer (admin shell
 * projects). Each is a separate CSS file, loaded only when picked; the default stays as it is.
 *
 * @param {{ themes: string[]; cwd?: string; dryRun?: boolean }} options
 */
export function addThemes({ themes, cwd = process.cwd(), dryRun }) {
  if (themes.length === 0) throw new Error(`theme add needs theme names: ${BUILT_IN.join(", ")}`);
  const ids = [...new Set(themes.map(builtIn))];
  const { root, project } = projectAt(cwd);
  if (!hasShell(project))
    throw new Error(
      "switching theme styles at runtime needs the preferences drawer of the admin shell (--template admin); use `skein theme use <name>` to change this app's theme style",
    );
  const writer = new Writer(root, { dryRun });
  const needsInstall = ensureThemesPackage(writer, project);
  const before = themeList(writer.read(SETTINGS));
  writer.write(
    SETTINGS,
    addToList(
      writer.read(SETTINGS),
      ids.map((id) => entryFor(id)),
    ),
  );
  const result = writer.commit({ edits: ["package.json", SETTINGS] });
  return {
    ...result,
    root,
    needsInstall,
    added: ids.filter((id) => !before.includes(id)),
    themeStyles: themeList(readFileSync(join(root, SETTINGS), "utf8")),
  };
}

/**
 * `skein theme remove <name…>`: takes theme styles out of the preferences drawer's choice. The default can't be
 * removed (`theme use` another first), and neither can the last one.
 *
 * @param {{ themes: string[]; cwd?: string; dryRun?: boolean }} options
 */
export function removeThemes({ themes, cwd = process.cwd(), dryRun }) {
  if (themes.length === 0) throw new Error("theme remove needs theme style names");
  const { root, project } = projectAt(cwd);
  if (!hasShell(project))
    throw new Error("only an admin shell project has a list of theme styles (settings.ts)");
  const writer = new Writer(root, { dryRun });
  let source = writer.read(SETTINGS);
  const current = source.match(/\bthemeStyle: "([^"]*)"/)?.[1];
  const ids = [...new Set(themes.map(normalize))];
  for (const id of ids) {
    if (!themeList(source).includes(id))
      throw new Error(`"${id}" is not in ${SETTINGS}: ${themeList(source).join(", ")}`);
    if (id === current)
      throw new Error(`"${id}" is the default theme style: \`skein theme use <another>\` first`);
    source = removeFromList(source, id);
  }
  writer.write(SETTINGS, source);
  const result = writer.commit({ edits: [SETTINGS] });
  return { ...result, root, removed: ids, themeStyles: themeList(source) };
}

/** The directory of a bundled theme style: installed in the project, else this checkout's. */
function themePackageDir(root, theme) {
  let dir;
  try {
    dir = dirname(
      createRequire(join(root, "package.json")).resolve(`${THEMES_PACKAGE}/package.json`),
    );
  } catch {
    dir = join(REPO_PACKAGES_DIR, "themes");
  }
  if (!existsSync(join(dir, theme, "index.css"))) {
    throw new Error(`${THEMES_PACKAGE} is not installed here: install it to start from ${theme}`);
  }
  return join(dir, theme);
}

/**
 * Points the project at its own theme style in src/theme/: skein.theme.ts, index.html and .skein.json.
 */
function useCustomTheme(root, name, { dryRun } = {}) {
  const project = readProject(root);
  const writer = new Writer(root, { dryRun });
  if (hasShell(project)) {
    // Added to the theme styles the user can pick, and made the default; the bundled ones stay in the list
    writer.write(
      SETTINGS,
      setDefault(addToList(writer.read(SETTINGS), [entryFor("none", name)]), name),
    );
    setHtmlThemeStyle(writer, name);
    writer.write(MARKER, json({ ...project, theme: "none", themeStyle: name }));
    return writer.commit({ edits: [SETTINGS, "index.html", MARKER] });
  }
  // @skeinui/themes stays: nothing of it is bundled any more, and `theme use` can switch back without an install
  const context = contextFor({
    packageName: project.name,
    theme: "none",
    themeStyle: name,
    features: project.features.map((f) => ({ name: f })),
    local: Boolean(project.local),
  });
  writer.write("src/skein.theme.ts", themeFile(context));
  setHtmlThemeStyle(writer, name);
  writer.write(MARKER, json({ ...project, theme: "none", themeStyle: name }));
  return writer.commit({ edits: ["src/skein.theme.ts", "index.html", MARKER] });
}

/**
 * `skein theme init|check`: the theme kit, run against `dir` (default src/theme of the project).
 * `init --from <theme>` starts from a copy of a bundled theme style (renamed to `name`, so it passes the
 * check from the first moment) instead of a blank one; `--use` also switches the project to it.
 *
 * @param {"init" | "check"} command
 * @param {{ dir?: string; name?: string; from?: string; use?: boolean; cwd?: string; dryRun?: boolean }} options
 */
export async function themeKit(command, { dir, name, from, use, cwd = process.cwd(), dryRun }) {
  const root = findProjectRoot(cwd) ?? cwd;
  const target = dir ? resolve(cwd, dir) : join(root, CUSTOM_THEME_DIR);
  if (command === "init") {
    if (!name) throw new Error("theme init needs --name <name>");
    if (!/^[a-z][a-z0-9-]*$/.test(name))
      throw new Error(`invalid theme style name "${name}": use lowercase letters, digits and "-"`);
    if (existsSync(target) && readdirSync(target).length > 0)
      throw new Error(`${target} is not empty`);
    let files;
    if (from) {
      if (!isTheme(from) || from === "none")
        throw new Error(
          `--from takes a bundled theme style: ${THEMES.filter((t) => t.id !== "none")
            .map((t) => t.id)
            .join(", ")}`,
        );
      const source = themePackageDir(root, from);
      files = readdirSync(source).filter((f) => f.endsWith(".css"));
      if (!dryRun) {
        mkdirSync(target, { recursive: true });
        for (const file of files) {
          const css = readFileSync(join(source, file), "utf8").replaceAll(
            `[data-skein-theme="${from}"]`,
            `[data-skein-theme="${name}"]`,
          );
          writeFileSync(join(target, file), css);
        }
      }
    } else {
      files = dryRun ? [] : initTheme(target, name);
    }
    let switched = null;
    if (use) {
      if (!findProjectRoot(cwd))
        throw new Error("--use needs a Skein project (no .skein.json found here or above)");
      if (relative(join(root, "src"), target) !== "theme")
        throw new Error(`--use expects the theme style in ${CUSTOM_THEME_DIR}/`);
      switched = useCustomTheme(root, name, { dryRun });
    }
    return { files, dir: target, from: from ?? null, switched };
  }
  return { issues: checkTheme(target, name), dir: target };
}
