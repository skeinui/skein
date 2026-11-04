import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { MarqueeDirection } from "../../contract.ts";
import { en } from "../../locales/en.ts";
import { useConfig } from "../config-provider/context.ts";

export interface MarqueeLabels {
  pause: string;
  play: string;
}

export interface MarqueeProps {
  children: ReactNode;
  /**
   * Scroll speed, pixels / second: the duration is the content width / speed, written as `--marquee-duration`.
   * @default 40
   */
  speed?: number;
  /**
   * start scrolls toward the start direction (right to left, reversed under RTL), end is the opposite.
   * @default "start"
   */
  direction?: MarqueeDirection;
  /**
   * Pause on mouse hover / when focus is inside.
   * @default true
   */
  pauseOnHover?: boolean;
  /**
   * Show a pause button. WCAG 2.2.2: automatically scrolling content lasting over 5 seconds must be pausable; do not turn it off unless an equivalent control exists elsewhere.
   * @default true
   */
  pausable?: boolean;
  /** Controlled paused state. */
  paused?: boolean;
  /** @default false */
  defaultPaused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  /** Name of the region, used by screen readers. */
  "aria-label"?: string;
  labels?: Partial<MarqueeLabels>;
}

/**
 * Horizontal strip that scrolls its content continuously, for logos, tickers and announcements; it scrolls only when the content is wider than the container, otherwise it is static.
 * `speed` (px / s) and `direction` set the motion; it pauses on hover / focus (`pauseOnHover`) and has a pause button (`pausable`, keep it on for WCAG 2.2.2),
 * `paused` / `onPausedChange` control pausing. It does not scroll when the system requests reduced motion (the content becomes manually scrollable instead).
 * For paging through slides one at a time use Carousel.
 *
 * Theme style: a copy of the content is duplicated end to end (hidden from screen readers and not focusable). The animation itself lives in the theme style;
 * the component only supplies the duration (--marquee-duration).
 */
export function Marquee({
  children,
  speed = 40,
  direction = "start",
  pauseOnHover = true,
  pausable = true,
  paused: pausedProp,
  defaultPaused = false,
  onPausedChange,
  "aria-label": ariaLabel,
  labels: labelsProp,
}: MarqueeProps) {
  const config = useConfig();
  const labels = { ...en.labels.marquee, ...config.labels?.marquee, ...labelsProp };
  const [inner, setInner] = useState(defaultPaused);
  const paused = pausedProp ?? inner;
  const [overflow, setOverflow] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const measure = () => {
      const width = content.offsetWidth;
      setOverflow(width > viewport.clientWidth + 1);
      rootRef.current?.style.setProperty(
        "--marquee-duration",
        `${Math.max(width, 1) / Math.max(speed, 1)}s`,
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, [speed, children]);

  const toggle = () => {
    if (pausedProp === undefined) setInner(!paused);
    onPausedChange?.(!paused);
  };

  return (
    <div
      ref={rootRef}
      role="marquee"
      aria-label={ariaLabel}
      data-slot="marquee"
      data-direction={direction}
      data-overflow={overflow ? "" : undefined}
      data-paused={paused ? "" : undefined}
      data-pause-on-hover={pauseOnHover ? "" : undefined}
    >
      <div ref={viewportRef} data-slot="marquee-viewport">
        <div data-slot="marquee-track">
          <div ref={contentRef} data-slot="marquee-content">
            {children}
          </div>
          {overflow ? (
            <div data-slot="marquee-content" aria-hidden="true" inert>
              {children}
            </div>
          ) : null}
        </div>
      </div>
      {overflow && pausable ? (
        <button
          type="button"
          data-slot="marquee-pause"
          aria-label={paused ? labels.play : labels.pause}
          aria-pressed={paused}
          onClick={toggle}
        >
          <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M5 3.5v9l7-4.5z" /> : <path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" />}
          </svg>
        </button>
      ) : null}
    </div>
  );
}
