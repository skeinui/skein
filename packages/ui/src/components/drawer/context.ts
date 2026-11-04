import { createContext, useContext } from "react";
import type { DrawerSide } from "../../contract.ts";

export const DrawerSideContext = createContext<DrawerSide>("right");

export function useDrawerSide() {
  return useContext(DrawerSideContext);
}
