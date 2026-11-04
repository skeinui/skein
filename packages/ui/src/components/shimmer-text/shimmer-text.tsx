import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

export interface ShimmerTextProps {
  /** Short status text, such as "Thinking…". */
  children?: ReactNode;
  /**
   * Whether it shimmers; turning it off gives plain muted text (e.g. thinking has ended).
   * @default true
   */
  active?: boolean;
  /**
   * Time for one shimmer sweep (seconds).
   * @default 2
   */
  duration?: number;
}

/**
 * Shimmer text, for short labels like "Thinking" and "Generating": the text itself is muted, with an identical copy overlaid on top,
 * showing a highlight only within the glyph shapes, and the highlight sweeps from left to right in a loop. The overlaid copy is aria-hidden, so screen readers read it only once.
 * The animation is in the theme style; under "reduced motion" the highlight layer is not shown and the text is solid.
 */
export function ShimmerText({ children, active = true, duration = 2 }: ShimmerTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    ref.current?.style.setProperty("--sh-duration", `${duration}s`);
  }, [duration]);
  return (
    <span ref={ref} data-slot="shimmer-text" data-active={active ? "" : undefined}>
      <span data-slot="shimmer-text-label">{children}</span>
      {active ? (
        <span data-slot="shimmer-text-highlight" aria-hidden="true">
          {children}
        </span>
      ) : null}
    </span>
  );
}
