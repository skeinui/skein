import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { Markdown, isSafeUrl } from "../src/index.ts";
import type { MarkdownProps } from "../src/index.ts";
import { parseBlocks, parseInline, splitBlocks } from "../src/components/markdown/parse.ts";

const md = (source: string, props: Omit<MarkdownProps, "children"> = {}) =>
  renderToStaticMarkup(createElement(Markdown, { ...props, children: source }));

describe("splitBlocks", () => {
  test("blank lines, headings and fences separate blocks; blank lines inside a fence don't split", () => {
    expect(splitBlocks("a\nb\n\nc")).toEqual(["a\nb", "c"]);
    expect(splitBlocks("para\n# Title\nmore")).toEqual(["para", "# Title", "more"]);
    expect(splitBlocks("```js\nx\n\ny\n```\nafter")).toEqual(["```js\nx\n\ny\n```", "after"]);
  });
  test("an unclosed fence (mid-stream) is one block", () => {
    expect(splitBlocks("hi\n\n```js\nconst a = 1;")).toEqual(["hi", "```js\nconst a = 1;"]);
  });
  test("streaming append: earlier blocks keep their text", () => {
    const a = splitBlocks("# T\n\nfirst paragraph\n\nsecond par");
    const b = splitBlocks("# T\n\nfirst paragraph\n\nsecond paragraph continues");
    expect(b.slice(0, 2)).toEqual(a.slice(0, 2));
    expect(b[2]).not.toBe(a[2]);
  });
});

describe("parseBlocks", () => {
  test("heading levels, thematic breaks, paragraphs join lines", () => {
    expect(parseBlocks("## Hi")).toEqual([{ type: "heading", level: 2, text: "Hi" }]);
    expect(parseBlocks("---")).toEqual([{ type: "hr" }]);
    expect(parseBlocks("a\nb")).toEqual([{ type: "paragraph", text: "a\nb" }]);
  });
  test("lists: ordered start number, task items, nesting", () => {
    const [list] = parseBlocks("3. a\n4. b");
    expect(list).toMatchObject({ type: "list", ordered: true, start: 3 });
    const [tasks] = parseBlocks("- [x] done\n- [ ] todo");
    expect(tasks).toMatchObject({
      items: [
        { source: "done", checked: true },
        { source: "todo", checked: false },
      ],
    });
    const [nested] = parseBlocks("- a\n  - b\n  - c\n- d");
    expect(nested).toMatchObject({ items: [{ source: "a\n- b\n- c" }, { source: "d" }] });
  });
  test("tables: alignment and padding missing cells", () => {
    const [table] = parseBlocks("| a | b | c |\n|:--|:-:|--:|\n| 1 | 2 |");
    expect(table).toEqual({
      type: "table",
      header: ["a", "b", "c"],
      align: ["start", "center", "end"],
      rows: [["1", "2", ""]],
    });
  });
  test("blockquote", () => {
    expect(parseBlocks("> a\n> b")).toEqual([{ type: "quote", source: "a\nb" }]);
  });
});

describe("parseInline", () => {
  test("code, bold, italic, strikethrough", () => {
    expect(parseInline("`a*b*` **bold** *em* ~~del~~")).toMatchObject([
      { type: "code", text: "a*b*" },
      { type: "text", text: " " },
      { type: "strong" },
      { type: "text", text: " " },
      { type: "em" },
      { type: "text", text: " " },
      { type: "del" },
    ]);
  });
  test("snake_case and 2*3 aren't emphasis; unclosed markers stay as text", () => {
    expect(parseInline("snake_case_name")).toEqual([{ type: "text", text: "snake_case_name" }]);
    expect(parseInline("2 * 3 * 4")).toEqual([{ type: "text", text: "2 * 3 * 4" }]);
    expect(parseInline("**unclosed bold")).toEqual([{ type: "text", text: "**unclosed bold" }]);
    expect(parseInline("`open code")).toEqual([{ type: "text", text: "`open code" }]);
  });
  test("escapes", () => {
    expect(parseInline("\\*not em\\*")).toEqual([{ type: "text", text: "*not em*" }]);
  });
  test("links, images, autolinks and bare links (trailing punctuation dropped)", () => {
    expect(parseInline("[a](https://x.com)")).toMatchObject([
      { type: "link", href: "https://x.com" },
    ]);
    expect(parseInline("![alt](/a.png)")).toEqual([{ type: "image", src: "/a.png", alt: "alt" }]);
    expect(parseInline("see https://x.com/a.")).toMatchObject([
      { type: "text", text: "see " },
      { type: "link", href: "https://x.com/a" },
      { type: "text", text: "." },
    ]);
    expect(parseInline("<https://x.com>")).toMatchObject([{ type: "link", href: "https://x.com" }]);
  });
  test("unsafe URLs: links keep only their text, images don't render", () => {
    expect(parseInline("[x](javascript:alert(1))")).toEqual([{ type: "text", text: "x" }]);
    expect(parseInline("[x](JaVaScRiPt:alert(1))")).toEqual([{ type: "text", text: "x" }]);
    // A disguise with control characters also doesn't become a link
    expect(parseInline("[x](java\tscript:alert(1))").some((n) => n.type === "link")).toBe(false);
    expect(parseInline("![x](javascript:alert(1))").some((n) => n.type === "image")).toBe(false);
    expect(parseInline("![x](data:text/html;base64,AAAA)").some((n) => n.type === "image")).toBe(
      false,
    );
  });
  test("hard line breaks", () => {
    expect(parseInline("a  \nb")).toEqual([
      { type: "text", text: "a" },
      { type: "br" },
      { type: "text", text: "b" },
    ]);
  });
});

describe("isSafeUrl", () => {
  test.each([
    ["https://a.com", true],
    ["mailto:a@b.c", true],
    ["/relative", true],
    ["#anchor", true],
    ["javascript:alert(1)", false],
    ["data:text/html,x", false],
    ["vbscript:x", false],
    ["", false],
  ])("%s → %s", (url, ok) => {
    expect(isSafeUrl(url)).toBe(ok);
  });
});

describe("Markdown rendering", () => {
  test("basic elements, no class / style", () => {
    const html = md(
      "# Title\n\nHello **world** and `code` [link](https://a.com).\n\n- one\n- two\n\n> quote\n\n---",
    );
    expect(html).toContain('data-slot="markdown"');
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain('<code data-slot="markdown-inline-code">code</code>');
    expect(html).toContain('href="https://a.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("<ul><li>one</li><li>two</li></ul>");
    expect(html).toContain("<blockquote><p>quote</p></blockquote>");
    expect(html).toContain("<hr/>");
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("HTML is plain text, no tags injected", () => {
    const html = md("<script>alert(1)</script> <img src=x onerror=alert(1)>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  test("fenced code uses CodeBlock (language, highlighting); unclosed fences render too", () => {
    const html = md('```ts\nconst a = "b";\n```');
    expect(html).toContain('data-slot="code-block"');
    expect(html).toContain('data-slot="code-block-language">ts<');
    expect(html).toContain('data-token="keyword">const<');
    expect(md("```js\nlet x")).toContain('data-slot="code-block"');
  });

  test("ordered list start number, task items have screen reader text", () => {
    expect(md("3. a\n4. b")).toContain('<ol start="3">');
    const html = md("- [x] done\n- [ ] todo");
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('aria-label="Completed"');
    expect(html).toContain('aria-label="Not completed"');
    expect(md("- [x] a", { labels: { taskDone: "Done" } })).toContain('aria-label="Done"');
  });

  test("tables: focusable scroll area, header scope, alignment", () => {
    const html = md("| a | b |\n|:-:|--:|\n| 1 | 2 |");
    expect(html).toContain(
      'data-slot="markdown-table-wrap" role="region" tabindex="0" aria-label="Table"',
    );
    expect(html).toContain('<th data-align="center" scope="col">a</th>');
    expect(html).toContain('<td data-align="end">2</td>');
  });

  test("nested lists, code blocks in lists", () => {
    const html = md("- a\n  - b\n\n  ```js\n  x\n  ```");
    // Blank line inside an item: a loose list, paragraphs wrapped in <p>; the nested list and code block are both in this item
    expect(html).toContain('<li><p>a</p><ul><li>b</li></ul><div data-slot="code-block"');
    expect(md("- a\n  - b\n- c")).toContain("<li>a<ul><li>b</li></ul></li><li>c</li>");
  });

  test("linkTarget=_self has no rel; breaks turns single newlines into <br>", () => {
    expect(md("[a](/x)", { linkTarget: "_self" })).not.toContain("noopener");
    expect(md("a\nb", { breaks: true })).toContain("a<br/>b");
    expect(md("a\nb")).toContain("a\nb");
  });

  test("unsafe links keep only their text", () => {
    const html = md("[click](javascript:alert(1))");
    expect(html).not.toContain("href=");
    expect(html).toContain("click");
  });
});

describe("Markdown citation markers", () => {
  const sources = [
    { href: "https://a.com/x", title: "A" },
    { href: "https://b.com", title: "B", description: "About B" },
  ];

  test("parseInline cite: [n] only when enabled, not when followed by ( or :", () => {
    expect(parseInline("see [1]", { cite: true })).toEqual([
      { type: "text", text: "see " },
      { type: "cite", n: 1 },
    ]);
    expect(parseInline("see [1]")).toEqual([{ type: "text", text: "see [1]" }]);
    expect(parseInline("[1](https://a.com)", { cite: true })).toMatchObject([{ type: "link" }]);
    expect(parseInline("[1]: ref", { cite: true }).some((n) => n.type === "cite")).toBe(false);
    expect(parseInline("[x] and [12][3]", { cite: true }).filter((n) => n.type === "cite")).toEqual(
      [
        { type: "cite", n: 12 },
        { type: "cite", n: 3 },
      ],
    );
  });

  test("rendering: [n] with a source becomes a marker link named 'Source n: title'", () => {
    const html = md("Facts[1] and more[2].", { citations: sources });
    expect(html).toContain('data-slot="citation-marker"');
    expect(html).toContain('href="https://a.com/x"');
    expect(html).toContain('aria-label="Source 1: A"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("numbers without a source stay text; [1] is text without citations", () => {
    expect(md("Unknown[7].", { citations: sources })).toContain("Unknown[7].");
    expect(md("Plain [1].")).toContain("Plain [1].");
    expect(md("Plain [1].")).not.toContain("citation-marker");
  });

  test("markers in tables, lists and headings work too", () => {
    const html = md("# T[1]\n\n- item[2]\n\n| a |\n|---|\n| c[1] |", { citations: sources });
    expect(html.match(/data-slot="citation-marker"/g)).toHaveLength(3);
  });

  test("a non-http(s) source URL: the marker isn't a link", () => {
    const html = md("x[1]", { citations: [{ href: "javascript:alert(1)", title: "bad" }] });
    expect(html).toContain('data-slot="citation-marker"');
    expect(html).not.toContain("href=");
  });
});

describe("Markdown streaming caret", () => {
  test("streaming: the caret is at the end of the last text, not on its own line", () => {
    const html = md("first\n\nlast para", { streaming: true });
    expect(html).toContain('data-streaming=""');
    expect(html.match(/data-slot="markdown-caret"/g)).toHaveLength(1);
    expect(html).toContain(
      '<p>last para<span data-slot="markdown-caret" aria-hidden="true"></span></p>',
    );
    expect(html).toContain("<p>first</p>");
  });

  test("last block is a list: the caret is in the last item", () => {
    const html = md("- a\n- b", { streaming: true });
    expect(html).toContain('<li>b<span data-slot="markdown-caret"');
    expect(html).not.toContain('<li>a<span data-slot="markdown-caret"');
  });

  test("last block is code / not streaming: no caret", () => {
    expect(md("```js\nlet a", { streaming: true })).not.toContain("markdown-caret");
    expect(md("text")).not.toContain("markdown-caret");
    expect(md("text")).not.toContain("data-streaming");
  });
});

describe("Markdown codeRenderers", () => {
  const renderers = {
    mermaid: ({ code }: { code: string }) => createElement("div", { "data-x": "diagram" }, code),
  };
  const withRenderers = (source: string) => md(source, { codeRenderers: renderers });

  test("a closed fence goes to the renderer for its language", () => {
    const html = withRenderers("```mermaid\ngraph TD;A-->B\n```");
    expect(html).toContain('data-x="diagram"');
    expect(html).not.toContain('data-slot="code-block"');
  });

  test("mid-stream (unclosed fence) renders as a plain code block first", () => {
    const html = withRenderers("```mermaid\ngraph TD;A-->");
    expect(html).not.toContain('data-x="diagram"');
    expect(html).toContain('data-slot="code-block"');
  });

  test("languages are case-insensitive; unregistered languages stay CodeBlock", () => {
    expect(withRenderers("```Mermaid\nx\n```")).toContain('data-x="diagram"');
    expect(withRenderers("```ts\nx\n```")).toContain('data-slot="code-block"');
  });
});

describe("Markdown math", () => {
  const math: MarkdownProps["math"] = (tex, { display }) =>
    createElement("i", { "data-tex": tex, "data-d": display ? "1" : "0" }, `[${tex}]`);
  const withMath = (source: string) => md(source, { math });
  const texes = (html: string) => [...html.matchAll(/data-tex="([^"]*)"/g)].map((m) => m[1]);

  test("without math: formula markup is plain text", () => {
    const html = md("Cost $x^2$ and $$y$$");
    expect(html).toContain("$x^2$");
    expect(html).not.toContain('data-slot="markdown-math"');
  });

  test("inline $…$, \\(…\\): passed to math with display false", () => {
    const html = withMath("Euler: $e^{i\\pi}+1=0$ and \\(a+b\\).");
    expect(texes(html)).toEqual(["e^{i\\pi}+1=0", "a+b"]);
    expect(html).toContain('data-d="0"');
    expect(html).toContain('data-slot="markdown-math" data-display="inline"');
  });

  test("dollar signs in prices aren't formulas: $5 and $10, $5-$6, a single $", () => {
    for (const s of [
      "It costs $5 and $10 today",
      "range $5-$6 ok",
      "just a $ sign",
      "$ 5 $",
      "a$",
    ]) {
      expect(texes(withMath(s)), s).toEqual([]);
    }
  });

  test("escaped \\$ and $ in inline code aren't formulas", () => {
    expect(texes(withMath("price \\$a and \\$b"))).toEqual([]);
    expect(texes(withMath("run `echo $HOME and $PATH` now"))).toEqual([]);
  });

  test("inline $$…$$ and \\[…\\] display as blocks", () => {
    const html = withMath("see $$a+b$$ and \\[c\\]");
    expect(texes(html)).toEqual(["a+b", "c"]);
    expect(html.match(/data-d="1"/g)).toHaveLength(2);
  });

  test("block $$…$$: one line, several lines (with blank lines), paragraphs around", () => {
    expect(texes(withMath("$$a=b$$"))).toEqual(["a=b"]);
    const multi = withMath("before\n\n$$\nx = 1\n\ny = 2\n$$\n\nafter");
    expect(texes(multi)).toEqual(["x = 1\n\ny = 2"]);
    expect(multi).toContain("<p>before</p>");
    expect(multi).toContain("<p>after</p>");
    expect(multi).toContain('<div data-slot="markdown-math" data-display="block">');
  });

  test("an unclosed block formula (mid-stream) is plain text", () => {
    const html = withMath("intro\n\n$$\nx = 1 +");
    expect(texes(html)).toEqual([]);
    expect(html).toContain("x = 1 +");
  });

  test("$$ in fenced code isn't a formula", () => {
    expect(texes(withMath("```\n$$x$$\n```"))).toEqual([]);
  });

  test("inline formulas work in lists, tables and emphasis", () => {
    expect(texes(withMath("- item $a$\n- item $b$"))).toEqual(["a", "b"]);
    expect(texes(withMath("| h |\n|---|\n| $c$ |"))).toEqual(["c"]);
    expect(texes(withMath("**bold $d$**"))).toEqual(["d"]);
  });

  test("math throws: falls back to the source, other content unaffected", () => {
    const boom: MarkdownProps["math"] = () => {
      throw new Error("bad");
    };
    const html = md("ok $x$ fine", { math: boom });
    expect(html).toContain("<code>x</code>");
    expect(html).toContain("ok");
    expect(html).toContain("fine");
  });
});
