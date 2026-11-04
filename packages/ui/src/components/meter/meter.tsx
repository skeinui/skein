import { Meter as BaseMeter } from "@base-ui/react/meter";
import type { ReactNode } from "react";
import type { UIColor, UIRadius, UISize } from "../../contract.ts";

export interface MeterProps extends Omit<
  BaseMeter.Root.Props,
  "className" | "style" | "children" | "render"
> {
  /** The current value (required). */
  value: number;
  /**
   * Size step.
   * @default "md"
   */
  size?: UISize;
  /**
   * Semantic colour; the theme style picks the actual colours.
   * @default "primary"
   */
  color?: UIColor;
  /** Corner radius of the bar; the theme style decides when it is not passed. */
  radius?: UIRadius;
  /** Text above the bar, also the meter's accessible name. */
  label?: ReactNode;
  /**
   * Show the formatted value at the end of the header.
   * @default false
   */
  showValue?: boolean;
}

/**
 * Meter bar showing a quantity within a known range (disk usage, battery, score).
 * `value` sets the amount (0–100 unless `min` / `max` say otherwise), `label` names it and `showValue` prints the value;
 * `color` / `size` / `radius` set the look.
 * For how far a task has gone use Progress.
 *
 * Theme style: role="meter" comes from Base UI; the look fully reuses Progress's theme style (the same `progress-*` slots, plus `data-meter`).
 */
export function Meter({
  size = "md",
  color = "primary",
  radius,
  label,
  showValue = false,
  ...rest
}: MeterProps) {
  return (
    <BaseMeter.Root
      {...rest}
      data-slot="progress"
      data-meter=""
      data-size={size}
      data-color={color}
      data-radius={radius}
    >
      {label || showValue ? (
        <div data-slot="progress-header">
          {label ? <BaseMeter.Label data-slot="progress-label">{label}</BaseMeter.Label> : null}
          {showValue ? <BaseMeter.Value data-slot="progress-value" /> : null}
        </div>
      ) : null}
      <BaseMeter.Track data-slot="progress-track">
        <BaseMeter.Indicator data-slot="progress-indicator" />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
}
