import type { ComponentPropsWithoutRef } from "react";
import type { UIColor, UISize } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface SpinnerProps extends Omit<
  ComponentPropsWithoutRef<"span">,
  "className" | "style" | "color" | "children"
> {
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
  /** Accessible name; when omitted it is the locale's "Loading" text. */
  "aria-label"?: string;
}

/**
 * Spinner: a spinning loading indicator for content that is still loading, with `size` and `color`.
 * It has `role="status"` and is announced as "Loading" unless you pass an `aria-label`.
 * For a loading button use Button's `loading`; for a placeholder of the content's shape use Skeleton; for an assistant
 * that has not replied yet use Typing.
 *
 * Theme style: how the ring is drawn and how fast it spins are in the theme style.
 */
export function Spinner({
  size = "md",
  color = "primary",
  "aria-label": labelProp,
  ...rest
}: SpinnerProps) {
  const c = useLabels("common");
  const label = labelProp ?? c.loading;
  return (
    <span
      role="status"
      {...rest}
      aria-label={label}
      data-slot="spinner"
      data-size={size}
      data-color={color}
    />
  );
}
