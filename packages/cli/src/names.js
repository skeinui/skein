/** Turns a directory name into a valid npm package name (keeps an `@scope/`). */
export function toPackageName(name) {
  const clean = (part) =>
    part
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/^[._]/, "")
      .replace(/[^a-z0-9-~._]+/g, "-");
  const scoped = name.trim().match(/^@([^/]+)\/(.+)$/);
  return scoped ? `@${clean(scoped[1])}/${clean(scoped[2])}` : clean(name);
}

/** A `data-skein-theme` value for a blank theme style, taken from the package name. */
export function toThemeStyleName(packageName) {
  const name = packageName
    .replace(/^@[^/]+\//, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^[^a-z]+/, "")
    .replace(/-+$/, "");
  return name || "custom";
}

/** `user-list` / `userList` / `User List` → `user-list`. */
export function kebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/** `user-list` → `UserList`. */
export function pascal(name) {
  return kebab(name)
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

/** `user-list` → `userList`. */
export function camel(name) {
  const p = pascal(name);
  return p && p[0].toLowerCase() + p.slice(1);
}

/** A display title from a package name: `my-admin` → `My Admin`. */
export function title(packageName) {
  return kebab(packageName.replace(/^@[^/]+\//, ""))
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * A page path such as `orders` or `system/users`: every segment kebab-cased; `system\users` (typed on Windows) too.
 * Returns null when nothing valid is left.
 */
export function pagePath(name) {
  const segments = name.split(/[\\/]/).map(kebab).filter(Boolean);
  return segments.length > 0 ? segments.join("/") : null;
}
