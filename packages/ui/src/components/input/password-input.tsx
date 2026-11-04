import { useState } from "react";
import { EyeIcon } from "./icons.tsx";
import { InputGroup } from "./input.tsx";
import type { InputGroupInputProps, InputGroupProps } from "./input.tsx";
import { useLabels } from "../../locales/use-labels.ts";

export interface PasswordInputLabels {
  show: string;
  hide: string;
}

export interface PasswordInputProps
  extends
    Omit<InputGroupInputProps, "type" | "size">,
    Pick<InputGroupProps, "variant" | "size" | "fullWidth"> {
  /**
   * Button to show / hide the password.
   * @default true
   */
  visibilityToggle?: boolean;
  /** Controlled visibility state. */
  visible?: boolean;
  /** @default false */
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  labels?: Partial<PasswordInputLabels>;
}

/** Password input: InputGroup + a button that toggles plain text. The button is an aria-pressed toggle, and its name changes with the state. */
export function PasswordInput({
  variant,
  size,
  fullWidth,
  visibilityToggle = true,
  visible: visibleProp,
  defaultVisible = false,
  onVisibleChange,
  labels,
  autoComplete = "current-password",
  ...rest
}: PasswordInputProps) {
  const [inner, setInner] = useState(defaultVisible);
  const visible = visibleProp ?? inner;
  const l = useLabels("passwordInput", labels);
  const toggle = () => {
    if (visibleProp === undefined) setInner(!visible);
    onVisibleChange?.(!visible);
  };
  return (
    <InputGroup variant={variant} size={size} fullWidth={fullWidth}>
      <InputGroup.Input
        {...rest}
        autoComplete={autoComplete}
        type={visible ? "text" : "password"}
      />
      {visibilityToggle ? (
        <InputGroup.Suffix>
          <InputGroup.Action
            aria-label={visible ? l.hide : l.show}
            aria-pressed={visible}
            disabled={rest.disabled}
            onClick={toggle}
          >
            <EyeIcon off={visible} />
          </InputGroup.Action>
        </InputGroup.Suffix>
      ) : null}
    </InputGroup>
  );
}
