#!/usr/bin/env node
/**
 * Prepares a release on your machine: bumps the versions with the changesets (`pnpm version-packages`: versions,
 * CHANGELOGs, the manifest) and commits the result as "Skein UI <version>". Pushing that commit to main is the
 * release (.github/workflows/release.yml: tests, an approval in the `npm` environment, publish, tag, GitHub Release).
 *
 *   pnpm release:prepare
 *
 * It stops, before it changes anything, when you are not on main, when the working tree is not clean (the release
 * commit holds only the version changes), or when there is no changeset to release. It does not push.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8" }).trim();
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
if (branch !== "main") fail(`On ${branch}, not main: a release is made from main.`);

const dirty = run("git", ["status", "--porcelain"]);
if (dirty) fail(`The working tree is not clean, commit or stash first:\n${dirty}`);

const changesets = readdirSync(join(root, ".changeset")).filter(
  (name) => name.endsWith(".md") && name !== "README.md",
);
if (changesets.length === 0)
  fail("No changeset in .changeset/: nothing to release (pnpm changeset).");
console.log(`Releasing ${changesets.length} changeset(s): ${changesets.join(", ")}`);

execFileSync("pnpm", ["version-packages"], { cwd: root, stdio: "inherit" });

const { version } = JSON.parse(readFileSync(join(root, "packages/ui/package.json"), "utf8"));
run("git", ["add", "-A"]);
// Just the title: it names the release's run in the Actions list ("Release Skein UI 0.1.3")
run("git", ["commit", "-m", `Skein UI ${version}`]);

console.log(`\nCommitted "Skein UI ${version}". Push it to release:\n  git push origin main`);
