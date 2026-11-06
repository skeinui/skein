// Walks through a generated admin app in a real browser. Used by run.mjs; can also be run on its own:
//   node tests/e2e/admin-flow.mjs http://localhost:5173
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

export async function adminFlow(base, { log = console.log } = {}) {
  const browser = await chromium.launch({ channel: process.env.E2E_CHANNEL ?? "chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  const steps = [];
  const step = async (name, fn) => {
    try {
      await fn();
      steps.push({ name, ok: true });
      log(`  ✓ ${name}`);
    } catch (error) {
      steps.push({ name, ok: false, error: String(error.message ?? error).split("\n")[0] });
      log(`  ✗ ${name}: ${String(error.message ?? error).split("\n")[0]}`);
      await page.screenshot({ path: `/tmp/skein-e2e-${steps.length}.png` }).catch(() => {});
    }
  };
  const nav = (label) =>
    page
      .locator('[data-slot^="admin-layout"] a, [data-slot^="side-menu"] a')
      .filter({ hasText: label })
      .first();
  const rows = () =>
    page.locator(
      '[data-slot="keep-alive-pane"][data-active] tbody [data-slot="table-row"]:not([data-empty])',
    );

  try {
    await step("visiting / signed out redirects to /login", async () => {
      await page.goto(base);
      await page.waitForURL(/\/login$/);
    });
    await step("sign in (mock default account) to the dashboard", async () => {
      await page.getByRole("button", { name: "登录" }).click();
      await page.waitForURL(/\/dashboard$/);
      await page.getByRole("heading", { name: "仪表盘" }).waitFor();
    });
    await step("dashboard stats and recent users come from mock", async () => {
      await page.getByText("用户总数").waitFor();
      await page
        .locator('[data-slot="statistic-value"]')
        .first()
        .filter({ hasText: "24" })
        .waitFor();
      await page.waitForFunction(
        () => document.querySelectorAll('[data-active] tbody [data-slot="table-row"]').length === 5,
      );
    });
    await step("menu comes from _meta.ts (dashboard, user management)", async () => {
      await nav("仪表盘").waitFor();
      await nav("用户管理").waitFor();
    });
    await step("menu opens user management: 10 rows on page 1, 24 in total", async () => {
      await nav("用户管理").click();
      await page.waitForURL(/\/users$/);
      await page.getByRole("heading", { name: "用户管理" }).waitFor();
      await page.waitForFunction(
        () =>
          document.querySelectorAll('[data-active] tbody [data-slot="table-row"]:not([data-empty])')
            .length === 10,
      );
    });
    await step("two tabs are open", async () => {
      const tabs = page.locator('[data-slot="page-tabs"] [role="tab"]');
      await page.waitForFunction(
        () => document.querySelectorAll('[data-slot="page-tabs"] [role="tab"]').length === 2,
      );
      if ((await tabs.count()) !== 2) throw new Error(`tabs: ${await tabs.count()}`);
    });
    await step("filtering by keyword alice leaves 1 row", async () => {
      await page.getByLabel("关键词").fill("alice");
      await page.getByRole("button", { name: "查询" }).click();
      await page.waitForFunction(
        () =>
          document.querySelectorAll('[data-active] tbody [data-slot="table-row"]:not([data-empty])')
            .length === 1,
      );
      await page.getByRole("button", { name: "重置" }).click();
      await page.waitForFunction(
        () =>
          document.querySelectorAll('[data-active] tbody [data-slot="table-row"]:not([data-empty])')
            .length === 10,
      );
    });
    await step("create a user", async () => {
      await page.getByRole("button", { name: "新建用户" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("姓名").fill("Zoe Test");
      await dialog.getByLabel("邮箱").fill("zoe@example.com");
      await dialog.getByRole("button", { name: "保存" }).click();
      await page.getByText("已新建 Zoe Test").waitFor();
      await rows().filter({ hasText: "Zoe Test" }).waitFor();
    });
    await step("edit a user", async () => {
      await rows().filter({ hasText: "Zoe Test" }).getByRole("button", { name: "编辑" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("姓名").fill("Zoe Edited");
      await dialog.getByRole("button", { name: "保存" }).click();
      await page.getByText("已保存 Zoe Edited").waitFor();
      await rows().filter({ hasText: "Zoe Edited" }).waitFor();
    });
    await step("delete a user (confirm popover)", async () => {
      await rows().filter({ hasText: "Zoe Edited" }).getByRole("button", { name: "删除" }).click();
      await page.locator('[data-slot="popconfirm"]').getByRole("button", { name: "删除" }).click();
      await page.getByText("已删除 Zoe Edited").waitFor();
      await rows().filter({ hasText: "Zoe Edited" }).waitFor({ state: "detached" });
    });
    await step("go to page 2, switch tabs and back, still on page 2 (KeepAlive)", async () => {
      await page
        .locator('[data-slot="pagination"]')
        .getByRole("button", { name: "下一页" })
        .click();
      await page
        .locator('[data-slot="pagination"]')
        .getByText(/第 2/)
        .or(page.locator('[data-slot="pagination"] [aria-current="page"]', { hasText: "2" }))
        .first()
        .waitFor();
      await page.waitForURL(/\/users$/);
      const firstOnPage2 = await rows().first().textContent();
      await page
        .locator('[data-slot="page-tabs"] [role="tab"]')
        .filter({ hasText: "仪表盘" })
        .click();
      await page.waitForURL(/\/dashboard$/);
      await page
        .locator('[data-slot="page-tabs"] [role="tab"]')
        .filter({ hasText: "用户管理" })
        .click();
      await page.waitForURL(/\/users$/);
      const again = await rows().first().textContent();
      if (again !== firstOnPage2) throw new Error(`page reset: ${firstOnPage2} → ${again}`);
    });
    await step("switch to English from the toolbar: menu and page follow", async () => {
      await page.getByRole("button", { name: "语言" }).click();
      await page.getByRole("menuitemcheckbox", { name: "English" }).click();
      await nav("Users").waitFor();
      await page.getByRole("heading", { name: "Users" }).waitFor();
      if ((await page.evaluate(() => document.documentElement.lang)) !== "en")
        throw new Error("html lang");
    });
    await step(
      "switch to dark from the toolbar: <html data-skein-mode=dark>, kept after reload",
      async () => {
        await page.getByRole("button", { name: "Appearance" }).click();
        await page.getByRole("menuitemcheckbox", { name: "Dark" }).click();
        await page.waitForFunction(() => document.documentElement.dataset.skeinMode === "dark");
        await page.reload();
        const mode = await page.evaluate(() => document.documentElement.dataset.skeinMode);
        if (mode !== "dark") throw new Error(`after reload: ${mode}`);
        await page.getByRole("heading", { name: "Users" }).waitFor();
      },
    );
    await step("preferences: switch to top layout", async () => {
      await page.getByRole("button", { name: "Preferences" }).click();
      const drawer = page.getByRole("dialog");
      await drawer.waitFor();
      await drawer.getByRole("radio", { name: /top/i }).first().click();
      await page.waitForFunction(
        () =>
          document.querySelector('[data-slot="admin-layout"]')?.getAttribute("data-layout") ===
          "top",
      );
      await page.keyboard.press("Escape");
    });
    await step("an unknown address shows 404", async () => {
      await page.goto(`${base}/no-such-page`);
      await page.getByText("Page not found").waitFor();
    });
    await step("signing out returns to /login", async () => {
      await page.goto(`${base}/dashboard`);
      await page.getByRole("button", { name: "Account" }).click();
      await page.getByRole("menuitem", { name: "Sign out" }).click();
      await page.waitForURL(/\/login$/);
    });
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
  const steps = await adminFlow(process.argv[2] ?? "http://localhost:5173");
  process.exit(steps.every((s) => s.ok) ? 0 : 1);
}
