import { useLayoutEffect, useRef } from "react";

/**
 * Positions / sizes only known at runtime are written as CSS variables: component code does not write `style`, but sets them with a ref in the layout phase,
 * and the theme style decides how to use them (convert to lengths, draw progress...). Variable names carry `--`, and values are numbers or strings.
 */
export function useVars<T extends HTMLElement>(vars: Record<string, string | number>) {
  const ref = useRef<T>(null);
  const key = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const pair of key.split(";")) {
      const at = pair.indexOf(":");
      el.style.setProperty(pair.slice(0, at), pair.slice(at + 1));
    }
  }, [key]);
  return ref;
}
