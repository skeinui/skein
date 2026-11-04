import { Slider as BaseSlider } from "@base-ui/react/slider";
import type { ReactNode } from "react";
import type { UIColor, UISize } from "../../contract.ts";

export interface SliderProps extends Omit<
  BaseSlider.Root.Props<number | readonly number[]>,
  "className" | "style" | "children" | "render" | "orientation"
> {
  /**
   * Size step: the track's thickness and the thumb's size.
   * @default "md"
   */
  size?: UISize;
  /**
   * Semantic colour of the selected range and the thumb; the theme style picks the actual colours.
   * @default "primary"
   */
  color?: UIColor;
  /** Text above the slider. */
  label?: ReactNode;
  /**
   * Shows the current value on the right of the text row (a range slider shows a – b).
   * @default false
   */
  showValue?: boolean;
  /** How the current value is displayed (e.g. adding a unit); if omitted, Base UI's default number format is used. A range slider calls it once per value and joins them with –. */
  formatValue?: (value: number) => string;
  /**
   * An accessible name is required when there is no `label` (the slider thumb is an `<input type="range">`; without a name screen readers cannot tell what it is).
   * Each thumb of a range slider is "name 1", "name 2"; use `thumbLabels` to name them yourself.
   */
  "aria-label"?: string;
  /** Accessible name of each thumb, by index (e.g. ["Minimum price", "Maximum price"]); overrides the "name 1" / "name 2" default. */
  thumbLabels?: readonly string[];
}

/**
 * Slider for picking a number, or a range of numbers, by dragging a thumb along a horizontal track.
 * `value` / `onValueChange` hold a number for a single value or an array for a range (one thumb per value); `min` / `max` / `step` bound it.
 * `label` adds a caption, `showValue` shows the current value (formatted with `formatValue`, e.g. to add a unit); without a `label`, give it an `aria-label`.
 * Horizontal only for now. To type an exact number use NumberField.
 *
 * Theme style: keyboard, touch and aria come from Base UI.
 */
export function Slider({
  size = "md",
  color = "primary",
  label,
  showValue = false,
  formatValue,
  "aria-label": ariaLabel,
  thumbLabels,
  ...rest
}: SliderProps) {
  const initial = rest.value ?? rest.defaultValue ?? rest.min ?? 0;
  const count = Array.isArray(initial) ? initial.length : 1;
  return (
    <BaseSlider.Root {...rest} data-slot="slider" data-size={size} data-color={color}>
      {label || showValue ? (
        <div data-slot="slider-header">
          {label ? <BaseSlider.Label data-slot="slider-label">{label}</BaseSlider.Label> : null}
          {showValue ? (
            <BaseSlider.Value data-slot="slider-value">
              {formatValue
                ? (_formatted, values) => values.map((v) => formatValue(v)).join(" – ")
                : undefined}
            </BaseSlider.Value>
          ) : null}
        </div>
      ) : null}
      <BaseSlider.Control data-slot="slider-control">
        <BaseSlider.Track data-slot="slider-track">
          <BaseSlider.Indicator data-slot="slider-indicator" />
          {Array.from({ length: count }, (_, i) => (
            <BaseSlider.Thumb
              key={i}
              index={count > 1 ? i : undefined}
              data-slot="slider-thumb"
              aria-label={
                thumbLabels?.[i] ??
                (ariaLabel ? (count > 1 ? `${ariaLabel} ${i + 1}` : ariaLabel) : undefined)
              }
            />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
