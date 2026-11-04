/**
 * Splits command output containing ANSI escape sequences into "lines -> segments":
 * recognizes SGR (color, bold, dim, italic, underline, inverse), and for colors the 16 colors (30–37 / 90–97 / 40–47 / 100–107, and n < 16 in 38;5;n / 48;5;n);
 * `\r` (in-place refresh such as progress bars) returns to the start of the line and overwrites; other cursor movement, screen clearing and similar sequences are dropped.
 */
export interface AnsiStyle {
  /** Foreground colors 0–15 (8–15 are bright colors). */
  fg?: number;
  bg?: number;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  inverse?: boolean;
}

export interface AnsiSegment extends AnsiStyle {
  text: string;
}

const same = (a: AnsiStyle, b: AnsiStyle) =>
  a.fg === b.fg &&
  a.bg === b.bg &&
  !!a.bold === !!b.bold &&
  !!a.dim === !!b.dim &&
  !!a.italic === !!b.italic &&
  !!a.underline === !!b.underline &&
  !!a.inverse === !!b.inverse;

function applySgr(style: AnsiStyle, params: number[]): AnsiStyle {
  let next = { ...style };
  const list = params.length ? params : [0];
  for (let i = 0; i < list.length; i++) {
    const p = list[i]!;
    if (p === 0) next = {};
    else if (p === 1) next.bold = true;
    else if (p === 2) next.dim = true;
    else if (p === 3) next.italic = true;
    else if (p === 4) next.underline = true;
    else if (p === 7) next.inverse = true;
    else if (p === 22) {
      next.bold = false;
      next.dim = false;
    } else if (p === 23) next.italic = false;
    else if (p === 24) next.underline = false;
    else if (p === 27) next.inverse = false;
    else if (p >= 30 && p <= 37) next.fg = p - 30;
    else if (p >= 90 && p <= 97) next.fg = p - 90 + 8;
    else if (p === 39) delete next.fg;
    else if (p >= 40 && p <= 47) next.bg = p - 40;
    else if (p >= 100 && p <= 107) next.bg = p - 100 + 8;
    else if (p === 49) delete next.bg;
    else if (p === 38 || p === 48) {
      // 38;5;n takes only those within the 16 colors; 38;2;r;g;b consumes the parameters without coloring
      const key = p === 38 ? "fg" : "bg";
      if (list[i + 1] === 5) {
        const n = list[i + 2];
        if (n !== undefined && n >= 0 && n < 16) next[key] = n;
        i += 2;
      } else if (list[i + 1] === 2) {
        i += 4;
      }
    }
  }
  return next;
}

// oxlint-disable-next-line no-control-regex -- ANSI escape sequences start with ESC
const CSI = /\u001b\[([0-9;?]*)([ -/]*[@-~])/g;
// oxlint-disable-next-line no-control-regex -- ESC / BEL are part of the escape sequences
const OTHER_ESC = /\u001b(?:\][^\u0007\u001b]*(?:\u0007|\u001b\\)|[()#][A-Za-z0-9]|[=>78MNOZc])/g;

const visibleLength = (raw: string) => raw.replace(CSI, "").length;

/**
 * `\r` (in-place refresh such as progress bars): only the last non-empty segment in a line is what is finally displayed; SGR (color) sequences in the earlier overwritten segments must be kept,
 * otherwise later colors would be wrong.
 */
function collapseCarriageReturns(line: string): string {
  if (!line.includes("\r")) return line;
  const parts = line.split("\r");
  let keep = parts.length - 1;
  while (keep > 0 && visibleLength(parts[keep]!) === 0) keep--;
  const carried = parts
    .slice(0, keep)
    .join("")
    // oxlint-disable-next-line no-control-regex -- SGR (colour) escape sequences start with ESC
    .match(/\u001b\[[0-9;]*m/g);
  return (carried?.join("") ?? "") + parts[keep]!;
}

/** Parses into lines (split on `\n`); each line is a list of styled segments, with adjacent same-style segments already merged. */
export function parseAnsi(input: string): AnsiSegment[][] {
  const text = input.replace(/\r\n/g, "\n").replace(OTHER_ESC, "");
  const raw = text.split("\n").map(collapseCarriageReturns);
  // Drop the empty line produced by a trailing newline
  if (raw.length > 1 && raw[raw.length - 1] === "") raw.pop();
  let style: AnsiStyle = {};
  return raw.map((piece) => {
    const line: AnsiSegment[] = [];
    const write = (chunk: string) => {
      if (!chunk) return;
      const last = line[line.length - 1];
      if (last && same(last, style)) last.text += chunk;
      else line.push({ ...style, text: chunk });
    };
    let last = 0;
    CSI.lastIndex = 0;
    for (let m = CSI.exec(piece); m; m = CSI.exec(piece)) {
      write(piece.slice(last, m.index));
      last = m.index + m[0].length;
      if (m[2] === "m") {
        style = applySgr(
          style,
          m[1]!.split(";").map((n) => (n === "" ? 0 : Number(n))),
        );
      }
    }
    write(piece.slice(last));
    return line;
  });
}

/** Plain text with all escape sequences removed (for copying). */
export function stripAnsi(input: string): string {
  return parseAnsi(input)
    .map((line) => line.map((s) => s.text).join(""))
    .join("\n");
}
