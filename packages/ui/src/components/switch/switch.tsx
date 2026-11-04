import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ReactNode } from "react";
import type { UISize } from "../../contract.ts";

export interface SwitchProps extends Omit<
  BaseSwitch.Root.Props,
  "className" | "style" | "children" | "render"
> {
  /**
   * Size step.
   * @default "md"
   */
  size?: UISize;
  /** Mark invalid manually when not inside a Field; inside a Field it is decided by the Field's validation state. */
  invalid?: boolean;
  /** Label text, to the right of the switch; without it only the switch is rendered, so give it an `aria-label`. */
  children?: ReactNode;
  /** Secondary text under the label; clicking it toggles as well. */
  description?: ReactNode;
}

/**
 * Switch: an on / off toggle for a setting that takes effect at once, with its label (`children`) and an optional `description`.
 * `checked` / `onCheckedChange` control it (`defaultChecked` for uncontrolled); clicking the text toggles it too.
 * For a choice confirmed later with a form submit use Checkbox; for a pressed / unpressed button use Toggle.
 *
 * Theme style: structure and state conventions match Checkbox: <label> wraps "control + text", the state is on the control,
 * and the theme style reads it with :has().
 */
export function Switch({ size = "md", invalid, children, description, ...rest }: SwitchProps) {
  return (
    <label data-slot="switch" data-size={size}>
      <BaseSwitch.Root
        {...rest}
        {...(invalid ? { "data-invalid": "", "aria-invalid": true } : null)}
        data-slot="switch-control"
      >
        <BaseSwitch.Thumb data-slot="switch-thumb" />
      </BaseSwitch.Root>
      {children || description ? (
        <span data-slot="switch-content">
          {children ? <span data-slot="switch-label">{children}</span> : null}
          {description ? <span data-slot="switch-description">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
