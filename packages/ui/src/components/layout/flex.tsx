import { createElement } from "react";
import type { ComponentPropsWithoutRef } from "react";
import type { Gap, LayoutTag } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface FlexProps extends Without<ComponentPropsWithoutRef<"div">> {
  /**
   * Which element to render as (semantics).
   * @default "div"
   */
  as?: LayoutTag;
  /**
   * row is horizontal, column is vertical (a Stack); reverse reverses the order.
   * @default "row"
   */
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  /**
   * Spacing between children, from the theme style's spacing scale.
   * @default "md"
   */
  gap?: Gap;
  /**
   * Cross-axis alignment (vertical when in a row).
   * @default "stretch"
   */
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  /**
   * Main-axis distribution (horizontal when in a row).
   * @default "start"
   */
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  /**
   * Wrap when there is not enough room.
   * @default false
   */
  wrap?: boolean;
  /**
   * Inline flex (inline-flex), does not fill the whole row.
   * @default false
   */
  inline?: boolean;
}

/**
 * Flex layout: lay out a row (or column) of things, with spacing from the theme style's scale, so no styles are needed in application code. Vertical is Stack:
 * `<Flex direction="column" gap="sm">`.
 */
export function Flex({
  as = "div",
  direction = "row",
  gap = "md",
  align = "stretch",
  justify = "start",
  wrap = false,
  inline = false,
  ...rest
}: FlexProps) {
  return createElement(as, {
    ...rest,
    "data-slot": "flex",
    "data-direction": direction,
    "data-gap": gap,
    "data-align": align,
    "data-justify": justify,
    "data-wrap": wrap ? "" : undefined,
    "data-inline": inline ? "" : undefined,
  });
}

/** Takes up the remaining space and pushes what follows it to the other end: `<Flex><Title/><Flex.Spacer/><Button/></Flex>`. */
function FlexSpacer(props: Without<ComponentPropsWithoutRef<"div">>) {
  return <div {...props} data-slot="flex-spacer" aria-hidden="true" />;
}

Flex.Spacer = FlexSpacer;
