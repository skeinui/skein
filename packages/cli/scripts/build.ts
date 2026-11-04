// contract.json (generated, not committed): @skeinui/ui's contract (slots, variants, tokens), for checking and
// creating theme styles before a project has @skeinui/ui installed
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_PACKAGES_DIR } from "../src/paths.js";
import { BUNDLED_CONTRACT } from "../src/theme/contract.js";

const manifest = JSON.parse(readFileSync(join(REPO_PACKAGES_DIR, "ui", "manifest.json"), "utf8"));
writeFileSync(BUNDLED_CONTRACT, `${JSON.stringify(manifest.contract)}\n`);
console.log(`contract.json from @skeinui/ui ${manifest.version}`);
