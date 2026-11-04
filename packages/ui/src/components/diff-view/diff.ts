/** Line-by-line diff: compare two texts, parse a unified diff, then collapse large runs of unchanged lines. */

export type DiffLineType = "add" | "del" | "ctx";

export interface DiffLine {
  type: DiffLineType;
  text: string;
  /** Line number in the old file (none for added lines). */
  oldNo?: number;
  /** Line number in the new file (none for deleted lines). */
  newNo?: number;
}

/** If the two sides together exceed this many lines, the LCS table would be too large, so fall back to "delete everything, then add everything". */
const MAX_CELLS = 4_000_000;

const split = (text: string): string[] => {
  if (text === "") return [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
};

/** Compare two texts and produce add / del / ctx per line, with old and new line numbers. First strip the identical head and tail, then use LCS on the rest. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = split(before);
  const b = split(after);
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  ) {
    tail++;
  }
  const ma = a.slice(head, a.length - tail);
  const mb = b.slice(head, b.length - tail);

  const middle: { type: DiffLineType; text: string }[] = [];
  if (ma.length * mb.length > MAX_CELLS) {
    for (const t of ma) middle.push({ type: "del", text: t });
    for (const t of mb) middle.push({ type: "add", text: t });
  } else {
    // lcs[i][j] = length of the longest common subsequence of ma[i..] and mb[j..]
    const cols = mb.length + 1;
    const lcs = new Uint32Array((ma.length + 1) * cols);
    for (let i = ma.length - 1; i >= 0; i--) {
      for (let j = mb.length - 1; j >= 0; j--) {
        lcs[i * cols + j] =
          ma[i] === mb[j]
            ? lcs[(i + 1) * cols + j + 1]! + 1
            : Math.max(lcs[(i + 1) * cols + j]!, lcs[i * cols + j + 1]!);
      }
    }
    let i = 0;
    let j = 0;
    while (i < ma.length && j < mb.length) {
      if (ma[i] === mb[j]) {
        middle.push({ type: "ctx", text: ma[i]! });
        i++;
        j++;
      } else if (lcs[(i + 1) * cols + j]! >= lcs[i * cols + j + 1]!) {
        middle.push({ type: "del", text: ma[i++]! });
      } else {
        middle.push({ type: "add", text: mb[j++]! });
      }
    }
    while (i < ma.length) middle.push({ type: "del", text: ma[i++]! });
    while (j < mb.length) middle.push({ type: "add", text: mb[j++]! });
  }

  const all = [
    ...a.slice(0, head).map((text) => ({ type: "ctx" as const, text })),
    ...middle,
    ...a.slice(a.length - tail).map((text) => ({ type: "ctx" as const, text })),
  ];
  let oldNo = 1;
  let newNo = 1;
  return all.map((line) => {
    if (line.type === "ctx") return { ...line, oldNo: oldNo++, newNo: newNo++ };
    if (line.type === "del") return { ...line, oldNo: oldNo++ };
    return { ...line, newNo: newNo++ };
  });
}

/** Parse a unified diff (output of git diff / diff -u): ignore the file header, and number each line by the @@ line numbers. */
export function parsePatch(patch: string): DiffLine[] {
  const out: DiffLine[] = [];
  let oldNo = 0;
  let newNo = 0;
  let inHunk = false;
  for (const raw of patch.replace(/\r\n?/g, "\n").split("\n")) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) {
      oldNo = Number(hunk[1]);
      newNo = Number(hunk[2]);
      inHunk = true;
      continue;
    }
    if (!inHunk) continue; // headers: diff --git / index / --- / +++
    if (raw.startsWith("\\")) continue; // "\ No newline at end of file"
    if (raw.startsWith("+")) out.push({ type: "add", text: raw.slice(1), newNo: newNo++ });
    else if (raw.startsWith("-")) out.push({ type: "del", text: raw.slice(1), oldNo: oldNo++ });
    else if (raw.startsWith(" ") || raw === "")
      out.push({ type: "ctx", text: raw.slice(1), oldNo: oldNo++, newNo: newNo++ });
  }
  // Remove the extra empty line at the end (an artifact of split)
  while (out.length && out[out.length - 1]!.type === "ctx" && out[out.length - 1]!.text === "") {
    out.pop();
  }
  return out;
}

export interface DiffGap {
  type: "gap";
  /** How many unchanged lines were collapsed. */
  count: number;
  /** The collapsed lines (shown when expanded). */
  lines: DiffLine[];
}

export type DiffItem = DiffLine | DiffGap;

/** Keep `context` lines before and after each change, and collapse unchanged lines farther away into a gap; if nothing changed at all, only one gap remains. */
export function collapse(lines: readonly DiffLine[], context: number): DiffItem[] {
  const keep = Array.from({ length: lines.length }, () => false);
  lines.forEach((line, i) => {
    if (line.type === "ctx") return;
    for (let k = Math.max(0, i - context); k <= Math.min(lines.length - 1, i + context); k++) {
      keep[k] = true;
    }
  });
  const out: DiffItem[] = [];
  let run: DiffLine[] = [];
  const flush = () => {
    // Collapsing a single line is not worth it, just show it
    if (run.length === 1) out.push(run[0]!);
    else if (run.length) out.push({ type: "gap", count: run.length, lines: run });
    run = [];
  };
  lines.forEach((line, i) => {
    if (keep[i]) {
      flush();
      out.push(line);
    } else run.push(line);
  });
  flush();
  return out;
}
