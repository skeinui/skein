import { readFileSync } from "node:fs";
import { join } from "node:path";

export const ROOT = join(import.meta.dirname, "..");
export const TEMPLATES_DIR = join(ROOT, "templates");
/** The monorepo's packages/, used by `--local` to point a project at the packages in this checkout. */
export const REPO_PACKAGES_DIR = join(ROOT, "..");

export const { version: VERSION } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
