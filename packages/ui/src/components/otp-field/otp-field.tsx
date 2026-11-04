import { OTPField as BaseOtpField } from "@base-ui/react/otp-field";
import { useId } from "react";
import type { FieldVariant, UISize } from "../../contract.ts";
import { useFieldDefaults } from "../field/context.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface OtpFieldProps extends Omit<
  BaseOtpField.Root.Props,
  "className" | "style" | "children" | "render" | "size"
> {
  /** Number of digits in the verification code. */
  length: number;
  variant?: FieldVariant;
  size?: UISize;
  invalid?: boolean;
  /** Insert a separator after this digit position, e.g. for a 6-digit code passing 3 gives "123 – 456". */
  separatorAfter?: number;
}

/**
 * One-time code input: one box per digit (`length` boxes) for verification codes, with automatic advance, pasting the whole code and backspace stepping back.
 * `value` / `onValueChange` hold the code as a string, `onValueComplete` fires when every box is filled, and `separatorAfter` splits the boxes into groups ("123 – 456").
 * For a regular text or password input use Input.
 *
 * Theme style: advance, paste and backspace behavior come from Base UI. Each box uses the `otp-input` slot, and its look is decided by the theme style (width, height, border radius, focus ring).
 */
export function OtpField({
  length,
  variant,
  size,
  invalid,
  separatorAfter,
  ...root
}: OtpFieldProps) {
  const t = useLabels("otpField");
  const field = useFieldDefaults();
  const rootId = useId();
  // Base UI's first cell does not accept aria-label, only aria-labelledby or an associated <label>:
  // When not inside a Field and the caller gave no aria-labelledby, point the first cell at the whole (the whole has a name; the default is used if none is given)
  const selfLabelled = !field && !root["aria-labelledby"];
  const name = root["aria-label"] ?? (selfLabelled ? t.code : undefined);
  return (
    <BaseOtpField.Root
      {...root}
      aria-label={name}
      length={length}
      data-slot="otp-field"
      data-size={size ?? field?.size ?? "md"}
    >
      {selfLabelled ? (
        <span id={rootId} hidden>
          {name}
        </span>
      ) : null}
      {Array.from({ length }, (_, i) => (
        <span key={i} data-slot="otp-cell">
          <BaseOtpField.Input
            data-slot="otp-input"
            data-variant={variant ?? field?.variant ?? "outline"}
            data-size={size ?? field?.size ?? "md"}
            aria-label={i === 0 ? undefined : t.digit(i + 1)}
            aria-labelledby={i === 0 && selfLabelled ? rootId : undefined}
            {...(invalid ? { "data-invalid": "", "aria-invalid": true } : null)}
          />
          {separatorAfter && i + 1 === separatorAfter && i + 1 < length ? (
            <span data-slot="otp-separator" aria-hidden="true">
              –
            </span>
          ) : null}
        </span>
      ))}
    </BaseOtpField.Root>
  );
}
