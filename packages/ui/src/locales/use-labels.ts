import { useConfig } from "../components/config-provider/context.ts";
import { en } from "./en.ts";
import type { LabelTypes, Messages } from "./messages.ts";

const isPlain = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Merges text by priority: later ones override earlier ones, and `undefined` does not count (`labels={{ next: undefined }}` will not wipe out the default);
 * when a value is an object (such as a table of names per status), it merges one more level in, so writing only one status does not lose the rest.
 */
export function mergeLabels<T extends object>(base: T, ...layers: (Partial<T> | undefined)[]): T {
  const out = { ...base } as Record<string, unknown>;
  for (const layer of layers) {
    if (!layer) continue;
    for (const [key, value] of Object.entries(layer)) {
      if (value === undefined) continue;
      const before = out[key];
      out[key] = isPlain(value) && isPlain(before) ? { ...before, ...value } : value;
    }
  }
  return out as T;
}

/** A component gets its own text: the component's `labels` > ConfigProvider's `labels` > English defaults. */
export function useLabels<K extends keyof LabelTypes>(
  key: K,
  own?: Partial<LabelTypes[K]>,
): Messages["labels"][K] {
  const config = useConfig();
  return mergeLabels(en.labels[key], config.labels?.[key], own as never) as Messages["labels"][K];
}
