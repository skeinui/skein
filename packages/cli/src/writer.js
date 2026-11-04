import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/**
 * Collects file writes for a command, then applies them all at once: nothing is written when a file
 * would be overwritten without `force`, and `dryRun` only reports. Paths are relative to `root`.
 */
export class Writer {
  constructor(root, { force = false, dryRun = false } = {}) {
    this.root = root;
    this.force = force;
    this.dryRun = dryRun;
    /** @type {Map<string, string>} */
    this.files = new Map();
  }

  write(path, content) {
    this.files.set(path, content);
  }

  /** The current content: a pending write, else the file on disk, else undefined. */
  read(path) {
    if (this.files.has(path)) return this.files.get(path);
    const file = join(this.root, path);
    return existsSync(file) ? readFileSync(file, "utf8") : undefined;
  }

  /** Files that exist with other content and would be overwritten. */
  conflicts() {
    return [...this.files.keys()].filter((path) => {
      const file = join(this.root, path);
      return existsSync(file) && readFileSync(file, "utf8") !== this.files.get(path);
    });
  }

  /**
   * Writes everything, or nothing if there are conflicts and no `force`. `edits` are paths that are
   * expected to change (package.json, …): they are not conflicts. Returns `{ created, changed }`.
   */
  commit({ edits = [] } = {}) {
    const conflicts = this.conflicts().filter((p) => !edits.includes(p));
    if (conflicts.length > 0 && !this.force) {
      const list = conflicts.map((p) => `  ${p}`).join("\n");
      throw new Error(`these files already exist, pass --force to overwrite them:\n${list}`);
    }
    const created = [];
    const changed = [];
    for (const [path, content] of this.files) {
      const file = join(this.root, path);
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
