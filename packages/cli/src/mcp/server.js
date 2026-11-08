import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CHECKS,
  LOGIN_LAYOUTS,
  addThemes,
  TEMPLATES,
  THEMES,
  VERSION,
  check,
  componentMarkdown,
  createProject,
  findComponent,
  loadFeatures,
  loadManifest,
  newModule,
  newPage,
  preview,
  rulesMarkdown,
  searchComponents,
  suggest,
  summary,
  themeKit,
  useTheme,
} from "../index.js";
import { isAbsolute, resolve } from "node:path";
import { z } from "zod";

const INSTRUCTIONS = `Skein UI tools. Skein components (@skeinui/ui) render structure and data-* attributes only; every visual comes from a theme style.
- Before using a component, call skein_docs with its name: props with allowed values, parts and examples. Don't guess props.
- Add pages with skein_new_page (route, menu entry, API file, translations, mock), never by hand.
- After every change call skein_check and fix what it reports until ok is true; its hints say how Skein wants it done.`;

const text = (value) => ({
  content: [
    { type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) },
  ],
});
const failure = (error) => ({
  isError: true,
  content: [{ type: "text", text: error.message ?? String(error) }],
});

/** Wraps a tool so a thrown error becomes an MCP tool error the agent can read. */
const safe = (fn) => async (args) => {
  try {
    return await fn(args);
  } catch (error) {
    return failure(error);
  }
};

/**
 * The Skein MCP server. Tools work in `cwd` (the project the client started the server in) unless a call
 * passes its own `cwd`.
 */
export function createServer({ cwd = process.cwd() } = {}) {
  const server = new McpServer({ name: "skein", version: VERSION }, { instructions: INSTRUCTIONS });
  const dirOf = (path) => (path ? (isAbsolute(path) ? path : resolve(cwd, path)) : cwd);
  const cwdArg = z
    .string()
    .optional()
    .describe("Project directory (default: where the server runs)");
  const write = {
    dryRun: z.boolean().optional().describe("Only list what would be written"),
    force: z.boolean().optional(),
  };

  server.registerTool(
    "skein_docs",
    {
      title: "Skein component docs",
      description:
        "Docs of @skeinui/ui. With `component`: its props (types, allowed values), compound parts, data-slot hooks and code examples. With `search`: components matching the words. With neither: the house rules and every component with a one-line summary.",
      inputSchema: {
        component: z.string().optional().describe("Component name, e.g. Button, DatePicker, Table"),
        search: z.string().optional().describe("Words to look for, e.g. 'date range', 'upload'"),
        examples: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("How many examples to include (default: all)"),
        cwd: cwdArg,
      },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ component, search, examples, cwd: dir }) => {
      const manifest = loadManifest(dirOf(dir));
      if (search) return text(searchComponents(manifest, search));
      if (!component) {
        const list = Object.entries(manifest.components)
          .map(([name, info]) => `- ${name}: ${summary(info.description)}`)
          .join("\n");
        return text(
          `# Skein UI ${manifest.version}\n\n## Rules\n\n${rulesMarkdown(manifest)}\n\n## Components\n\n${list}`,
        );
      }
      const found = findComponent(manifest, component);
      if (!found) {
        const close = suggest(manifest, component);
        throw new Error(
          `no component "${component}"${close.length ? `, did you mean: ${close.join(", ")}` : ""}`,
        );
      }
      return text(componentMarkdown(found, { examples: examples ?? Infinity }));
    }),
  );

  server.registerTool(
    "skein_check",
    {
      title: "Check the project",
      description: `Everything wrong with a Skein project: ${CHECKS.join(", ")}. Returns { ok, errors, warnings, issues: [{ check, severity, file, line, message, hint }] }. Call it after every change and fix until ok is true.`,
      inputSchema: {
        only: z.array(z.enum(CHECKS)).optional().describe("Run only these checks"),
        cwd: cwdArg,
      },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ only, cwd: dir }) => text(await check({ cwd: dirOf(dir), only }))),
  );

  server.registerTool(
    "skein_new_page",
    {
      title: "Add a page",
      description:
        "Adds src/pages/<path>/ (index.tsx, _meta.ts menu entry, api/, locales/, mocks/ — whichever the project has) and its route. Nested paths like system/roles make system a menu group. With `from` (an OpenAPI document) the page is a complete list / filter / create / edit / delete page with typed requests and mocks. Changes no existing file.",
      inputSchema: {
        path: z.string().describe("e.g. orders, system/roles"),
        from: z
          .string()
          .optional()
          .describe(
            "An OpenAPI 3 file (JSON / YAML): make a working CRUD page for one of its resources (admin projects)",
          ),
        resource: z
          .string()
          .optional()
          .describe(
            "With `from`: the collection path, e.g. /orders, when the page name doesn't match",
          ),
        ...write,
        cwd: cwdArg,
      },
    },
    safe(async ({ path, from, resource, dryRun, force, cwd: dir }) =>
      text(
        newPage({
          name: path,
          cwd: dirOf(dir),
          dryRun,
          force,
          from: from && resolve(dirOf(dir), from),
          resource,
        }),
      ),
    ),
  );

  server.registerTool(
    "skein_new_module",
    {
      title: "Add a module",
      description: "Adds src/modules/<name>/: a part that isn't a page (index.tsx, locales/).",
      inputSchema: { name: z.string(), ...write, cwd: cwdArg },
    },
    safe(async ({ name, dryRun, force, cwd: dir }) =>
      text(newModule({ name, cwd: dirOf(dir), dryRun, force })),
    ),
  );

  const themeIds = THEMES.map((t) => t.id);
  server.registerTool(
    "skein_theme_use",
    {
      title: "Switch the theme style",
      description: `Makes a theme style the app's: in admin projects the default of settings.ts's themeStyles (added if missing), otherwise the import of src/skein.theme.ts; index.html follows. Run the package manager's install if it says so. Themes: ${themeIds.filter((t) => t !== "none").join(", ")}.`,
      inputSchema: { theme: z.string(), dryRun: write.dryRun, cwd: cwdArg },
    },
    safe(async ({ theme, dryRun, cwd: dir }) => text(useTheme({ theme, cwd: dirOf(dir), dryRun }))),
  );

  server.registerTool(
    "skein_theme_add",
    {
      title: "Let users switch theme styles",
      description: `Admin projects: adds theme styles to settings.ts's themeStyles, the choice users get in the preferences drawer (each style is a separate CSS file, loaded only when picked). The default stays; skein_theme_use changes it. Themes: ${themeIds.filter((t) => t !== "none").join(", ")} (skein = default).`,
      inputSchema: { themes: z.array(z.string()), dryRun: write.dryRun, cwd: cwdArg },
    },
    safe(async ({ themes, dryRun, cwd: dir }) =>
      text(addThemes({ themes, cwd: dirOf(dir), dryRun })),
    ),
  );

  server.registerTool(
    "skein_theme_init",
    {
      title: "Start a theme style of the app's own",
      description:
        "Writes a theme style to src/theme/ named `name`: a renamed copy of a bundled theme style (`from`, passes skein_check at once — then adjust tokens.css / dark.css) or a blank one listing every required token and selector. With `use`, the app switches to it. For brand colors, radius, fonts, density or a whole new look.",
      inputSchema: {
        name: z.string().describe("data-skein-theme value, lowercase, e.g. acme"),
        from: z
          .enum(themeIds.filter((t) => t !== "none"))
          .optional()
          .describe("Start from this bundled theme style"),
        use: z.boolean().optional().describe("Switch the app to it (skein.theme.ts, index.html)"),
        dryRun: write.dryRun,
        cwd: cwdArg,
      },
    },
    safe(async ({ name, from, use, dryRun, cwd: dir }) =>
      text(await themeKit("init", { name, from, use, dryRun, cwd: dirOf(dir) })),
    ),
  );

  const features = loadFeatures().map((f) => f.name);
  server.registerTool(
    "skein_create_project",
    {
      title: "Create a project",
      description: `Creates a Skein project. Templates: ${Object.entries(TEMPLATES)
        .map(([id, t]) => `${id} (${t.label})`)
        .join(
          ", ",
        )}. Themes: ${themeIds.join(", ")} (none = a blank theme style to write). Features: ${features.join(", ")}.`,
      inputSchema: {
        dir: z.string().describe("Directory to create (must be empty or missing)"),
        template: z.enum(Object.keys(TEMPLATES)).optional(),
        theme: z.enum(themeIds).optional(),
        loginLayout: z
          .enum(LOGIN_LAYOUTS)
          .optional()
          .describe("The sign-in page of an admin app (default split)"),
        add: z.array(z.enum(features)).optional().describe("Extra features"),
        remove: z
          .array(z.enum(features))
          .optional()
          .describe("Features of the template to leave out, e.g. mock"),
        dryRun: write.dryRun,
      },
    },
    safe(async ({ dir, template, theme, loginLayout, add, remove, dryRun }) =>
      text(createProject({ dir: dirOf(dir), template, theme, loginLayout, add, remove, dryRun })),
    ),
  );

  server.registerTool(
    "skein_preview",
    {
      title: "Open a page in Chrome",
      description:
        "Starts the dev server (or uses `url`), opens `route` in the Chrome installed on this machine (signed in when the app has a login) and returns { ok, errors (exceptions, console errors), failedRequests, warnings, blank, headings, notes, screenshot }. Call it after changing a page and fix what it reports; read the screenshot file to check the layout. Needs the project's preview feature (playwright-core).",
      inputSchema: {
        route: z.string().optional().describe("e.g. /orders (default /)"),
        url: z
          .string()
          .optional()
          .describe("A dev server that is already running, e.g. http://localhost:5173"),
        login: z
          .boolean()
          .optional()
          .describe("Sign in first when the app has a login (default true)"),
        cwd: cwdArg,
      },
      annotations: { readOnlyHint: true },
    },
    safe(async ({ route, url, login, cwd: dir }) =>
      text(await preview({ route, url, login, cwd: dirOf(dir) })),
    ),
  );

  server.registerTool(
    "skein_list",
    {
      title: "Templates, features, themes",
      description: "What skein_create_project and skein_theme_use accept.",
      annotations: { readOnlyHint: true },
    },
    safe(async () =>
      text({
        templates: TEMPLATES,
        features: loadFeatures().map(({ name, description, requires }) => ({
          name,
          description,
          requires,
        })),
        themes: THEMES,
      }),
    ),
  );

  return server;
}
