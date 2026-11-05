// The tenant feature in a real browser: pages under /<tenant>/, switching tenants (from a list and from a detail
// page), addresses without a tenant, each tenant's own users. Used by run.mjs; can also be run on its own:
//   node tests/e2e/tenant-flow.mjs http://localhost:5173
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

export async function tenantFlow(base, { log = console.log } = {}) {
  const browser = await chromium.launch({ channel: process.env.E2E_CHANNEL ?? "chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  const requests = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  page.on("response", (r) => {
    const url = new URL(r.url());
    if (url.pathname.startsWith("/api/users"))
      requests.push(`${url.pathname} ${r.request().headers()["x-tenant-id"]} ${r.status()}`);
  });
  const steps = [];
  const step = async (name, fn) => {
    try {
      await fn();
      steps.push({ name, ok: true });
      log(`  ✓ ${name}`);
    } catch (error) {
      steps.push({ name, ok: false, error: String(error.message ?? error).split("\n")[0] });
      log(`  ✗ ${name}: ${String(error.message ?? error).split("\n")[0]}`);
      await page.screenshot({ path: `/tmp/skein-e2e-tenant-${steps.length}.png` }).catch(() => {});
    }
  };
  const path = () => new URL(page.url()).pathname;
  const expectPath = async (expected) => {
    await page.waitForURL((u) => u.pathname === expected, { timeout: 10_000 });
  };
  const rows = () =>
    page.locator(
      '[data-slot="keep-alive-pane"][data-active] tbody [data-slot="table-row"]:not([data-empty])',
    );
  const firstName = () => rows().first().locator("a").textContent();
  const tabs = () =>
    page
      .locator('[role="tab"]')
      .evaluateAll((list) => list.map((t) => t.textContent?.trim() ?? ""));
  const switchTo = async (name) => {
    await page.getByRole("button", { name: "切换租户" }).click();
    await page.getByRole("menuitem", { name }).click();
  };

  try {
    await step("signed out, /users → login → /acme/users (the first tenant)", async () => {
      await page.goto(`${base}/users`);
      await page.waitForURL(/\/login$/);
      await page.getByRole("button", { name: "登录" }).click();
      await expectPath("/acme/users");
    });
    await step("acme's users only (8 of 24), menu links under /acme", async () => {
      await page.waitForFunction(
        () =>
          document.querySelectorAll('[data-active] tbody [data-slot="table-row"]:not([data-empty])')
            .length === 8,
      );
      if ((await firstName()) !== "Alice Chen") throw new Error(`first row: ${await firstName()}`);
      const hrefs = await page
        .locator('[data-slot^="admin-layout"] a[href], [data-slot^="side-menu"] a[href]')
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
      if (!hrefs.includes("/acme/dashboard") || !hrefs.includes("/acme/users"))
        throw new Error(`menu links: ${hrefs.join(" ")}`);
    });
    await step("a user's detail page: /acme/users/1, tab named after the user", async () => {
      await rows().first().locator("a").click();
      await expectPath("/acme/users/1");
      await page.getByRole("heading", { name: "Alice Chen" }).waitFor();
      if (!(await tabs()).includes("Alice Chen"))
        throw new Error(`tabs: ${(await tabs()).join(" | ")}`);
    });
    await step(
      "switching to Globex on the detail page: its list, globex's users, the detail tab closed, no request for the old user",
      async () => {
        requests.length = 0;
        await switchTo("Globex");
        await expectPath("/globex/users");
        await page.waitForFunction(
          () =>
            document
              .querySelector('[data-active] tbody [data-slot="table-row"] a')
              ?.textContent?.trim() === "Bob Li",
        );
        if ((await tabs()).includes("Alice Chen"))
          throw new Error(`tabs: ${(await tabs()).join(" | ")}`);
        const stray = requests.filter((r) => r.startsWith("/api/users/"));
        if (stray.length > 0 || !requests.some((r) => r === "/api/users globex 200"))
          throw new Error(`requests: ${requests.join("; ")}`);
      },
    );
    await step("a reload stays on /globex/users", async () => {
      await page.reload();
      await expectPath("/globex/users");
      await page.getByRole("button", { name: "切换租户" }).filter({ hasText: "Globex" }).waitFor();
    });
    await step("addresses without a tenant / with an unknown one go under globex", async () => {
      for (const [from, to] of [
        ["/dashboard", "/globex/dashboard"],
        ["/oldco/users", "/globex/users"],
        ["/", "/globex/dashboard"],
      ]) {
        await page.goto(`${base}${from}`);
        await expectPath(to).catch(() => {
          throw new Error(`${from} → ${path()}, expected ${to}`);
        });
      }
    });
    await step(
      "another tenant's user is not found (404 from the mock, shown on the page)",
      async () => {
        await page.goto(`${base}/globex/users/1`);
        await page.getByRole("heading", { name: "用户不存在" }).waitFor();
        // That 404 is the expected one
        const index = errors.findIndex((e) => e.includes("404"));
        if (index >= 0) errors.splice(index, 1);
      },
    );
    await step("no errors", async () => {
      const real = errors.filter((e) => !/favicon|Download the React DevTools/.test(e));
      if (real.length > 0) throw new Error(real.slice(0, 3).join(" | "));
    });
  } finally {
    await browser.close();
  }
  return steps;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const steps = await tenantFlow(process.argv[2] ?? "http://localhost:5173");
  process.exit(steps.every((s) => s.ok) ? 0 : 1);
}
