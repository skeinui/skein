import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, test } from "vite-plus/test";
import { build, createServer, parseSync } from "vite-plus";
import {
  dependencyDirs,
  importsOf,
  isInside,
  pathKey,
  prune,
  skeinThemes,
  stylesFor,
  toPosix,
} from "../vite.js";

const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(require.resolve("@skeinui/ui/manifest.json"), "utf8"));
const THEMES = toPosix(join(import.meta.dirname, ".."));
const imports = (code: string, file = "app.tsx") => importsOf(code, file, parseSync);

describe("importsOf", () => {
  test("named imports and re-exports, renamed, without types", () => {
    const code = `
      import { Button, Card as Box, type CardProps } from "@skeinui/ui";
      import type { DialogProps } from "@skeinui/ui";
      export { Tag } from '@skeinui/ui';
      import { zhCN } from "@skeinui/ui/locales/zh-CN";
      export const App = () => <Box><Button>{"ok"}</Button></Box>;`;
    expect(imports(code)).toEqual(["Button", "Card", "Tag"]);
  });

  test("the whole package (namespace, default, export *, dynamic import): null", () => {
    expect(imports('import * as UI from "@skeinui/ui";')).toBeNull();
    expect(imports('import UI from "@skeinui/ui";')).toBeNull();
    expect(imports('export * from "@skeinui/ui";')).toBeNull();
    expect(imports('export * as UI from "@skeinui/ui";')).toBeNull();
    expect(imports('const ui = await import("@skeinui/ui");', "a.ts")).toBeNull();
    // Offsets after non-ASCII text still land on the specifier
    expect(imports('// 中文注释 🎨\nconst ui = await import("@skeinui/ui");', "a.ts")).toBeNull();
  });

  test("comments and strings are not imports", () => {
    const code = `
      // import { Kanban } from "@skeinui/ui";
      /* export * from "@skeinui/ui"; */
      const s = 'import { Agenda } from "@skeinui/ui"';
      import { Button } from "@skeinui/ui";`;
    expect(imports(code, "a.ts")).toEqual(["Button"]);
  });

  test("code that doesn't parse: undefined; no mention of the package: []", () => {
    expect(imports('import { Button } from "@skeinui/ui";\nconst = ;', "a.ts")).toBeUndefined();
    expect(imports('import { x } from "./x";')).toEqual([]);
  });
});

describe("paths on every platform", () => {
  test("Windows: backslashes, forward slashes and drive letter case are one path", () => {
    const id = "C:/Users/me/app/node_modules/@skeinui/themes/antd/index.css";
    expect(isInside(id, "c:\\Users\\me\\app\\node_modules\\@skeinui\\themes", "win32")).toBe(true);
    expect(isInside("C:\\Users\\me\\app\\src\\a.tsx", "C:/Users/me/app/src/", "win32")).toBe(true);
    expect(pathKey("C:\\A\\b.ts", "win32")).toBe(pathKey("c:/a/B.ts", "win32"));
  });

  test("macOS / Linux: paths compare as they are", () => {
    expect(
      isInside(
        "/app/node_modules/@skeinui/themes/antd/index.css",
        "/app/node_modules/@skeinui/themes",
        "linux",
      ),
    ).toBe(true);
    expect(isInside("/app/Src/a.ts", "/app/src", "linux")).toBe(false);
    // A sibling whose name starts like the directory isn't inside it
    expect(isInside("/app/themes2/index.css", "/app/themes", "darwin")).toBe(false);
  });

  test("toPosix drops the query Vite adds to ids", () => {
    expect(toPosix("C:\\app\\theme\\index.css?direct")).toBe("C:/app/theme/index.css");
  });
});

describe("stylesFor and prune", () => {
  test("the base stylesheets, and those of the components the imports render", () => {
    const keep = stylesFor(["Pagination"], manifest.styles)!;
    expect([...keep].sort()).toEqual([
      "button",
      "dark",
      "pagination",
      "scrollbar",
      "select",
      "tokens",
    ]);
    expect(stylesFor(null, manifest.styles)).toBeNull();
    // A type or an unknown name adds nothing
    expect([...stylesFor(["PaginationProps"], manifest.styles)!].sort()).toEqual(
      manifest.styles.base.sort(),
    );
  });

  test("prune keeps the other lines and the @imports of the kept stylesheets", () => {
    const css =
      '@layer ui-style;\n@import "./tokens.css";\n@import "./button.css";\n@import "./kanban.css";\n';
    expect(prune(css, new Set(["tokens", "button"]))).toBe(
      '@layer ui-style;\n@import "./tokens.css";\n@import "./button.css";\n',
    );
  });

  test("prune keeps Windows line endings (a theme style of your own checked out with CRLF)", () => {
    const css = '@import "./tokens.css";\r\n@import "./kanban.css";\r\n@import "./button.css";\r\n';
    expect(prune(css, new Set(["tokens", "button"]))).toBe(
      '@import "./tokens.css";\r\n@import "./button.css";\r\n',
    );
  });

  test("every stylesheet of a theme style is needed by some export, and every export's exist", () => {
    const sheets = readFileSync(join(import.meta.dirname, "..", "default", "index.css"), "utf8")
      .split("\n")
      .map((line) => line.match(/@import\s+"\.\/([\w-]+)\.css"/)?.[1])
      .filter(Boolean);
    const needed = new Set([
      ...manifest.styles.base,
      ...Object.values<string[]>(manifest.styles.exports).flat(),
    ]);
    expect(sheets.filter((sheet) => !needed.has(sheet!))).toEqual([]);
    expect([...needed].filter((sheet) => !sheets.includes(sheet))).toEqual([]);
  });
});

// Projects inside the package, so they resolve @skeinui/ui like a real one does
const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});
/**
 * A project with `files` (paths relative to its root). main.js imports a theme style by path: inside its own package,
 * @skeinui/themes doesn't resolve by name (a project's node_modules has it).
 */
function project(files: Record<string, string>) {
  const root = mkdtempSync(join(import.meta.dirname, "tmp-"));
  fixtures.push(root);
  const all: Record<string, string> = {
    "package.json": '{ "name": "fixture", "type": "module" }',
    "index.html": '<script type="module" src="/main.js"></script>',
    "main.js": 'import "../../antd/index.css";\nimport "./src/app.tsx";',
    ...files,
  };
  for (const [file, text] of Object.entries(all)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  }
  return root;
}
/** A package in node_modules/<name> with these dependencies and index.js */
const dependency = (name: string, dependencies: Record<string, string>, code = "") => ({
  [`node_modules/${name}/package.json`]: JSON.stringify({
    name,
    type: "module",
    main: "index.js",
    dependencies,
  }),
  [`node_modules/${name}/index.js`]: code,
});
// Built CSS is minified ([data-slot=button]); in dev it is a JS string ([data-slot=\\"button\\"])
const styles = (css: string, slot: string) =>
  new RegExp(`\\[data-slot=\\\\?"?${slot}\\\\?"?\\]`).test(css);

async function buildCss(root: string, options?: Parameters<typeof skeinThemes>[0]) {
  const out = (await build({
    root,
    logLevel: "silent",
    plugins: [skeinThemes(options)],
    build: { write: false },
  })) as { output: { fileName: string; source?: string | Uint8Array }[] };
  return out.output
    .filter((file) => file.fileName.endsWith(".css"))
    .map((file) => String(file.source))
    .join("");
}

describe("dependencyDirs", () => {
  test("the dependencies that depend on @skeinui/ui, and theirs", () => {
    const root = project({
      "package.json": JSON.stringify({
        name: "fixture",
        dependencies: { "ui-lib": "*", other: "*" },
      }),
      ...dependency("ui-lib", { "@skeinui/ui": "*", "deep-lib": "*" }),
      ...dependency("ui-lib/node_modules/deep-lib", { "@skeinui/ui": "*" }),
      ...dependency("other", { react: "*" }),
    });
    expect(dependencyDirs(root).map((dir) => dir.slice(toPosix(root).length))).toEqual([
      "/node_modules/ui-lib",
      "/node_modules/ui-lib/node_modules/deep-lib",
    ]);
  });
});

describe("in a build", () => {
  test("only the stylesheets of the imported components end up in the CSS", async () => {
    const root = project({
      "src/app.tsx": 'import { Button } from "@skeinui/ui";\nexport const App = Button;',
    });
    const out = await buildCss(root);
    expect(styles(out, "button")).toBe(true);
    expect(out).toContain("--ui-bg");
    expect(styles(out, "kanban")).toBe(false);
    expect(styles(out, "admin-layout")).toBe(false);
  });

  test("a namespace import keeps every stylesheet", async () => {
    const root = project({
      "src/app.tsx": 'import * as UI from "@skeinui/ui";\nexport const App = UI.Button;',
    });
    expect(styles(await buildCss(root), "kanban")).toBe(true);
  });

  test("a component a dependency of the project imports keeps its stylesheet", async () => {
    const root = project({
      "package.json": JSON.stringify({
        name: "fixture",
        type: "module",
        dependencies: { "board-lib": "*" },
      }),
      "src/app.tsx": 'import { Board } from "board-lib";\nexport const App = Board;',
      ...dependency(
        "board-lib",
        { "@skeinui/ui": "*" },
        'import { Kanban } from "@skeinui/ui";\nexport const Board = Kanban;',
      ),
    });
    expect(styles(await buildCss(root), "kanban")).toBe(true);
  });

  test("a module outside the scanned directories fails the build, naming the fix", async () => {
    const files = {
      "src/app.tsx":
        'import { Button } from "@skeinui/ui";\nimport "../lib/board.tsx";\nexport const App = Button;',
      "lib/board.tsx": 'import { Kanban } from "@skeinui/ui";\nexport const Board = Kanban;',
    };
    await expect(buildCss(project(files))).rejects.toThrow(/lib\/board\.tsx: Kanban[\s\S]*include/);
    expect(styles(await buildCss(project(files), { include: ["src", "lib"] }), "kanban")).toBe(
      true,
    );
  });

  test("prune: false keeps every stylesheet", async () => {
    const root = project({
      "src/app.tsx": 'import { Button } from "@skeinui/ui";\nexport const App = Button;',
    });
    expect(styles(await buildCss(root, { prune: false }), "kanban")).toBe(true);
  });
});

describe("in dev", () => {
  test("follows the edits: a file added, a module the scan missed", async () => {
    const root = project({
      "src/app.tsx": 'import { Button } from "@skeinui/ui";\nexport const App = Button;',
    });
    const server = await createServer({
      root,
      logLevel: "silent",
      plugins: [skeinThemes()],
      server: { middlewareMode: true, hmr: false, ws: false },
    });
    const css = async () =>
      (await server.transformRequest(`/@fs/${THEMES.replace(/^\//, "")}/antd/index.css`))?.code ??
      "";
    const settle = () => new Promise((done) => setTimeout(done, 50));
    try {
      expect(styles(await css(), "button")).toBe(true);
      expect(styles(await css(), "kanban")).toBe(false);

      // A new file in src/ imports Kanban
      const board = join(root, "src", "board.tsx");
      writeFileSync(board, 'import { Kanban } from "@skeinui/ui";\nexport const Board = Kanban;');
      server.watcher.emit("add", board);
      await settle();
      expect(styles(await css(), "kanban")).toBe(true);

      // A module outside src/ that the app loads: added when it is transformed
      writeFileSync(
        join(root, "agenda.tsx"),
        'import { Agenda } from "@skeinui/ui";\nexport const A = Agenda;',
      );
      expect(styles(await css(), "agenda")).toBe(false);
      await server.transformRequest("/agenda.tsx");
      await settle();
      expect(styles(await css(), "agenda")).toBe(true);
    } finally {
      await server.close();
    }
  });
});
