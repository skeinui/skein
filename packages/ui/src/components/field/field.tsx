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

/**
 * The label of a field. With `nativeLabel={false}` (the control is a button such as a Select's trigger, or not a control at all) it is a `div`:
 * Base UI wants an element that is not a `<label>` then, and you do not have to pass `render` yourself.
 */
function FieldLabel({ nativeLabel, render, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      {...props}
      nativeLabel={nativeLabel}
      render={render ?? (nativeLabel === false ? <div /> : undefined)}
      data-slot="field-label"
    />
  );
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
