import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

/** The element to scroll in: an element, a ref, or a function returning an element; the whole window if not given. */
export type AffixTarget = HTMLElement | RefObject<HTMLElement | null> | (() => HTMLElement | null);

export interface AffixProps {
  /** Pixels from the container top at which to pin. Defaults to 0 when offsetBottom is not given. */
  offsetTop?: number;
  /** Pixels from the container bottom at which to pin (for when the element is below the container and only comes into view after scrolling, e.g. a bottom action bar); when given, the top is no longer used. */
  offsetBottom?: number;
  /** Scroll container to watch: an element, a ref, or a function returning one. Defaults to the window. */
  target?: AffixTarget;
  /** Callback when pinned / released. */
  onChange?: (affixed: boolean) => void;
  children?: ReactNode;
}

function resolveTarget(target: AffixTarget | undefined): HTMLElement | null {
  if (!target) return null;
  if (typeof target === "function") return target();
  if (target instanceof HTMLElement) return target;
  return target.current;
}

/**
 * Affix: pins an element (a toolbar, a bottom action bar) to the edge of the scroll container when it would scroll out of view.
 * Pinned at `offsetTop` (or `offsetBottom`), it is released when it is back in place;
 * the page does not jump. `target` is the scroll container (the window by default), `onChange` reports pin / release.
 *
 * Theme style: when pinned, the content is `position: fixed` with a same-size placeholder left in place. A ref sets
 * --affix-top / --affix-left / --affix-w / --affix-h on the root (pixels, no unit); the theme style applies them and the layering.
 * When an ancestor has a transform, the component measures the offset and compensates.
 */
export function Affix({ offsetTop, offsetBottom, target, onChange, children }: AffixProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [affixed, setAffixed] = useState(false);
  const affixedRef = useRef(false);
  const applied = useRef({ top: 0, left: 0 });
  const useBottom = offsetBottom !== undefined && offsetTop === undefined;
  const top = offsetTop ?? 0;

  const measure = useCallback(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;
    const scroller = resolveTarget(target);
    const bounds = scroller
      ? scroller.getBoundingClientRect()
      : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    // The placeholder is always at the original position (when pinned it is stretched to the same height); use its position to tell "where it originally was"
    const natural = root.getBoundingClientRect();
    const height = content.getBoundingClientRect().height;
    const next = useBottom
      ? natural.bottom > bounds.bottom - (offsetBottom ?? 0)
      : natural.top < bounds.top + top;
    const pinnedTop = useBottom ? bounds.bottom - (offsetBottom ?? 0) - height : bounds.top + top;
    // When an ancestor has transform / filter etc., fixed is positioned relative to that ancestor, not the viewport: if already pinned,
    // measure where it is actually drawn and compensate for the difference
    let applyTop = pinnedTop;
    let applyLeft = natural.left;
    if (content.hasAttribute("data-affixed")) {
      const actual = content.getBoundingClientRect();
      applyTop = pinnedTop - (actual.top - applied.current.top);
      applyLeft = natural.left - (actual.left - applied.current.left);
    }
    applied.current = { top: applyTop, left: applyLeft };
    root.style.setProperty("--affix-top", String(applyTop));
    root.style.setProperty("--affix-left", String(applyLeft));
    root.style.setProperty("--affix-w", String(natural.width));
    root.style.setProperty("--affix-h", String(height));
    if (next !== affixedRef.current) {
      affixedRef.current = next;
      setAffixed(next);
      onChange?.(next);
    }
  }, [target, useBottom, offsetBottom, top, onChange]);

  useLayoutEffect(() => {
    measure();
  }, [measure, affixed]);

  useEffect(() => {
    const scroller = resolveTarget(target);
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    (scroller ?? window).addEventListener("scroll", schedule, { passive: true });
    // When the container scrolls inside the window or the window is resized, the pinned position (relative to the viewport) must change too
    if (scroller) window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    if (rootRef.current) observer?.observe(rootRef.current);
    if (contentRef.current) observer?.observe(contentRef.current);
    if (scroller) observer?.observe(scroller);
    return () => {
      cancelAnimationFrame(raf);
      (scroller ?? window).removeEventListener("scroll", schedule);
      if (scroller) window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [target, measure]);

  return (
    <div ref={rootRef} data-slot="affix" data-affixed={affixed ? "" : undefined}>
      <div ref={contentRef} data-slot="affix-content" data-affixed={affixed ? "" : undefined}>
        {children}
      </div>
    </div>
  );
}
