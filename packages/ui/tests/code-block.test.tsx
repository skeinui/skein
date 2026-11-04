// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { CodeBlock, canHighlight, tokenize } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  vi.useRealTimers();
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const types = (code: string, lang: string) =>
  tokenize(code, lang)
    .filter((t) => t.type)
    .map((t) => `${t.type}:${t.text}`);

describe("tokenize", () => {
  test("tokens always join back into the source", () => {
    const samples: [string, string][] = [
      ['const a = "x" + 1; // hi\n/* c\n d */ let b', "ts"],
      ['{"a": [1, true, null], "b": "c"}', "json"],
      ["def f(x):\n    return x  # c\n'''doc'''", "python"],
      ['echo "$HOME" # c\nif [ -f x ]; then ls; fi', "bash"],
      ["a { color: #fff; margin: 0 4px } /* c */", "css"],
      ['<div class="a">hi</div><!-- c -->', "html"],
      ["SELECT a FROM t WHERE b = 'x' -- c", "sql"],
      ["whatever", "unknown"],
      ['"unterminated', "js"],
    ];
    for (const [code, lang] of samples) {
      expect(
        tokenize(code, lang)
          .map((t) => t.text)
          .join(""),
      ).toBe(code);
    }
  });

  test("js: keywords, strings, numbers, comments; keywords / numbers inside words do not count", () => {
    expect(types('const x = "a" + 12; // c', "js")).toEqual([
      "keyword:const",
      'string:"a"',
      "number:12",
      "comment:// c",
    ]);
    expect(types("constant foo1 = 2", "js")).toEqual(["number:2"]);
  });

  test("json: keys are property, values are string / number / keyword", () => {
    expect(types('{"a": "b", "n": 3, "t": true}', "json")).toEqual([
      'property:"a"',
      'string:"b"',
      'property:"n"',
      "number:3",
      'property:"t"',
      "keyword:true",
    ]);
  });

  test("bash: variables, comments; python: triple-quoted strings span lines", () => {
    expect(types('echo "$HOME" # c', "bash")).toEqual([
      "keyword:echo",
      'string:"$HOME"',
      "comment:# c",
    ]);
    expect(types("x = '''a\nb'''", "python")).toEqual(["string:'''a\nb'''"]);
  });

  test("language aliases and whether a language is known", () => {
    expect(canHighlight("TypeScript")).toBe(true);
    expect(canHighlight("sh")).toBe(true);
    expect(canHighlight("brainfuck")).toBe(false);
    expect(canHighlight(undefined)).toBe(false);
  });
});

describe("CodeBlock", () => {
  test("SSR: header language, copy button, focusable code area, colored tokens, no class / style", () => {
    const html = ssr(createElement(CodeBlock, { code: 'const a = "b";', language: "ts" }));
    expect(html).toContain('data-slot="code-block-language">ts<');
    expect(html).toContain('aria-label="Copy code"');
    expect(html).toContain(
      'data-slot="code-block-pre" tabindex="0" role="region" aria-label="ts code"',
    );
    expect(html).toContain('data-token="keyword">const<');
    expect(html).toContain('data-token="string">&quot;b&quot;<');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("title replaces the header text; unknown languages and highlight=false are plain text", () => {
    const html = ssr(createElement(CodeBlock, { code: "x", language: "ts", title: "app.ts" }));
    expect(html).toContain('data-slot="code-block-language">app.ts<');
    expect(ssr(createElement(CodeBlock, { code: "const a", language: "nope" }))).not.toContain(
      "data-token",
    );
    expect(
      ssr(createElement(CodeBlock, { code: "const a", language: "ts", highlight: false })),
    ).not.toContain("data-token");
  });

  test("one line element per line; empty lines have a placeholder; lineNumbers / wrap written as attributes", () => {
    const html = ssr(
      createElement(CodeBlock, { code: "a\n\nb", language: "x", lineNumbers: true, wrap: true }),
    );
    expect(html.match(/data-slot="code-block-line"/g)).toHaveLength(3);
    expect(html).toContain("data-line-numbers");
    expect(html).toContain("data-wrap");
    expect(html).toContain("​");
  });

  test("custom highlight: returns content per line", () => {
    const html = ssr(
      createElement(CodeBlock, {
        code: "a\nb",
        language: "x",
        highlight: (code) => code.split("\n").map((l) => createElement("em", { key: l }, l)),
      }),
    );
    expect(html).toContain("<em>a</em>");
    expect(html).toContain("<em>b</em>");
  });

  test("copy: writes to the clipboard, the button name and announcement become Copied, restored after 2 seconds", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root!.render(createElement(CodeBlock, { code: "echo hi", language: "bash" }));
    });
    const button = () => host!.querySelector<HTMLButtonElement>('[data-slot="code-block-copy"]')!;
    const status = () => host!.querySelector('[data-slot="code-block-status"]')!;
    await act(async () => button().click());
    expect(writeText).toHaveBeenCalledWith("echo hi");
    expect(button().getAttribute("aria-label")).toBe("Copied");
    expect(button().hasAttribute("data-copied")).toBe(true);
    expect(status().textContent).toBe("Copied");
    expect(status().getAttribute("role")).toBe("status");
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(button().getAttribute("aria-label")).toBe("Copy code");
    expect(status().textContent).toBe("");
  });

  test("without clipboard permission: nothing happens", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(CodeBlock, { code: "x" }));
    });
    const button = host.querySelector<HTMLButtonElement>('[data-slot="code-block-copy"]')!;
    await act(async () => button.click());
    expect(button.getAttribute("aria-label")).toBe("Copy code");
  });
});
