import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadManifest } from "../docs.js";
import { ROOT } from "../paths.js";

/** The contract this CLI was released with (scripts/build.ts copies it from @skeinui/ui's manifest). */
export const BUNDLED_CONTRACT = join(ROOT, "contract.json");

/**
 * The value lists of @skeinui/ui's contract (slots, variants, required tokens…) that theme styles are
 * checked against: from the @skeinui/ui installed near `from` (it matches the project's components), else
 * the copy that ships with the CLI (e.g. creating a project before anything is installed).
 *
 * @param {string} [from]
 * @returns {Record<string, readonly (string | number)[]>}
 */
export function loadContract(from = process.cwd()) {
  try {
    return loadManifest(from).contract;
  } catch (error) {
    if (existsSync(BUNDLED_CONTRACT)) return JSON.parse(readFileSync(BUNDLED_CONTRACT, "utf8"));
    throw error;
  }
}
