import { createContext, useContext } from "react";
import type { ButtonVariant, UIColor, UIRadius, UISize } from "../../contract.ts";

/** Defaults that ButtonGroup passes down to buttons in the group; a button's own props win. */
export interface ButtonGroupContextValue {
  variant?: ButtonVariant;
  color?: UIColor;
  size?: UISize;
  radius?: UIRadius;
  disabled?: boolean;
}

export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

/** Button uses it to read the defaults of its group; null when not in a group. */
export function useButtonGroup() {
  return useContext(ButtonGroupContext);
}
