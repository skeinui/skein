// What the app does when its browser storage holds something else than it wrote (an older version, another tool, a
// hand edit): every store reads it with a check, so the app opens anyway. Used by admin-flow.mjs and tenant-flow.mjs.

/**
 * Signs in in a fresh browser context, spoils the stored keys in three ways (wrong types, half an object with junk
 * in a list, text that isn't JSON), and after each reload the dashboard must open: no error page, a color mode.
 *
 * @param {import("playwright-core").Browser} browser
 * @param {string} base the app's address
 */
export async function storageSurvives(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    const page = await context.newPage();
    // The default language is Chinese here
    await page.goto(`${base}/login`);
    await page.getByRole("button", { name: "登录" }).click();
    await page.waitForURL(/\/dashboard$/);
    const prefix = await page.evaluate(() =>
      Object.keys(localStorage)
        .find((key) => key.endsWith("-auth"))
        .replace(/-auth$/, ""),
    );
    const write = (local, session) =>
      page.evaluate(
        ([prefix, local, session]) => {
          for (const [suffix, raw] of Object.entries(local))
            localStorage.setItem(prefix + suffix, raw);
          for (const [suffix, raw] of Object.entries(session))
            sessionStorage.setItem(prefix + suffix, raw);
        },
        [prefix, local, session],
      );
    const state = (value) => JSON.stringify({ state: value, version: 0 });
    // The session stays valid (the mock's token) so the page can open; its other fields are the ones spoiled
    const auth = (extra) => state({ token: "mock-token", ...extra });
    const opens = async (what) => {
      await page.reload();
      await page.getByRole("heading", { name: "仪表盘" }).waitFor();
      if (await page.getByText("页面出错了").count()) throw new Error(`${what}: the error page`);
      const mode = await page.evaluate(() => document.documentElement.dataset.skeinMode);
      if (mode !== "light" && mode !== "dark")
        throw new Error(`${what}: data-skein-mode is ${mode}`);
    };

    await write(
      {
        "-preferences": state({ mode: "purple", layout: "nope" }),
        "-auth": auth({ refreshToken: 5, user: 42, intendedPath: {}, expired: "yes" }),
        "-tenant": state({ tenantId: 5 }),
        "-toolbar": state({ header: "search" }),
      },
      { "-tabs": state({ tabs: "x" }) },
    );
    await opens("wrong types");

    await write(
      {
        "-preferences": state({ mode: "dark", layout: { layout: "top" } }),
        "-auth": auth({ intendedPath: "//elsewhere.example/x" }),
        "-toolbar": state({ header: [1, "search", null, {}, "no-such-tool"] }),
      },
      {
        "-tabs": state({
          tabs: [1, null, { key: 3 }, { key: "/dashboard", title: "仪表盘", pinned: true }],
        }),
      },
    );
    await opens("half an object, junk in a list");
    // What is kept is read as it should be: dark mode, the top layout
    const read = await page.evaluate(() => ({
      mode: document.documentElement.dataset.skeinMode,
      layout: document.querySelector('[data-slot="admin-layout"]')?.getAttribute("data-layout"),
    }));
    if (read.mode !== "dark" || read.layout !== "top")
      throw new Error(`the saved mode and layout were not read: ${JSON.stringify(read)}`);

    await write(
      { "-preferences": "{oops", "-tenant": "{oops", "-toolbar": "{oops" },
      { "-tabs": "{oops" },
    );
    await opens("text that isn't JSON");
  } finally {
    await context.close();
  }
}
