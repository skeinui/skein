// public/llms.txt and public/llms-full.txt (https://llmstxt.org) from @skeinui/ui/manifest.json, so AI tools
// can read the component docs as plain text. Run before dev and build; the files are not committed.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { llmsFull, llmsIndex } from "@skeinui/cli/docs";

const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(require.resolve("@skeinui/ui/manifest.json"), "utf8"));
const out = join(import.meta.dirname, "..", "public");
writeFileSync(join(out, "llms.txt"), llmsIndex(manifest));
writeFileSync(join(out, "llms-full.txt"), llmsFull(manifest));
console.log(`llms.txt / llms-full.txt: ${Object.keys(manifest.components).length} components`);
