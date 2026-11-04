import { Fragment, memo } from "react";
import type { ReactNode } from "react";
import { CitationMarker } from "../citation/citation.tsx";
import type { CitationProps } from "../citation/citation.tsx";
import { CodeBlock } from "../code-block/index.ts";
import type { CodeBlockProps } from "../code-block/index.ts";
import { parseBlocks, parseInline, splitBlocks } from "./parse.ts";
import type { Block, Inline } from "./parse.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface MarkdownLabels {
  /** Screen-reader text for completed items in a task list, default "Completed". */
  taskDone?: string;
  /** For incomplete items, default "Not completed". */
  taskTodo?: string;
  /** Name of the table scroll area, default "Table". */
  table?: string;
}

export interface MarkdownProps {
  /** Raw Markdown. When streaming, just keep appending: earlier unchanged blocks are not redrawn, and unclosed markers are shown as raw text. */
  children: string;
  /**
   * How links open, default `_blank` (with `noopener noreferrer`).
   * @default "_blank"
   */
  linkTarget?: "_blank" | "_self";
  /**
   * A single newline within a paragraph also breaks the line (common in chat); by default it is treated as a space per the standard.
   * @default false
   */
  breaks?: boolean;
  /** Highlighting of fenced code, same as `CodeBlock`'s `highlight`. */
  highlight?: CodeBlockProps["highlight"];
  /** Theme of fenced code, same as `CodeBlock`'s `theme`. */
  codeTheme?: CodeBlockProps["theme"];
  /**
   * Take over rendering of fenced code by language, e.g. `{ mermaid: ({ code }) => <MermaidBlock code={code} render={render} /> }`.
   * Not called while the fence is not yet closed (halfway through streaming); it is shown as a normal code block first. Pass a stable object: if it changes, all blocks are redrawn.
   */
  codeRenderers?: Readonly<Record<string, (props: { code: string }) => ReactNode>>;
  /**
   * Citation sources: `[1]`, `[2]` in the body become clickable citation badges, and the nth source corresponds to `[n]` (1-based).
   * Numbers with no matching source (e.g. `[7]`) remain plain text. Pass stable citations: if the array changes, all blocks are redrawn.
   */
  citations?: readonly Omit<CitationProps, "sourceType" | "onClick">[];
  /**
   * Math: when given, `$$…$$` blocks and inline `$…$`, `\\(…\\)`, `\\[…\\]` are recognized, and rendering is handed to this function (hook up KaTeX / MathJax),
   * which returns the content to put in the page. When not given, they are treated as plain text. The `$` rules are the same as Pandoc
   * (the opening `$` must not be followed by whitespace, the closing `$` must not be preceded by whitespace nor followed by a digit, so "$5 and $10" is not a formula);
   * an unclosed block formula (halfway through streaming) is shown as plain text first. Pass a stable function: if it changes, all blocks are redrawn.
   * If the function throws, the raw formula text is shown instead.
   */
  math?: (tex: string, options: { display: boolean }) => ReactNode;
  /**
   * Still streaming: a blinking cursor is shown after the last piece of text and removed when finished.
   * @default false
   */
  streaming?: boolean;
  labels?: MarkdownLabels;
}

interface Ctx {
  linkTarget: "_blank" | "_self";
  breaks: boolean;
  highlight: CodeBlockProps["highlight"];
  codeTheme: CodeBlockProps["theme"];
  codeRenderers: MarkdownProps["codeRenderers"];
  math: MarkdownProps["math"];
  taskDone: string;
  taskTodo: string;
  table: string;
  citations: MarkdownProps["citations"];
  /** Whether to draw the streaming cursor at the end of this block. */
  caret: boolean;
}

const CARET = <span data-slot="markdown-caret" aria-hidden="true" />;
const inlineOptions = (ctx: Ctx) => ({ cite: !!ctx.citations?.length, math: !!ctx.math });
const blockOptions = (ctx: Ctx) => ({ math: !!ctx.math });

/** The caller's formula render function; if it throws, fall back to showing the raw text, so one bad formula does not break the whole message. */
function renderMath(tex: string, display: boolean, ctx: Ctx): ReactNode {
  let content: ReactNode;
  try {
    content = ctx.math!(tex, { display });
  } catch {
    content = <code>{tex}</code>;
  }
  const Tag = display ? "div" : "span";
  return (
    <Tag data-slot="markdown-math" data-display={display ? "block" : "inline"}>
      {content}
    </Tag>
  );
}

function renderInline(nodes: Inline[], ctx: Ctx): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return ctx.breaks && node.text.includes("\n") ? (
          <Fragment key={i}>
            {node.text.split("\n").map((part, k) => (
              <Fragment key={k}>
                {k > 0 ? <br /> : null}
                {part}
              </Fragment>
            ))}
          </Fragment>
        ) : (
          node.text
        );
      case "code":
        return (
          <code key={i} data-slot="markdown-inline-code">
            {node.text}
          </code>
        );
      case "strong":
        return <strong key={i}>{renderInline(node.children, ctx)}</strong>;
      case "em":
        return <em key={i}>{renderInline(node.children, ctx)}</em>;
      case "del":
        return <del key={i}>{renderInline(node.children, ctx)}</del>;
      case "math":
        return <Fragment key={i}>{renderMath(node.tex, node.display, ctx)}</Fragment>;
      case "br":
        return <br key={i} />;
      case "cite": {
        const source = ctx.citations?.[node.n - 1];
        return source ? <CitationMarker key={i} index={node.n} {...source} /> : `[${node.n}]`;
      }
      case "image":
        return (
          <img key={i} data-slot="markdown-image" src={node.src} alt={node.alt} loading="lazy" />
        );
      case "link":
        return (
          <a
            key={i}
            data-slot="markdown-link"
            href={node.href}
            target={ctx.linkTarget}
            rel={ctx.linkTarget === "_blank" ? "noopener noreferrer" : undefined}
          >
            {renderInline(node.children, ctx)}
          </a>
        );
    }
  });
}

function renderBlock(block: Block, key: number, ctx: Ctx): ReactNode {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as const;
      return (
        <Tag key={key}>
          {renderInline(parseInline(block.text, inlineOptions(ctx)), ctx)}
          {ctx.caret ? CARET : null}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p key={key}>
          {renderInline(parseInline(block.text, inlineOptions(ctx)), ctx)}
          {ctx.caret ? CARET : null}
        </p>
      );
    case "math":
      return <Fragment key={key}>{renderMath(block.tex, true, ctx)}</Fragment>;
    case "hr":
      return <hr key={key} />;
    case "code": {
      const custom = block.language ? ctx.codeRenderers?.[block.language.toLowerCase()] : undefined;
      if (custom && block.closed)
        return <Fragment key={key}>{custom({ code: block.code })}</Fragment>;
      return (
        <CodeBlock
          key={key}
          code={block.code}
          language={block.language}
          highlight={ctx.highlight}
          theme={ctx.codeTheme}
        />
      );
    }
    case "quote":
      return <blockquote key={key}>{renderSource(block.source, ctx)}</blockquote>;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag key={key} start={block.ordered && block.start !== 1 ? block.start : undefined}>
          {block.items.map((item, i) => (
            <li key={i} data-task={item.checked === null ? undefined : ""}>
              {item.checked === null ? null : (
                <span
                  data-slot="markdown-task"
                  data-checked={item.checked ? "" : undefined}
                  role="checkbox"
                  aria-checked={item.checked}
                  aria-disabled="true"
                  aria-label={item.checked ? ctx.taskDone : ctx.taskTodo}
                />
              )}
              {renderSource(item.source, ctx, true)}
              {ctx.caret && i === block.items.length - 1 ? CARET : null}
            </li>
          ))}
        </Tag>
      );
    }
    case "table":
      return (
        <div
          key={key}
          data-slot="markdown-table-wrap"
          role="region"
          tabIndex={0}
          aria-label={ctx.table}
        >
          <table>
            <thead>
              <tr>
                {block.header.map((cell, i) => (
                  <th key={i} data-align={block.align[i] ?? undefined} scope="col">
                    {renderInline(parseInline(cell, inlineOptions(ctx)), ctx)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i} data-align={block.align[i] ?? undefined}>
                      {renderInline(parseInline(cell, inlineOptions(ctx)), ctx)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** Nested content (quotes, list items): go through splitting into blocks + parsing again. Paragraphs in compact list items (no blank lines inside) are not wrapped in <p>. */
function renderSource(source: string, ctx: Ctx, tight = false): ReactNode[] {
  const blocks = splitBlocks(source, blockOptions(ctx)).flatMap((raw) =>
    parseBlocks(raw, blockOptions(ctx)),
  );
  // A list item with no blank lines is compact: paragraphs are not wrapped in <p>
  const bare = tight && !/\n[ \t]*\n/.test(source);
  return blocks.map((block, i) =>
    bare && block.type === "paragraph" ? (
      <Fragment key={i}>{renderInline(parseInline(block.text, inlineOptions(ctx)), ctx)}</Fragment>
    ) : (
      renderBlock(block, i, ctx)
    ),
  );
}

interface BlockViewProps extends Ctx {
  source: string;
}

/** A top-level block: cached by raw text, and not redrawn if the raw text and config are unchanged (while streaming only the last block changes). */
const BlockView = memo(
  function BlockView({ source, ...ctx }: BlockViewProps) {
    return (
      <>{parseBlocks(source, blockOptions(ctx)).map((block, i) => renderBlock(block, i, ctx))}</>
    );
  },
  (a, b) =>
    a.source === b.source &&
    a.linkTarget === b.linkTarget &&
    a.breaks === b.breaks &&
    a.highlight === b.highlight &&
    a.codeTheme === b.codeTheme &&
    a.codeRenderers === b.codeRenderers &&
    a.math === b.math &&
    a.taskDone === b.taskDone &&
    a.taskTodo === b.taskTodo &&
    a.table === b.table &&
    a.citations === b.citations &&
    a.caret === b.caret,
);

/**
 * Markdown rendering: a zero-dependency parser (headings, paragraphs, fenced code, quotes, lists / task lists, tables, horizontal rules,
 * inline code / bold / italic / strikethrough / links / images), with fenced code using `CodeBlock`.
 * HTML is not recognized and is treated as plain text; links and images only allow http(s) / mailto / tel and relative addresses.
 */
export function Markdown({
  children,
  linkTarget = "_blank",
  breaks = false,
  highlight,
  codeTheme,
  codeRenderers,
  math,
  citations,
  streaming = false,
  labels: labelsProp,
}: MarkdownProps) {
  const labels = useLabels("markdown", labelsProp);
  const ctx: Omit<Ctx, "caret"> = {
    linkTarget,
    breaks,
    highlight,
    codeTheme,
    codeRenderers,
    math,
    taskDone: labels.taskDone,
    taskTodo: labels.taskTodo,
    table: labels.table,
    citations,
  };
  const blocks = splitBlocks(children, { math: !!math });
  return (
    <div data-slot="markdown" data-streaming={streaming ? "" : undefined}>
      {blocks.map((source, i) => (
        <BlockView key={i} source={source} {...ctx} caret={streaming && i === blocks.length - 1} />
      ))}
    </div>
  );
}
