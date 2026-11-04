import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CodeTheme } from "../../contract.ts";
import { canHighlight, tokenize } from "./tokenize.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface CodeBlockProps {
  /** Code text. */
  code: string;
  /** Language, shown in the header and also decides which built-in highlighting set is used (js / ts / json / python / bash / css / html / sql, etc.). */
  language?: string;
  /** Text on the left of the header, defaults to the language; pass something like a file name to replace it. */
  title?: string;
  /**
   * Highlighting: by default (`true`) the built-in lightweight highlighter is used, and unrecognized languages are plain text; `false` disables highlighting;
   * or pass a function that returns the already highlighted content per line (for shiki / Prism), with a line count matching `code` split on newlines.
   * @default true
   */
  highlight?: boolean | ((code: string, language: string | undefined) => ReactNode[]);
  /**
   * Code theme (GitHub / One / Solarized / Catppuccin follow light / dark mode, Dracula / Nord / Monokai / Tokyo Night are always dark).
   * If omitted, the theme style's own colors are used. Requires importing `@skeinui/themes/code/index.css` (or a single theme's file).
   */
  theme?: CodeTheme;
  /**
   * Show line numbers.
   * @default false
   */
  lineNumbers?: boolean;
  /**
   * Wrap long lines; by default they scroll horizontally.
   * @default false
   */
  wrap?: boolean;
  /** Name of the copy button, default "Copy code". */
  copyLabel?: string;
  /** Name of the button after a successful copy, also announced by screen readers, default "Copied"; it reverts after 2 seconds. */
  copiedLabel?: string;
}

const COPIED_MS = 2000;

const CopyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/** Split the whole token stream into lines at newlines (a token may span lines, e.g. a multi-line comment). */
function renderLines(code: string, language: string | undefined): ReactNode[] {
  const lines: ReactNode[][] = [[]];
  let key = 0;
  for (const token of tokenize(code, language)) {
    const parts = token.text.split("\n");
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part === "") return;
      lines[lines.length - 1]!.push(
        token.type ? (
          <span key={key++} data-token={token.type}>
            {part}
          </span>
        ) : (
          part
        ),
      );
    });
  }
  return lines.map((content) => (content.length ? content : null));
}

/**
 * Code block: the header has the language (or title) plus a copy button, below it is horizontally scrollable code. After a successful copy the button name becomes `copiedLabel`,
 * the icon becomes a check mark, and it is announced once with `role="status"`; it reverts after 2 seconds. The code area is keyboard focusable (so arrow keys can scroll it, WCAG 2.1.1).
 */
export function CodeBlock({
  code,
  language,
  title,
  highlight = true,
  theme,
  lineNumbers = false,
  wrap = false,
  copyLabel: copyLabelProp,
  copiedLabel: copiedLabelProp,
}: CodeBlockProps) {
  const t = useLabels("codeBlock");
  const copiedLabel = copiedLabelProp ?? t.copied;
  const copyLabel = copyLabelProp ?? t.copy;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return; // no clipboard permission: nothing happens
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  const rows =
    typeof highlight === "function"
      ? highlight(code, language)
      : highlight && canHighlight(language)
        ? renderLines(code, language)
        : code.split("\n");
  const label = title ?? language ?? "text";

  return (
    <div
      data-slot="code-block"
      data-language={language}
      data-code-theme={theme}
      data-line-numbers={lineNumbers ? "" : undefined}
      data-wrap={wrap ? "" : undefined}
    >
      <div data-slot="code-block-header">
        <span data-slot="code-block-language">{label}</span>
        <button
          type="button"
          data-slot="code-block-copy"
          data-copied={copied ? "" : undefined}
          aria-label={copied ? copiedLabel : copyLabel}
          onClick={copy}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
        <span data-slot="code-block-status" role="status">
          {copied ? copiedLabel : ""}
        </span>
      </div>
      <pre data-slot="code-block-pre" tabIndex={0} role="region" aria-label={t.code(label)}>
        <code data-slot="code-block-code">
          {rows.map((row, i) => (
            // Line numbers rely on CSS counters; an empty line gets a zero-width space so it has line height
            <span key={i} data-slot="code-block-line">
              {row === null || row === "" ? "\u200b" : row}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
