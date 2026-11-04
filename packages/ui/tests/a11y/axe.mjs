#!/usr/bin/env node
/**
 * Accessibility scan: opens the playground's full-page AdminLayout demo in a real Chrome, injects axe-core, and scans each
 * combination of "theme style x light / dark x layout x state", reporting only **new** violations (known exceptions go in known.json, with reasons).
 * jsdom does no rendering, so axe's color contrast ratio, focus order and similar checks need a real browser; that is why this isn't part of `vp test`.
 *
 * Usage (first start the playground in another terminal: `vp run skein-doc#dev`, port 5175):
 *   vp run a11y                                       everything: 5 theme styles x light / dark x 6 layouts x each layout's states
 *   vp run a11y -- --styles=default,heroui            scan only some theme styles
 *   vp run a11y -- --modes=light --layouts=side,mix   scan only light mode and some layouts
 *   vp run a11y -- --all                              also list known exceptions (with reasons)
 *   Environment variables: A11Y_URL (default http://localhost:5175), A11Y_CHANNEL (default chrome), A11Y_WORKERS (default 3)
 *
 * Exit codes: 0 no new violations; 1 new violations; 2 scan did not complete (server not running / a task still failed after retries).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const KNOWN = JSON.parse(readFileSync(join(HERE, "known.json"), "utf8"));
const URL_BASE = process.env.A11Y_URL ?? "http://localhost:5175";
const CHANNEL = process.env.A11Y_CHANNEL ?? "chrome";
const WORKERS = Number(process.env.A11Y_WORKERS ?? 3);

const ALL_STYLES = ["default", "shadcn", "heroui", "antd"];
/** Name -> the part written into the settings (`side+header` is the side layout + toolbar in the header). */
const LAYOUTS = {
  side: {},
  "side+header": { toolbar: "header" },
  top: { layout: "top" },
  mix: { layout: "mix" },
  column: { layout: "column" },
  boxed: { layout: "boxed" },
};

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const list = (v, all) => (v ? String(v).split(",") : all);
const styles = list(args.styles, ALL_STYLES);
const modes = list(args.modes, ["light", "dark"]);
const layouts = list(args.layouts, Object.keys(LAYOUTS));

/** The ids Base UI generates for overlays differ every time: normalize them so they can be deduplicated and matched. */
const normalize = (target) => target.replace(/(?:base-ui-)?_r_[0-9a-z]+_/g, "_r_*_");

function matchKnown(v) {
  return KNOWN.find(
    (k) =>
      k.rule === v.rule &&
      (!k.styles || k.styles.includes(v.style)) &&
      (!k.modes || k.modes.includes(v.mode)) &&
      (!k.states || k.states.includes(v.state)) &&
      (!k.target || new RegExp(k.target).test(v.target)),
  );
}

async function scan(context, job) {
  const { style, mode, layout } = job;
  const settings = {
    version: 1,
    layout: layout.startsWith("side") ? "side" : layout,
    menuVariant: "modern",
    showTabs: true,
    tabVariant: "chrome",
    themeOverrides: {},
    themeStyle: style,
    ...LAYOUTS[layout],
  };
  const violations = [];
  const run = async (page, state) => {
    await page.evaluate(AXE);
    const res = await page.evaluate(() =>
      window.axe.run(document, { resultTypes: ["violations"] }),
    );
    for (const v of res.violations)
      for (const n of v.nodes)
        violations.push({
          rule: v.id,
          impact: v.impact,
          style,
          mode,
          layout,
          state,
          target: normalize(n.target.join(" ")),
          html: n.html.slice(0, 120),
          summary: (n.failureSummary ?? "").split("\n")[1]?.trim() ?? "",
        });
  };
  const open = async (width) => {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 760 });
    await page.addInitScript(
      (value) => localStorage.setItem("skein.ui.admin-layout.settings", value),
      JSON.stringify(settings),
    );
    await page.goto(`${URL_BASE}/__admin-layout?lang=zh-CN&mode=${mode}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForSelector("[data-slot=admin-layout]", { timeout: 60000 });
    await page.waitForTimeout(900);
    return page;
  };
  const account = (page) => page.locator("[aria-label='账户']").first();

  // Desktop: expanded, user menu open
  let page = await open(1280);
  try {
    await run(page, "expanded");
    if (await account(page).count()) {
      await account(page).click();
      await page.waitForTimeout(500);
      await run(page, "user menu");
      await page.keyboard.press("Escape");
    }
    // Sidebar collapsed (sidebar-type layouts): once collapsed the toolbar keeps only the avatar, and the user menu must contain the collapsed entries
    const trigger = page.locator("[data-slot=admin-layout] [data-slot=sidebar-trigger]").first();
    if ((layout.startsWith("side") || layout === "boxed") && (await trigger.count())) {
      await trigger.evaluate((el) => el.click());
      await page.waitForTimeout(800);
      await run(page, "collapsed");
      if (await account(page).count()) {
        await account(page).click();
        await page.waitForTimeout(500);
        await run(page, "collapsed+user menu");
        await page.keyboard.press("Escape");
      }
    }
  } finally {
    await page.close();
  }
  // Narrow screen: open the navigation drawer (the drawer takes a moment to slide in, otherwise axe picks up the mask's color)
  page = await open(390);
  try {
    const opener = page
      .locator(
        "[data-slot=admin-layout-menu-button], [data-slot=admin-layout-header] [data-slot=sidebar-trigger], [data-slot=admin-layout-bar] [data-slot=sidebar-trigger]",
      )
      .first();
    if (await opener.count()) {
      await opener.click();
      await page.waitForTimeout(1500);
      await run(page, "mobile drawer");
    }
  } finally {
    await page.close();
  }
  return violations;
}

async function pool(tasks, size, run) {
  const results = Array.from({ length: tasks.length });
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, tasks.length) }, async () => {
      while (next < tasks.length) {
        const i = next++;
        results[i] = await run(tasks[i]);
      }
    }),
  );
  return results;
}

async function main() {
  try {
    const res = await fetch(URL_BASE, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    console.error(
      `Cannot reach ${URL_BASE}. Start the playground in another terminal first: vp run skein-doc#dev`,
    );
    process.exit(2);
  }
  for (const l of layouts)
    if (!(l in LAYOUTS)) {
      console.error(`Unknown layout ${l}, choose from: ${Object.keys(LAYOUTS).join(", ")}`);
      process.exit(2);
    }
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const jobs = styles.flatMap((style) =>
    modes.flatMap((mode) => layouts.map((layout) => ({ style, mode, layout }))),
  );
  console.log(`Scanning ${jobs.length} combinations (${WORKERS} in parallel)…`);
  const t0 = Date.now();
  const failures = [];
  const found = [];
  await pool(jobs, WORKERS, async (job) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const context = await browser.newContext();
      try {
        found.push(...(await scan(context, job)));
        return;
      } catch (error) {
        if (attempt === 3)
          failures.push(
            `${job.style}/${job.mode}/${job.layout}: ${String(error.message).split("\n")[0]}`,
          );
      } finally {
        await context.close();
      }
    }
  });
  await browser.close();
  if (failures.length) {
    console.error(`${failures.length} combinations could not be scanned:`);
    for (const f of failures.slice(0, 10)) console.error(`  ${f}`);
    process.exit(2);
  }
  console.log(`Done in ${Math.round((Date.now() - t0) / 1000)} s\n`);

  // Dedupe: the same rule + the same target counts as one, recording which combinations it appears in
  const groups = new Map();
  for (const v of found) {
    const key = `${v.rule}|${v.target}`;
    if (!groups.has(key)) groups.set(key, { ...v, known: matchKnown(v), where: [] });
    const g = groups.get(key);
    g.where.push(`${v.style}/${v.mode}/${v.layout}/${v.state}`);
    // If any item in a group is not in the known exceptions, the whole group counts as new
    if (!matchKnown(v)) g.known = undefined;
  }
  const rows = [...groups.values()].sort((a, b) => a.rule.localeCompare(b.rule));
  const fresh = rows.filter((r) => !r.known);
  const known = rows.filter((r) => r.known);
  const show = (r) => {
    console.log(`[${r.impact}] ${r.rule} | ${r.target}`);
    console.log(`    ${r.html}`);
    if (r.summary) console.log(`    ${r.summary}`);
    const extra = r.where.length > 4 ? ` … ${r.where.length} in total` : "";
    console.log(`    found in: ${r.where.slice(0, 4).join(", ")}${extra}`);
  };

  if (args.all && known.length) {
    console.log("-- known exceptions (known.json) --");
    const byReason = new Map();
    for (const r of known) byReason.set(r.known.reason, (byReason.get(r.known.reason) ?? 0) + 1);
    for (const [reason, n] of byReason) console.log(`  ${n} groups: ${reason}`);
    console.log("");
  }
  if (fresh.length) {
    console.log(`✗ ${fresh.length} new violation groups:\n`);
    for (const r of fresh) show(r);
    console.log(
      `\nPlus ${known.length} known exception groups (see --all). To add one to the known exceptions, write it to tests/a11y/known.json (a reason is required).`,
    );
    process.exit(1);
  }
  console.log(
    `✓ No new violations (${known.length} known exception groups, --all shows the reasons)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
