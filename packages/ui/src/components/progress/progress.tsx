import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { ReactNode } from "react";
import type { ProgressType, UIColor, UIRadius, UISize } from "../../contract.ts";

export interface ProgressProps extends Omit<
  BaseProgress.Root.Props,
  "className" | "style" | "children" | "render"
> {
  /** Current value; pass null for indeterminate progress (looping animation). */
  value: number | null;
  /**
   * line is a bar; circle is a ring; dashboard is a gauge with a gap (270°).
   * @default "line"
   */
  type?: ProgressType;
  /**
   * Size step: the bar's thickness / the ring's diameter (3 / 5 / 7.5rem).
   * @default "md"
   */
  size?: UISize;
  /**
   * Semantic colour of the indicator; the theme style picks the actual colours.
   * @default "primary"
   */
  color?: UIColor;
  /** Only applies to bars (the ends of a ring are round); a pill shape when not passed. */
  radius?: UIRadius;
  /** Bar: text above the progress bar; ring: text below the ring. */
  label?: ReactNode;
  /**
   * Bar: percentage shown at the top right; ring: shown in the center of the ring (formatted by Base UI).
   * @default false
   */
  showValue?: boolean;
}

/** Fold the current value into a 0–100 percentage (by min / max) and write it as a CSS variable for the theme style; not written when null or there is no range. */
function percent(value: number | null, min = 0, max = 100) {
  if (value === null || max <= min) return null;
  return Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
}

/**
 * Progress indicator for a task that advances over time, drawn as a bar, a ring or a gauge.
 * `value` is the current amount within `min` / `max` (default 0–100); pass `null` for indeterminate progress (looping animation).
 * `type` picks line / circle / dashboard, `label` adds a caption, `showValue` shows the percentage; `color` / `size` / `radius` set its look.
 * For a static measurement within a range (disk usage, a score) use Meter; for a wait with no measurable progress use Spinner.
 *
 * Theme style: accessibility (role / aria-valuenow) comes from Base UI, and the look of bar and ring is entirely in the theme style.
 * The ring is an SVG: a base circle plus an indicator circle, normalized with `pathLength=100`, so progress is just the percentage in stroke-dasharray (`--pc-value`).
 */
export function Progress({
  type = "line",
  size = "md",
  color = "primary",
  radius,
  label,
  showValue = false,
  ...rest
}: ProgressProps) {
  const ring = type !== "line";
  const pct = percent(rest.value, rest.min, rest.max);
  return (
    <BaseProgress.Root
      {...rest}
      data-slot="progress"
      data-type={type}
      data-size={size}
      data-color={color}
      data-radius={radius}
    >
      {ring ? (
        <>
          <div data-slot="progress-circle-body">
            <svg
              data-slot="progress-circle"
              viewBox="0 0 100 100"
              aria-hidden="true"
              focusable="false"
            >
              <circle data-slot="progress-circle-track" cx="50" cy="50" r="47" pathLength="100" />
              <circle
                data-slot="progress-circle-indicator"
                cx="50"
                cy="50"
                r="47"
                pathLength="100"
                ref={(el) => {
                  if (!el) return;
                  if (pct === null) el.style.removeProperty("--pc-value");
                  else el.style.setProperty("--pc-value", String(pct));
                }}
              />
            </svg>
            {showValue ? <BaseProgress.Value data-slot="progress-circle-value" /> : null}
          </div>
          {label ? (
            <BaseProgress.Label data-slot="progress-label">{label}</BaseProgress.Label>
          ) : null}
        </>
      ) : (
        <>
          {label || showValue ? (
            <div data-slot="progress-header">
              {label ? (
                <BaseProgress.Label data-slot="progress-label">{label}</BaseProgress.Label>
              ) : null}
              {showValue ? <BaseProgress.Value data-slot="progress-value" /> : null}
            </div>
          ) : null}
          <BaseProgress.Track data-slot="progress-track">
            <BaseProgress.Indicator data-slot="progress-indicator" />
          </BaseProgress.Track>
        </>
      )}
    </BaseProgress.Root>
  );
}
