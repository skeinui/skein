import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import type { ReactNode } from "react";
import type { FieldVariant } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style" | "children" | "render">;

export interface CheckboxProps extends Without<BaseCheckbox.Root.Props> {
  /**
   * Fill of the control: `outline` is a white box with a shadow, `filled` a grey one (HeroUI v3's primary / secondary).
   * @default "outline"
   */
  variant?: FieldVariant;
  /** Mark invalid manually when not inside a Field; inside a Field the Field's validation state decides. */
  invalid?: boolean;
  /** Label text, placed to the right of the control. */
  children?: ReactNode;
  /** Description under the label; clicking it toggles as well. */
  description?: ReactNode;
}

/**
 * Checkbox: one on / off choice with its label (`children`) and an optional `description`; clicking the text toggles it too.
 * `checked` / `onCheckedChange` control it, `indeterminate` shows a dash (e.g. "select all" with some selected).
 * For several related choices put them in a CheckboxGroup; for a setting that applies at once use Switch.
 *
 * Theme style: a <label> wraps "control + text"; state (checked, disabled, invalid) is on the control and the theme style
 * reads it with :has(). The check mark and the dash are two svgs; which one shows and how it animates is up to the theme style.
 */
export function Checkbox({
  variant = "outline",
  invalid,
  children,
  description,
  ...rest
}: CheckboxProps) {
  return (
    <label data-slot="checkbox" data-variant={variant}>
      <BaseCheckbox.Root
        {...rest}
        {...(invalid ? { "data-invalid": "", "aria-invalid": true } : null)}
        data-slot="checkbox-control"
      >
        <BaseCheckbox.Indicator data-slot="checkbox-indicator" keepMounted>
          <svg data-slot="checkbox-checkmark" viewBox="0 0 17 18" aria-hidden="true">
            <polyline
              points="1 9 7 14 15 4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
            />
          </svg>
          <svg data-slot="checkbox-indeterminate" viewBox="0 0 24 24" aria-hidden="true">
            <line
              x1="4"
              y1="12"
              x2="20"
              y2="12"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {children || description ? (
        <span data-slot="checkbox-content">
          {children ? <span data-slot="checkbox-label">{children}</span> : null}
          {description ? <span data-slot="checkbox-description">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}

export interface CheckboxGroupProps extends Omit<BaseCheckboxGroup.Props, "className" | "style"> {
  /**
   * Direction the checkboxes are laid out in.
   * @default "vertical"
   */
  orientation?: "horizontal" | "vertical";
}

/**
 * A group of `Checkbox`es: `value` / `onValueChange` hold the array of checked values (each Checkbox needs a `value`).
 */
export function CheckboxGroup({ orientation = "vertical", ...rest }: CheckboxGroupProps) {
  return <BaseCheckboxGroup {...rest} data-slot="checkbox-group" data-orientation={orientation} />;
}
