// Rewrites the mock template's public/mockServiceWorker.js (committed) with the msw version generated projects
// install (the catalog's), after an msw upgrade: `pnpm --filter @skeinui/cli msw-worker`
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { REPO_PACKAGES_DIR, TEMPLATES_DIR } from "../src/paths.js";

const workspace = parse(readFileSync(join(REPO_PACKAGES_DIR, "..", "pnpm-workspace.yaml"), "utf8"));
const version = String(workspace.catalog.msw).replace(/^[\^~]/, "");
const dir = join(TEMPLATES_DIR, "features", "mock", "files", "public");
execFileSync("pnpm", ["dlx", `msw@${version}`, "init", dir, "--no-save"], { stdio: "inherit" });
console.log(`mockServiceWorker.js from msw ${version}`);
