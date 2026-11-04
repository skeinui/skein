import { createContext, useContext } from "react";
import type { ConfigLabels } from "../../locales/messages.ts";

export type { ConfigLabels };

export interface ConfigValue {
  /** Default locale for date components (BCP 47, e.g. "zh-CN"). */
  locale?: string;
  labels?: ConfigLabels;
}

const EMPTY: ConfigValue = {};

export const ConfigContext = createContext<ConfigValue>(EMPTY);

/** Components use it to read the global config; an empty object when not inside a ConfigProvider. */
export function useConfig(): ConfigValue {
  return useContext(ConfigContext);
}
