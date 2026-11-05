#!/usr/bin/env node
/**
 * The notes of a release, for its GitHub Release: the CHANGELOG entries of that version, across the packages.
 *
 *   node scripts/release-notes.mjs 0.0.5
 *
 * The packages are one fixed group (one version), so an entry is often in several CHANGELOGs: each is listed once.
 * Dependency bumps ("Updated dependencies", a bare "@skeinui/ui@0.0.3") are left out.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const PACKAGES = ["ui", "themes", "cli", "create-skein", "skeinui"];

const version = process.argv[2];
if (!version) throw new Error("usage: node scripts/release-notes.mjs <version>");

/** The bullet entries (with their indented lines) of `version` in a CHANGELOG. */
function entriesOf(changelog) {
  const lines = changelog.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => line === `## ${version}`);
  if (start === -1) return [];
  const entries = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    if (line.startsWith("- ")) entries.push(line);
    else if (/^\s+\S/.test(line) && entries.length) entries[entries.length - 1] += `\n${line}`;
  }
  // Dependency bumps: "- Updated dependencies [1a2b3c4]" and a bare "- @skeinui/ui@0.0.3"
  return entries.filter(
    (entry) =>
      !/^- Updated dependencies\b/.test(entry) &&
      !/^- (@[\w-]+\/)?[\w-]+@\d+\.\d+\.\d+\S*$/.test(entry),
  );
}

const seen = new Set();
const entries = [];
const packages = [];
for (const dir of PACKAGES) {
  const pkg = JSON.parse(readFileSync(join(ROOT, "packages", dir, "package.json"), "utf8"));
  packages.push(`\`${pkg.name}@${version}\``);
  const file = join(ROOT, "packages", dir, "CHANGELOG.md");
  if (!existsSync(file)) continue;
  for (const entry of entriesOf(readFileSync(file, "utf8"))) {
    // `- 1a2b3c4: text`: the same change listed under each package of the group
    const key = entry.replace(/^- [0-9a-f]{7,}: /, "- ");
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(entry);
  }
}

console.log(
  [
    entries.length ? entries.join("\n") : "No changes in this release.",
    "",
    `**Packages:** ${packages.join(", ")}`,
  ].join("\n"),
);
