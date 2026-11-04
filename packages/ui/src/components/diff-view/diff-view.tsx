import { useState } from "react";
import type { CodeTheme, DiffLineType } from "../../contract.ts";
import { tokenize } from "../code-block/index.ts";
import { collapse, diffLines, parsePatch } from "./diff.ts";
import type { DiffGap, DiffLine } from "./diff.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface DiffViewLabels {
  /** Screen reader prefixes for each kind of line, default Added / Removed. */
  added?: string;
  removed?: string;
  /** Text of the collapse button, default `Show ${n} unchanged lines`. */
  expand?: (count: number) => string;
  /** Message when there are no changes at all, default "No changes". */
  empty?: string;
  /** Name of the compared content, defaults to the file name. */
  diff?: string;
}

interface DiffViewBase {
  /** File name, shown in the header; also the name of the code area. */
  fileName?: string;
  /** Language, used for lightweight highlighting of each line (same as CodeBlock); no highlighting if omitted. */
  language?: string;
  /** Code theme, same as `theme` of `CodeBlock`. */
  codeTheme?: CodeTheme;
  /**
   * Number of lines to keep before and after each change; unchanged lines farther away are collapsed, default 3; click the collapse bar to expand.
   * @default 3
   */
  context?: number;
  labels?: DiffViewLabels;
}

export type DiffViewProps =
  | (DiffViewBase & {
      /** Text before the change; compared line by line with `newText`. Pass either both texts or `patch`. */
      oldText: string;
      /** Text after the change. */
      newText: string;
      patch?: never;
    })
  | (DiffViewBase & {
      /** A unified diff (`git diff` / `diff -u` output) to show instead of `oldText` / `newText`; the file header is ignored, lines are numbered from the `@@` hunk headers. */
      patch: string;
      oldText?: never;
      newText?: never;
    });

const SIGN: Record<DiffLineType, string> = { add: "+", del: "−", ctx: " " };

function Code({ text, language }: { text: string; language?: string }) {
  if (!language || text === "") return <>{text === "" ? "​" : text}</>;
  return (
    <>
      {tokenize(text, language).map((t, i) =>
        t.type ? (
          <span key={i} data-token={t.type}>
            {t.text}
          </span>
        ) : (
          t.text
        ),
      )}
    </>
  );
}

/**
 * Code diff view: given two texts (or a unified diff), shows added / removed / unchanged lines per line, with old and new line numbers;
 * the header has the file name and a `+n −m` summary; unchanged lines far from changes are collapsed into one bar, click to expand.
 * Each line has a screen-reader-only prefix (Added / Removed), so it does not rely on red / green alone. The code area is keyboard focusable and scrolls horizontally.
 */
export function DiffView(props: DiffViewProps) {
  const { fileName, language, codeTheme, context = 3, labels: labelsProp } = props;
  const labels = useLabels("diffView", labelsProp);
  const lines =
    props.patch !== undefined ? parsePatch(props.patch) : diffLines(props.oldText, props.newText);
  const added = lines.filter((l) => l.type === "add").length;
  const removed = lines.filter((l) => l.type === "del").length;
  const items = collapse(lines, context);
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const name = labelsProp?.diff ?? fileName ?? labels.diff;

  const row = (line: DiffLine, key: string | number) => (
    <tr key={key} data-slot="diff-row" data-type={line.type}>
      <td data-slot="diff-gutter">{line.oldNo ?? ""}</td>
      <td data-slot="diff-gutter">{line.newNo ?? ""}</td>
      <td data-slot="diff-code">
        <span data-slot="diff-sign" aria-hidden="true">
          {SIGN[line.type]}
        </span>
        {line.type === "add" ? (
          <span data-slot="diff-label">{labels.added}: </span>
        ) : line.type === "del" ? (
          <span data-slot="diff-label">{labels.removed}: </span>
        ) : null}
        <Code text={line.text} language={language} />
      </td>
    </tr>
  );

  return (
    <div data-slot="diff-view" data-code-theme={codeTheme}>
      <div data-slot="diff-header">
        {fileName ? <span data-slot="diff-file">{fileName}</span> : <span />}
        <span data-slot="diff-stats">
          <span data-slot="diff-stat" data-type="add">
            +{added}
          </span>{" "}
          <span data-slot="diff-stat" data-type="del">
            −{removed}
          </span>
        </span>
      </div>
      {lines.length === 0 || (added === 0 && removed === 0) ? (
        <div data-slot="diff-empty">{labels.empty}</div>
      ) : (
        <div data-slot="diff-scroll" tabIndex={0} role="region" aria-label={name}>
          <table data-slot="diff-table" role="presentation">
            <tbody>
              {items.map((item, i) => {
                if (item.type !== "gap") return row(item, i);
                const gap: DiffGap = item;
                if (open.has(i)) return gap.lines.map((l, k) => row(l, `${i}-${k}`));
                return (
                  <tr key={i} data-slot="diff-row" data-type="gap">
                    <td colSpan={3} data-slot="diff-gap">
                      <button
                        type="button"
                        data-slot="diff-expand"
                        onClick={() => setOpen((s) => new Set(s).add(i))}
                      >
                        {labels.expand(gap.count)}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
