// A CRUD page generated from OpenAPI, in a real browser: rows load from the mock, create / edit / delete work.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

/**
 * @param {string} base
 * @param {{ path: string; menu: string; create: [string, string][]; rename: [string, string]; expectRows: number; detail?: boolean; batch?: boolean; sort?: { column: string; asked: RegExp }; search?: { keyword: string; status: string } }} page
 * `detail`: the document reads one item, so the table's name column opens a detail page. `batch`: the rows can be
 * ticked (export, delete together). `sort`: a header that sorts, and the query the API is asked. `search`: a keyword
 * and a value of the one condition the API takes, both asked of the API.
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
    if (page.search) {
      const { keyword, status } = page.search;
      await step(
        `${page.path}: the keyword and a condition chip are asked of the API and narrow the rows`,
        async () => {
          const all = await rows().count();
          const asked = (re) => tab.waitForRequest((r) => re.test(r.url()));
          const keywordAsked = asked(new RegExp(`[?&]q=${keyword}`));
          await tab.getByLabel("Keyword", { exact: true }).fill(keyword);
          await tab.getByLabel("Keyword", { exact: true }).press("Enter");
          await keywordAsked;
          await tab.waitForFunction((all) => {
            const n = document.querySelectorAll(
              '[data-active] tbody [data-slot="table-row"]:not([data-empty])',
            ).length;
            return n > 0 && n < all;
          }, all);
          // The only condition the API takes is on its status: the chip's editor starts with it
          const popup = tab.locator('[data-slot="popover"]').last();
          await tab.getByRole("button", { name: "筛选", exact: true }).click();
          await popup.getByRole("combobox", { name: "值" }).click();
          await tab.getByRole("option", { name: status, exact: true }).click();
          const statusAsked = asked(new RegExp(`status=${status}`));
          await popup.getByRole("button", { name: "确定" }).click();
          await statusAsked;
          await tab.getByRole("button", { name: "重置", exact: true }).click();
          await tab.waitForFunction(
            (all) =>
              document.querySelectorAll(
                '[data-active] tbody [data-slot="table-row"]:not([data-empty])',
              ).length === all,
            all,
          );
        },
      );
    }
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
    if (page.sort) {
      const { column, asked } = page.sort;
      await step(
        `${page.path}: ${column} sorts: the API is asked, the rows come back in order`,
        async () => {
          const pane = '[data-slot="keep-alive-pane"][data-active]';
          const index = await tab
            .locator(`${pane} thead th`)
            .evaluateAll(
              (heads, name) => heads.findIndex((h) => h.textContent?.trim().startsWith(name)),
              column,
            );
          if (index < 0) throw new Error(`no column ${column}`);
          const ordered = (direction) =>
            tab.waitForFunction(
              ({ index, direction }) => {
                const values = [
                  ...document.querySelectorAll(
                    '[data-active] tbody [data-slot="table-row"]:not([data-empty])',
                  ),
                ].map((tr) =>
                  Number.parseFloat((tr.children[index].textContent ?? "").replace(/[^\d.-]/g, "")),
                );
                const pairs = values.slice(1).map((v, i) => [values[i], v]);
                return (
                  values.length > 1 &&
                  pairs.some(([a, b]) => a !== b) &&
                  pairs.every(([a, b]) => (direction === "asc" ? a <= b : a >= b))
                );
              },
              { index, direction },
            );
          const head = tab.locator(`${pane} thead`).getByRole("columnheader", { name: column });
          const request = tab.waitForRequest((r) => asked.test(r.url()));
          await head.getByRole("button").click();
          await request;
          await ordered("asc");
          await head.getByRole("button").click();
          await ordered("desc");
        },
      );
    }
    if (page.batch) {
      /** The CSV the click on `button` downloads, as lines. */
      const csvOf = async (button) => {
        const [download] = await Promise.all([
          tab.waitForEvent("download"),
          tab.getByRole("button", { name: button, exact: true }).click(),
        ]);
        const text = await readFile(await download.path(), "utf8");
        return text
          .replace(/^\uFEFF/, "")
          .trim()
          .split(/\r?\n/);
      };
      await step(`${page.path}: export the rows on screen as CSV`, async () => {
        const lines = await csvOf("导出 CSV");
        const shown = await rows().count();
        if (lines.length !== shown + 1) throw new Error(`${lines.length} lines for ${shown} rows`);
      });
      await step(`${page.path}: tick two rows, export them, delete them together`, async () => {
        const texts = [];
        for (const i of [0, 1]) {
          texts.push(((await rows().nth(i).textContent()) ?? "").trim());
          await rows().nth(i).getByRole("checkbox").check();
        }
        await tab.getByText("已选 2 项").waitFor();
        const lines = await csvOf("导出选中");
        if (lines.length !== 3) throw new Error(`${lines.length} lines for a header and 2 rows`);
        await tab.getByRole("button", { name: "删除选中" }).click();
        await tab.locator('[data-slot="popconfirm"]').getByRole("button", { name: "删除" }).click();
        await tab.getByText("已删除 2 条").first().waitFor();
        await tab.getByText("已选 2 项").waitFor({ state: "detached" });
        // Gone from the list, whatever page they were on (rows of a name that repeats keep the others)
        for (const text of texts)
          await rows().filter({ hasText: text }).first().waitFor({ state: "detached" });
      });
    }
    // The page's `<resource>:read` (orders, catalog-products): the viewer has none of them
    await step(`${page.path}: a user without the permission gets the 403 page`, async () => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      try {
        const other = await context.newPage();
        await other.goto(`${base}/login`);
        await other.getByLabel("用户名", { exact: true }).fill("viewer");
        await other.getByLabel("密码", { exact: true }).fill("viewer123");
        await other.getByRole("button", { name: "登录" }).click();
        await other.waitForURL(/dashboard/);
        await other.goto(`${base}${page.path}`);
        await other.getByText("没有访问权限", { exact: true }).waitFor();
      } finally {
        await context.close();
      }
    });
    await step(`${page.path}: no errors`, async () => {
      if (errors.length > 0) throw new Error(errors.slice(0, 3).join(" | "));
    });
  } finally {
    await browser.close();
  }
  return steps;
}
