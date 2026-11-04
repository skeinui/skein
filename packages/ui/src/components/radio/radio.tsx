import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";
import type { FieldVariant } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style" | "children" | "render">;

export interface RadioGroupProps extends Omit<BaseRadioGroup.Props, "className" | "style"> {
  /**
   * Direction the radios are laid out in.
   * @default "vertical"
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Background of the controls: outline (white with a shadow) or filled (grey).
   * @default "outline"
   */
  variant?: FieldVariant;
}

/**
 * A group of `Radio`s where exactly one can be selected: `value` / `onValueChange` hold the selected value.
 * Arrow keys move and select, and only the selected radio is in the tab order.
 */
export function RadioGroup({
  orientation = "vertical",
  variant = "outline",
  ...rest
}: RadioGroupProps) {
  return (
    <BaseRadioGroup
      {...rest}
      data-slot="radio-group"
      data-orientation={orientation}
      data-variant={variant}
    />
  );
}

export interface RadioProps extends Without<BaseRadio.Root.Props> {
  /** When not inside a Field, mark it manually with invalid; inside a Field the Field's validation state decides. */
  invalid?: boolean;
  /** The label, to the right of the control. */
  children?: ReactNode;
  /** Secondary text under the label (explains the option). */
  description?: ReactNode;
}

/**
 * Single radio option with a label, used inside a RadioGroup, which holds the selected value.
 * `value` identifies the option, `children` is its label and `description` a line of help text under it; clicking the text selects it too.
 * For several independent on / off choices use Checkbox / CheckboxGroup; for a compact button-like choice use Segmented; for many options use Select.
 *
 * Theme style: structure and state conventions match Checkbox: <label> wraps "control + text", the state is on the control, and the theme style reads it with :has().
 */
export function Radio({ invalid, children, description, ...rest }: RadioProps) {
  return (
    <label data-slot="radio">
      <BaseRadio.Root
        {...rest}
        {...(invalid ? { "data-invalid": "", "aria-invalid": true } : null)}
        data-slot="radio-control"
      >
        <BaseRadio.Indicator data-slot="radio-indicator" keepMounted />
      </BaseRadio.Root>
      {children || description ? (
        <span data-slot="radio-content">
          {children ? <span data-slot="radio-label">{children}</span> : null}
          {description ? <span data-slot="radio-description">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
