import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import type { ReactNode } from "react";

type Without<T> = Omit<T, "className" | "style">;

export interface FieldsetProps extends Without<BaseFieldset.Root.Props> {
  /** Group title, rendered as <legend>, which screen readers read as the name of this group of form controls. */
  legend?: ReactNode;
  /** Disables the whole group: every control inside it is disabled too. */
  disabled?: boolean;
}

/** Groups related form controls: the semantics and disabled propagation of the native fieldset, with the look decided by the theme style. */
export function Fieldset({ legend, children, ...rest }: FieldsetProps) {
  return (
    <BaseFieldset.Root {...rest} data-slot="fieldset">
      {legend ? (
        <BaseFieldset.Legend data-slot="fieldset-legend">{legend}</BaseFieldset.Legend>
      ) : null}
      {children}
    </BaseFieldset.Root>
  );
}
