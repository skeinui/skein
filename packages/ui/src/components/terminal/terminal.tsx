import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TerminalStatus } from "../../contract.ts";
import { parseAnsi, stripAnsi } from "./ansi.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface TerminalLabels {
  /** Name of the copy button, default "Copy output". */
  copy?: string;
  /** Name and announcement after a successful copy, default "Copied". */
  copied?: string;
  /** Text for each status (header and screen readers). */
  status?: Partial<Record<TerminalStatus, string>>;
  /** Name of the output area; the title by default. */
  output?: string;
  /** Title when `title` is not given. */
  title?: string;
}

export interface TerminalProps {
  /** Command output, may contain ANSI escape sequences (color, bold...); for streaming output just keep appending. */
  output: string;
  /** The command that was run, shown as a `$ command` line above the output. */
  command?: string;
  /** Header title, default "Terminal". */
  title?: string;
  /** running: in progress, done: finished successfully, error: failed; if omitted no status is shown. */
  status?: TerminalStatus;
  /** Exit code at the end, shown after the status. */
  exitCode?: number;
  /**
   * Output beyond this many lines scrolls inside, default 16.
   * @default 16
   */
  maxLines?: number;
  labels?: TerminalLabels;
}

const COPIED_MS = 2000;
const STICK_PX = 32;

/**
 * Command output: a dark terminal panel whose header holds the title, the status (running / done / failed + exit code) and a copy button, with the output below.
 * Recognizes ANSI colors and styles; while running and when you are at the bottom, new output automatically scrolls along. The output area is keyboard-focusable and scrollable with arrow keys.
 * Status changes are announced with `role="status"`, while the output itself is not announced (flooding output does not suit a live region).
 */
export function Terminal({
  output,
  command,
  title: titleProp,
  status,
  exitCode,
  maxLines = 16,
  labels: labelsProp,
}: TerminalProps) {
  const labels = useLabels("terminal", labelsProp);
  const title = titleProp ?? labels.title;
  const lines = parseAnsi(output);
  const pre = useRef<HTMLPreElement>(null);
  const stuck = useRef(true);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // The height cap is in lines: the line count is written as a CSS variable and the height is computed by the theme style
  useLayoutEffect(() => {
    pre.current?.style.setProperty("--term-lines", String(maxLines));
  }, [maxLines]);

  // Follow: when at the bottom, scroll to the bottom as the output grows
  useLayoutEffect(() => {
    const el = pre.current;
    if (el && stuck.current) el.scrollTop = el.scrollHeight;
  }, [output]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(stripAnsi(output));
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  const statusText = status
    ? `${labels.status[status]}${
        exitCode !== undefined && status !== "running" ? ` (${exitCode})` : ""
      }`
    : "";
  const copyLabel = copied ? labels.copied : labels.copy;

  return (
    <div data-slot="terminal" data-status={status}>
      <div data-slot="terminal-header">
        <span data-slot="terminal-title">{title}</span>
        {status ? (
          <span data-slot="terminal-status" data-status={status} role="status">
            {statusText}
          </span>
        ) : null}
        <button
          type="button"
          data-slot="terminal-copy"
          data-copied={copied ? "" : undefined}
          aria-label={copyLabel}
          onClick={copy}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {copied ? (
              <path d="M20 6 9 17l-5-5" />
            ) : (
              <>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </>
            )}
          </svg>
        </button>
      </div>
      <pre
        ref={pre}
        data-slot="terminal-output"
        tabIndex={0}
        role="region"
        aria-label={labelsProp?.output ?? title}
        onScroll={(e) => {
          const el = e.currentTarget;
          stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight <= STICK_PX;
        }}
      >
        {command ? (
          <span data-slot="terminal-line">
            <span data-slot="terminal-prompt" aria-hidden="true">
              ${" "}
            </span>
            {command}
          </span>
        ) : null}
        {lines.map((line, i) => (
          <span key={i} data-slot="terminal-line">
            {line.length === 0
              ? "​"
              : line.map((seg, k) => (
                  <span
                    key={k}
                    data-slot="terminal-text"
                    data-fg={seg.fg}
                    data-bg={seg.bg}
                    data-bold={seg.bold ? "" : undefined}
                    data-dim={seg.dim ? "" : undefined}
                    data-italic={seg.italic ? "" : undefined}
                    data-underline={seg.underline ? "" : undefined}
                    data-inverse={seg.inverse ? "" : undefined}
                  >
                    {seg.text}
                  </span>
                ))}
          </span>
        ))}
      </pre>
    </div>
  );
}
