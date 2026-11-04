import { useLayoutEffect } from "react";
import type { RefObject } from "react";

/**
 * A textarea that grows with its content: measures the content height and writes it directly to the element's height (a measured value cannot be a class),
 * growing up to `maxRows` rows, beyond which it scrolls inside. Re-measured when `value` changes.
 */
export function useAutoGrow(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxRows: number,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const cs = getComputedStyle(el);
    const line = Number.parseFloat(cs.lineHeight) || Number.parseFloat(cs.fontSize) * 1.5 || 20;
    const padding = Number.parseFloat(cs.paddingTop) + Number.parseFloat(cs.paddingBottom) || 0;
    const max = line * maxRows + padding;
    const next = Math.min(el.scrollHeight, max);
    if (next > 0) el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [ref, value, maxRows]);
}
