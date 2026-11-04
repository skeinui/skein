import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { BadgeVariant, UIColor, UIRadius, UISize } from "../../contract.ts";

export interface BadgeProps extends Omit<
  ComponentPropsWithoutRef<"span">,
  "className" | "style" | "color"
> {
  /** @default "soft" */
  variant?: BadgeVariant;
  /** @default "neutral" */
  color?: UIColor;
  /** @default "md" */
  size?: UISize;
  /** When not passed, the theme style decides. */
  radius?: UIRadius;
  children?: ReactNode;
}

/**
 * Badge: a small display-only label for a status, count or category, with no interaction.
 * `children` is the text, `color` / `variant` / `size` / `radius` set its look.
 * For a removable or clickable label use Tag.
 */
export function Badge({
  variant = "soft",
  color = "neutral",
  size = "md",
  radius,
  ...rest
}: BadgeProps) {
  return (
    <span
      {...rest}
      data-slot="badge"
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-radius={radius}
    />
  );
}
