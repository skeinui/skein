import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { afterAll, describe, expect, test } from "vite-plus/test";
import { build } from "vite-plus";
import { importsOf, prune, skeinThemes, stylesFor } from "../vite.js";

const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(require.resolve("@skeinui/ui/manifest.json"), "utf8"));

describe("importsOf", () => {
  test("named imports and re-exports, renamed, without types", () => {
    const code = `
      import { Button, Card as Box, type CardProps } from "@skeinui/ui";
      import type { DialogProps } from "@skeinui/ui";
      export { Tag } from '@skeinui/ui';
      import { zhCN } from "@skeinui/ui/locales/zh-CN";`;
    expect(importsOf(code)).toEqual(["Button", "Card", "Tag"]);
  });

  test("a namespace, default or dynamic import of the whole package can't be told apart: null", () => {
    expect(importsOf('import * as UI from "@skeinui/ui";')).toBeNull();
    expect(importsOf('const ui = await import("@skeinui/ui");')).toBeNull();
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

describe("in a build", () => {
  // Inside the package, so the project resolves @skeinui/themes and @skeinui/ui like a real one
  const root = mkdtempSync(join(import.meta.dirname, "tmp-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  const project = (app: string) => {
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "package.json"), '{ "name": "fixture", "type": "module" }');
    writeFileSync(join(root, "index.html"), '<script type="module" src="/main.js"></script>');
    // The build bundles the theme style only; the plugin reads the imports from src/. A relative path: inside its
    // own package, @skeinui/themes doesn't resolve by name (a project's node_modules has it)
    writeFileSync(join(root, "main.js"), 'import "../../antd/index.css";');
    writeFileSync(join(root, "src", "app.tsx"), app);
  };
  const css = async () => {
    const out = (await build({
      root,
      logLevel: "silent",
      plugins: [skeinThemes()],
      build: { write: false },
    })) as { output: { fileName: string; source?: string | Uint8Array }[] };
    return out.output
      .filter((file) => file.fileName.endsWith(".css"))
      .map((file) => String(file.source))
      .join("");
  };

  // The built CSS is minified: [data-slot=button]
  const styles = (css: string, slot: string) => new RegExp(`\\[data-slot="?${slot}"?\\]`).test(css);

  test("only the stylesheets of the imported components end up in the CSS", async () => {
    project(
      'import { Button } from "@skeinui/ui";\nexport const App = () => <Button>Save</Button>;',
    );
    const out = await css();
    expect(styles(out, "button")).toBe(true);
    expect(out).toContain("--ui-bg");
    expect(styles(out, "kanban")).toBe(false);
    expect(styles(out, "admin-layout")).toBe(false);
  });

  test("a namespace import keeps every stylesheet", async () => {
    project(
      'import * as UI from "@skeinui/ui";\nexport const App = () => <UI.Button>Save</UI.Button>;',
    );
    const out = await css();
    expect(styles(out, "kanban")).toBe(true);
  });
});
