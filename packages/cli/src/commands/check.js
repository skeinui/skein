import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { findProjectRoot, readProject, toPosix } from "../project.js";
import { checkTheme } from "../theme/index.js";

/**
 * `skein check`: one command that tells an agent (or a person) everything that is wrong with a Skein project,
 * as a list of issues with file, line and a hint on how Skein wants it done. Exits non-zero on errors.
 *
 * - typecheck: `tsc` (after `tsr generate` when the project has routes), with Skein-specific hints
 * - i18n: zh / en message files have the same keys, and every literal `t("key")` exists; warns about texts
 *   left untranslated (the English placeholders `new page` writes into zh.json and _meta.ts)
 * - style: no hard-coded colors in the project's CSS or inline styles (use var(--ui-*))
 * - theme: a theme style written in the project (src/theme/) covers the @skeinui/ui contract
 */
export const CHECKS = ["typecheck", "i18n", "style", "theme"];

/** @typedef {{ check: string; severity: "error" | "warning"; file?: string; line?: number; message: string; hint?: string }} Issue */

const HINTS = [
  [
    /Property '(className|style)' does not exist/,
    "Skein components take no className / style: visuals come from the theme style. Lay out with Flex / Grid, or wrap the component in your own element.",
  ],
  [
    /Type '"[^"]*"' is not assignable to type '"/,
    "A variant / color / size value that doesn't exist: `skein docs <Component>` lists the allowed values.",
  ],
  [
    /has no exported member named '(\w+)'.*@skeinui\/ui|Module '"@skeinui\/ui"' has no exported member '(\w+)'/,
    "Not a Skein component: `skein docs --search <word>` finds the right one.",
  ],
];

/** Files under `dir` that pass `filter`, in code-unit order on every system (Windows lists `audit-logs` before `_meta.ts`). */
function walk(dir, filter) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .flatMap((entry) => {
      const file = join(dir, entry);
      if (entry === "node_modules" || entry.startsWith(".")) return [];
      return statSync(file).isDirectory() ? walk(file, filter) : filter(file) ? [file] : [];
    });
}

/** A package's command from node_modules/.bin, looking up from `root` (packages' `exports` hide their bin files). */
function bin(root, name) {
  const file = process.platform === "win32" ? `${name}.cmd` : name;
  for (let dir = root; ; dir = dirname(dir)) {
    const candidate = join(dir, "node_modules", ".bin", file);
    if (existsSync(candidate)) return candidate;
    if (dirname(dir) === dir) return null;
  }
}

const run = (command, args, cwd) =>
  execFileSync(command, args, {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
    shell: process.platform === "win32",
  });

function typecheck(root, project) {
  const tsc = bin(root, "tsc");
  if (!tsc) {
    return [
      {
        check: "typecheck",
        severity: "error",
        message: "typescript is not installed: run npm install",
      },
    ];
  }
  if (project.features?.includes("router")) {
    // routeTree.gen.ts must match src/routes/ before tsc can check the routes
    try {
      const tsr = bin(root, "tsr");
      if (!tsr) throw new Error("@tanstack/router-cli is not installed: run npm install");
      run(tsr, ["generate"], root);
    } catch (error) {
      return [
        {
          check: "typecheck",
          severity: "error",
          message: `tsr generate failed: ${String(error.stderr ?? error.message).trim()}`,
        },
      ];
    }
  }
  let output = "";
  try {
    run(tsc, ["--noEmit", "--pretty", "false"], root);
  } catch (error) {
    output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }
  const issues = [];
  for (const line of output.split("\n")) {
    const m = line.match(/^(.+?)\((\d+),\d+\): error (TS\d+): (.*)$/);
    if (m) {
      issues.push({
        check: "typecheck",
        severity: "error",
        file: m[1],
        line: Number(m[2]),
        message: `${m[3]}: ${m[4]}`,
      });
    } else if (line.startsWith(" ") && issues.length > 0) {
      issues[issues.length - 1].message += `\n${line}`;
    }
  }
  for (const issue of issues) {
    const hint = HINTS.find(([re]) => re.test(issue.message))?.[1];
    if (hint) issue.hint = hint;
  }
  return issues;
}

const flatten = (obj, prefix = "") =>
  Object.entries(obj ?? {}).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

/** Values by flattened key. */
const values = (obj, prefix = "") =>
  Object.entries(obj ?? {}).flatMap(([k, v]) =>
    v && typeof v === "object" ? values(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]],
  );

/**
 * A Chinese text that is still the English one: words in Latin letters, the same as en. Abbreviations that read
 * the same in both (SKU, ID, URL) don't count.
 */
const untranslated = (zh, en) =>
  typeof zh === "string" &&
  zh === en &&
  /[A-Za-z]{2,}/.test(zh) &&
  !/[\u4e00-\u9fff]/.test(zh) &&
  !/^[A-Z0-9]{1,5}$/.test(zh);

const TRANSLATE_HINT =
  "skein new page writes the English name as a placeholder for both languages (the CLI can't translate): write the Chinese text.";

function i18n(root) {
  const issues = [];
  const messageDirs = walk(join(root, "src"), (f) =>
    toPosix(f).endsWith("locales/messages/zh.json"),
  ).map(dirname);
  for (const dir of messageDirs) {
    const load = (lng) => {
      const file = join(dir, `${lng}.json`);
      return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
    };
    const zh = load("zh");
    const en = load("en");
    const rel = relative(root, dir);
    if (!en) {
      issues.push({
        check: "i18n",
        severity: "error",
        file: `${rel}/en.json`,
        message: "en.json is missing",
      });
      continue;
    }
    const zhKeys = new Set(flatten(zh));
    const enKeys = new Set(flatten(en));
    for (const key of zhKeys) {
      if (!enKeys.has(key))
        issues.push({
          check: "i18n",
          severity: "error",
          file: `${rel}/en.json`,
          message: `missing key "${key}" (it is in zh.json)`,
        });
    }
    for (const key of enKeys) {
      if (!zhKeys.has(key))
        issues.push({
          check: "i18n",
          severity: "error",
          file: `${rel}/zh.json`,
          message: `missing key "${key}" (it is in en.json)`,
        });
    }
    const enValues = new Map(values(en));
    const left = values(zh)
      .filter(([key, text]) => untranslated(text, enValues.get(key)))
      .map(([key]) => key);
    if (left.length > 0)
      issues.push({
        check: "i18n",
        severity: "warning",
        file: `${rel}/zh.json`,
        message: `not translated (the same as en.json): ${left
          .slice(0, 8)
          .map((k) => `"${k}"`)
          .join(", ")}${left.length > 8 ? ` and ${left.length - 8} more` : ""}`,
        hint: TRANSLATE_HINT,
      });
    // Literal keys used by the page / module these messages belong to (locales/messages → its owner)
    const owner = dirname(dirname(dir));
    const sources = walk(
      owner,
      (f) => /\.tsx?$/.test(f) && !toPosix(f).includes(`${toPosix(owner)}/locales/`),
    );
    for (const file of sources) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((text, i) => {
          for (const m of text.matchAll(/\bt\(\s*["']([\w.-]+)["']/g)) {
            const key = m[1];
            const isPrefix = [...zhKeys].some((k) => k.startsWith(`${key}.`));
            if (!zhKeys.has(key) && !isPrefix) {
              issues.push({
                check: "i18n",
                severity: "error",
                file: relative(root, file),
                line: i + 1,
                message: `t("${key}") has no message in ${toPosix(relative(root, dir))}/`,
                hint: "Add the key to both zh.json and en.json of this page's locales/messages/.",
              });
            }
          }
        });
    }
  }
  // Menu labels (_meta.ts): label: { zh: "Orders", en: "Orders" }
  for (const file of walk(join(root, "src", "pages"), (f) => basename(f) === "_meta.ts")) {
    const text = readFileSync(file, "utf8");
    const m = text.match(/label:\s*\{\s*zh:\s*"([^"]*)",\s*en:\s*"([^"]*)"/);
    if (m && untranslated(m[1], m[2]))
      issues.push({
        check: "i18n",
        severity: "warning",
        file: relative(root, file),
        line: text.slice(0, m.index).split("\n").length,
        message: `menu label not translated: zh is "${m[1]}", the same as en`,
        hint: TRANSLATE_HINT,
      });
  }
  return issues;
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

function style(root) {
  const issues = [];
  const own = (f) => !toPosix(f).includes(`${toPosix(join(root, "src", "theme"))}/`);
  for (const file of walk(join(root, "src"), (f) => f.endsWith(".css") && own(f))) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((text, i) => {
        if (text.trim().startsWith("/*") || text.trim().startsWith("*")) return;
        for (const m of text.match(HEX) ?? []) {
          issues.push({
            check: "style",
            severity: "warning",
            file: relative(root, file),
            line: i + 1,
            message: `hard-coded color ${m}`,
            hint: "Use a token such as var(--ui-c-primary) or var(--ui-fg) so it follows the theme style and dark mode.",
          });
        }
      });
  }
  for (const file of walk(join(root, "src"), (f) => f.endsWith(".tsx"))) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((text, i) => {
        if (!/style=\{\{/.test(text)) return;
        for (const m of text.match(HEX) ?? []) {
          issues.push({
            check: "style",
            severity: "warning",
            file: relative(root, file),
            line: i + 1,
            message: `hard-coded color ${m} in an inline style`,
            hint: "Use a token such as var(--ui-c-primary) so it follows the theme style and dark mode.",
          });
        }
      });
  }
  return issues;
}

async function theme(root) {
  const dir = join(root, "src", "theme");
  const tokens = join(dir, "tokens.css");
  if (!existsSync(tokens)) return [];
  const name = readFileSync(tokens, "utf8").match(/\[data-skein-theme="([^"]+)"\]/)?.[1];
  if (!name)
    return [
      {
        check: "theme",
        severity: "error",
        file: "src/theme/tokens.css",
        message: /\[data-theme-style=/.test(readFileSync(tokens, "utf8"))
          ? "selectors use the attributes before 0.0.4: rename data-theme-style → data-skein-theme, data-mode → data-skein-mode, data-theme-color → data-skein-color, data-theme-density → data-skein-density"
          : 'no [data-skein-theme="…"] selector',
      },
    ];
  return checkTheme(dir, name).map((issue) => ({
    check: "theme",
    severity: "error",
    file: `src/theme/${issue.file}`,
    message: `[${issue.rule}] ${issue.message}`,
  }));
}

/**
 * @param {{ cwd?: string; only?: string[] }} options
 * @returns {Promise<{ root: string; ok: boolean; errors: number; warnings: number; issues: Issue[]; ran: string[] }>}
 */
export async function check({ cwd = process.cwd(), only } = {}) {
  const root = findProjectRoot(cwd);
  if (!root) throw new Error("not inside a Skein project (no .skein.json found here or above)");
  const project = readProject(root);
  const ran = only?.length ? CHECKS.filter((c) => only.includes(c)) : CHECKS;
  const issues = [];
  if (ran.includes("typecheck")) issues.push(...typecheck(root, project));
  if (ran.includes("i18n")) issues.push(...i18n(root));
  if (ran.includes("style")) issues.push(...style(root));
  if (ran.includes("theme")) issues.push(...(await theme(root)));
  // Paths with `/` on every platform, as --json and MCP report them
  for (const issue of issues) if (issue.file) issue.file = toPosix(issue.file);
  const errors = issues.filter((i) => i.severity === "error").length;
  return { root, ok: errors === 0, errors, warnings: issues.length - errors, issues, ran };
}
