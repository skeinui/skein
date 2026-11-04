import { Button as BaseButton } from "@base-ui/react/button";
import type { MouseEvent, ReactNode } from "react";
import type { ButtonVariant, UIColor, UIRadius, UISize } from "../../contract.ts";
import { useButtonGroup } from "../button-group/context.ts";

export interface ButtonProps extends Omit<BaseButton.Props, "className" | "style" | "children"> {
  /** @default "solid" */
  variant?: ButtonVariant;
  /** @default "primary" */
  color?: UIColor;
  /** @default "md" */
  size?: UISize;
  /** When not passed, the theme style decides. */
  radius?: UIRadius;
  /**
   * Fill the width of the parent.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Loading: does not respond to clicks, the leading icon slot is replaced by a spinner, and it stays focusable.
   * @default false
   */
  loading?: boolean;
  /**
   * A button with only an icon and no text; the theme style draws it as a square accordingly.
   * @default false
   */
  iconOnly?: boolean;
  /** Before the text, usually an icon; replaced by the spinner while `loading`. */
  startContent?: ReactNode;
  /** After the text, usually an icon (e.g. an arrow). */
  endContent?: ReactNode;
  children?: ReactNode;
}

function blockClick(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
}

/**
 * Button that triggers an action, with variants, colors, sizes, a loading state and icons.
 * `variant` / `color` / `size` set its look, `loading` shows a spinner and blocks clicks,
 * `startContent` / `endContent` add icons, `iconOnly` makes a square icon button (give it an `aria-label`).
 * Inside a ButtonGroup, variant / color / size / radius / disabled that are not passed take the group's values.
 * For navigation use Link; for an on / off state use Toggle.
 *
 * Theme style: behavior comes from Base UI; the component writes only `data-*` hooks, and the look is the theme style's CSS.
 */
export function Button({
  variant,
  color,
  size,
  radius,
  disabled,
  fullWidth = false,
  loading = false,
  iconOnly = false,
  startContent,
  endContent,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const group = useButtonGroup();
  return (
    <BaseButton
      {...rest}
      disabled={disabled ?? group?.disabled}
      data-slot="button"
      data-variant={variant ?? group?.variant ?? "solid"}
      data-color={color ?? group?.color ?? "primary"}
      data-size={size ?? group?.size ?? "md"}
      data-radius={radius ?? group?.radius}
      data-full-width={fullWidth ? "" : undefined}
      data-loading={loading ? "" : undefined}
      data-icon-only={iconOnly ? "" : undefined}
      aria-busy={loading || undefined}
      onClick={loading ? blockClick : onClick}
    >
      {loading ? (
        <span data-slot="button-spinner" aria-hidden="true" />
      ) : startContent ? (
        <span data-slot="button-start">{startContent}</span>
      ) : null}
      {children}
      {endContent ? <span data-slot="button-end">{endContent}</span> : null}
    </BaseButton>
  );
}
