#!/usr/bin/env node
/**
 * End-to-end: generates projects with the CLI (`--local`, so the @skeinui/* packages of this checkout are
 * used and nothing needs publishing), installs them with npm, type-checks and builds every one, then runs
 * the admin app in Chrome (admin-flow.mjs), adds pages and switches the theme style.
 *
 *   vp run e2e                 everything
 *   vp run e2e -- --keep       keep the generated projects (path printed at the end)
 *   vp run e2e -- --only=admin-antd
 *
 * Needs network access for npm and a local Chrome (E2E_CHANNEL, default chrome). Not part of `vp test`.
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { adminFlow } from "./admin-flow.mjs";
import { crudFlow } from "./crud-flow.mjs";
import { tenantFlow } from "./tenant-flow.mjs";

const CLI = join(import.meta.dirname, "..", "..", "bin", "skein.js");
const args = process.argv.slice(2);
const keep = args.includes("--keep");
const only = args.find((a) => a.startsWith("--only="))?.slice("--only=".length);

const CASES = [
  {
    id: "admin-antd",
    create: ["--template", "admin", "--theme", "antd", "--mcp", "--preview"],
    admin: true,
  },
  { id: "admin-no-mock", create: ["--template", "admin", "--no-mock"] },
  { id: "admin-tenant", create: ["--template", "admin", "--tenant"], tenant: true },
  { id: "basic-default", create: [], page: "basic" },
  { id: "basic-blank-theme", create: ["--theme", "none"], blankTheme: true },
  { id: "basic-router-query-i18n", create: ["--router", "--query", "--i18n"] },
  // pnpm blocks install scripts (msw) and resolves the linked packages' workspace:* deps: both need pnpm-workspace.yaml
  { id: "admin-pnpm", create: ["--template", "admin"], pm: "pnpm" },
].filter((c) => !only || c.id === only);

const root = mkdtempSync(join(tmpdir(), "skein-e2e-"));
const results = [];
const sh = (cwd, cmd, cmdArgs) =>
  execFileSync(cmd, cmdArgs, {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });

function check(id, name, fn) {
  try {
    fn();
    results.push({ id, name, ok: true });
    console.log(`  ✓ ${name}`);
    return true;
  } catch (error) {
    const out = `${error.stdout ?? ""}${error.stderr ?? ""}`
      .trim()
      .split("\n")
      .slice(-8)
      .join("\n    ");
    results.push({ id, name, ok: false });
    console.log(`  ✗ ${name}\n    ${out || error.message}`);
    return false;
  }
}

const BUNDLED_THEMES = ["default", "shadcn", "heroui", "antd"];

/**
 * How many rules of each bundled theme style the build's CSS has. All four live in @skeinui/themes; a
 * project imports one, and only that one may end up in dist/.
 */
function bundledThemes(dir) {
  const assets = join(dir, "dist", "assets");
  const css = readdirSync(assets)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(assets, f), "utf8"))
    .join("\n");
  return Object.fromEntries(
    BUNDLED_THEMES.map((t) => [
      t,
      (css.match(new RegExp(`data-skein-theme="?${t}"?\\]`, "g")) ?? []).length,
    ]),
  );
}

function onlyTheme(dir, expected) {
  const counts = bundledThemes(dir);
  const others = Object.entries(counts).filter(([t, n]) => t !== expected && n > 0);
  if ((expected && !(counts[expected] > 0)) || others.length > 0) {
    throw new Error(`theme rules in dist: ${JSON.stringify(counts)}`);
  }
}

/**
 * Admin projects list theme styles in settings.ts and load each on demand: every listed style must be a CSS file
 * of its own (so only the one in use is downloaded), and no other style may be bundled.
 */
function themesSplit(dir, expected) {
  const assets = join(dir, "dist", "assets");
  const perFile = readdirSync(assets)
    .filter((f) => f.endsWith(".css"))
    .map((f) => {
      const css = readFileSync(join(assets, f), "utf8");
      return BUNDLED_THEMES.filter((t) => new RegExp(`data-skein-theme="?${t}"?\\]`).test(css));
    })
    .filter((themes) => themes.length > 0);
  const byName = (a, b) => a.localeCompare(b);
  const found = perFile.flat().sort(byName);
  if (
    perFile.some((themes) => themes.length > 1) ||
    found.join() !== [...expected].sort(byName).join()
  )
    throw new Error(`theme styles per CSS file: ${JSON.stringify(perFile)}`);
}

/**
 * The project's dev server (`vp dev`, Vite+). Its own process group, so kill() stops the server vp starts too
 * (killing only vp leaves it running).
 */
async function serve(cwd, port, command = ["vp", "dev", "--port", String(port), "--strictPort"]) {
  const child = spawn("npx", command, {
    cwd,
    stdio: "ignore",
    env: { ...process.env, PORT: String(port) },
    detached: true,
  });
  const server = {
    kill() {
      try {
        if (child.pid === undefined) throw new Error("not started");
        process.kill(-child.pid, "SIGTERM");
      } catch {
        child.kill();
      }
    },
  };
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${port}/`)).ok) return server;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  server.kill();
  throw new Error(`dev server on ${port} did not start`);
}

/** The basic app: the theme style is applied (button not browser-default) and the counter works. */
async function basicPage(base) {
  const require = createRequire(import.meta.url);
  const { chromium } = require("playwright-core");
  const browser = await chromium.launch({ channel: process.env.E2E_CHANNEL ?? "chrome" });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  const button = page.locator('[data-slot="button"]').first();
  await button.click();
  await button.click();
  const text = await button.textContent();
  const radius = await button.evaluate((el) => getComputedStyle(el).borderRadius);
  await browser.close();
  if (!/Count is 2/.test(text ?? "") || radius === "0px" || errors.length > 0) {
    throw new Error(`text=${text} radius=${radius} errors=${errors.join(" | ")}`);
  }
}

let port = 4500;
for (const c of CASES) {
  console.log(`\n${c.id}  (skein create ${c.create.join(" ")})`);
  const dir = join(root, c.id);
  if (!check(c.id, "create", () => sh(root, "node", [CLI, "create", dir, ...c.create, "--local"])))
    continue;
  const pm = c.pm ?? "npm";
  const installArgs = pm === "npm" ? ["install", "--no-audit", "--no-fund"] : ["install"];
  if (!check(c.id, `${pm} install`, () => sh(dir, pm, installArgs))) continue;
  check(c.id, "build", () => sh(dir, "npm", ["run", "build"]));
  if (!c.blankTheme) {
    const expected = c.create.includes("--theme")
      ? c.create[c.create.indexOf("--theme") + 1]
      : "default";
    check(c.id, `dist has only the ${expected} theme style`, () => onlyTheme(dir, expected));
  }
  if (c.blankTheme) {
    // The blank theme style is unfinished on purpose: check must report exactly that, and nothing else
    check(c.id, "skein check: only the unfinished theme style", () => {
      let out = "";
      try {
        out = sh(dir, "npx", ["skein", "check", "--json"]);
      } catch (error) {
        out = error.stdout;
      }
      const result = JSON.parse(out);
      const other = result.issues.filter((i) => i.check !== "theme");
      if (result.ok || other.length > 0) throw new Error(JSON.stringify(other.slice(0, 3)));
    });
    // theme use installs @skeinui/themes and adds its Vite plugin: the build bundles only the stylesheets used
    if (
      check(c.id, "theme use default", () =>
        sh(dir, "npx", ["skein", "theme", "use", "default"]),
      ) &&
      check(c.id, `${pm} install`, () => sh(dir, pm, installArgs))
    ) {
      check(c.id, "build: skeinThemes() prunes the theme style", () => {
        const out = sh(dir, "npm", ["run", "build"]);
        if (!/\[skein-themes\] \d+ of \d+ stylesheets/.test(out)) throw new Error(out.slice(-400));
      });
      check(c.id, "dist has only the default theme style", () => onlyTheme(dir, "default"));
    }
  } else {
    check(c.id, "skein check: no problems", () => sh(dir, "npm", ["run", "check"]));
  }

  if (c.page === "basic") {
    const server = await serve(dir, port++);
    try {
      await basicPage(`http://localhost:${port - 1}`);
      results.push({ id: c.id, name: "browser", ok: true });
      console.log("  ✓ browser: themed button, counter works");
    } catch (error) {
      results.push({ id: c.id, name: "browser", ok: false });
      console.log(`  ✗ browser: ${error.message}`);
    } finally {
      server.kill();
    }
  }

  if (c.tenant) {
    const server = await serve(dir, port++);
    try {
      console.log("  browser, tenants:");
      const steps = await tenantFlow(`http://localhost:${port - 1}`, {
        log: (l) => console.log(`  ${l}`),
      });
      for (const s of steps) results.push({ id: c.id, name: `browser: ${s.name}`, ok: s.ok });
    } finally {
      server.kill();
    }
    const ordersYaml = join(import.meta.dirname, "..", "fixtures", "orders.yaml");
    check(c.id, "new page orders --from + system/logs under $tenant/, check clean", () => {
      sh(dir, "node", [CLI, "new", "page", "orders", "--from", ordersYaml]);
      sh(dir, "node", [CLI, "new", "page", "system/logs"]);
      for (const route of [["system", "logs.tsx"], ["orders_.$id.tsx"]])
        if (!existsSync(join(dir, "src", "routes", "_auth", "$tenant", ...route)))
          throw new Error(`no route ${route.join("/")} under $tenant/`);
      sh(dir, "npm", ["run", "check"]);
    });
    // The CRUD page under the tenant: the tenant's own 8 orders, create / edit / delete, its detail page
    const crudServer = await serve(dir, port++);
    try {
      console.log("  browser, CRUD page under the tenant:");
      const steps = await crudFlow(
        `http://localhost:${port - 1}`,
        {
          path: "/orders",
          menu: "Orders",
          expectRows: 8,
          detail: true,
          create: [
            ["Customer", "Zed Test"],
            ["Email", "zed@example.com"],
            ["Amount", "42"],
          ],
          rename: ["Customer", "Zed Renamed"],
        },
        { log: (l) => console.log(`  ${l}`) },
      );
      for (const s of steps) results.push({ id: c.id, name: `browser: ${s.name}`, ok: s.ok });
    } finally {
      crudServer.kill();
    }
  }

  if (c.admin) {
    const server = await serve(dir, port++);
    try {
      console.log("  browser:");
      const steps = await adminFlow(`http://localhost:${port - 1}`, {
        log: (l) => console.log(`  ${l}`),
      });
      for (const s of steps) results.push({ id: c.id, name: `browser: ${s.name}`, ok: s.ok });
    } finally {
      server.kill();
    }
    const fixtures = join(import.meta.dirname, "..", "fixtures");
    check(c.id, "new page --from OpenAPI (orders.yaml, products.json), check clean", () => {
      sh(dir, "node", [CLI, "new", "page", "orders", "--from", join(fixtures, "orders.yaml")]);
      sh(dir, "node", [
        CLI,
        "new",
        "page",
        "catalog/products",
        "--from",
        join(fixtures, "products.json"),
      ]);
      sh(dir, "npm", ["run", "check"]);
    });
    {
      const server = await serve(dir, port++);
      try {
        console.log("  browser, generated CRUD pages:");
        const log = (l) => console.log(`  ${l}`);
        const base = `http://localhost:${port - 1}`;
        const pages = [
          {
            path: "/orders",
            menu: "Orders",
            expectRows: 10,
            detail: true,
            create: [
              ["Customer", "Zed Test"],
              ["Email", "zed@example.com"],
              ["Amount", "42"],
            ],
            rename: ["Customer", "Zed Renamed"],
          },
          {
            path: "/catalog/products",
            menu: "Catalog",
            expectRows: 24,
            create: [
              ["Title", "Zelda Box"],
              ["Sku", "zelda-1"],
              ["Price", "59"],
            ],
            rename: ["Title", "Zelda Deluxe"],
          },
        ];
        for (const p of pages) {
          for (const s of await crudFlow(base, p, { log }))
            results.push({ id: c.id, name: `browser: ${s.name}`, ok: s.ok });
        }
      } finally {
        server.kill();
      }
    }
    check(c.id, "new page invoices + system/roles, new module, check still clean", () => {
      sh(dir, "node", [CLI, "new", "page", "invoices"]);
      sh(dir, "node", [CLI, "new", "page", "system/roles"]);
      sh(dir, "node", [CLI, "new", "module", "order-panel"]);
      sh(dir, "npm", ["run", "check"]);
    });
    // --preview: the pages open cleanly in Chrome (signed in), and a page whose API has no mock is caught
    const previewOf = (route) => {
      try {
        return JSON.parse(sh(dir, "node", [CLI, "preview", route, "--json"]));
      } catch (error) {
        return JSON.parse(error.stdout);
      }
    };
    check(c.id, "preview /users and /invoices: signed in, no errors, screenshot written", () => {
      for (const route of ["/users", "/invoices"]) {
        const r = previewOf(route);
        if (!r.ok || !r.signedIn || !existsSync(r.screenshot))
          throw new Error(`${route}: ${JSON.stringify(r).slice(0, 400)}`);
      }
    });
    check(c.id, "preview catches a page whose API has no mock", () => {
      rmSync(join(dir, "src", "pages", "invoices", "mocks"), { recursive: true, force: true });
      const r = previewOf("/invoices");
      rmSync(join(dir, "src", "pages", "invoices"), { recursive: true, force: true });
      rmSync(join(dir, "src", "routes", "_auth", "invoices.tsx"), { force: true });
      if (r.ok || !r.failedRequests.some((q) => q.url.endsWith("/api/invoices")))
        throw new Error(JSON.stringify(r).slice(0, 400));
    });
    await (async () => {
      // The project's .mcp.json (--mcp): start `npx skein mcp` over stdio like a client would, and call a tool
      // The MCP client comes from the CLI's own dev dependencies
      const require = createRequire(join(import.meta.dirname, "..", "..", "package.json"));
      const { Client } = await import(require.resolve("@modelcontextprotocol/sdk/client/index.js"));
      const { StdioClientTransport } = await import(
        require.resolve("@modelcontextprotocol/sdk/client/stdio.js")
      );
      const config = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf8")).mcpServers.skein;
      const client = new Client({ name: "e2e", version: "0" });
      try {
        await client.connect(new StdioClientTransport({ ...config, cwd: dir }));
        const result = await client.callTool({
          name: "skein_check",
          arguments: { only: ["i18n", "style"] },
        });
        const data = JSON.parse(result.content[0].text);
        if (!data.ok) throw new Error(result.content[0].text.slice(0, 300));
        results.push({
          id: c.id,
          name: "MCP: npx skein mcp from .mcp.json, skein_check",
          ok: true,
        });
        console.log("  ✓ MCP: npx skein mcp from .mcp.json, skein_check");
      } catch (error) {
        results.push({ id: c.id, name: "MCP", ok: false });
        console.log(`  ✗ MCP: ${error.message}`);
      } finally {
        await client.close();
      }
    })();
    check(
      c.id,
      "theme add skein + use heroui (no install), build: one CSS file per listed style",
      () => {
        sh(dir, "node", [CLI, "theme", "add", "skein"]);
        sh(dir, "node", [CLI, "theme", "use", "heroui"]);
        sh(dir, "npm", ["run", "build"]);
        themesSplit(dir, ["antd", "default", "heroui"]);
      },
    );
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
for (const f of failed) console.log(`  ✗ ${f.id}: ${f.name}`);
if (keep) console.log(`\nprojects kept in ${root}`);
else rmSync(root, { recursive: true, force: true });
process.exit(failed.length > 0 ? 1 : 0);
