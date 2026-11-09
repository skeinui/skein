import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { CalloutVariant, UIColor, UIRadius, UISize } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface CalloutProps extends Without<ComponentPropsWithoutRef<"div">> {
  /**
   * Visual variant; how each one looks is up to the theme style: `outline` a border, `soft` a tinted background, `dashed` a dashed border on a light tint.
   * @default "outline"
   */
  variant?: CalloutVariant;
  /**
   * Semantic colour of the tint; the theme style picks the actual colours.
   * @default "neutral"
   */
  color?: UIColor;
  /**
   * Padding step.
   * @default "md"
   */
  size?: UISize;
  /** Corner radius step; when omitted the theme style decides. */
  radius?: UIRadius;
  children?: ReactNode;
}

/**
 * Callout: a block of content set apart from the text around it, such as a message in a conversation (the customer's, the agent's, an internal note),
 * a suggested reply or a quotation. `variant` / `color` set the look; the content is anything.
 * For a short status message with an icon and a title use Alert; for a titled panel use Card.
 */
export function Callout({
  variant = "outline",
  color = "neutral",
  size = "md",
  radius,
  ...rest
}: CalloutProps) {
  return (
    <div
      {...rest}
      data-slot="callout"
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-radius={radius}
    />
  );
}
