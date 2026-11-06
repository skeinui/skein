#!/usr/bin/env node
/**
 * Visual regression (size / color snapshots): opens each component page of the playground in a real Chrome, measures the
 * width, height, background, text and border colors and radius of every `data-slot` element, and the size, stroke and color
 * of an icon (svg) it holds directly, merges them per page into a set of "slot|w|h|bg|radius|fg|border|icon",
 * and compares against the baseline stored in the repo.
 * Purpose: after changing CSS (radius, density, color theme, layering...), see at a glance **which sizes / colors of which components changed**,
 * and that the default appearance stays unchanged where it should. jsdom does no layout and can't measure these, so this isn't part of `vp test`.
 *
 * Usage (first start the playground in another terminal: `vp run skein-doc#dev`, port 5175):
 *   vp run --filter @skeinui/ui snapshot                  compare everything, exit code 1 on differences
 *   vp run --filter @skeinui/ui snapshot -- --update      write the current result as the new baseline
 *   vp run --filter @skeinui/ui snapshot -- --styles=heroui,antd --pages=card,table
 *   Environment variables: SNAPSHOT_URL (default http://localhost:5175), SNAPSHOT_CHANNEL (default chrome), SNAPSHOT_WORKERS (default 4)
 *
 * Baselines are in tests/visual/baseline/: one file per "theme style x mode" (light / dark, default density, including colors and radius),
 * plus one size-only file per "theme style x compact (light)", and admin-layout-*.json for the six AdminLayout layouts.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, "baseline");
const URL_BASE = process.env.SNAPSHOT_URL ?? "http://localhost:5175";
const CHANNEL = process.env.SNAPSHOT_CHANNEL ?? "chrome";
const WORKERS = Number(process.env.SNAPSHOT_WORKERS ?? 4);

const ALL_STYLES = ["default", "shadcn", "heroui", "antd"];
const PAGES = [
  "accordion",
  "alert",
  "artifact",
  "attachment",
  "autocomplete",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "calendar",
  "card",
  "cascader",
  "chat-thread",
  "checkbox",
  "citation",
  "code-block",
  "color-picker",
  "combobox",
  "command",
  "context-meter",
  "date-picker",
  "descriptions",
  "dialog",
  "diff-view",
  "drawer",
  "feedback",
  "float-button",
  "image-grid",
  "input",
  "kanban",
  "kbd",
  "layout",
  "markdown",
  "marquee",
  "mentions",
  "menu",
  "menubar",
  "navigation-menu",
  "number-field",
  "otp-field",
  "page-tabs",
  "pagination",
  "plan",
  "popover",
  "progress",
  "queue",
  "quote",
  "radio",
  "segmented",
  "select",
  "sidebar",
  "slider",
  "sortable",
  "suggestions",
  "switch",
  "table",
  "tabs",
  "tag",
  "time-picker",
  "toggle",
  "tool-call",
  "toolbar",
  "tooltip",
  "tree-select",
  "web-preview",
];
/** Overlays that exist only once opened: click the trigger, then measure the elements inside the overlay. */
const OVERLAYS = {
  "overlay:dialog": { page: "dialog", click: "main button" },
  "overlay:popover": { page: "popover", click: "main button" },
  "overlay:select": { page: "select", click: "main [data-slot=select-trigger]" },
  "overlay:menu": { page: "menu", click: "main [data-slot=menu-trigger], main button" },
  "overlay:date-picker": {
    page: "date-picker",
    click: "main [data-slot=select-icon], main [data-slot=date-input]",
  },
  "overlay:combobox": { page: "combobox", click: "main [data-slot=combobox-trigger]" },
};
/** Elements that are always moving / appear asynchronously: measuring them only produces jitter, so skip them. */
const IGNORE_SLOTS = new Set([
  "button-spinner",
  "spinner",
  "progress-circle-indicator",
  "progress-indicator",
  "tabs-indicator",
  "avatar-fallback",
  "avatar-image",
  "mermaid-body",
  "mermaid-status",
  "image-placeholder",
  "image",
  "skeleton",
  "shimmer-text",
  "typing",
  "toast",
  "marquee-track",
  "marquee-item",
  "border-beam",
  "segmented-thumb",
  "carousel-track",
  "web-preview-frame",
  // Streaming output / progress animation / async rendering: two measurements would differ
  "markdown",
  "markdown-caret",
  "markdown-math",
  "progress-value",
  "web-preview-loading",
  "plan-spinner",
  "plan-bar-fill",
  "plan-item-label",
  "plan-item-body",
  "tool-call-spinner",
  // Images: the hover mask follows the mouse, and network images only have a size once loaded
  "image-mask",
  "markdown-image",
  // A progress bar's width follows the animation
  "kanban-card-progress-bar",
]);
// side-header is an old layout name: when settings are read back it is converted to side + toolbar: header (see normalizeSettings), the baseline keeps this name
const LAYOUTS = ["side", "side-header", "top", "mix", "column", "boxed"];

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const styles = args.styles ? String(args.styles).split(",") : ALL_STYLES;
const onlyPages = args.pages ? new Set(String(args.pages).split(",")) : null;
const update = Boolean(args.update);

/**
 * Measured in the page: only elements with a size, key = slot[/variant]|w|h[|bg|radius|fg|border|icon]: fg is the text
 * color, border the top border's color when it has one, icon "size/stroke/color" of an svg child (the stroke in px as
 * drawn, so 1.5 whatever the viewBox), e.g. a menu icon a step lighter than its label or a tab icon's stroke.
 */
function measureScript(withLook, slotFilter, scope) {
  return `(() => {
    const ignore = new Set(${JSON.stringify([...IGNORE_SLOTS])});
    const filter = ${slotFilter ? slotFilter.toString() : "null"};
    const out = new Set();
    const round = (n) => Math.round(n * 2) / 2;
    for (const e of document.querySelectorAll(${JSON.stringify(scope ?? "main [data-slot], body > div:not(#root) [data-slot], body > [data-slot]")})) {
      const slot = e.dataset.slot;
      if (ignore.has(slot) || (filter && !filter(slot))) continue;
      const b = e.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      const cs = getComputedStyle(e);
      let key = slot + (e.dataset.variant ? "/" + e.dataset.variant : "") + "|" + round(b.width) + "|" + round(b.height);
      ${
        withLook
          ? `key += "|" + cs.backgroundColor + "|" + cs.borderTopLeftRadius + "|" + cs.color;
      key += "|" + (parseFloat(cs.borderTopWidth) > 0 ? cs.borderTopColor : "-");
      const svg = [...e.children].find((c) => c.tagName === "svg");
      if (svg) {
        const sb = svg.getBoundingClientRect();
        const ss = getComputedStyle(svg);
        const box = svg.viewBox?.baseVal?.width || sb.width;
        const stroke =
          ss.stroke === "none" ? "-" : Math.round((parseFloat(ss.strokeWidth) * sb.width * 100) / box) / 100;
        key += "|" + round(sb.width) + "/" + stroke + "/" + ss.color;
      }`
          : ""
      }
      out.add(key);
    }
    return [...out].sort();
  })()`;
}

async function settle(page) {
  await page.waitForSelector("main, [data-slot=admin-layout]", { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

/**
 * A batch = all pages under the same "theme style x mode x density": the playground is loaded only once, then history.pushState + popstate
 * is used for in-site navigation (which is how App tracks the path), and theme style / mode / density are changed directly via attributes on <html>. An order of magnitude faster than reloading for each page.
 */
async function measureBatch(context, { style, mode, compact, pages, look }) {
  const page = await context.newPage();
  const out = {};
  try {
    await page.goto(
      `${URL_BASE}/button?themeStyle=${style}&mode=${mode}${compact ? "&compact=on" : ""}`,
      {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      },
    );
    await settle(page);
    await page.evaluate(
      ({ style, mode, compact }) => {
        const root = document.documentElement;
        root.dataset.skeinTheme = style;
        root.dataset.skeinMode = mode;
        if (compact) root.dataset.skeinDensity = "compact";
        else delete root.dataset.skeinDensity;
      },
      { style, mode, compact },
    );
    for (const slug of pages) {
      const started = Date.now();
      const overlay = OVERLAYS[slug];
      const path = overlay ? overlay.page : slug;
      await page.evaluate((path) => {
        window.history.pushState(null, "", `/${path}${window.location.search}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, path);
      await page
        .waitForFunction(
          (path) => location.pathname === `/${path}` && document.querySelector("main [data-slot]"),
          path,
          {
            timeout: 20000,
          },
        )
        .catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(350);
      if (overlay) {
        await page
          .locator(overlay.click)
          .first()
          .click({ timeout: 5000 })
          .catch(() => {});
        await page.waitForTimeout(450);
      }
      out[slug] = await page.evaluate(measureScript(look));
      if (args.verbose && Date.now() - started > 3000)
        console.log(
          `    slow page: ${style}/${mode}${compact ? "/compact" : ""} ${slug} ${Math.round((Date.now() - started) / 1000)}s`,
        );
      if (overlay) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(250);
      }
    }
    return out;
  } finally {
    await page.close();
  }
}

async function measureAdmin(context, { style, mode, layout }) {
  // A context of its own: the layout is set in localStorage before the page loads, and pages running at the same
  // time in a shared context write theirs back, so a page could come up in another job's layout
  const own = await context.browser().newContext({ viewport: { width: 1400, height: 900 } });
  const page = await own.newPage();
  try {
    await page.addInitScript(
      (value) => {
        localStorage.setItem("skein.ui.admin-layout.settings", value);
      },
      JSON.stringify({
        version: 1,
        layout,
        menuVariant: "modern",
        showTabs: true,
        tabVariant: "chrome",
        themeOverrides: {},
      }),
    );
    await page.goto(`${URL_BASE}/__admin-layout?themeStyle=${style}&mode=${mode}&lang=en`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await settle(page);
    // The sidebar and others have transition animations: it counts as stable only when two consecutive measurements give the same width (transitions can drag on when the machine is busy)
    await page
      .waitForFunction(
        () => {
          const w = document
            .querySelector("[data-slot=admin-layout-body]")
            ?.getBoundingClientRect().width;
          const w2 = (window.__w2 = window.__w1 === w ? w : undefined);
          window.__w1 = w;
          return w2 !== undefined;
        },
        null,
        { polling: 500, timeout: 20000 },
      )
      .catch(() => {});
    await page.waitForTimeout(500);
    const slotFilter = (s) => /^(admin-layout|sidebar|page-tabs|sidemenu|breadcrumb)/.test(s);
    // The scope is the whole AdminLayout root (sidebar, header and tab bar are all inside; the side layout has no <main>, so per-page selectors can't measure them)
    return await page.evaluate(
      measureScript(
        true,
        slotFilter,
        '[data-slot="admin-layout"], [data-slot="admin-layout"] [data-slot]',
      ),
    );
  } finally {
    await own.close();
  }
}

/** Run a batch of tasks concurrently. */
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
      `Can't reach ${URL_BASE}. Start the playground in another terminal first: vp run skein-doc#dev`,
    );
    process.exit(2);
  }
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });

  const pages = [...PAGES, ...Object.keys(OVERLAYS)].filter((p) => !onlyPages || onlyPages.has(p));
  /** @type {Record<string, Record<string, string[]>>} file name -> page -> keys */
  const result = {};
  const jobs = [];
  for (const style of styles) {
    for (const mode of ["light", "dark"]) {
      const file = `${style}-${mode}`;
      result[file] = {};
      jobs.push({ file, style, mode, compact: false, pages, look: true });
    }
    const file = `${style}-compact`;
    result[file] = {};
    jobs.push({ file, style, mode: "light", compact: true, pages, look: false });
    for (const mode of ["light", "dark"]) {
      const adminFile = `admin-layout-${style}-${mode}`;
      result[adminFile] = {};
      for (const layout of LAYOUTS)
        jobs.push({ file: adminFile, style, mode, layout, admin: true });
    }
  }
  console.log(`Measuring ${jobs.length} batches (${WORKERS} in parallel)…`);
  const t0 = Date.now();
  const failures = [];
  await pool(jobs, WORKERS, async (job) => {
    // The first page compile on a cold-started dev server can be very slow: retry twice on failure
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (job.admin) result[job.file][job.layout] = await measureAdmin(context, job);
        else Object.assign(result[job.file], await measureBatch(context, job));
        if (args.verbose) console.log(`  done ${job.file}${job.admin ? " / " + job.layout : ""}`);
        return;
      } catch (error) {
        if (attempt === 3)
          failures.push(
            `${job.file}${job.admin ? " / " + job.layout : ""}: ${String(error.message).split("\n")[0]}`,
          );
      }
    }
  });
  if (failures.length) {
    await browser.close();
    console.error(
      `${failures.length} batches failed to measure; not writing or comparing the baseline:`,
    );
    for (const f of failures.slice(0, 10)) console.error(`  ${f}`);
    process.exit(2);
  }
  await browser.close();
  console.log(`Measured in ${Math.round((Date.now() - t0) / 1000)}s`);

  mkdirSync(BASELINE, { recursive: true });
  if (update) {
    for (const [file, data] of Object.entries(result)) {
      const path = join(BASELINE, `${file}.json`);
      // Only update the pages measured this time, keep the original for pages not measured (incremental update with --pages)
      let merged = data;
      if (onlyPages && existsSync(path))
        merged = { ...JSON.parse(readFileSync(path, "utf8")), ...data };
      const sorted = Object.fromEntries(
        Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)),
      );
      writeFileSync(path, JSON.stringify(sorted, null, 0).replace(/],"/g, '],\n"') + "\n");
    }
    console.log(`Baseline updated: ${Object.keys(result).length} files`);
    return;
  }

  let changed = 0;
  for (const [file, data] of Object.entries(result)) {
    const path = join(BASELINE, `${file}.json`);
    if (!existsSync(path)) {
      console.log(`✗ ${file}: no baseline (run --update first)`);
      changed++;
      continue;
    }
    const base = JSON.parse(readFileSync(path, "utf8"));
    for (const [page, keys] of Object.entries(data)) {
      const before = new Set(base[page] ?? []);
      const after = new Set(keys);
      const removed = [...before].filter((k) => !after.has(k));
      const added = [...after].filter((k) => !before.has(k));
      if (!removed.length && !added.length) continue;
      changed++;
      console.log(`✗ ${file} / ${page}: ${removed.length} removed, ${added.length} added`);
      for (const k of removed.slice(0, 6)) console.log(`    - ${k}`);
      for (const k of added.slice(0, 6)) console.log(`    + ${k}`);
      if (removed.length > 6 || added.length > 6) console.log("    …");
    }
  }
  if (changed) {
    console.log(
      `\n${changed} differences from the baseline. Once they are confirmed as intended, update the baseline with --update.`,
    );
    process.exit(1);
  }
  console.log("✓ everything matches the baseline");
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
