/**
 * A library-free Markdown parser covering the subset common in chat replies:
 * headings, paragraphs, fenced code, quotes, ordered / unordered / task lists (nestable), tables, horizontal rules;
 * inline code, bold, italic, strikethrough, links, images, autolinks, line breaks.
 * HTML is not recognized (treated as plain text, so no tags are injected). Unclosed markers are shown as raw text, so it does not break halfway through streaming.
 * Math is optional (`math: true`): `$$…$$` blocks, inline `$…$`, `\(…\)`, `\[…\]`; it only recognizes them, and rendering is done by the caller's function.
 */

import { isSafeUrl } from "./url.ts";

// ───────────── Blocks ─────────────

export type TableAlign = "start" | "center" | "end" | null;

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; language: string | undefined; code: string; closed: boolean }
  | { type: "quote"; source: string }
  | {
      type: "list";
      ordered: boolean;
      start: number;
      items: { source: string; checked: boolean | null }[];
    }
  | { type: "table"; header: string[]; align: TableAlign[]; rows: string[][] }
  | { type: "math"; tex: string }
  | { type: "hr" };

export interface BlockOptions {
  /** Recognize `$$…$$` formula blocks. Unclosed ones (halfway through streaming) become ordinary paragraphs. */
  math?: boolean;
}

const indentOf = (line: string) => /^\s*/.exec(line.replace(/\t/g, "    "))![0].length;
const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)[^`]*$/;
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR = /^ {0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/;
const QUOTE = /^ {0,3}>\s?/;
const LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
/** `$$ … $$` on a single line (single-line formula block). */
const MATH_ONE_LINE = /^\s*\$\$(.+?)\$\$\s*$/;
const MATH_OPEN = /^\s*\$\$/;
const TABLE_SEP = /^\s*\|?\s*:?-{1,}:?\s*(?:\|\s*:?-{1,}:?\s*)*\|?\s*$/;

/**
 * Split the raw text into top-level blocks: separated by blank lines, fenced code, headings. Each block's raw text is returned separately,
 * so while streaming the earlier blocks' text is unchanged, and the caller can cache by raw text and redraw only the last block.
 */
export function splitBlocks(source: string, options: BlockOptions = {}): string[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) blocks.push(current.join("\n"));
    current = [];
  };
  /** What is being collected is a list: indented content (including blank lines and code blocks) belongs to it and is not split off. */
  const inList = () => current.length > 0 && LIST_ITEM.test(current[0]!);
  const nextNonBlank = (from: number) => {
    for (let k = from; k < lines.length; k++) if (lines[k]!.trim() !== "") return lines[k]!;
    return undefined;
  };
  let fence: { marker: string; length: number; nested: boolean } | null = null;
  let inMath = false;
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n]!;
    if (inMath) {
      current.push(line);
      if (/\$\$\s*$/.test(line)) {
        inMath = false;
        flush();
      }
      continue;
    }
    if (options.math && !fence && MATH_OPEN.test(line) && !inList()) {
      flush();
      current.push(line);
      // One that closes on the same line ($$x$$) need not wait for later lines
      if (!MATH_ONE_LINE.test(line)) inMath = true;
      else flush();
      continue;
    }
    if (fence) {
      current.push(line);
      const close = new RegExp(`^\\s*${fence.marker}{${fence.length},}\\s*$`);
      if (close.test(line)) {
        const nested = fence.nested;
        fence = null;
        if (!nested) flush();
      }
      continue;
    }
    const nestedFence = inList() && indentOf(line) >= 2 ? /^\s*(`{3,}|~{3,})/.exec(line) : null;
    const open = nestedFence ?? FENCE.exec(line);
    if (open) {
      const nested = !!nestedFence;
      if (!nested) flush();
      current.push(line);
      fence = { marker: open[1]![0]! === "`" ? "`" : "~", length: open[1]!.length, nested };
      continue;
    }
    if (line.trim() === "") {
      if (inList()) {
        const next = nextNonBlank(n + 1);
        if (next !== undefined && (indentOf(next) >= 2 || LIST_ITEM.test(next))) {
          current.push("");
          continue;
        }
      }
      flush();
      continue;
    }
    if (!(inList() && indentOf(line) >= 2) && (HEADING.test(line) || HR.test(line))) {
      flush();
      blocks.push(line);
      continue;
    }
    current.push(line);
  }
  flush();
  return blocks;
}

const startsBlock = (line: string) =>
  HEADING.test(line) ||
  HR.test(line) ||
  FENCE.test(line) ||
  QUOTE.test(line) ||
  /^ {0,3}(?:[-*+]|1[.)])\s+/.test(line);

const splitRow = (line: string): string[] => {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells: string[] = [];
  let cell = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") {
      cell += "|";
      i++;
    } else if (s[i] === "|") {
      cells.push(cell.trim());
      cell = "";
    } else cell += s[i];
  }
  cells.push(cell.trim());
  return cells;
};

/** Parse the raw text of a top-level block into one or several blocks (consecutive lines may be mixed, such as a paragraph plus a list). */
export function parseBlocks(raw: string, options: BlockOptions = {}): Block[] {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim() === "") {
      i++;
      continue;
    }
    // Formula block: $$ … $$ (if not closed it is not treated as a formula, and falls through to paragraph handling)
    if (options.math && MATH_OPEN.test(line)) {
      const one = MATH_ONE_LINE.exec(line);
      if (one) {
        blocks.push({ type: "math", tex: one[1]!.trim() });
        i++;
        continue;
      }
      const body = [line.replace(MATH_OPEN, "")];
      let k = i + 1;
      let closed = false;
      while (k < lines.length) {
        if (/\$\$\s*$/.test(lines[k]!)) {
          body.push(lines[k]!.replace(/\$\$\s*$/, ""));
          closed = true;
          break;
        }
        body.push(lines[k]!);
        k++;
      }
      if (closed) {
        blocks.push({ type: "math", tex: body.join("\n").trim() });
        i = k + 1;
        continue;
      }
    }
    // Fenced code (counts even if unclosed: halfway through streaming)
    const fence = FENCE.exec(line);
    if (fence) {
      const marker = fence[1]![0]!;
      const length = fence[1]!.length;
      const close = new RegExp(`^ {0,3}${marker === "`" ? "`" : "~"}{${length},}\\s*$`);
      const body: string[] = [];
      i++;
      while (i < lines.length && !close.test(lines[i]!)) body.push(lines[i++]!);
      const closed = i < lines.length;
      if (closed) i++;
      blocks.push({ type: "code", language: fence[2] || undefined, code: body.join("\n"), closed });
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1]!.length as 1 | 2 | 3 | 4 | 5 | 6,
        text: heading[2]!,
      });
      i++;
      continue;
    }
    if (HR.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }
    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (
        i < lines.length &&
        (QUOTE.test(lines[i]!) ||
          (body.length && lines[i]!.trim() !== "" && !startsBlock(lines[i]!)))
      ) {
        body.push(lines[i]!.replace(QUOTE, ""));
        i++;
      }
      blocks.push({ type: "quote", source: body.join("\n") });
      continue;
    }
    // Table: the current line has | and the next line is a separator row
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      TABLE_SEP.test(lines[i + 1]!) &&
      lines[i + 1]!.includes("-")
    ) {
      const header = splitRow(line);
      const seps = splitRow(lines[i + 1]!);
      if (header.length === seps.length || seps.length >= 1) {
        const align: TableAlign[] = header.map((_, k) => {
          const s = seps[k] ?? "";
          const l = s.startsWith(":");
          const r = s.endsWith(":");
          return l && r ? "center" : r ? "end" : l ? "start" : null;
        });
        const rows: string[][] = [];
        i += 2;
        while (i < lines.length && lines[i]!.trim() !== "" && lines[i]!.includes("|")) {
          const cells = splitRow(lines[i++]!);
          rows.push(header.map((_, k) => cells[k] ?? ""));
        }
        blocks.push({ type: "table", header, align, rows });
        continue;
      }
    }
    const item = LIST_ITEM.exec(line);
    if (item) {
      const baseIndent = indentOf(line);
      const ordered = /\d/.test(item[2]!);
      const start = ordered ? Number(item[2]!.replace(/\D/g, "")) : 1;
      const items: { source: string; checked: boolean | null }[] = [];
      while (i < lines.length) {
        const m = LIST_ITEM.exec(lines[i]!);
        if (!m || indentOf(lines[i]!) !== baseIndent || /\d/.test(m[2]!) !== ordered) break;
        const contentIndent = baseIndent + m[2]!.length + 1;
        let text = m[3]!;
        let checked: boolean | null = null;
        const task = /^\[([ xX])\]\s+(.*)$/.exec(text);
        if (task) {
          checked = task[1] !== " ";
          text = task[2]!;
        }
        const body = [text];
        i++;
        while (i < lines.length) {
          const next = lines[i]!;
          if (next.trim() === "") {
            // Indented content after a blank line still belongs to this item
            const after = lines[i + 1];
            if (after !== undefined && indentOf(after) >= contentIndent) {
              body.push("");
              i++;
              continue;
            }
            break;
          }
          if (indentOf(next) >= contentIndent) {
            body.push(next.replace(/\t/g, "    ").slice(contentIndent));
            i++;
          } else if (!LIST_ITEM.test(next) && !startsBlock(next)) {
            body.push(next.trim()); // lazy continuation line
            i++;
          } else break;
        }
        items.push({ source: body.join("\n"), checked });
        // Items separated by blank lines still count as the same list
        if (lines[i]?.trim() === "" && lines[i + 1] !== undefined) {
          const peek = LIST_ITEM.exec(lines[i + 1]!);
          if (peek && indentOf(lines[i + 1]!) === baseIndent && /\d/.test(peek[2]!) === ordered)
            i++;
        }
      }
      blocks.push({ type: "list", ordered, start, items });
      continue;
    }
    // Paragraph: continues until a blank line or the start of another block
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i]!.trim() !== "" && !startsBlock(lines[i]!)) {
      if (lines[i]!.includes("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]!)) break;
      para.push(lines[i++]!);
    }
    blocks.push({ type: "paragraph", text: para.join("\n") });
  }
  return blocks;
}

// ───────────── Inline ─────────────

export type Inline =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "strong" | "em" | "del"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "image"; src: string; alt: string }
  | { type: "cite"; n: number }
  | { type: "math"; tex: string; display: boolean }
  | { type: "br" };

const PUNCT = /[!-/:-@[-`{-~]/;

/** Find the close that pairs with open (skipping escapes); returns -1 if none. */
function findClose(text: string, from: number, open: string, close: string): number {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    if (text[i] === "\\") {
      i++;
    } else if (text[i] === open && open !== close) {
      depth++;
    } else if (text[i] === close) {
      if (depth === 0) return i;
      depth--;
    }
  }
  return -1;
}

export interface InlineOptions {
  /** Treat a numeric bracket like `[1]` as a citation badge (when not followed by `(` / `:`). */
  cite?: boolean;
  /** Recognize inline math: `$…$`, `$$…$$`, `\(…\)`, `\[…\]`. The `$` rules are the same as Pandoc: the opening `$` cannot be followed by whitespace, the closing `$` cannot be preceded by whitespace nor immediately followed by a digit, so "$5 and $10" is not treated as a formula. */
  math?: boolean;
}

/** Find the closing `$` of inline math (skipping escapes); see `InlineOptions.math` for the rules; returns -1 if none. */
function findMathClose(text: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    const c = text[i]!;
    if (c === "\\") {
      i++;
    } else if (c === "$") {
      const before = text[i - 1] ?? " ";
      if (/\s/.test(before)) continue;
      if (/\d/.test(text[i + 1] ?? "")) continue;
      return i;
    }
  }
  return -1;
}

export function parseInline(text: string, options: InlineOptions = {}): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const pushText = () => {
    if (buf) out.push({ type: "text", text: buf });
    buf = "";
  };
  let i = 0;
  while (i < text.length) {
    const c = text[i]!;
    // Math: \(…\) / \[…\] / $$…$$ / $…$
    if (options.math) {
      if (c === "\\" && (text[i + 1] === "(" || text[i + 1] === "[")) {
        const display = text[i + 1] === "[";
        const end = text.indexOf(display ? "\\]" : "\\)", i + 2);
        if (end !== -1 && text.slice(i + 2, end).trim() !== "") {
          pushText();
          out.push({ type: "math", tex: text.slice(i + 2, end).trim(), display });
          i = end + 2;
          continue;
        }
      }
      if (c === "$") {
        if (text[i + 1] === "$") {
          const end = text.indexOf("$$", i + 2);
          if (end !== -1 && text.slice(i + 2, end).trim() !== "") {
            pushText();
            out.push({ type: "math", tex: text.slice(i + 2, end).trim(), display: true });
            i = end + 2;
            continue;
          }
        } else if (i + 1 < text.length && !/\s/.test(text[i + 1]!)) {
          const end = findMathClose(text, i + 1);
          if (end !== -1 && end > i + 1 && !text.slice(i + 1, end).includes("\n\n")) {
            pushText();
            out.push({ type: "math", tex: text.slice(i + 1, end), display: false });
            i = end + 1;
            continue;
          }
        }
      }
    }
    // Escape
    if (c === "\\") {
      const n = text[i + 1];
      if (n === "\n") {
        pushText();
        out.push({ type: "br" });
        i += 2;
        continue;
      }
      if (n !== undefined && PUNCT.test(n)) {
        buf += n;
        i += 2;
        continue;
      }
    }
    // Inline code
    if (c === "`") {
      let n = 0;
      while (text[i + n] === "`") n++;
      const ticks = "`".repeat(n);
      const end = text.indexOf(ticks, i + n);
      let close = end;
      // Find a backtick run of exactly the same length
      while (close !== -1 && text[close + n] === "`") {
        let k = close;
        while (text[k] === "`") k++;
        close = text.indexOf(ticks, k);
      }
      if (close !== -1) {
        pushText();
        let code = text.slice(i + n, close).replace(/\n/g, " ");
        if (code.length > 1 && code.startsWith(" ") && code.endsWith(" ") && code.trim() !== "") {
          code = code.slice(1, -1);
        }
        out.push({ type: "code", text: code });
        i = close + n;
        continue;
      }
      buf += ticks;
      i += n;
      continue;
    }
    // Citation badge [1]
    if (options.cite && c === "[") {
      const m = /^\[(\d{1,3})\](?![(:])/.exec(text.slice(i));
      if (m) {
        pushText();
        out.push({ type: "cite", n: Number(m[1]) });
        i += m[0].length;
        continue;
      }
    }
    // Image / link
    if (c === "[" || (c === "!" && text[i + 1] === "[")) {
      const isImage = c === "!";
      const labelStart = i + (isImage ? 2 : 1);
      const labelEnd = findClose(text, labelStart, "[", "]");
      if (labelEnd !== -1 && text[labelEnd + 1] === "(") {
        const urlEnd = findClose(text, labelEnd + 2, "(", ")");
        if (urlEnd !== -1) {
          const target = /^\s*<?([^\s>]*)>?(?:\s+["'][^"']*["'])?\s*$/.exec(
            text.slice(labelEnd + 2, urlEnd),
          );
          if (target) {
            const href = target[1]!;
            const label = text.slice(labelStart, labelEnd);
            if (isImage) {
              if (isSafeUrl(href, "image")) {
                pushText();
                out.push({ type: "image", src: href, alt: label });
                i = urlEnd + 1;
                continue;
              }
            } else {
              pushText();
              if (isSafeUrl(href)) {
                out.push({ type: "link", href, children: parseInline(label, options) });
              } else {
                // Unsafe URL: keep only the text, no link
                out.push(...parseInline(label, options));
              }
              i = urlEnd + 1;
              continue;
            }
          }
        }
      }
    }
    // <https://…> autolink
    if (c === "<") {
      const m = /^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i.exec(text.slice(i));
      if (m) {
        pushText();
        out.push({ type: "link", href: m[1]!, children: [{ type: "text", text: m[1]! }] });
        i += m[0].length;
        continue;
      }
    }
    // Bare link
    if (
      (c === "h" || c === "H") &&
      /^https?:\/\//i.test(text.slice(i, i + 8)) &&
      !/[\w]/.test(text[i - 1] ?? " ")
    ) {
      const m = /^https?:\/\/[^\s<>]+/i.exec(text.slice(i))!;
      const url = m[0].replace(/[.,;:!?'")\]]+$/, "");
      if (url.length > 8) {
        pushText();
        out.push({ type: "link", href: url, children: [{ type: "text", text: url }] });
        i += url.length;
        continue;
      }
    }
    // Bold / italic / strikethrough
    if (c === "*" || c === "_" || c === "~") {
      const double = text[i + 1] === c;
      if (c === "~" && !double) {
        buf += c;
        i++;
        continue;
      }
      const marker = double ? c + c : c;
      const innerStart = i + marker.length;
      const prev = text[i - 1] ?? " ";
      // _ in the middle of a word is not emphasis (snake_case)
      const intraword = c === "_" && /\w/.test(prev);
      if (!intraword && innerStart < text.length && !/\s/.test(text[innerStart]!)) {
        let close = innerStart;
        let found = -1;
        while ((close = text.indexOf(marker, close)) !== -1) {
          const before = text[close - 1] ?? " ";
          const after = text[close + marker.length] ?? " ";
          const escaped = before === "\\";
          const closes = !/\s/.test(before) && !escaped && !(c === "_" && /\w/.test(after));
          // A single * cannot close in the middle of **
          const inDouble = !double && text[close + 1] === c;
          if (closes && !inDouble && close > innerStart) {
            found = close;
            break;
          }
          close += inDouble ? 2 : marker.length;
        }
        if (found !== -1) {
          pushText();
          out.push({
            type: c === "~" ? "del" : double ? "strong" : "em",
            children: parseInline(text.slice(innerStart, found), options),
          });
          i = found + marker.length;
          continue;
        }
      }
      buf += marker;
      i += marker.length;
      continue;
    }
    // Two spaces plus a newline = hard line break
    if (c === " " && text[i + 1] === " " && /^ +\n/.test(text.slice(i))) {
      const m = /^ +\n/.exec(text.slice(i))!;
      pushText();
      out.push({ type: "br" });
      i += m[0].length;
      continue;
    }
    buf += c;
    i++;
  }
  pushText();
  return out;
}
