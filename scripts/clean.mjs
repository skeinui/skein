#!/usr/bin/env node
/**
 * Removes what builds and tests generate, so the next run starts from the sources:
 *
 *   pnpm clean           build output, generated files
 *   pnpm clean --deps    the same, plus every node_modules (then run pnpm install)
 */
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const GENERATED = [
  // docs site: build output and llms.txt (scripts/llms.ts, before dev / build)
  "apps/skein-doc/dist",
  "apps/skein-doc/public/llms.txt",
  "apps/skein-doc/public/llms-full.txt",
  // @skeinui/ui: vp pack (build / prepack), what the published package contains
  "packages/ui/dist",
  // CLI: scripts/build.ts (test / prepack). The mock template's mockServiceWorker.js stays: it only changes
  // with msw, and `skein create` needs it
  "packages/cli/contract.json",
];

/** node_modules of the root, apps/* and packages/* (the workspace). */
function nodeModules() {
  const dirs = [ROOT];
  for (const group of ["apps", "packages"]) {
    const base = join(ROOT, group);
    if (existsSync(base)) dirs.push(...readdirSync(base).map((d) => join(base, d)));
  }
  return dirs.map((d) => join(d, "node_modules"));
}

const targets = [
  ...GENERATED.map((p) => join(ROOT, p)),
  ...(process.argv.includes("--deps") ? nodeModules() : []),
].filter((p) => existsSync(p));

for (const path of targets) {
  rmSync(path, { recursive: true, force: true });
  console.log(`  - ${relative(ROOT, path)}`);
}
console.log(targets.length ? `removed ${targets.length}` : "nothing to clean");
