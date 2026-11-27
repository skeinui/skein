import { useCallback } from "react";
import { useVars } from "./use-vars.ts";
import type { Ref } from "react";

/** Width props shared by field-like components; a number is px, a string any CSS length (`"16rem"`, `"50%"`). */
export interface WidthProps {
  /** Fixed width (a number is px, a string any CSS length such as `"16rem"` or `"50%"`). Unset, the box is as wide as its content; `fullWidth` wins. */
  width?: number | string;
  /** Minimum width (number = px, string = CSS length); the box still grows with its content. */
  minWidth?: number | string;
  /** Maximum width (number = px, string = CSS length); longer content is truncated or scrolls inside. */
  maxWidth?: number | string;
}

export const toLength = (v: number | string | undefined) =>
  typeof v === "number" ? `${v}px` : (v ?? "");

/**
 * Writes `width` / `minWidth` / `maxWidth` as `--ui-<prefix>-width` / `-min-width` / `-max-width` on the element (component code does not write `style`);
 * the theme style reads them on that slot. An unset value removes the variable, so the style's own default applies.
 * Returns a callback ref; pass the component's own `ref` as `forwarded` to keep it working.
 */
export function useWidthVars<T extends HTMLElement>(
  prefix: string,
  { width, minWidth, maxWidth }: WidthProps,
  forwarded?: Ref<T>,
) {
  const w = toLength(width);
  const min = toLength(minWidth);
  const max = toLength(maxWidth);
  return useCallback(
    (el: T | null) => {
      if (el) {
        el.style.setProperty(`--ui-${prefix}-width`, w);
        el.style.setProperty(`--ui-${prefix}-min-width`, min);
        el.style.setProperty(`--ui-${prefix}-max-width`, max);
      }
      if (typeof forwarded === "function") forwarded(el);
      else if (forwarded) forwarded.current = el;
    },
    [prefix, w, min, max, forwarded],
  );
}

/** `iconSize` of a component: written as `--ui-<prefix>-icon-size` on the element the returned ref goes to; the theme style reads it where it sizes the icons. */
export function useIconSizeVar<T extends HTMLElement>(prefix: string, size?: number | string) {
  return useVars<T>({ [`--ui-${prefix}-icon-size`]: toLength(size) });
}
