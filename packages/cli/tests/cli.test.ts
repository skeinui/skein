import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { checkTheme, coverageFor, loadContract } from "../src/theme/index.js";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { createProject, featuresFor } from "../src/commands/create.js";
import { newModule, newPage } from "../src/commands/new.js";
import { init } from "../src/commands/init.js";
import { addThemes, removeThemes, themeKit, useTheme } from "../src/commands/theme.js";
import { render } from "../src/engine.js";
import { loadFeatures, resolveFeatures } from "../src/features.js";
import { pagePath, pascal, toPackageName, toThemeStyleName } from "../src/names.js";
import { packageJson } from "../src/project.js";
import { parse as parseYaml } from "yaml";
import { THEMES } from "../src/themes.js";

let tmp: string | undefined;
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = undefined;
});
const target = (name = "my-app") => join((tmp = mkdtempSync(join(tmpdir(), "skein-cli-"))), name);
const read = (...parts: string[]) => readFileSync(join(...parts), "utf8");
const pkgOf = (dir: string) => JSON.parse(read(dir, "package.json"));
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((e) =>
    statSync(join(dir, e)).isDirectory() ? walk(join(dir, e)) : [join(dir, e)],
  );
/** Template tags left in generated files (i18next's `{{user}}`, JSX's `{{ a: 1 }}` are not tags). */
const leftovers = (root: string) =>
  walk(root)
    .filter((f) => !f.includes("mockServiceWorker"))
    .flatMap((f) =>
      (
        read(f).match(
          /\{\{(#if \w+|else|\/if|name|Name|title|themeStyle|themeImport|storageKey)\}\}/g,
        ) ?? []
      ).map((m) => `${relative(root, f)}: ${m}`),
    );

const PACKAGES_DIR = join(import.meta.dirname, "..", "..");
const COVERAGE = coverageFor(loadContract());

describe("template engine", () => {
  test("variables and conditional blocks, nestable, with else", () => {
    const text = "a {{name}} {{#if x}}X{{#if y}}Y{{else}}-y{{/if}}{{else}}-x{{/if}} z";
    expect(render(text, { flags: { x: true }, vars: { name: "N" } })).toBe("a N X-y z");
    expect(render(text, { flags: { x: true, y: true }, vars: { name: "N" } })).toBe("a N XY z");
    expect(render(text, { vars: { name: "N" } })).toBe("a N -x z");
  });

  test("tags on their own line are removed with the newline, leaving no blank line", () => {
    const text = "one\n  {{#if x}}\ntwo\n  {{/if}}\nthree\n";
    expect(render(text, { flags: { x: true } })).toBe("one\ntwo\nthree\n");
    expect(render(text)).toBe("one\nthree\n");
  });

  test("JSX double braces, i18next interpolation and unknown variables are kept as is", () => {
    const text = 'style={{ width: 1 }} t("x", { a: 1 }) "{{user}}" {{name}}';
    expect(render(text, { vars: { name: "n" } })).toBe(
      'style={{ width: 1 }} t("x", { a: 1 }) "{{user}}" n',
    );
  });

  test("unclosed / extra tags throw", () => {
    expect(() => render("{{#if x}}a")).toThrow("not closed");
    expect(() => render("a{{/if}}")).toThrow("without");
    expect(() => render("a{{else}}")).toThrow("without");
  });
});

describe("features", () => {
  test("resolved and sorted by requires: dependencies first", () => {
    const names = resolveFeatures(["shell"]).map((f) => f.name);
    expect(new Set(names)).toEqual(new Set(["router", "query", "i18n", "auth", "shell"]));
    expect(names.indexOf("router")).toBeLessThan(names.indexOf("auth"));
    expect(names.indexOf("auth")).toBeLessThan(names.indexOf("shell"));
  });

  test("admin has mock by default, --no-mock removes it; required features can't be removed", () => {
    expect(featuresFor({ template: "admin" }).map((f) => f.name)).toContain("mock");
    expect(featuresFor({ template: "admin", remove: ["mock"] }).map((f) => f.name)).not.toContain(
      "mock",
    );
    expect(() => featuresFor({ template: "admin", remove: ["router"] })).toThrow(
      'requires "router"',
    );
    expect(() => featuresFor({ template: "nope" })).toThrow('unknown template "nope"');
    expect(() => resolveFeatures(["nope"])).toThrow('unknown feature "nope"');
  });

  test("every requires declared in feature.json exists", () => {
    const all = loadFeatures();
    const names = new Set(all.map((f) => f.name));
    for (const f of all)
      for (const r of f.requires) expect(names.has(r), `${f.name} → ${r}`).toBe(true);
  });
});

describe("create", () => {
  test("basic: default theme style, only base files, no router", () => {
    const dir = target();
    createProject({ dir });
    const pkg = pkgOf(dir);
    expect(Object.keys(pkg.dependencies)).toEqual([
      "@skeinui/themes",
      "@skeinui/ui",
      "react",
      "react-dom",
    ]);
    expect(read(dir, "src", "skein.theme.ts")).toContain(
      'import "@skeinui/themes/default/index.css";',
    );
    expect(read(dir, "index.html")).toContain('data-skein-theme="default"');
    expect(existsSync(join(dir, "src", "pages", "home", "index.tsx"))).toBe(true);
    expect(existsSync(join(dir, "src", "routes"))).toBe(false);
    expect(existsSync(join(dir, ".gitignore"))).toBe(true);
    // Files whose content is all conditional are not written
    expect(existsSync(join(dir, ".env.development"))).toBe(false);
    expect(JSON.parse(read(dir, ".skein.json"))).toMatchObject({
      template: "basic",
      theme: "default",
      features: [],
    });
    expect(pkg.scripts.check).toBe("skein check");
    expect(Object.keys(pkg.devDependencies)).toContain("@skeinui/cli");
    expect(leftovers(dir)).toEqual([]);
  });

  test("admin: adoor directory layout, mock on", () => {
    const dir = target("my-admin");
    const project = createProject({ dir, template: "admin", theme: "antd" });
    expect(project.features).toEqual(["mock", "router", "query", "i18n", "auth", "shell"]);
    for (const file of [
      "src/routes/_auth.tsx",
      "src/routes/_auth/dashboard.tsx",
      "src/routes/_auth/users.tsx",
      "src/routes/_auth/$.tsx",
      "src/routes/login.tsx",
      "src/pages/users/_meta.ts",
      "src/pages/users/api/index.ts",
      "src/pages/users/locales/messages/zh.json",
      "src/pages/users/mocks/handlers.ts",
      "src/modules/route-layout.tsx",
      "src/skein-shell/app-layout.tsx",
      "src/lib/http.ts",
      "src/lib/i18n.ts",
      "src/store/auth-store.ts",
      "src/mocks/index.ts",
      "src/settings.ts",
      "public/mockServiceWorker.js",
    ]) {
      expect(existsSync(join(dir, file)), file).toBe(true);
    }
    expect(existsSync(join(dir, "src", "pages", "home"))).toBe(false);
    expect(read(dir, ".env.development")).toContain("VITE_ENABLE_MOCK=true");
    const pkg = pkgOf(dir);
    expect(pkg.scripts.build).toBe("tsr generate && tsc && vite build");
    expect(pkg.msw).toEqual({ workerDirectory: ["public"] });
    // pnpm blocks msw's install script unless it is allowed (and fails the install); bun likewise
    expect(read(dir, "pnpm-workspace.yaml")).toMatch(/allowBuilds:\n  msw: true/);
    expect(pkg.trustedDependencies).toEqual(["msw"]);
    expect(Object.keys(pkg.dependencies)).toEqual(
      expect.arrayContaining([
        "@tanstack/react-router",
        "@tanstack/react-query",
        "i18next",
        "zustand",
        "lucide-react",
      ]),
    );
    expect(read(dir, "src", "settings.ts")).toContain('appName: "My Admin"');
    expect(leftovers(dir)).toEqual([]);
  });

  test("admin --no-mock: no MSW, mock files or mock switch", () => {
    const dir = target();
    createProject({ dir, template: "admin", remove: ["mock"] });
    const files = walk(dir).map((f) => relative(dir, f));
    expect(files.filter((f) => f.includes("mock"))).toEqual([]);
    expect(pkgOf(dir).devDependencies.msw).toBeUndefined();
    expect(existsSync(join(dir, "pnpm-workspace.yaml"))).toBe(false);
    expect(read(dir, "src", "main.tsx")).not.toContain("mocks");
    expect(read(dir, ".env.development")).not.toContain("VITE_ENABLE_MOCK");
    expect(read(dir, "src", "pages", "login", "components", "login-form.tsx")).not.toContain(
      "admin123",
    );
  });

  test.each(THEMES.filter((t) => t.id !== "none").map((t) => t.id))(
    "%s: present in @skeinui/themes, the project imports only it",
    (theme) => {
      expect(existsSync(join(PACKAGES_DIR, "themes", theme, "index.css"))).toBe(true);
      const dir = target();
      createProject({ dir, theme });
      expect(pkgOf(dir).dependencies["@skeinui/themes"]).toBeDefined();
      expect(read(dir, "src", "skein.theme.ts")).toContain(
        `import "@skeinui/themes/${theme}/index.css";`,
      );
    },
  );

  test("--theme none: blank theme style in src/theme/, named after the project", () => {
    const dir = target("Acme Admin");
    const { themeStyle } = createProject({ dir, theme: "none" });
    expect(themeStyle).toBe("acme-admin");
    expect(read(dir, "src", "skein.theme.ts")).toContain('import "./theme/index.css";');
    const rules = new Set(checkTheme(join(dir, "src", "theme"), "acme-admin").map((i) => i.rule));
    expect(rules).toEqual(new Set(["tokens", "dark-tokens", "coverage"]));
    for (const file of Object.keys(COVERAGE))
      expect(existsSync(join(dir, "src", "theme", file))).toBe(true);
  });

  test("--local: @skeinui/* points at this repo, vite dedupes React", () => {
    const dir = target();
    createProject({ dir, template: "admin", local: true });
    expect(pkgOf(dir).dependencies["@skeinui/ui"]).toBe(`file:${join(PACKAGES_DIR, "ui")}`);
    expect(read(dir, "vite.config.ts")).toContain('dedupe: ["react", "react-dom"]');
    // pnpm can't resolve the packages' workspace:* dependencies outside the monorepo without these
    const pnpm = read(dir, "pnpm-workspace.yaml");
    expect(pnpm).toContain(`"@skeinui/cli": "link:${join(PACKAGES_DIR, "cli")}"`);
    expect(pnpm).not.toContain("theme-kit");
    expect(pnpm).toContain(`"@skeinui/themes": "link:${join(PACKAGES_DIR, "themes")}"`);
    expect(pnpm).toContain("  msw: true");
  });

  test("--dry-run writes nothing; a non-empty directory needs --force", () => {
    const dir = target();
    const dry = createProject({ dir, dryRun: true });
    expect(dry.created).toContain("package.json");
    expect(existsSync(dir)).toBe(false);
    createProject({ dir });
    writeFileSync(join(dir, "extra.txt"), "");
    expect(() => createProject({ dir })).toThrow("is not empty");
    expect(() => createProject({ dir, theme: "bootstrap" })).toThrow('unknown theme "bootstrap"');
  });
});

describe("new page / module", () => {
  test("admin project: full page files + route under _auth, only adds, never modifies", () => {
    const dir = target();
    createProject({ dir, template: "admin" });
    const before = new Map(walk(dir).map((f) => [f, read(f)]));
    const { created, changed } = newPage({ name: "system/user-roles", cwd: join(dir, "src") });
    expect(changed).toEqual([]);
    expect(created.sort()).toEqual(
      [
        "src/pages/system/_meta.ts",
        "src/pages/system/user-roles/_meta.ts",
        "src/pages/system/user-roles/api/index.ts",
        "src/pages/system/user-roles/index.tsx",
        "src/pages/system/user-roles/locales/index.ts",
        "src/pages/system/user-roles/locales/messages/en.json",
        "src/pages/system/user-roles/locales/messages/zh.json",
        "src/pages/system/user-roles/mocks/handlers.ts",
        "src/routes/_auth/system/user-roles.tsx",
      ].sort(),
    );
    for (const [file, content] of before) expect(read(file), file).toBe(content);
    const route = read(dir, "src", "routes", "_auth", "system", "user-roles.tsx");
    expect(route).toContain('createFileRoute("/_auth/system/user-roles")');
    expect(route).toContain('import { SystemUserRolesPage } from "@/pages/system/user-roles";');
    expect(read(dir, "src", "pages", "system", "user-roles", "index.tsx")).toContain(
      "systemUserRolesKeys.all",
    );
    expect(read(dir, "src", "pages", "system", "_meta.ts")).toContain("isGroup: true");
    expect(leftovers(dir)).toEqual([]);
    expect(() => newPage({ name: "system/user-roles", cwd: dir })).toThrow("already exists");
  });

  test("no mocks/ without mock; no pages without router; error outside a project", () => {
    const dir = target();
    createProject({ dir, template: "admin", remove: ["mock"] });
    const { created } = newPage({ name: "orders", cwd: dir });
    expect(created.some((f) => f.includes("mocks"))).toBe(false);

    const basic = join(tmp!, "basic");
    createProject({ dir: basic });
    expect(() => newPage({ name: "orders", cwd: basic })).toThrow("router feature");
    expect(() => newPage({ name: "orders", cwd: tmpdir() })).toThrow("not inside a Skein project");
  });

  test("dry-run writes nothing; module goes to src/modules/<name>", () => {
    const dir = target();
    createProject({ dir, template: "admin" });
    newPage({ name: "orders", cwd: dir, dryRun: true });
    expect(existsSync(join(dir, "src", "pages", "orders"))).toBe(false);
    const { created } = newModule({ name: "Order Panel", cwd: dir });
    expect(created).toContain("src/modules/order-panel/index.tsx");
    expect(read(dir, "src", "modules", "order-panel", "index.tsx")).toContain(
      "export function OrderPanel()",
    );
  });
});

describe("instructions for AI", () => {
  test("AGENTS.md / CLAUDE.md / skills follow the features: admin covers pages, menus, mock; basic doesn't", () => {
    const admin = target("admin");
    createProject({ dir: admin, template: "admin" });
    const agents = read(admin, "AGENTS.md");
    expect(read(admin, "CLAUDE.md").trim()).toBe("@AGENTS.md");
    for (const text of [
      "npm run check",
      "npx skein docs",
      "npx skein new page",
      "_meta.ts",
      "mocks/handlers.ts",
      "src/pages/users/",
    ]) {
      expect(agents, text).toContain(text);
    }
    for (const skill of ["skein-ui", "skein-page", "skein-theme"]) {
      const md = read(admin, ".claude", "skills", skill, "SKILL.md");
      expect(md.startsWith(`---\nname: ${skill}\ndescription: `), skill).toBe(true);
    }

    const basic = join(tmp!, "basic");
    createProject({ dir: basic });
    const basicAgents = read(basic, "AGENTS.md");
    for (const text of ["skein new page", "_meta.ts", "mocks/", "admin / admin123"]) {
      expect(basicAgents, text).not.toContain(text);
    }
    expect(read(basic, ".claude", "skills", "skein-page", "SKILL.md")).toContain(
      "This app has no router",
    );
    expect(leftovers(admin)).toEqual([]);
    expect(leftovers(basic)).toEqual([]);
  });

  test("MCP only with --mcp: .mcp.json, SDK dependencies, notes in AGENTS.md", () => {
    const plain = target("plain");
    createProject({ dir: plain, template: "admin" });
    expect(existsSync(join(plain, ".mcp.json"))).toBe(false);
    expect(Object.keys(pkgOf(plain).devDependencies)).not.toContain("@modelcontextprotocol/sdk");
    expect(read(plain, "AGENTS.md")).not.toContain("MCP");
    expect(read(plain, "AGENTS.md")).not.toMatch(/\n\n\n/);

    const withMcp = join(tmp!, "with-mcp");
    createProject({ dir: withMcp, add: ["mcp"] });
    expect(JSON.parse(read(withMcp, ".mcp.json")).mcpServers.skein).toEqual({
      command: "npx",
      args: ["skein", "mcp"],
    });
    expect(pkgOf(withMcp).devDependencies).toMatchObject({
      "@modelcontextprotocol/sdk": expect.any(String),
      zod: expect.any(String),
    });
    expect(read(withMcp, "AGENTS.md")).toContain("`npx skein mcp`");
    expect(read(withMcp, "AGENTS.md")).not.toMatch(/\n\n\n/);
  });

  test("preview only with --preview: playwright-core, notes in AGENTS.md and skills", () => {
    const plain = target("plain-preview");
    createProject({ dir: plain, template: "admin" });
    expect(Object.keys(pkgOf(plain).devDependencies)).not.toContain("playwright-core");
    expect(read(plain, "AGENTS.md")).not.toContain("skein preview");
    expect(read(plain, ".claude", "skills", "skein-ui", "SKILL.md")).not.toContain("preview");

    const withPreview = join(tmp!, "with-preview");
    createProject({ dir: withPreview, template: "admin", add: ["preview"] });
    expect(pkgOf(withPreview).devDependencies["playwright-core"]).toBeDefined();
    expect(read(withPreview, "AGENTS.md")).toContain("`npx skein preview <route>`");
    expect(read(withPreview, "AGENTS.md")).toContain("(signed in)");
    expect(read(withPreview, ".claude", "skills", "skein-page", "SKILL.md")).toContain(
      "npx skein preview /<path>",
    );
    expect(read(withPreview, "AGENTS.md")).not.toMatch(/\n\n\n/);
  });

  test("preview outside a project gives a readable error", async () => {
    const { preview } = await import("../src/commands/preview.js");
    await expect(preview({ cwd: tmpdir() })).rejects.toThrow("not inside a Skein project");
  });
});

describe("docs", () => {
  test("manifest: look up components, search, suggestions for typos", async () => {
    const docs = await import("../src/docs.js");
    const manifest = docs.loadManifest(tmpdir());
    const button = docs.findComponent(manifest, "button");
    expect(button?.name).toBe("Button");
    expect(docs.componentMarkdown(button!)).toMatch(
      /- `variant` \(default "solid"\): `[^`]*"outline"[^`]*"solid"/,
    );
    expect(
      docs.searchComponents(manifest, "date picker").map((c: { name: string }) => c.name),
    ).toContain("DatePicker");
    expect(docs.suggest(manifest, "Buton")).toEqual(["Button"]);
    expect(docs.llmsIndex(manifest)).toContain("- [Button](/button):");
  });

  test("component docs list the fields of data types; the summary is the full first sentence, not cut at a line break", async () => {
    const docs = await import("../src/docs.js");
    const manifest = docs.loadManifest(tmpdir());
    const md = docs.componentMarkdown(docs.findComponent(manifest, "Breadcrumb")!);
    expect(md).toContain("## Type BreadcrumbItem");
    expect(md).toMatch(/- `label` \(required\): `ReactNode`/);
    expect(docs.summary("A wrapped\nsentence. Second one.")).toBe("A wrapped sentence.");
    expect(docs.summary("First paragraph\n\nSecond paragraph.")).toBe("First paragraph");
    expect(docs.summary("A bar (e.g. this one). More.")).toBe("A bar (e.g. this one).");
  });
});

describe("OpenAPI → CRUD page", () => {
  const FIXTURES = join(import.meta.dirname, "fixtures");

  test("orders.yaml: $ref / allOf, { data } wrapper, pagination, filters, PUT, read-only fields", async () => {
    const { analyzeResource, loadSpec } = await import("../src/openapi.js");
    const m = analyzeResource(loadSpec(join(FIXTURES, "orders.yaml")), { name: "orders" });
    expect(m).toMatchObject({
      path: "/api/orders",
      itemPath: "/api/orders/:id",
      entity: "Order",
      idField: "id",
      idType: "number",
      labelField: "customer",
      pagination: { page: "page", pageSize: "pageSize" },
      list: { envelope: "data", itemsKey: "items", totalKey: "total" },
      ops: { create: true, update: "put", remove: true },
    });
    expect(m.input.map((f: { name: string }) => f.name)).toEqual([
      "customer",
      "email",
      "status",
      "amount",
      "paid",
      "deliverOn",
      "note",
    ]);
    expect(m.filters.map((f: { name: string; kind: string }) => `${f.name}:${f.kind}`)).toEqual([
      "q:string",
      "status:enum",
    ]);
  });

  test("products.json: array response, no pagination, PATCH, string id kept in the form, dashed field names", async () => {
    const { analyzeResource, loadSpec } = await import("../src/openapi.js");
    const m = analyzeResource(loadSpec(join(FIXTURES, "products.json")), {
      name: "catalog/products",
    });
    expect(m).toMatchObject({
      path: "/v1/catalog/products",
      idField: "sku",
      idType: "string",
      pagination: null,
      list: { envelope: null, itemsKey: null },
      ops: { update: "patch" },
    });
    expect(m.input.map((f: { name: string }) => f.name)).toContain("sku");
    expect(m.fields.find((f: { name: string }) => f.name === "category")).toMatchObject({
      kind: "enum",
    });
  });

  test("generates the full set of files, only adds; clear errors for non-admin projects and missing resources", async () => {
    const dir = target();
    createProject({ dir, template: "admin" });
    const { created, changed } = newPage({
      name: "orders",
      cwd: dir,
      from: join(FIXTURES, "orders.yaml"),
    });
    expect(changed).toEqual([]);
    expect(created).toEqual(
      expect.arrayContaining([
        "src/pages/orders/api/index.ts",
        "src/pages/orders/components/orders-filter.tsx",
        "src/pages/orders/components/orders-table.tsx",
        "src/pages/orders/components/order-form-dialog.tsx",
        "src/pages/orders/mocks/handlers.ts",
        "src/routes/_auth/orders.tsx",
      ]),
    );
    const api = read(dir, "src", "pages", "orders", "api", "index.ts");
    expect(api).toContain("http.put<Order>(`/api/orders/${id}`, input)");
    expect(read(dir, "src", "pages", "orders", "mocks", "handlers.ts")).toContain(
      "HttpResponse.json({ data: { items: items, total: matched.length } })",
    );

    expect(() =>
      newPage({ name: "shipments", cwd: dir, from: join(FIXTURES, "orders.yaml") }),
    ).toThrow("--resource");
    const basic = join(tmp!, "basic");
    createProject({ dir: basic, add: ["router"] });
    expect(() =>
      newPage({ name: "orders", cwd: basic, from: join(FIXTURES, "orders.yaml") }),
    ).toThrow("lacks: shell, query, i18n");
  });
});

describe("theme init --from --use", () => {
  test("copies a bundled theme style under a new name and switches the project to it; theme use can switch back later", async () => {
    const { themeKit } = await import("../src/commands/theme.js");
    const dir = target();
    createProject({ dir, theme: "antd" });
    const result = await themeKit("init", { name: "acme", from: "shadcn", use: true, cwd: dir });
    expect(result.files).toContain("button.css");
    const button = read(dir, "src", "theme", "button.css");
    expect(button).toContain('[data-skein-theme="acme"]');
    expect(button).not.toContain('[data-skein-theme="shadcn"]');
    expect(read(dir, "src", "skein.theme.ts")).toContain('import "./theme/index.css";');
    expect(read(dir, "index.html")).toContain('data-skein-theme="acme"');
    // @skeinui/themes stays installed (nothing of it is imported any more), so theme use needs no install
    expect(pkgOf(dir).dependencies["@skeinui/themes"]).toBeDefined();
    expect(JSON.parse(read(dir, ".skein.json"))).toMatchObject({
      theme: "none",
      themeStyle: "acme",
    });
    expect(checkTheme(join(dir, "src", "theme"), "acme")).toEqual([]);

    await expect(themeKit("init", { name: "acme", from: "shadcn", cwd: dir })).rejects.toThrow(
      "is not empty",
    );
    await expect(themeKit("init", { name: "Acme", cwd: join(tmp!, "x") })).rejects.toThrow(
      "invalid theme style name",
    );
    useTheme({ theme: "heroui", cwd: dir });
    expect(JSON.parse(read(dir, ".skein.json")).themeStyle).toBeUndefined();
  });
});

describe("dependency versions match", () => {
  test("generated projects use this repo's versions: dependencies in both the templates and the pnpm-workspace.yaml catalog have identical versions", () => {
    const workspace = parseYaml(
      read(join(import.meta.dirname, "..", "..", "..", "pnpm-workspace.yaml")),
    );
    const catalog: Record<string, string> = workspace.catalog;
    // Every feature at once: the base dependencies plus each feature's
    const pkg = packageJson({
      name: "app",
      theme: "default",
      features: loadFeatures(),
      local: false,
    });
    const template: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
    // In the workspace vite is Vite+'s alias; generated projects use vite itself
    const shared = Object.keys(template).filter((n) => n in catalog && n !== "vite");
    expect(shared.length).toBeGreaterThan(5);
    const differ = shared
      .filter((n) => template[n] !== catalog[n])
      .map((n) => `${n}: template ${template[n]}, catalog ${catalog[n]}`);
    expect(
      differ,
      "change the template (src/project.js, templates/features/*/feature.json) or the catalog",
    ).toEqual([]);
  });
});

describe("mockServiceWorker.js of the mock template", () => {
  test("same version as the msw installed in generated projects (after upgrading msw run pnpm --filter @skeinui/cli msw-worker)", () => {
    const workspace = parseYaml(
      read(join(import.meta.dirname, "..", "..", "..", "pnpm-workspace.yaml")),
    );
    const worker = read(
      join(
        import.meta.dirname,
        "..",
        "templates",
        "features",
        "mock",
        "files",
        "public",
        "mockServiceWorker.js",
      ),
    );
    const version = worker.match(/PACKAGE_VERSION = '([^']+)'/)?.[1];
    expect(version).toBe(String(workspace.catalog.msw).replace(/^[\^~]/, ""));
  });
});

describe("init: detects features from the structure when .skein.json is missing", () => {
  const without = (dir: string) => {
    const original = JSON.parse(read(dir, ".skein.json"));
    rmSync(join(dir, ".skein.json"));
    return original;
  };

  test("admin project: after deleting .skein.json, init restores it as it was and lists the evidence", () => {
    const dir = target();
    createProject({ dir, template: "admin", theme: "antd", add: ["mcp"] });
    const original = without(dir);
    const result = init({ cwd: dir });
    const restored = JSON.parse(read(dir, ".skein.json"));
    const sorted = (list: string[]) => [...list].sort((a, b) => a.localeCompare(b));
    expect({ ...restored, features: sorted(restored.features) }).toEqual({
      ...original,
      features: sorted(original.features),
    });
    expect(result.evidence.router).toContain(
      "vite.config.ts: file routes (TanStack Router plugin)",
    );
    expect(() => init({ cwd: dir })).toThrow("already exists");
  });

  test("dependencies only, no Skein structure: features not counted; features missing a prerequisite are dropped with a note", () => {
    const dir = target();
    createProject({ dir });
    without(dir);
    const pkg = pkgOf(dir);
    pkg.dependencies["@tanstack/react-router"] = "^1.166.0";
    pkg.devDependencies.msw = "^2.12.0";
    writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
    expect(init({ cwd: dir, dryRun: true }).project.features).toEqual([]);
    expect(existsSync(join(dir, ".skein.json"))).toBe(false);

    const admin = target("admin-no-auth");
    createProject({ dir: admin, template: "admin" });
    without(admin);
    rmSync(join(admin, "src", "store"), { recursive: true });
    const result = init({ cwd: admin, dryRun: true });
    expect(result.project.features).not.toContain("auth");
    expect(result.project.features).not.toContain("shell");
    expect(result.warnings.join()).toContain("shell looks present but needs auth");
  });
});

describe("theme use", () => {
  test("--theme none project has no @skeinui/themes: theme use adds the dependency and asks to install", () => {
    const dir = target();
    createProject({ dir, theme: "none" });
    expect(pkgOf(dir).dependencies["@skeinui/themes"]).toBeUndefined();
    const result = useTheme({ theme: "antd", cwd: dir });
    expect(result.needsInstall).toBe(true);
    expect(result.changed).toContain("package.json");
    expect(pkgOf(dir).dependencies["@skeinui/themes"]).toBeDefined();
  });

  test("basic: only changes imports: skein.theme.ts / index.html / .skein.json, no dependency change, no reinstall", () => {
    const dir = target();
    createProject({ dir, theme: "antd" });
    const result = useTheme({ theme: "heroui", cwd: dir });
    expect(result.changed.sort()).toEqual([".skein.json", "index.html", "src/skein.theme.ts"]);
    expect(result.needsInstall).toBe(false);
    expect(read(dir, "src", "skein.theme.ts")).toContain('export const themeStyle = "heroui";');
    expect(read(dir, "index.html")).toContain('data-skein-theme="heroui"');
    expect(JSON.parse(read(dir, ".skein.json")).theme).toBe("heroui");
    expect(() => useTheme({ theme: "none", cwd: dir })).toThrow("unknown theme");
    expect(() => addThemes({ themes: ["shadcn"], cwd: dir })).toThrow("preferences drawer");
  });
});

describe("admin: several theme styles (themeStyles in settings.ts, switched in preferences)", () => {
  const listOf = (dir: string) =>
    [...read(dir, "src", "settings.ts").matchAll(/^ {4}"([\w-]+)": \{ label/gm)].map((m) => m[1]);
  const defaultOf = (dir: string) =>
    read(dir, "src", "settings.ts").match(/\bthemeStyle: "([^"]+)"/)?.[1];

  test("a new project lists only the --theme style, loaded on demand; no skein.theme.ts", () => {
    const dir = target();
    createProject({ dir, template: "admin", theme: "antd" });
    expect(listOf(dir)).toEqual(["antd"]);
    expect(defaultOf(dir)).toBe("antd");
    expect(read(dir, "src", "settings.ts")).toContain(
      'load: () => import("@skeinui/themes/antd/index.css")',
    );
    expect(existsSync(join(dir, "src", "skein.theme.ts"))).toBe(false);
    expect(read(dir, "src", "main.tsx")).toContain("await loadThemeStyle(");
    expect(read(dir, "src", "providers.tsx")).toContain("useThemeStyle(");
  });

  test("theme add several (skein = default), theme use sets the default, theme remove; the default can't be removed", () => {
    const dir = target();
    createProject({ dir, template: "admin", theme: "antd" });
    const added = addThemes({ themes: ["heroui", "skein", "antd"], cwd: dir });
    expect(added.added).toEqual(["heroui", "default"]);
    expect(listOf(dir)).toEqual(["antd", "heroui", "default"]);
    expect(read(dir, "src", "settings.ts")).toContain('"default": { label: "Skein"');
    expect(defaultOf(dir)).toBe("antd");

    const used = useTheme({ theme: "shadcn", cwd: dir });
    expect(used.changed.sort()).toEqual([".skein.json", "index.html", "src/settings.ts"]);
    expect(listOf(dir)).toEqual(["antd", "heroui", "default", "shadcn"]);
    expect(defaultOf(dir)).toBe("shadcn");
    expect(read(dir, "index.html")).toContain('data-skein-theme="shadcn"');

    expect(() => removeThemes({ themes: ["shadcn"], cwd: dir })).toThrow("default theme style");
    expect(removeThemes({ themes: ["heroui", "skein"], cwd: dir }).themeStyles).toEqual([
      "antd",
      "shadcn",
    ]);
    expect(() => removeThemes({ themes: ["heroui"], cwd: dir })).toThrow("is not in");
    expect(() => addThemes({ themes: ["bootstrap"], cwd: dir })).toThrow(
      'unknown theme "bootstrap"',
    );
  });

  test("theme init --use: own theme style added to the list as default, bundled ones still selectable", async () => {
    const dir = target();
    createProject({ dir, template: "admin", theme: "antd" });
    await themeKit("init", { name: "acme", from: "antd", use: true, cwd: dir });
    expect(listOf(dir)).toEqual(["antd", "acme"]);
    expect(defaultOf(dir)).toBe("acme");
    expect(read(dir, "src", "settings.ts")).toContain(
      '"acme": { label: "Acme", load: () => import("./theme/index.css") }',
    );
  });
});

describe("names", () => {
  test.each([
    ["My App", "my-app"],
    ["_private", "private"],
    ["@acme/web", "@acme/web"],
  ])("package name %s → %s", (input, expected) => expect(toPackageName(input)).toBe(expected));

  test.each([
    ["@acme/web", "web"],
    ["2048", "custom"],
    ["app.v2", "app-v2"],
  ])("theme style name %s → %s", (input, expected) =>
    expect(toThemeStyleName(input)).toBe(expected),
  );

  test("page paths and component names", () => {
    expect(pagePath("System/UserRoles")).toBe("system/user-roles");
    expect(pagePath("//")).toBeNull();
    expect(pascal("system-user-roles")).toBe("SystemUserRoles");
  });
});
