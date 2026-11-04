import { createElement } from "react";
import type { ComponentPropsWithoutRef } from "react";
import type { LayoutTag } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface ContainerProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Which element to render as (semantics). */
  as?: LayoutTag;
  /**
   * Maximum width: sm / md / lg / xl use the theme style's scale, full is unconstrained.
   * @default "lg"
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /**
   * Center horizontally.
   * @default true
   */
  center?: boolean;
  /**
   * Left and right padding.
   * @default true
   */
  padded?: boolean;
}

/** Content container: limits the maximum width, centers horizontally, adds left and right padding; wrap it around a page's content area. */
export function Container({
  as = "div",
  size = "lg",
  center = true,
  padded = true,
  ...rest
}: ContainerProps) {
  return createElement(as, {
    ...rest,
    "data-slot": "container",
    "data-size": size,
    "data-center": center ? "" : undefined,
    "data-padded": padded ? "" : undefined,
  });
}
