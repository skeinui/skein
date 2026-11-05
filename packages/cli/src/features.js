import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TEMPLATES_DIR } from "./paths.js";

const FEATURES_DIR = join(TEMPLATES_DIR, "features");

/** `templates/features/<name>/feature.json`, in a stable order. */
export function loadFeatures() {
  return readdirSync(FEATURES_DIR)
    .filter((name) => existsSync(join(FEATURES_DIR, name, "feature.json")))
    .map((name) => {
      const json = JSON.parse(readFileSync(join(FEATURES_DIR, name, "feature.json"), "utf8"));
      return {
        dependencies: {},
        devDependencies: {},
        requires: [],
        ...json,
        name,
        dir: join(FEATURES_DIR, name, "files"),
      };
    });
}

/**
 * Templates are presets of features. `admin` turns on the shell; mock is on by default but optional
 * (`--no-mock`), so it is not something the shell requires.
 */
export const TEMPLATES = {
  basic: { label: "React on Vite+ (vp) + one theme style", features: [] },
  admin: { label: "Layout, menu, tabs, login, CRUD example", features: ["shell", "mock"] },
};
export const DEFAULT_TEMPLATE = "basic";

/**
 * Adds every feature the chosen ones require and orders them so that a feature comes after what it
 * requires (its files are laid on top of theirs).
 */
export function resolveFeatures(chosen, all = loadFeatures()) {
  const byName = new Map(all.map((f) => [f.name, f]));
  const ordered = [];
  const visit = (name, path = []) => {
    const feature = byName.get(name);
    if (!feature)
      throw new Error(`unknown feature "${name}", choose from: ${[...byName.keys()].join(", ")}`);
    if (path.includes(name))
      throw new Error(`features require each other: ${[...path, name].join(" → ")}`);
    if (ordered.includes(feature)) return;
    for (const dep of feature.requires) visit(dep, [...path, name]);
    ordered.push(feature);
  };
  // Visit in the loaded order so the result doesn't depend on how the user listed them
  for (const feature of all) if (chosen.includes(feature.name)) visit(feature.name);
  for (const name of chosen) visit(name);
  return ordered;
}
