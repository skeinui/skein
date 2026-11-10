import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { check } from "./commands/check.js";
import {
  DEFAULT_LOGIN_LAYOUT,
  LOGIN_LAYOUTS,
  createProject,
  isEmptyDir,
} from "./commands/create.js";
import { init } from "./commands/init.js";
import { newModule, newPage } from "./commands/new.js";
import { preview } from "./commands/preview.js";
import { addThemes, removeThemes, themeKit, useTheme } from "./commands/theme.js";
import {
  componentMarkdown,
  findComponent,
  loadManifest,
  rulesMarkdown,
  searchComponents,
  suggest,
  summary,
} from "./docs.js";
import { DEFAULT_TEMPLATE, TEMPLATES, loadFeatures } from "./features.js";
import { VERSION } from "./paths.js";
import { Cancelled, interactive, session } from "./prompt.js";
import { DEFAULT_THEME, THEMES } from "./themes.js";
import { report } from "./writer.js";

const FEATURES = loadFeatures();

const USAGE = `skein ${VERSION}

Usage:
  skein create [dir] [options]       create a project (npm create skein runs this)
  skein init                         write .skein.json for a project that lacks one (deleted, or not made
                                     by skein create): its features are detected from the files
  skein new page <path>              add a page: src/pages/<path>/ and its route (e.g. orders, system/users)
  skein new page <path> --from <openapi.yaml> [--resource /orders]
                                     a working CRUD page for one resource of an OpenAPI 3 document
  skein new module <name>            add a module: src/modules/<name>/
  skein docs [component]             component docs: props, parts, examples (no name: the list)
  skein docs --search <words>        find components
  skein check [--only typecheck,i18n,style,theme,pages]
                                     everything wrong with the project, with hints
  skein theme use <name>             make a theme style the app's (admin: the default of settings.ts)
  skein theme add <name…>            admin: more theme styles users can switch to in the preferences
                                     drawer, e.g. theme add antd heroui skein (each loaded only when picked)
  skein theme remove <name…>         admin: take theme styles out of that choice
  skein theme init [dir] --name <n> [--from <theme>] [--use]
                                     a theme style of the app's own (default dir: src/theme): blank, or a
                                     renamed copy of a bundled one to adjust; --use switches the app to it
  skein theme check [dir]            check a theme style against the @skeinui/ui contract
  skein list                         templates, features and theme styles
  skein preview [route] [--url <dev server>] [--no-login] [--out <png>]
                                     open a page in Chrome: exceptions, console errors, failed requests,
                                     blank page, and a screenshot (needs the preview feature: --preview)
  skein mcp                          the commands above as MCP tools over stdio (.mcp.json starts it;
                                     needs the project's mcp feature: create with --mcp)

create options:
  --template <name>   ${Object.keys(TEMPLATES).join(" | ")} (default: ${DEFAULT_TEMPLATE})
  --theme <name>      ${THEMES.map((t) => t.id).join(" | ")} (default: ${DEFAULT_THEME})
  --login-layout <name>  the sign-in page of an admin app: ${LOGIN_LAYOUTS.join(" | ")} (default: ${DEFAULT_LOGIN_LAYOUT})
  --<feature>         add a feature: ${FEATURES.map((f) => f.name).join(", ")}
  --no-<feature>      leave out a feature of the template (e.g. --no-mock)
  --local             use the @skeinui/* packages of this checkout (for developing Skein itself)

  --force             overwrite files that already exist
  --dry-run           only list what would be written
  --json              machine-readable output on stdout (for agents and scripts); never prompts`;

function parse(argv) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    allowNegative: true,
    options: {
      template: { type: "string", short: "t" },
      theme: { type: "string" },
      "login-layout": { type: "string" },
      name: { type: "string" },
      search: { type: "string" },
      from: { type: "string" },
      resource: { type: "string" },
      only: { type: "string" },
      local: { type: "boolean" },
      use: { type: "boolean" },
      url: { type: "string" },
      out: { type: "string" },
      login: { type: "boolean" },
      force: { type: "boolean" },
      "dry-run": { type: "boolean" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
      ...Object.fromEntries(FEATURES.map((f) => [f.name, { type: "boolean" }])),
    },
  });
}

const packageManager = () => {
  const agent = process.env.npm_config_user_agent?.split("/")[0] ?? "npm";
  return ["pnpm", "yarn", "bun"].includes(agent) ? agent : "npm";
};
/** Whether `dir` is in a git repository (a .git here or above). */
const insideGit = (dir) => {
  for (let up = resolve(dir); ; up = dirname(up)) {
    if (existsSync(join(up, ".git"))) return true;
    if (dirname(up) === up) return false;
  }
};
const runScript = (pm, script) => (pm === "npm" ? `npm run ${script}` : `${pm} ${script}`);

/**
 * Every command returns `{ data, print, failed? }`: `data` is what `--json` prints, `print` the human
 * output. `failed` sets a non-zero exit code without being an error (e.g. check found problems).
 */

async function create(values, [dirArg]) {
  let dir = dirArg;
  let { template, theme } = values;
  const add = FEATURES.filter((f) => values[f.name] === true).map((f) => f.name);
  const remove = FEATURES.filter((f) => values[f.name] === false).map((f) => f.name);

  // Only `skein create` with no directory is interactive; everything not asked takes its default
  if (!dir && interactive() && !values.json) {
    const ask = session();
    try {
      dir = await ask.text("Project name", "skein-app");
      if (!isEmptyDir(dir)) throw new Error(`${dir} already exists and is not empty`);
      template ??= await ask.select(
        "Template",
        Object.entries(TEMPLATES).map(([id, t]) => ({ id, label: t.label })),
      );
      theme ??= await ask.select("Theme style", THEMES);
      if (TEMPLATES[template]?.features.includes("mock") && values.mock === undefined) {
        if (!(await ask.confirm("Mock the API with MSW?"))) remove.push("mock");
      }
      if (values.mcp === undefined) {
        if (await ask.confirm("Add an MCP server for AI agents (skein mcp, .mcp.json)?", false))
          add.push("mcp");
      }
      if (values.preview === undefined) {
        if (
          await ask.confirm(
            "Let AI agents open pages in Chrome to check them (skein preview)?",
            false,
          )
        )
          add.push("preview");
      }
    } finally {
      ask.close();
    }
  }
  dir ??= "skein-app";
  const dryRun = values["dry-run"];
  const project = createProject({
    dir,
    name: values.name,
    template,
    theme,
    loginLayout: values["login-layout"],
    add,
    remove,
    local: values.local,
    force: values.force,
    dryRun,
  });
  template ??= DEFAULT_TEMPLATE;
  theme ??= DEFAULT_THEME;

  const pm = packageManager();
  return {
    data: { ...project, template, theme, dryRun: Boolean(dryRun) },
    print() {
      console.log(
        `\n  ${dryRun ? "Would create" : "Created"} ${project.packageName} in ${project.relativeRoot}` +
          ` (template: ${template}, theme style: ${theme})`,
      );
      console.log(`  features: ${project.features.join(", ") || "none"}\n`);
      if (dryRun) return report(project, { dryRun });
      console.log("  Next:");
      if (project.relativeRoot !== ".") console.log(`    cd ${project.relativeRoot}`);
      // Before the install: its prepare script (vp config) sets up the git hook only in a repository
      if (!insideGit(project.root)) console.log("    git init");
      console.log(`    ${pm} install`);
      console.log(`    ${runScript(pm, "dev")}`);
      if (project.features.includes("auth")) {
        console.log(
          `\n  Sign in with admin / admin123${project.features.includes("mock") ? " (mocked)" : ""}.`,
        );
      }
      if (theme === "none") {
        console.log(
          `\n  Your theme style "${project.themeStyle}" is in src/theme/: fill in the tokens and`,
        );
        console.log(
          `  component rules, then ${runScript(pm, "check")} lists what is still missing.`,
        );
      }
      console.log("");
    },
  };
}

const written = (result, dryRun, hint) => ({
  data: { ...result, dryRun: Boolean(dryRun), ...(hint ? { hint } : {}) },
  print() {
    report(result, { dryRun });
    if (hint && !dryRun) console.log(`\n  ${hint}`);
    console.log("");
  },
});

/** The files `new page` / `new module` wrote with English placeholders for the Chinese texts. */
const translateNote = (result) =>
  result.translate.length > 0
    ? `\n  Its texts are English placeholders in both languages (the CLI can't translate): write the Chinese in\n${result.translate.map((f) => `    ${f}`).join("\n")}\n  npm run check lists what is still untranslated.`
    : "";

function newCommand(values, [kind, name]) {
  if (!name || (kind !== "page" && kind !== "module"))
    throw new Error("use: new page <path> | new module <name>");
  const dryRun = values["dry-run"];
  if (kind === "page") {
    const result = newPage({
      name,
      force: values.force,
      dryRun,
      from: values.from,
      resource: values.resource,
    });
    return written(
      result,
      dryRun,
      `${result.path} is in the menu and the router (restart dev if it is not running).${translateNote(result)}`,
    );
  }
  const result = newModule({ name, force: values.force, dryRun });
  return written(
    result,
    dryRun,
    `Use it with: import { ${result.Name} } from "@/modules/${result.name}";${translateNote(result)}`,
  );
}

function docs(values, [name]) {
  const manifest = loadManifest();
  if (values.search) {
    const found = searchComponents(manifest, values.search);
    return {
      data: { query: values.search, components: found },
      print() {
        if (found.length === 0) console.log(`No component matches "${values.search}".`);
        for (const c of found) console.log(`  ${c.name.padEnd(20)} ${c.summary}`);
      },
    };
  }
  if (!name) {
    const components = Object.entries(manifest.components).map(([n, info]) => ({
      name: n,
      summary: summary(info.description),
    }));
    return {
      data: { version: manifest.version, rules: manifest.rules, components },
      print() {
        console.log(
          `@skeinui/ui ${manifest.version}\n\nRules:\n${rulesMarkdown(manifest)}\n\nComponents:`,
        );
        for (const c of components) console.log(`  ${c.name.padEnd(20)} ${c.summary}`);
        console.log("\n  skein docs <component> for props, parts and examples.");
      },
    };
  }
  const component = findComponent(manifest, name);
  if (!component) {
    const close = suggest(manifest, name);
    throw new Error(
      `no component "${name}"${close.length ? `, did you mean: ${close.slice(0, 5).join(", ")}` : ""}`,
    );
  }
  return { data: component, print: () => console.log(componentMarkdown(component)) };
}

async function checkCommand(values) {
  const only = values.only?.split(",").map((s) => s.trim());
  const result = await check({ only });
  return {
    data: result,
    failed: !result.ok,
    print() {
      for (const issue of result.issues) {
        const where = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ""}` : "";
        const mark = issue.severity === "error" ? "✗" : "!";
        console.log(
          `${mark} [${issue.check}] ${where}\n    ${issue.message.replace(/\n/g, "\n    ")}`,
        );
        if (issue.hint) console.log(`    → ${issue.hint}`);
      }
      const summaryLine = `${result.errors} errors, ${result.warnings} warnings (${result.ran.join(", ")})`;
      console.log(
        result.issues.length > 0 ? `\n${summaryLine}` : `✓ no problems (${result.ran.join(", ")})`,
      );
    },
  };
}

/** What theme use / add did about the skeinThemes() Vite plugin when they added @skeinui/themes. */
const pluginHint = (plugin) =>
  !plugin
    ? ""
    : plugin.added
      ? ` ${plugin.file} now uses skeinThemes(): only the stylesheets of the components you import are bundled.`
      : ` To bundle only the stylesheets of the components you import, add skeinThemes() from @skeinui/themes/vite to the plugins of ${plugin.file}.`;

async function themeCommand(values, [sub, arg, ...more]) {
  if (sub === "add" || sub === "remove") {
    const themes = [arg, ...more].filter(Boolean);
    const dryRun = values["dry-run"];
    if (sub === "add") {
      const result = addThemes({ themes, dryRun });
      const hint =
        (result.added.length
          ? `Added ${result.added.join(", ")}.`
          : "Already in the list, nothing to add.") +
        ` Users pick from: ${result.themeStyles.join(", ")} (preferences drawer).` +
        (result.needsInstall ? ` Run ${packageManager()} install.` : "") +
        pluginHint(result.plugin);
      return written(result, dryRun, hint);
    }
    const result = removeThemes({ themes, dryRun });
    return written(result, dryRun, `Users pick from: ${result.themeStyles.join(", ")}.`);
  }
  if (sub === "use") {
    if (!arg) throw new Error("theme use needs a theme style name");
    const result = useTheme({ theme: arg, dryRun: values["dry-run"] });
    const hint =
      `Theme style: ${result.previous} → ${arg}.` +
      (result.needsInstall ? ` Run ${packageManager()} install.` : "") +
      pluginHint(result.plugin) +
      (result.keptCustom
        ? ` Your own theme style in ${result.keptCustom}/ is kept but no longer imported.`
        : "");
    return written(result, values["dry-run"], hint);
  }
  if (sub === "init") {
    const result = await themeKit("init", {
      dir: arg,
      name: values.name,
      from: values.from,
      use: values.use,
      dryRun: values["dry-run"],
    });
    return {
      data: result,
      print() {
        const where = relative(process.cwd(), result.dir) || result.dir;
        console.log(
          `  ${values["dry-run"] ? "Would write" : "Wrote"} ${result.files.length} files to ${where}` +
            (result.from ? ` (a copy of ${result.from}, renamed to ${values.name}).` : " (blank)."),
        );
        if (result.switched) report(result.switched, { dryRun: values["dry-run"] });
        console.log(
          result.switched
            ? `\n  The app now uses it. Change the tokens in ${where}/tokens.css and dark.css, then run the check.`
            : `\n  Point src/skein.theme.ts at it (or rerun with --use), then run the check.`,
        );
      },
    };
  }
  if (sub === "check") {
    const dir = arg ?? "src/theme";
    let name = values.name;
    const tokens = join(dir, "tokens.css");
    if (!name && existsSync(tokens)) {
      name = readFileSync(tokens, "utf8").match(/\[data-skein-theme="([^"]+)"\]/)?.[1];
    }
    if (!name)
      throw new Error("could not read the theme style name from tokens.css, pass --name <name>");
    const { issues } = await themeKit("check", { dir: arg, name });
    return {
      data: { name, ok: issues.length === 0, issues },
      failed: issues.length > 0,
      print() {
        for (const issue of issues) console.log(`${issue.file}  [${issue.rule}]  ${issue.message}`);
        if (issues.length > 0) {
          console.log(
            `\n${issues.length} problems in ${new Set(issues.map((i) => i.file)).size} files`,
          );
        } else {
          console.log(`${name}: covers the whole contract`);
        }
      },
    };
  }
  throw new Error(
    `unknown command "theme ${sub ?? ""}", use: theme use | add | remove | init | check`,
  );
}

function list() {
  const templates = Object.entries(TEMPLATES).map(([id, t]) => ({ id, ...t }));
  const features = FEATURES.map(({ name, description, requires }) => ({
    name,
    description,
    requires,
  }));
  return {
    data: { templates, features, themes: THEMES },
    print() {
      console.log("Templates:");
      for (const t of templates) console.log(`  ${t.id.padEnd(10)} ${t.label}`);
      console.log("\nFeatures:");
      for (const f of features) {
        const requires = f.requires.length > 0 ? `  (requires ${f.requires.join(", ")})` : "";
        console.log(`  ${f.name.padEnd(10)} ${f.description}${requires}`);
      }
      console.log("\nTheme styles:");
      for (const t of THEMES) console.log(`  ${t.id.padEnd(10)} ${t.label}`);
    },
  };
}

const MCP_PACKAGES = ["@modelcontextprotocol/sdk", "zod"];

/**
 * `skein mcp`: serves until the client closes stdin. The MCP SDK is an optional peer, installed by the
 * project's mcp feature, and only loaded here so the other commands (and `npm create skein`) don't need it.
 */
async function mcp() {
  let modules;
  try {
    modules = await Promise.all([
      import("./mcp/server.js"),
      import("@modelcontextprotocol/sdk/server/stdio.js"),
    ]);
  } catch (error) {
    if (
      error.code !== "ERR_MODULE_NOT_FOUND" ||
      !MCP_PACKAGES.some((p) => error.message.includes(p))
    )
      throw error;
    throw new Error(
      `skein mcp needs ${MCP_PACKAGES.join(" and ")}. Create the project with --mcp, or add them:\n` +
        `    npm install -D ${MCP_PACKAGES.join(" ")}\n` +
        `  and a .mcp.json: { "mcpServers": { "skein": { "command": "npx", "args": ["skein", "mcp"] } } }`,
    );
  }
  const [{ createServer }, { StdioServerTransport }] = modules;
  // Tools work in the directory the client starts the server in (the project's .mcp.json)
  await createServer().connect(new StdioServerTransport());
}

async function previewCommand(values, [route]) {
  const result = await preview({ route, url: values.url, login: values.login, out: values.out });
  return {
    data: result,
    failed: !result.ok,
    print() {
      console.log(`${result.ok ? "✓" : "✗"} ${result.route}  ${result.url}`);
      if (result.headings.length) console.log(`  headings: ${result.headings.join(" · ")}`);
      if (result.blank) console.log("  ✗ the page is blank (nothing rendered)");
      for (const e of result.errors) console.log(`  ✗ [${e.type}] ${e.message.split("\n")[0]}`);
      for (const r of result.failedRequests)
        console.log(
          `  ✗ [request] ${r.method} ${r.url} → ${[r.status, r.error].filter(Boolean).join(": ")}`,
        );
      for (const w of result.warnings) console.log(`  ! [warning] ${w.split("\n")[0]}`);
      for (const n of result.notes) console.log(`  ! ${n}`);
      console.log(`  screenshot: ${result.screenshot}`);
    },
  };
}

function initCommand(values) {
  const result = init({ force: values.force, dryRun: values["dry-run"] });
  return {
    data: result,
    print() {
      const { project } = result;
      console.log(
        `\n  ${result.written ? "Wrote" : "Would write"} ${result.file}: template ${project.template}, theme style ${project.themeStyle ?? project.theme}`,
      );
      for (const [what, evidence] of Object.entries(result.evidence))
        console.log(`  ✓ ${what.padEnd(8)} ${[evidence].flat().join(", ")}`);
      if (result.notFound.length) console.log(`  · not found: ${result.notFound.join(", ")}`);
      for (const w of result.warnings) console.log(`  ! ${w}`);
      console.log(
        "\n  Features are detected from the files the skein commands rely on; edit features in .skein.json if one is wrong.\n",
      );
    },
  };
}

const COMMANDS = {
  create,
  init: initCommand,
  preview: previewCommand,
  new: newCommand,
  docs,
  check: checkCommand,
  theme: themeCommand,
  list,
};

/** Runs the CLI with `argv` (without node and the script). */
export async function run(argv) {
  let json = argv.includes("--json");
  try {
    const { values, positionals } = parse(argv);
    json = Boolean(values.json);
    const [command, ...rest] = positionals;
    if (values.version) return console.log(json ? JSON.stringify({ version: VERSION }) : VERSION);
    if (values.help || !command) return console.log(USAGE);
    // stdout carries the MCP protocol: nothing else may be printed to it
    if (command === "mcp") return await mcp();
    const handler = COMMANDS[command];
    if (!handler) throw new Error(`unknown command "${command}"\n\n${USAGE}`);
    const result = await handler(values, rest);
    if (json) console.log(JSON.stringify({ ok: !result.failed, command, ...result.data }, null, 2));
    else result.print();
    if (result.failed) process.exitCode = 1;
  } catch (error) {
    if (json) console.log(JSON.stringify({ ok: false, error: error.message }));
    else console.error(`\n  ${error instanceof Cancelled ? error.message : error.message}\n`);
    process.exitCode = 1;
  }
}
