import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { CODE_THEMES, CodeBlock, DiffView, Markdown } from "../src/index.ts";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "themes", "code");
const read = (f: string) => readFileSync(join(DIR, f), "utf8");

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

/** Extract the variables from each declaration block: returns [selector, {variable: value}][]. */
function blocks(css: string): [string, Record<string, string>][] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, sel, body]): [string, Record<string, string>] => [
      sel!.trim(),
      Object.fromEntries(
        [...body!.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]),
      ),
    ])
    .filter(([, vars]) => Object.keys(vars).length > 0);
}

describe("code themes (packages/themes/code)", () => {
  test("one file per theme, all imported by index.css", () => {
    const files = readdirSync(DIR).filter((f) => f.endsWith(".css"));
    for (const name of CODE_THEMES) expect(files).toContain(`${name}.css`);
    const index = read("index.css");
    for (const name of CODE_THEMES) expect(index).toContain(`./${name}.css`);
    expect(index).toContain("./base.css");
  });

  test.each(CODE_THEMES)("%s: in the ui-code layer, selector is data-code-theme", (name) => {
    const css = read(`${name}.css`);
    expect(css).toMatch(/^@layer ui-tokens, ui-color, ui-style, ui-code;/);
    expect(css).toContain("@layer ui-code {");
    expect(css).toContain(`[data-code-theme="${name}"]`);
  });

  test.each(CODE_THEMES)(
    "%s: every palette sets all variables, text and token contrast >= 4.5",
    (name) => {
      const sets = blocks(read(`${name}.css`));
      expect(sets.length).toBeGreaterThan(0);
      for (const [selector, v] of sets) {
        for (const key of [
          "--ui-bg",
          "--ui-surface",
          "--ui-fg",
          "--ui-fg-muted",
          "--ui-border",
          "--code-keyword",
          "--code-string",
          "--code-number",
          "--code-property",
          "--code-variable",
          "--code-comment",
        ]) {
          expect(v[key], `${name} ${selector} is missing ${key}`).toMatch(/^#[0-9a-f]{6}$/);
        }
        for (const key of [
          "--ui-fg",
          "--ui-fg-muted",
          "--code-keyword",
          "--code-string",
          "--code-number",
          "--code-property",
          "--code-variable",
          "--code-comment",
        ]) {
          expect(
            contrast(v[key]!, v["--ui-bg"]!),
            `${name} ${selector} ${key}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    },
  );

  test("themes that follow light / dark have two palettes, fixed dark ones only one", () => {
    for (const name of ["github", "one", "solarized", "catppuccin"]) {
      expect(blocks(read(`${name}.css`))).toHaveLength(2);
      expect(read(`${name}.css`)).toContain('[data-mode="dark"]');
    }
    for (const name of ["dracula", "nord", "monokai", "tokyo-night"]) {
      expect(blocks(read(`${name}.css`))).toHaveLength(1);
      expect(read(`${name}.css`)).toContain("color-scheme: dark");
    }
  });

  test("base.css colors 6 token kinds from --code-* variables, no hard-coded colors", () => {
    const base = read("base.css");
    for (const t of ["keyword", "string", "number", "property", "variable", "comment"]) {
      expect(base).toContain(`[data-token="${t}"]`);
      expect(base).toContain(`var(--code-${t})`);
    }
    expect(base).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});

describe("theme prop", () => {
  test("CodeBlock / Markdown fences / DiffView write the theme as data-code-theme, absent when not given", () => {
    expect(
      renderToStaticMarkup(createElement(CodeBlock, { code: "x", theme: "dracula" })),
    ).toContain('data-code-theme="dracula"');
    expect(renderToStaticMarkup(createElement(CodeBlock, { code: "x" }))).not.toContain(
      "data-code-theme",
    );
    expect(
      renderToStaticMarkup(
        createElement(Markdown, { codeTheme: "nord", children: "```ts\nx\n```" }),
      ),
    ).toContain('data-code-theme="nord"');
    expect(
      renderToStaticMarkup(
        createElement(DiffView, { codeTheme: "one", oldText: "a", newText: "b" }),
      ),
    ).toContain('data-code-theme="one"');
  });
});
