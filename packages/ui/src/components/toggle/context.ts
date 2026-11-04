import { createContext, useContext } from "react";
import type { ToggleVariant, UIColor, UISize } from "../../contract.ts";

/** Defaults ToggleGroup passes down to the buttons in the group; a value passed by an individual Toggle takes precedence. */
export interface ToggleGroupContextValue {
  variant?: ToggleVariant;
  color?: UIColor;
  size?: UISize;
}

export const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

export function useToggleGroup() {
  return useContext(ToggleGroupContext);
}
