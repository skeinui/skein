import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ScrollShadowOrientation } from "../../contract.ts";

export interface ScrollShadowProps {
  /**
   * Scroll direction.
   * @default "vertical"
   */
  orientation?: ScrollShadowOrientation;
  /**
   * Length of the edge fade (pixels).
   * @default 40
   */
  size?: number;
  /**
   * Hide the scrollbar (it can still scroll, and the fading edge is the hint).
   * @default false
   */
  hideScrollbar?: boolean;
  /** Name of the scroll region: when the content really overflows and needs scrolling it is `role="region"`, and screen readers read out this name. */
  "aria-label"?: string;
  /** The content. Put the component in a parent with a height (or width): it fills the parent and scrolls inside it. */
  children?: ReactNode;
}

/**
 * Scroll container with edge fade: when content can still scroll in a direction, the edge on that side fades out to hint "there is more here"; at the end it disappears.
 * Scrolling itself is native; the fade is a mask in the theme style, and the component only writes "there is content on the start / end side" as data attributes.
 * There is no height prop: put it in a parent with a height (or width) and it fills the parent and scrolls inside it.
 * When the content overflows the container is keyboard focusable (arrow keys can only scroll it then, WCAG 2.1.1).
 */
export function ScrollShadow({
  orientation = "vertical",
  size = 40,
  hideScrollbar = false,
  "aria-label": label,
  children,
}: ScrollShadowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const horizontal = orientation === "horizontal";

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const pos = Math.abs(horizontal ? el.scrollLeft : el.scrollTop);
    const max = horizontal ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
    const set = (name: string, on: boolean) =>
      on ? el.setAttribute(name, "") : el.removeAttribute(name);
    set("data-shadow-start", max > 1 && pos > 1);
    set("data-shadow-end", max > 1 && pos < max - 1);
    setScrollable(max > 1);
  }, [horizontal]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ss-size", `${size}px`);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [size, update, children]);

  return (
    <div
      ref={ref}
      data-slot="scroll-shadow"
      data-orientation={orientation}
      data-scrollbar={hideScrollbar ? "hidden" : undefined}
      onScroll={update}
      // When content overflows the container it must be keyboard focusable so arrow keys can scroll
      {...(scrollable
        ? { tabIndex: 0, ...(label ? { role: "region", "aria-label": label } : null) }
        : null)}
    >
      <div data-slot="scroll-shadow-content">{children}</div>
    </div>
  );
}
