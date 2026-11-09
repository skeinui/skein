import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { BadgePlacement, UIColor, UISize } from "../../contract.ts";

export interface BadgeProps extends Omit<
  ComponentPropsWithoutRef<"span">,
  "className" | "style" | "color"
> {
  /**
   * What the indicator shows: a number, or any text. A number above `max` shows as `max+`; nothing is drawn for 0
   * (unless `showZero`), a negative number, or when it is not given.
   */
  count?: ReactNode;
  /**
   * The largest number shown as is.
   * @default 99
   */
  max?: number;
  /**
   * Draw the indicator for a `count` of 0.
   * @default false
   */
  showZero?: boolean;
  /**
   * A small dot without a number, for "something new here"; `count` is ignored.
   * @default false
   */
  dot?: boolean;
  /**
   * Semantic colour; the theme style picks the actual colours.
   * @default "danger"
   */
  color?: UIColor;
  /**
   * Size step.
   * @default "md"
   */
  size?: UISize;
  /**
   * Which corner of `children` the indicator hangs on; ignored without `children`.
   * @default "top-end"
   */
  placement?: BadgePlacement;
  /** The element the indicator hangs on (an icon, an avatar, a button); without it the indicator is drawn on its own. */
  children?: ReactNode;
}

function indicatorText(count: ReactNode, max: number, showZero: boolean): ReactNode {
  if (typeof count === "number") {
    if (Number.isNaN(count) || count < 0 || (count === 0 && !showZero)) return null;
    return count > max ? `${max}+` : count;
  }
  return count === undefined || count === null || count === false || count === "" ? null : count;
}

/**
 * Badge: a count or a dot hung on the corner of another element (an icon, an avatar, a button), or shown on its own.
 * `count` / `max` / `showZero` decide what it says, `dot` makes it a plain dot, `placement` picks the corner.
 * For a text label, a status or a keyword use Tag.
 */
export function Badge({
  count,
  max = 99,
  showZero = false,
  dot = false,
  color = "danger",
  size = "md",
  placement = "top-end",
  children,
  ...rest
}: BadgeProps) {
  const text = dot ? null : indicatorText(count, max, showZero);
  const shown = dot || text !== null;
  const wrapped = children !== undefined && children !== null && children !== false;
  return (
    <span
      {...rest}
      data-slot="badge"
      data-color={color}
      data-size={size}
      data-placement={wrapped ? placement : undefined}
      data-wrapped={wrapped ? "" : undefined}
    >
      {children}
      {shown ? (
        <span data-slot="badge-indicator" data-dot={dot ? "" : undefined}>
          {text}
        </span>
      ) : null}
    </span>
  );
}
