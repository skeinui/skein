import { Field as BaseField } from "@base-ui/react/field";
import { useMemo } from "react";
import type { ReactNode } from "react";
import type { FieldVariant, UISize } from "../../contract.ts";
import { FieldContext } from "./context.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface FieldProps extends Without<BaseField.Root.Props> {
  /** Default look of all controls inside; a value passed by the control itself takes precedence. */
  variant?: FieldVariant;
  /** Default size of all controls inside; a value passed by the control itself takes precedence. */
  size?: UISize;
  /** Only affects the asterisk after the label; real required validation needs required on the control. */
  required?: boolean;
  children?: ReactNode;
}

/**
 * Wrapper for one form control that ties together its label, help text and error message.
 * Put the control (Input, Select, …) inside with `Field.Label`, `Field.Description` and `Field.Error` (shown when validation fails);
 * the label and messages are linked to the control automatically. `variant` / `size` become defaults for the controls inside, and `required` only adds
 * the asterisk (set `required` on the control for real validation). To build a whole form from data use Form; to group several fields use Fieldset.
 *
 * Theme style: validation and a11y association (label for, aria-describedby) come from Base UI; the field writes `data-variant` / `data-size` / `data-required`.
 */
export function Field({ variant, size, required, children, ...rest }: FieldProps) {
  const value = useMemo(() => ({ variant, size }), [variant, size]);
  return (
    <FieldContext.Provider value={value}>
      <BaseField.Root
        {...rest}
        data-slot="field"
        data-variant={variant}
        data-size={size}
        data-required={required ? "" : undefined}
      >
        {children}
      </BaseField.Root>
    </FieldContext.Provider>
  );
}

export type FieldLabelProps = Without<BaseField.Label.Props>;

function FieldLabel(props: FieldLabelProps) {
  return <BaseField.Label {...props} data-slot="field-label" />;
}

export type FieldDescriptionProps = Without<BaseField.Description.Props>;

function FieldDescription(props: FieldDescriptionProps) {
  return <BaseField.Description {...props} data-slot="field-description" />;
}

export type FieldErrorProps = Without<BaseField.Error.Props>;

/** By default appears when validation fails; to control visibility externally, pass match. */
function FieldError(props: FieldErrorProps) {
  return <BaseField.Error {...props} data-slot="field-error" />;
}

Field.Label = FieldLabel;
Field.Description = FieldDescription;
Field.Error = FieldError;
