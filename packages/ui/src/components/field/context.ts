import { createContext, useContext } from "react";
import type { FieldVariant, UISize } from "../../contract.ts";

/** Defaults a Field provides to the controls inside it; a value passed by the control itself takes precedence. */
export interface FieldContextValue {
  variant?: FieldVariant;
  size?: UISize;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

/** Controls use it to read the defaults of the Field they are in; null when not inside a Field. */
export function useFieldDefaults() {
  return useContext(FieldContext);
}
