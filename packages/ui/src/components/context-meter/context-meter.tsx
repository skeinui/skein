import { useLayoutEffect, useRef } from "react";
import type { OverlayAlign, OverlaySide } from "../../contract.ts";
import { Popover } from "../popover/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface ContextSegment {
  /** Unique id of the segment (used as its React key). */
  id: string;
  /** What this part is ("Messages", "Tool results"). */
  label: string;
  /** How many tokens it takes. */
  tokens: number;
}

export interface ContextMeterLabels {
  /** Popover title, default "Context window". */
  title?: string;
  /** Template for the trigger name: default "Context 45% used, 57.6K of 128K tokens". */
  summary?: (percent: number, used: string, max: string) => string;
  /** Name of the "remaining" row, default "Free". */
  free?: string;
  /** Name of the part of the breakdown that is not categorized, default "Other". */
  other?: string;
  /** The word "token", default "tokens". */
  unit?: string;
}

export interface ContextMeterProps {
  /** How many tokens are used. */
  used: number;
  /** Total tokens in the context window. */
  max: number;
  /** Breakdown of the used part (messages, tool results, system prompt...), shown in the popover as a stacked bar and a list. */
  segments?: readonly ContextSegment[];
  labels?: ContextMeterLabels;
  /**
   * Which side of the trigger the popover opens on.
   * @default "top"
   */
  side?: OverlaySide;
  /**
   * How the popover lines up with the trigger along that side.
   * @default "end"
   */
  align?: OverlayAlign;
}

/** 12345 → "12.3K", 128000 → "128K", 1_000_000 → "1M". */
export function formatTokens(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  const trim = (v: number) =>
    v >= 100 || Number.isInteger(v) ? String(Math.round(v)) : v.toFixed(1);
  if (n < 1000) return String(Math.round(n));
  if (n < 1_000_000) return `${trim(n / 1000)}K`;
  return `${trim(n / 1_000_000)}M`;
}

const RADIUS = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Usage levels: below 70% ok, 70–90% warn, 90% and above danger. */
const levelOf = (percent: number) => (percent >= 90 ? "danger" : percent >= 70 ? "warn" : "ok");

function Segment({ index, share }: { index: number; share: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    ref.current?.style.setProperty("--ctx-w", `${share}%`);
  }, [share]);
  return <span ref={ref} data-slot="context-meter-segment" data-index={index % 6} />;
}

/**
 * Context usage: a small ring plus a percentage, clicking opens a popover with the total, the used amount and what parts it is made of.
 * The higher the usage the more prominent it is (warning color from 70%, danger color from 90%). The trigger is a button whose name includes the exact numbers, so screen readers know the usage without opening the popover.
 */
export function ContextMeter({
  used,
  max,
  segments,
  labels: labelsProp,
  side = "top",
  align = "end",
}: ContextMeterProps) {
  const labels = useLabels("contextMeter", labelsProp);
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(100, Math.max(0, Math.round((used / safeMax) * 100)));
  const level = levelOf(percent);
  const usedText = formatTokens(used);
  const maxText = formatTokens(max);
  const summary = labels.summary(percent, usedText, maxText);
  const unit = labels.unit;
  const free = Math.max(0, max - used);
  const total = segments?.reduce((sum, s) => sum + s.tokens, 0) ?? 0;
  return (
    <Popover>
      <Popover.Trigger
        data-slot="context-meter"
        data-level={level}
        aria-label={summary}
        render={<button type="button" />}
      >
        <svg data-slot="context-meter-ring" viewBox="0 0 20 20" aria-hidden="true">
          <circle data-slot="context-meter-track" cx="10" cy="10" r={RADIUS} fill="none" />
          <circle
            data-slot="context-meter-value"
            cx="10"
            cy="10"
            r={RADIUS}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(CIRCUMFERENCE * percent) / 100} ${CIRCUMFERENCE}`}
            transform="rotate(-90 10 10)"
          />
        </svg>
        <span data-slot="context-meter-percent" aria-hidden="true">
          {percent}%
        </span>
      </Popover.Trigger>
      <Popover.Content side={side} align={align} aria-label={labels.title}>
        <div data-slot="context-meter-popup">
          <div data-slot="context-meter-heading">{labels.title}</div>
          <div data-slot="context-meter-total">
            {usedText} / {maxText} {unit} · {percent}%
          </div>
          <div data-slot="context-meter-bar" aria-hidden="true">
            {segments?.map((s, i) =>
              s.tokens > 0 ? (
                <Segment key={s.id} index={i} share={(s.tokens / safeMax) * 100} />
              ) : null,
            )}
          </div>
          {segments?.length ? (
            <ul data-slot="context-meter-list">
              {segments.map((s, i) => (
                <li key={s.id} data-slot="context-meter-item">
                  <span data-slot="context-meter-swatch" data-index={i % 6} aria-hidden="true" />
                  <span data-slot="context-meter-item-label">{s.label}</span>
                  <span data-slot="context-meter-item-value">{formatTokens(s.tokens)}</span>
                </li>
              ))}
              {total < used ? (
                <li data-slot="context-meter-item">
                  <span data-slot="context-meter-swatch" data-index="other" aria-hidden="true" />
                  <span data-slot="context-meter-item-label">{labels.other}</span>
                  <span data-slot="context-meter-item-value">{formatTokens(used - total)}</span>
                </li>
              ) : null}
              <li data-slot="context-meter-item" data-free="">
                <span data-slot="context-meter-swatch" data-index="free" aria-hidden="true" />
                <span data-slot="context-meter-item-label">{labels.free}</span>
                <span data-slot="context-meter-item-value">{formatTokens(free)}</span>
              </li>
            </ul>
          ) : null}
        </div>
      </Popover.Content>
    </Popover>
  );
}
