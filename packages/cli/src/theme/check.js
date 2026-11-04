import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadContract } from "./contract.js";
import { coverageFor } from "./coverage.js";
/** Files that hold tokens rather than component rules. */
const TOKEN_FILES = ["tokens.css", "dark.css", "index.css"];
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
/** All declarations of the form `--ui-xxx:` (excluding var() references). */
export const declaredTokens = (css) =>
  new Set([...css.matchAll(/(--ui-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
/**
 * Checks a theme style directory against the contract of `@skeinui/ui`. `name` is the value of
 * `data-theme-style` the style is scoped to. Returns every problem found; an empty array means the style is complete.
 */
/**
 * @param {string} dir the theme style's directory
 * @param {string} name its `data-theme-style` value
 * @param {Record<string, readonly (string | number)[]>} [contract] default: the @skeinui/ui installed near `dir`
 * @returns {{ rule: string; file: string; message: string }[]}
 */
export function checkTheme(dir, name, contract = loadContract(dir)) {
  const { MODE_TOKENS, REQUIRED_TOKENS } = contract;
  const COVERAGE = coverageFor(contract);
  const issues = [];
  const report = (rule, file, message) => issues.push({ rule, file, message });
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".css")) : [];
  const read = (file) => stripComments(readFileSync(join(dir, file), "utf8"));
  const missingList = (items) => items.join(", ");
  for (const [file, required, rule] of [
    ["tokens.css", REQUIRED_TOKENS, "tokens"],
    ["dark.css", MODE_TOKENS, "dark-tokens"],
  ]) {
    if (!files.includes(file)) {
      report(rule, file, "file is missing");
      continue;
    }
    const declared = declaredTokens(read(file));
    const missing = required.filter((t) => !declared.has(t));
    if (missing.length > 0) report(rule, file, `missing tokens: ${missingList(missing)}`);
  }
  if (files.includes("index.css")) {
    const index = read("index.css");
    const missing = files.filter((f) => f !== "index.css" && !index.includes(`"./${f}"`));
    if (missing.length > 0)
      report("index-imports", "index.css", `not imported: ${missingList(missing)}`);
  } else {
    report("index-imports", "index.css", "file is missing");
  }
  const scope = `[data-theme-style="${name}"]`;
  for (const file of files) {
    const css = read(file);
    // Each rule's selector list, split on top-level commas
    const unscoped = [...css.matchAll(/([^{}]+)\{/g)]
      .flatMap((m) => m[1].split(/,(?![^(]*\))/))
      .map((sel) => sel.trim())
      .filter((sel) => sel.includes("[data-slot=") && !sel.includes(scope));
    if (unscoped.length > 0) {
      report("scope", file, `selectors not scoped to ${scope}: ${missingList(unscoped)}`);
    }
    // Values like these don't raise an error in CSS, the browser just silently drops the declaration
    const placeholders = [
      ...(css.match(/@[A-Z][A-Z_]{2,}/g) ?? []),
      ...(css.match(new RegExp(`:\\s*${name.replaceAll("-", "\\-")}[A-Z][A-Z_]+`, "g")) ?? []),
    ];
    if (placeholders.length > 0) {
      report("placeholder", file, `unreplaced placeholders: ${missingList(placeholders)}`);
    }
    if (!TOKEN_FILES.includes(file)) {
      // Colour values in component rules may only come from tokens
      const hex = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      if (hex.length > 0) report("no-hex", file, `hard-coded colours: ${missingList(hex)}`);
    }
  }
  for (const [file, selectors] of Object.entries(COVERAGE)) {
    if (!files.includes(file)) {
      report("coverage", file, "file is missing");
      continue;
    }
    const css = read(file);
    const uncovered = selectors.filter((s) => !css.includes(s));
    if (uncovered.length > 0) report("coverage", file, `missing: ${missingList(uncovered)}`);
  }
  // When a Menu / Popover in the group opens, Base UI inserts focus-guard <span>s after the trigger,
  // so the trigger is no longer :last-child and the group loses its rounded corner
  if (files.includes("button-group.css")) {
    const childPseudo = read("button-group.css").match(/:(first|last)-child/g) ?? [];
    if (childPseudo.length > 0) {
      report(
        "button-group-siblings",
        "button-group.css",
        "judge the first / last button by sibling buttons, not :first-child / :last-child",
      );
    }
  }
  return issues;
}
