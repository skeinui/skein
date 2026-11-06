// A CRUD page generated from OpenAPI, in a real browser: rows load from the mock, create / edit / delete work.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

/**
 * @param {string} base
 * @param {{ path: string; menu: string; create: [string, string][]; rename: [string, string]; expectRows: number; detail?: boolean }} page
 * `detail`: the document reads one item, so the table's name column opens a detail page.
 */
export async function crudFlow(base, page, { log = console.log } = {}) {
  const browser = await chromium.launch({ channel: process.env.E2E_CHANNEL ?? "chrome" });
  const tab = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  tab.on("pageerror", (e) => errors.push(e.message));
  tab.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const rows = () =>
    tab.locator(
      '[data-slot="keep-alive-pane"][data-active] tbody [data-slot="table-row"]:not([data-empty])',
    );
  const steps = [];
  const step = async (name, fn) => {
    try {
      await fn();
      steps.push({ name, ok: true });
      log(`  ✓ ${name}`);
    } catch (error) {
      steps.push({ name, ok: false });
      log(`  ✗ ${name}: ${String(error.message).split("\n")[0]}`);
      await tab
        .screenshot({ path: `/tmp/skein-crud-${page.path.replaceAll("/", "-")}.png` })
        .catch(() => {});
    }
  };
  try {
    await tab.goto(`${base}/login`);
    await tab.getByRole("button", { name: "登录" }).click();
    await tab.waitForURL(/dashboard/);
    await step(
      `${page.path}: menu has "${page.menu}", opening it loads ${page.expectRows} rows from mock`,
      async () => {
        // A page of a group sits under the group's entry (a button, not a link): look for the text
        await tab
          .locator('[data-slot^="admin-layout"]')
          .getByText(page.menu, { exact: true })
          .first()
          .waitFor();
        await tab.goto(`${base}${page.path}`);
        await tab.waitForFunction(
          (n) =>
            document.querySelectorAll(
              '[data-active] tbody [data-slot="table-row"]:not([data-empty])',
            ).length === n,
          page.expectRows,
        );
      },
    );
    await step(`${page.path}: create`, async () => {
      await tab.getByRole("button", { name: "新建" }).click();
      const dialog = tab.getByRole("dialog");
      for (const [label, value] of page.create)
        await dialog.getByLabel(label, { exact: true }).fill(value);
      await dialog.getByRole("button", { name: "保存" }).click();
      await tab
        .getByText(/^已新建/)
        .first()
        .waitFor();
      await rows().filter({ hasText: page.create[0][1] }).first().waitFor();
    });
    await step(`${page.path}: edit`, async () => {
      await rows()
        .filter({ hasText: page.create[0][1] })
        .first()
        .getByRole("button", { name: "编辑" })
        .click();
      const dialog = tab.getByRole("dialog");
      await dialog.getByLabel(page.rename[0], { exact: true }).fill(page.rename[1]);
      await dialog.getByRole("button", { name: "保存" }).click();
      await rows().filter({ hasText: page.rename[1] }).first().waitFor();
    });
    await step(`${page.path}: delete`, async () => {
      await rows()
        .filter({ hasText: page.rename[1] })
        .first()
        .getByRole("button", { name: "删除" })
        .click();
      await tab.locator('[data-slot="popconfirm"]').getByRole("button", { name: "删除" }).click();
      await rows().filter({ hasText: page.rename[1] }).first().waitFor({ state: "detached" });
    });
    if (page.detail)
      await step(`${page.path}: the name opens the detail page, back to the list`, async () => {
        const link = rows().first().locator("a").first();
        const name = (await link.textContent())?.trim() ?? "";
        await link.click();
        await tab.waitForURL(new RegExp(`${page.path}/[^/]+$`));
        await tab.getByRole("heading", { name, exact: true }).waitFor();
        await tab.getByRole("button", { name: "返回列表" }).click();
        await tab.waitForURL(new RegExp(`${page.path}$`));
      });
    await step(`${page.path}: no errors`, async () => {
      if (errors.length > 0) throw new Error(errors.slice(0, 3).join(" | "));
    });
  } finally {
    await browser.close();
  }
  return steps;
}
