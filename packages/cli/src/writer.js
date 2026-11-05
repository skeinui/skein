import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { packageBin } from "./project.js";

/**
 * Collects file writes for a command, then applies them all at once: nothing is written when a file
 * would be overwritten without `force`, and `dryRun` only reports. Paths are relative to `root`.
 *
 * Commands see LF line endings only: `read` gives a CRLF file (Windows) with LF, and writing it back restores
 * its CRLF, so their edits needn't care and the file keeps its line endings. New files are written with LF.
 * Paths are kept with `/` on every platform (what `created` / `changed`, --json and MCP report).
 */
/** The files Oxfmt formats. */
const FORMATTED = /\.(?:[cm]?[jt]sx?|jsonc?|md|css|scss|less|html|ya?ml|toml)$/;

/**
 * Formats the files a command wrote with the project's Vite+ (`vp fmt`), so `vp check` accepts what the CLI
 * generates (a page from an OpenAPI document, an edited settings.ts…). A project without vite-plus installed is
 * left as written; a formatter failure doesn't fail the command.
 */
function formatWithVitePlus(root, paths) {
  const files = paths.filter((path) => FORMATTED.test(path));
  if (files.length === 0) return;
  let vp;
  try {
    vp = packageBin(root, "vite-plus", "vp");
  } catch {
    return;
  }
  try {
    execFileSync(process.execPath, [vp, "fmt", ...files], { cwd: root, stdio: "ignore" });
  } catch {
    // Left as written: `vp check` reports what is still to format
  }
}

/** `a\\b` (Windows `join`) as `a/b`. */
const toPosix = (path) => path.replace(/\\/g, "/");

export class Writer {
  constructor(root, { force = false, dryRun = false } = {}) {
    this.root = root;
    this.force = force;
    this.dryRun = dryRun;
    /** @type {Map<string, string>} */
    this.files = new Map();
    /** Files read with CRLF line endings, written back with them */
    this.crlf = new Set();
  }

  write(path, content) {
    this.files.set(toPosix(path), content);
  }

  /** The current content: a pending write, else the file on disk, else undefined. */
  read(path) {
    path = toPosix(path);
    if (this.files.has(path)) return this.files.get(path);
    const file = join(this.root, path);
    if (!existsSync(file)) return undefined;
    const text = readFileSync(file, "utf8");
    if (!text.includes("\r\n")) return text;
    this.crlf.add(path);
    return text.replace(/\r\n/g, "\n");
  }

  /** What `path` is written with: its content, CRLF again for a file read with it. */
  output(path) {
    const content = this.files.get(path);
    return this.crlf.has(path) ? content.replace(/\r?\n/g, "\r\n") : content;
  }

  /** Files that exist with other content and would be overwritten. */
  conflicts() {
    return [...this.files.keys()].filter((path) => {
      const file = join(this.root, path);
      return existsSync(file) && readFileSync(file, "utf8") !== this.output(path);
    });
  }

  /**
   * Writes everything, or nothing if there are conflicts and no `force`. `edits` are paths that are
   * expected to change (package.json, …): they are not conflicts. Returns `{ created, changed }`.
   */
  commit({ edits = [] } = {}) {
    const expected = edits.map(toPosix);
    const conflicts = this.conflicts().filter((p) => !expected.includes(p));
    if (conflicts.length > 0 && !this.force) {
      const list = conflicts.map((p) => `  ${p}`).join("\n");
      throw new Error(`these files already exist, pass --force to overwrite them:\n${list}`);
    }
    const created = [];
    const changed = [];
    for (const path of this.files.keys()) {
      const file = join(this.root, path);
      const content = this.output(path);
      if (existsSync(file)) {
        if (readFileSync(file, "utf8") === content) continue;
        changed.push(path);
      } else {
        created.push(path);
      }
      if (this.dryRun) continue;
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content);
    }
    if (!this.dryRun) formatWithVitePlus(this.root, [...created, ...changed]);
    return { created, changed };
  }
}

/** Prints what a commit did, adoor style: `+` created, `✎` changed. */
export function report({ created, changed }, { dryRun = false, cwd = process.cwd(), root } = {}) {
  const show = (path) => (root ? relative(cwd, join(root, path)) || path : path);
  for (const path of created) console.log(`  + ${show(path)}`);
  for (const path of changed) console.log(`  ✎ ${show(path)}`);
  if (dryRun) console.log("\n  (dry run: nothing was written)");
}
