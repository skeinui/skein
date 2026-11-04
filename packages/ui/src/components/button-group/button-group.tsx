import { useMemo } from "react";
import type { ComponentPropsWithoutRef } from "react";
import type { ButtonVariant, UIColor, UIOrientation, UIRadius, UISize } from "../../contract.ts";
import { ButtonGroupContext } from "./context.ts";

export interface ButtonGroupProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "className" | "style"
> {
  /** Default variant of the buttons in the group; a button's own `variant` wins. */
  variant?: ButtonVariant;
  /** Default colour of the buttons in the group. */
  color?: UIColor;
  /** Default size of the buttons in the group. */
  size?: UISize;
  /** Radius step of the buttons in the group; only the two ends keep their outer corners rounded. */
  radius?: UIRadius;
  /** Disables the buttons in the group by default; a button can override it with `disabled={false}`. */
  disabled?: boolean;
  /**
   * Fills the width of the container; the buttons share it equally.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Layout direction.
   * @default "horizontal"
   */
  orientation?: UIOrientation;
}

/**
 * ButtonGroup: joins several Buttons into one connected bar (e.g. "Day | Week | Month" actions).
 * `variant` / `color` / `size` / `radius` / `disabled` on the group are defaults for the buttons in it;
 * `orientation` stacks them vertically, `fullWidth` stretches the group. Use `ButtonGroup.Separator` for a divider.
 * For a single-choice switch use Segmented or ToggleGroup; for a main action plus a menu use SplitButton.
 *
 * Theme style: only writes hooks; seam radius and border overlap are handled by the theme style; defaults reach the buttons via context.
 */
export function ButtonGroup({
  variant,
  color,
  size,
  radius,
  disabled,
  fullWidth = false,
  orientation = "horizontal",
  children,
  ...rest
}: ButtonGroupProps) {
  const value = useMemo(
    () => ({ variant, color, size, radius, disabled }),
    [variant, color, size, radius, disabled],
  );
  return (
    <ButtonGroupContext.Provider value={value}>
      <div
        role="group"
        {...rest}
        data-slot="button-group"
        data-orientation={orientation}
        data-variant={variant}
        data-color={color}
        data-size={size}
        data-radius={radius}
        data-full-width={fullWidth ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
}

export type ButtonGroupSeparatorProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "className" | "style"
>;

/**
 * Placed inside a button (usually the first child), it draws a divider at the seam with the previous button.
 * Position and color are decided by the theme style; without it there is no divider. Variants with an outline rely on border overlap, which the theme style hides.
 */
function ButtonGroupSeparator(props: ButtonGroupSeparatorProps) {
  return <span aria-hidden="true" {...props} data-slot="button-group-separator" />;
}

ButtonGroup.Separator = ButtonGroupSeparator;
