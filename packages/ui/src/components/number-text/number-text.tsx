import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useConfig } from "../config-provider/index.ts";

type Without<T> = Omit<T, "className" | "style" | "children" | "value">;

export interface NumberFormatOptions {
  /**
   * `percent` writes `0.97` as "97%"; `unit: "percent"` (with `format: "unit"`) writes `97` as "97%".
   * @default "decimal"
   */
  format?: "decimal" | "percent" | "currency" | "unit";
  /** ISO 4217 code ("USD", "CNY"); needed by `format="currency"`. */
  currency?: string;
  /** A unit of Intl ("kilometer", "megabyte", "hour", "percent"); needed by `format="unit"`. */
  unit?: string;
  /** How many digits after the point, always that many (1 gives "4.0"); the format's usual number when omitted. */
  precision?: number;
  /**
   * `compact` writes 12500 as "13K" (each language shortens in its own way).
   * @default "standard"
   */
  notation?: "standard" | "compact";
  /** BCP 47 tag of the language (e.g. "zh-CN"); the browser's when omitted. */
  locale?: string;
}

/** A number as text in the language of `locale` ("12,500", "97%", "$4.50"); an empty value or one that is not a number is `undefined`. */
export function formatNumberText(
  value: number | bigint | null | undefined,
  { format, currency, unit, precision, notation, locale }: NumberFormatOptions = {},
): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && !Number.isFinite(value)) return undefined;
  return new Intl.NumberFormat(locale, {
    style: format,
    currency,
    unit,
    notation,
    ...(precision === undefined
      ? {}
      : { minimumFractionDigits: precision, maximumFractionDigits: precision }),
  }).format(value);
}

export interface NumberTextProps
  extends Without<ComponentPropsWithoutRef<"data">>, NumberFormatOptions {
  /** The number. */
  value?: number | bigint | null;
  /**
   * Shown when there is no value or it is not a number.
   * @default "—"
   */
  fallback?: ReactNode;
}

/**
 * Number text: a number as text in the language of the app, as a `<data>` element with the exact value: a count, a percentage, an amount of money, a size.
 * `format` picks what it is (`percent`, `currency`, `unit`), `precision` how many digits follow the point, `notation="compact"` shortens a large number; the language is the `locale` of ConfigProvider.
 * With no value it shows `fallback` (a dash). For the text alone (a CSV cell, a title) use `formatNumberText`.
 */
export function NumberText({
  value,
  format,
  currency,
  unit,
  precision,
  notation,
  locale: localeProp,
  fallback = "—",
  ...rest
}: NumberTextProps) {
  const config = useConfig();
  const locale = localeProp ?? config.locale;
  const text = formatNumberText(value, { format, currency, unit, precision, notation, locale });
  if (text === undefined) return <>{fallback}</>;
  return (
    <data {...rest} value={String(value)}>
      {text}
    </data>
  );
}
