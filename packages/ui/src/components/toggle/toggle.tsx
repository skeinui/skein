import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import type { ToggleVariant, UIColor, UIOrientation, UISize } from "../../contract.ts";
import { ToggleGroupContext, useToggleGroup } from "./context.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface ToggleProps extends Without<BaseToggle.Props<string>> {
  /**
   * Visual variant: transparent / outlined / always tinted; inside a ToggleGroup the group's by default.
   * @default "ghost"
   */
  variant?: ToggleVariant;
  /**
   * Colour when pressed; inside a ToggleGroup the group's by default.
   * @default "neutral"
   */
  color?: UIColor;
  /**
   * Size step; inside a ToggleGroup the group's by default.
   * @default "md"
   */
  size?: UISize;
  /** For icon-only use, with equal width and height. */
  iconOnly?: boolean;
}

/**
 * Toggle: a button that stays pressed or unpressed, such as Bold in a text editor.
 * `pressed` / `onPressedChange` control it (`defaultPressed` for uncontrolled); `variant` / `color` / `size` set its look,
 * `iconOnly` makes it square (give it an `aria-label`). Inside a ToggleGroup it takes the group's variant / color / size
 * and needs a `value`. For a setting switch use Switch; for a one-off action use Button.
 *
 * Theme style: behavior comes from Base UI; it writes data-pressed when pressed.
 */
export function Toggle({ variant, color, size, iconOnly = false, ...rest }: ToggleProps) {
  const group = useToggleGroup();
  return (
    <BaseToggle
      {...rest}
      data-slot="toggle"
      data-variant={variant ?? group?.variant ?? "ghost"}
      data-color={color ?? group?.color ?? "neutral"}
      data-size={size ?? group?.size ?? "md"}
      data-icon-only={iconOnly ? "" : undefined}
    />
  );
}

export interface ToggleGroupProps extends Without<BaseToggleGroup.Props<string>> {
  /**
   * Variant of the Toggles in the group; a Toggle's own `variant` wins.
   * @default "ghost"
   */
  variant?: ToggleVariant;
  /**
   * Pressed colour of the Toggles in the group.
   * @default "neutral"
   */
  color?: UIColor;
  /**
   * Size of the Toggles in the group.
   * @default "md"
   */
  size?: UISize;
  /**
   * Layout direction.
   * @default "horizontal"
   */
  orientation?: UIOrientation;
  /**
   * Adjacent buttons sit flush together, with the border radius removed at the seams.
   * @default false
   */
  attached?: boolean;
}

/**
 * ToggleGroup: a set of Toggles where one (or, with `multiple`, several) can be pressed, such as text alignment buttons.
 * `value` / `onValueChange` control it, and `value` is always an array of the pressed Toggles' `value`s; single-select by
 * default, clicking the pressed one again deselects it. `variant` / `color` / `size` pass down to the Toggles, `attached`
 * joins them, `orientation` stacks them. For a required single choice styled as a track use Segmented; in a form use RadioGroup.
 *
 * Theme style: behavior comes from Base UI.
 */
export function ToggleGroup({
  variant = "ghost",
  color = "neutral",
  size = "md",
  orientation = "horizontal",
  attached = false,
  ...rest
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ variant, color, size }}>
      <BaseToggleGroup
        {...rest}
        orientation={orientation}
        data-slot="toggle-group"
        data-variant={variant}
        data-attached={attached ? "" : undefined}
      />
    </ToggleGroupContext.Provider>
  );
}
