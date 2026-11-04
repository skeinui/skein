import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { UIColor, UISize } from "../../contract.ts";
import { Skeleton } from "../skeleton/index.ts";

export interface StatisticProps {
  /** Small caption above the value, e.g. "Active users". */
  title?: ReactNode;
  /** Value to display; a number or numeric string is formatted by precision and the separator, other strings are shown as is. */
  value?: number | string;
  /** Number of decimal places to keep; left as is if omitted. */
  precision?: number;
  /**
   * Separator for every three digits of the integer part; pass an empty string for no grouping.
   * @default ","
   */
  groupSeparator?: string;
  /**
   * Character between the integer and decimal parts.
   * @default "."
   */
  decimalSeparator?: string;
  /** Fully custom display (e.g. percentages, unit conversion); when given, the formatting above is no longer used. */
  format?: (value: number | string | undefined) => ReactNode;
  /** Shown before the value, e.g. a currency sign or an icon. */
  prefix?: ReactNode;
  /** Shown after the value, e.g. a unit or "%". */
  suffix?: ReactNode;
  /** Small text under the value, often used for period-over-period / year-over-year trends. */
  description?: ReactNode;
  /** Color of the value. */
  color?: UIColor;
  /**
   * Size step of the value.
   * @default "md"
   */
  size?: UISize;
  /**
   * Loading: the value position is replaced by a placeholder bar.
   * @default false
   */
  loading?: boolean;
  /**
   * Number rolling: each digit is a column of 0–9, and when the value changes each digit rolls to its new number; on first display it rolls up from 0.
   * Only applies to the default number formatting (no rolling if `format` is given); does not move when the system asks for reduced motion. The rolling visual layer is hidden from screen readers, which read the full text.
   * @default false
   */
  animated?: boolean;
}

const DIGITS = Array.from({ length: 10 }, (_, i) => i);

/** One digit: a column of 0–9, with --stat-digit deciding which one is shown (the translation is in the theme style, so there is a transition when the value changes). */
function Digit({ digit }: { digit: number }) {
  return (
    <span data-slot="statistic-digit">
      <span
        data-slot="statistic-digit-strip"
        ref={(el) => el?.style.setProperty("--stat-digit", String(digit))}
      >
        {DIGITS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    </span>
  );
}

/**
 * Rolling numbers. On the server and during hydration plain text is shown first (no flicker, no hydration mismatch), and after mount it is swapped for the rolling version:
 * everything starts at 0, then the next frame sets the real digits, so it rolls up from 0. Digits are matched by position counted from the right, so each digit stays the same column when the digit count changes.
 */
function AnimatedText({ text }: { text: string }) {
  const [phase, setPhase] = useState<"plain" | "zero" | "live">("plain");
  useEffect(() => {
    setPhase("zero");
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setPhase("live")));
    return () => cancelAnimationFrame(id);
  }, []);
  if (phase === "plain") return <>{text}</>;
  const chars = Array.from(text);
  return (
    <>
      <span data-slot="statistic-text">{text}</span>
      <span data-slot="statistic-digits" aria-hidden="true">
        {chars.map((ch, i) => {
          const key = chars.length - i;
          return /\d/.test(ch) ? (
            <Digit key={key} digit={phase === "zero" ? 0 : Number(ch)} />
          ) : (
            <span key={key} data-slot="statistic-char">
              {ch}
            </span>
          );
        })}
      </span>
    </>
  );
}

/** Number formatting: rounds to the given digits and adds a separator every three digits of the integer part. Does not depend on Intl, so server and browser output match. */
export function formatNumber(
  value: number | string | undefined,
  {
    precision,
    groupSeparator = ",",
    decimalSeparator = ".",
  }: Pick<StatisticProps, "precision" | "groupSeparator" | "decimalSeparator"> = {},
): string {
  if (value === undefined || value === null || value === "") return "-";
  const n = typeof value === "number" ? value : Number(value);
  if (typeof value === "string" && !Number.isFinite(n)) return value;
  if (!Number.isFinite(n)) return String(value);
  const text = precision === undefined ? String(n) : n.toFixed(precision);
  // Exponential form (very large or very small numbers) is not split and is shown as is
  if (/e/i.test(text)) return text;
  const negative = text.startsWith("-");
  const [int = "", decimal] = (negative ? text.slice(1) : text).split(".");
  const grouped = groupSeparator ? int.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator) : int;
  return `${negative ? "-" : ""}${grouped}${decimal !== undefined ? decimalSeparator + decimal : ""}`;
}

/** Statistic: a small title, a large value (with optional prefix / suffix), and an optional small description; the value is formatted automatically. */
export function StatisticBase({
  title,
  value,
  precision,
  groupSeparator,
  decimalSeparator,
  format,
  prefix,
  suffix,
  description,
  color,
  size = "md",
  loading = false,
  animated = false,
}: StatisticProps) {
  const shown = format
    ? format(value)
    : formatNumber(value, { precision, groupSeparator, decimalSeparator });
  return (
    <div
      data-slot="statistic"
      data-size={size}
      data-color={color}
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
    >
      {title ? <div data-slot="statistic-title">{title}</div> : null}
      <div data-slot="statistic-content">
        {loading ? (
          <span data-slot="statistic-skeleton">
            <Skeleton shape="rect" />
          </span>
        ) : (
          <>
            {prefix ? <span data-slot="statistic-prefix">{prefix}</span> : null}
            <span data-slot="statistic-value" data-animated={animated && !format ? "" : undefined}>
              {animated && !format && typeof shown === "string" ? (
                <AnimatedText text={shown} />
              ) : (
                shown
              )}
            </span>
            {suffix ? <span data-slot="statistic-suffix">{suffix}</span> : null}
          </>
        )}
      </div>
      {description ? <div data-slot="statistic-description">{description}</div> : null}
    </div>
  );
}
