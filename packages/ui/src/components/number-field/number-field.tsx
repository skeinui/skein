import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import type { FieldVariant, UISize } from "../../contract.ts";
import { useFieldDefaults } from "../field/context.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface NumberFieldProps extends Omit<
  BaseNumberField.Root.Props,
  "className" | "style" | "children" | "render" | "size"
> {
  variant?: FieldVariant;
  size?: UISize;
  fullWidth?: boolean;
  invalid?: boolean;
  placeholder?: string;
  /**
   * Increment / decrement buttons on both sides, shown by default.
   * @default true
   */
  stepper?: boolean;
  "aria-label"?: string;
}

const Icon = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

/**
 * Input for a number, with increment / decrement buttons, Up / Down arrow keys and press-and-hold to change the value continuously.
 * `value` / `onValueChange` hold a number (null when empty); `min` / `max` / `step` limit and step it, `format` (Intl.NumberFormat options) formats it,
 * and `stepper={false}` hides the buttons. For picking within a range by dragging use Slider; for free text use Input.
 *
 * Theme style: min / max / step, arrow keys, press-and-hold and formatting come from Base UI.
 * The input look reuses Input's (slot is input-group), and the increment / decrement buttons are drawn by the theme style.
 */
export function NumberField({
  variant,
  size,
  fullWidth = false,
  invalid,
  placeholder,
  stepper = true,
  "aria-label": ariaLabel,
  ...root
}: NumberFieldProps) {
  const t = useLabels("numberField");
  const field = useFieldDefaults();
  return (
    <BaseNumberField.Root {...root} data-slot="number-field">
      <BaseNumberField.Group
        data-slot="input-group"
        data-variant={variant ?? field?.variant ?? "outline"}
        data-size={size ?? field?.size ?? "md"}
        data-full-width={fullWidth ? "" : undefined}
      >
        {stepper ? (
          <BaseNumberField.Decrement data-slot="number-field-decrement" aria-label={t.decrease}>
            <Icon d="M5 12h14" />
          </BaseNumberField.Decrement>
        ) : null}
        <BaseNumberField.Input
          data-slot="input-group-input"
          aria-label={ariaLabel}
          placeholder={placeholder}
          {...(invalid ? { "data-invalid": "", "aria-invalid": true } : null)}
        />
        {stepper ? (
          <BaseNumberField.Increment data-slot="number-field-increment" aria-label={t.increase}>
            <Icon d="M12 5v14M5 12h14" />
          </BaseNumberField.Increment>
        ) : null}
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
