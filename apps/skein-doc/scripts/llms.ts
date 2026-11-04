// From @skeinui/ui/manifest.json, before dev and build (the files are not committed):
// - public/llms.txt and public/llms-full.txt (https://llmstxt.org), so AI tools can read the component docs as text;
// - public/api/<Component>.json, each component's props and parts' props: what a page's API tables need
//   (doc.tsx ApiReference), a few KB, instead of the whole manifest (650 KB).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { llmsFull, llmsIndex } from "@skeinui/cli/docs";

const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(require.resolve("@skeinui/ui/manifest.json"), "utf8"));
const out = join(import.meta.dirname, "..", "public");
writeFileSync(join(out, "llms.txt"), llmsIndex(manifest));
writeFileSync(join(out, "llms-full.txt"), llmsFull(manifest));

const api = join(out, "api");
rmSync(api, { recursive: true, force: true });
mkdirSync(api);
for (const [name, component] of Object.entries<{
  props: unknown;
  parts?: Record<string, { props: unknown }>;
}>(manifest.components)) {
  const parts = Object.fromEntries(
    Object.entries(component.parts ?? {}).map(([part, value]) => [part, { props: value.props }]),
  );
  writeFileSync(join(api, `${name}.json`), JSON.stringify({ props: component.props, parts }));
}

console.log(
  `llms.txt / llms-full.txt / api/*.json: ${Object.keys(manifest.components).length} components`,
);
