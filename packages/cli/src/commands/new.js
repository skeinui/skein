import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { crudFiles } from "../crud.js";
import { analyzeResource, loadSpec } from "../openapi.js";
import { render } from "../engine.js";
import { camel, kebab, pagePath, pascal, title } from "../names.js";
import { TEMPLATES_DIR } from "../paths.js";
import { findProjectRoot, readProject, renderDir } from "../project.js";
import { Writer } from "../writer.js";

/** The lucide-react icon of a menu group `new page` makes, by its directory name (Folder for the rest). */
const GROUP_ICONS = { system: "Settings", settings: "Settings" };

function projectAt(cwd) {
  const root = findProjectRoot(cwd);
  if (!root) throw new Error("not inside a Skein project (no .skein.json found here or above)");
  const project = readProject(root);
  const flags = Object.fromEntries(project.features.map((f) => [f, true]));
  return { root, project, flags };
}

/**
 * `skein new page <path>`: `src/pages/<path>/` from `templates/pages/_blank` plus its route file. Pages
 * register themselves (routes by the router plugin, menu by `_meta.ts`, mocks by `mocks/handlers.ts`),
 * so nothing that already exists is edited. A parent directory without `_meta.ts` gets one as a menu group.
 *
 * With `from` (an OpenAPI 3 file, JSON or YAML) the page is a working CRUD page for one resource of it —
 * `resource` names the collection path when the page name doesn't match one.
 *
 * @param {{ name: string; cwd?: string; force?: boolean; dryRun?: boolean; from?: string; resource?: string }} options
 */
export function newPage({ name, cwd = process.cwd(), force, dryRun, from, resource }) {
  const { root, flags } = projectAt(cwd);
  if (!flags.router)
    throw new Error("pages need the router feature (create the project with --router)");
  const path = pagePath(name);
  if (!path) throw new Error(`invalid page name "${name}"`);
  const segments = path.split("/");
  const leaf = segments[segments.length - 1];
  const authed = Boolean(flags.auth);
  // With tenant, every page is under /<tenant>/ (routes/_auth/$tenant/)
  const parent = [...(authed ? ["_auth"] : []), ...(flags.tenant ? ["$tenant"] : [])];
  const context = {
    flags,
    vars: {
      name: leaf,
      Name: pascal(path.replaceAll("/", "-")),
      camel: camel(path.replaceAll("/", "-")),
      routePath: path,
      title: title(leaf),
      path: `/${path}`,
      routeId: `${parent.map((s) => `/${s}`).join("")}/${path}`,
      ns: path.replaceAll("/", "-"),
      order: 100,
    },
  };

  const writer = new Writer(root, { force, dryRun });
  const pageDir = join("src", "pages", path);
  if (existsSync(join(root, pageDir)) && !force) throw new Error(`${pageDir} already exists`);
  if (from) {
    const missing = ["shell", "query", "i18n"].filter((f) => !flags[f]);
    if (missing.length > 0) {
      throw new Error(
        `--from makes an admin CRUD page; this project lacks: ${missing.join(", ")} (use --template admin)`,
      );
    }
    const model = analyzeResource(loadSpec(resolve(cwd, from)), { name: path, resource });
    for (const [file, content] of Object.entries(crudFiles(model, { path, flags }))) {
      writer.write(join(pageDir, file), content);
    }
  } else {
    renderDir(writer, join(TEMPLATES_DIR, "pages", "_blank", "files"), context, pageDir);
  }
  const route = render(
    readFileSync(join(TEMPLATES_DIR, "pages", "_blank", "route.tsx"), "utf8"),
    context,
  );
  writer.write(join("src", "routes", ...parent, `${path}.tsx`), route);

  // Menu groups for parents that aren't pages themselves
  for (let i = 1; flags.shell && i < segments.length; i++) {
    const groupDir = join("src", "pages", ...segments.slice(0, i));
    if (existsSync(join(root, groupDir))) continue;
    const group = title(segments[i - 1]);
    const icon = GROUP_ICONS[segments[i - 1]] ?? "Folder";
    writer.write(
      join(groupDir, "_meta.ts"),
      `import { ${icon} } from "lucide-react";\nimport type { PageMeta } from "@/lib/page-meta";\n\nexport const meta: PageMeta = {\n  isGroup: true,\n  icon: ${icon},\n  label: { zh: "${group}", en: "${group}" },\n};\n`,
    );
  }
  const result = writer.commit();
  // The texts it wrote for both languages are the English name: the Chinese ones are left to translate
  const translate = result.created.filter((f) => /(^|\/)(_meta\.ts|zh\.json)$/.test(f));
  return { ...result, root, path: `/${path}`, translate };
}

/**
 * `skein new module <name>`: `src/modules/<name>/` from `templates/modules/_blank`.
 *
 * @param {{ name: string; cwd?: string; force?: boolean; dryRun?: boolean }} options
 */
export function newModule({ name, cwd = process.cwd(), force, dryRun }) {
  const { root, flags } = projectAt(cwd);
  const id = kebab(name);
  if (!id) throw new Error(`invalid module name "${name}"`);
  const dir = join("src", "modules", id);
  if (existsSync(join(root, dir)) && !force) throw new Error(`${dir} already exists`);
  const writer = new Writer(root, { force, dryRun });
  renderDir(
    writer,
    join(TEMPLATES_DIR, "modules", "_blank", "files"),
    {
      flags,
      vars: { name: id, Name: pascal(id), title: title(id), ns: `module-${id}` },
    },
    dir,
  );
  const result = writer.commit();
  const translate = result.created.filter((f) => /(^|\/)zh\.json$/.test(f));
  return { ...result, root, name: id, Name: pascal(id), translate };
}
