import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { checkTheme, coverageFor, initTheme, loadContract } from "../src/theme/index.js";
import type { ThemeRule } from "../src/theme/index.js";

// The contract of this checkout's @skeinui/ui (packages/ui/manifest.json)
const contract = loadContract();
const { MODE_TOKENS, REQUIRED_TOKENS } = contract as Record<string, string[]>;
const COVERAGE = coverageFor(contract);

const PACKAGES_DIR = join(import.meta.dirname, "..", "..");
/** Bundled theme styles: packages/themes/<name>/ with a tokens.css (color/, density/, code/ have none). */
const THEMES_PACKAGE = join(PACKAGES_DIR, "themes");
const bundled = readdirSync(THEMES_PACKAGE, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(THEMES_PACKAGE, e.name, "tokens.css")))
  .map((e) => e.name);

const RULES: ThemeRule[] = [
  "tokens",
  "dark-tokens",
  "index-imports",
  "scope",
  "coverage",
  "no-hex",
  "button-group-siblings",
  "placeholder",
];

describe("bundled theme styles cover the whole contract", () => {
  test("there is at least one theme style", () => {
    expect(bundled.length).toBeGreaterThan(0);
  });

  describe.each(bundled)("%s", (name) => {
    const issues = checkTheme(join(THEMES_PACKAGE, name), name);
    test.each(RULES)("%s", (rule) => {
      const found = issues.filter((i) => i.rule === rule).map((i) => `${i.file}: ${i.message}`);
      expect(found).toEqual([]);
    });
  });
});

let tmp: string | undefined;
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = undefined;
});
const tempDir = () => (tmp = mkdtempSync(join(tmpdir(), "skein-theme-")));

describe("checkTheme finds problems", () => {
  test("missing directory: token files, index.css and every component file reported missing", () => {
    const issues = checkTheme(join(tempDir(), "nope"), "acme");
    expect(issues.filter((i) => i.message === "file is missing")).toHaveLength(
      Object.keys(COVERAGE).length + 3,
    );
  });

  test("each rule", () => {
    const dir = tempDir();
    const write = (file: string, css: string) => writeFileSync(join(dir, file), css);
    write("tokens.css", '[data-theme-style="acme"] { --ui-bg: white; }');
    write("dark.css", "");
    write("index.css", '@import "./tokens.css";');
    write("button.css", '[data-slot="button"] { color: #ff0000; border: @SEL_BG; }');
    write("button-group.css", '[data-theme-style="acme"] [data-slot="button"]:last-child {}');

    const rules = new Set(checkTheme(dir, "acme").map((i) => i.rule));
    expect([...rules].sort()).toEqual([...RULES].sort());
  });

  test("selectors and tokens inside comments don't count as covered", () => {
    const dir = tempDir();
    writeFileSync(join(dir, "button.css"), '/* [data-slot="button"] */');
    writeFileSync(join(dir, "tokens.css"), "/* --ui-bg: white; */");
    const issues = checkTheme(dir, "acme");
    expect(issues.find((i) => i.file === "button.css")?.message).toContain('[data-slot="button"]');
    expect(issues.find((i) => i.file === "tokens.css")?.message).toContain("--ui-bg");
  });
});

describe("initTheme writes a blank theme style", () => {
  test("all files present, index.css imports them all, only tokens and component rules left to fill", () => {
    const dir = join(tempDir(), "acme");
    const files = initTheme(dir, "acme");
    expect(files).toContain("tokens.css");
    expect(files).toContain("dark.css");
    for (const file of Object.keys(COVERAGE)) expect(files).toContain(file);

    const issues = checkTheme(dir, "acme");
    expect(new Set(issues.map((i) => i.rule))).toEqual(
      new Set<ThemeRule>(["tokens", "dark-tokens", "coverage"]),
    );
    // Every required token and every component file is still to do, nothing else
    expect(issues.filter((i) => i.rule === "coverage")).toHaveLength(Object.keys(COVERAGE).length);
    const tokens = readFileSync(join(dir, "tokens.css"), "utf8");
    for (const t of REQUIRED_TOKENS) expect(tokens).toContain(`${t}: ;`);
    const dark = readFileSync(join(dir, "dark.css"), "utf8");
    for (const t of MODE_TOKENS) expect(dark).toContain(`${t}: ;`);
  });

  test("rejects non-empty directories and invalid names", () => {
    const dir = tempDir();
    writeFileSync(join(dir, "x.css"), "");
    expect(() => initTheme(dir, "acme")).toThrow("not empty");
    expect(() => initTheme(join(dir, "y"), "Acme Theme")).toThrow("invalid theme style name");
  });
});

describe("contract.json", () => {
  test("the CLI's bundled contract matches @skeinui/ui's manifest (used before @skeinui/ui is installed)", async () => {
    const { BUNDLED_CONTRACT } = await import("../src/theme/contract.js");
    const bundled = JSON.parse(readFileSync(BUNDLED_CONTRACT, "utf8"));
    const manifest = JSON.parse(readFileSync(join(PACKAGES_DIR, "ui", "manifest.json"), "utf8"));
    expect(bundled).toEqual(manifest.contract);
    expect(Object.keys(coverageFor(bundled))).toEqual(Object.keys(COVERAGE));
  });
});
