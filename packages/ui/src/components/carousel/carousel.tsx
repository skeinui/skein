import { Children, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { en } from "../../locales/en.ts";
import { useConfig } from "../config-provider/context.ts";

export type CarouselEffect = "slide" | "fade";
export type CarouselDotPosition = "bottom" | "top";

export interface CarouselLabels {
  previous: string;
  next: string;
  /** Name of the dot group. */
  slides: string;
  /** Button name for "slide n"; n starts from 1. */
  goTo: (n: number) => string;
  /** Name of each page, such as "1 of 5". */
  slide: (n: number, total: number) => string;
  pause: string;
  play: string;
}

export interface CarouselProps {
  /** Each child is one page. */
  children: ReactNode;
  /** Controlled current page (from 0). */
  index?: number;
  /**
   * Initial `index` when uncontrolled.
   * @default 0
   */
  defaultIndex?: number;
  /** Called with the new `index`; pass `index` as well to control it. */
  onIndexChange?: (index: number) => void;
  /**
   * Autoplay interval (milliseconds); `false` turns autoplay off. No autoplay when the system asks for reduced motion.
   * @default false
   */
  autoplay?: number | false;
  /**
   * After reaching the end, wrap around to the other end.
   * @default true
   */
  loop?: boolean;
  /**
   * `slide` is a horizontal slide, `fade` is a cross-fade.
   * @default "slide"
   */
  effect?: CarouselEffect;
  /**
   * Dots to pick a page.
   * @default true
   */
  dots?: boolean;
  /**
   * Where the dots sit: below or above the slides.
   * @default "bottom"
   */
  dotPosition?: CarouselDotPosition;
  /**
   * Previous / next arrows on both sides.
   * @default true
   */
  arrows?: boolean;
  /**
   * Pause autoplay when the mouse is over / focus is inside.
   * @default true
   */
  pauseOnHover?: boolean;
  /** Name of the whole carousel, for screen readers. */
  "aria-label"?: string;
  labels?: Partial<CarouselLabels>;
}

const Arrow = ({ dir }: { dir: "prev" | "next" }) => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
    <path
      d={dir === "prev" ? "m10 3-5 5 5 5" : "m6 3 5 5-5 5"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const reducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SWIPE = 40;

/**
 * Slideshow that shows one page at a time and changes pages with dots, arrows, keyboard (← →, Home / End), drag / swipe or autoplay.
 * Each child is one page; `index` / `onIndexChange` control the current page (from 0), `autoplay` sets an interval in milliseconds
 * (stoppable with the pause button, and paused on hover / focus unless `pauseOnHover` is false), `loop` wraps around, `effect` is slide or fade,
 * `dots` / `arrows` toggle the controls. Pages other than the current one are inert, so their links and buttons are unreachable.
 * For a continuously scrolling strip use Marquee.
 *
 * Theme style: semantics follow the WAI-ARIA carousel pattern (a region with `aria-roledescription="carousel"`, each page a group "n of N").
 * The current page's position is handed to the theme style through the `--car-index` variable, and the component writes no style.
 */
export function Carousel({
  children,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  autoplay = false,
  loop = true,
  effect = "slide",
  dots = true,
  dotPosition = "bottom",
  arrows = true,
  pauseOnHover = true,
  labels: labelsProp,
  ...aria
}: CarouselProps) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const config = useConfig();
  const labels = { ...en.labels.carousel, ...config.labels?.carousel, ...labelsProp };
  const [inner, setInner] = useState(defaultIndex);
  const index = Math.min(Math.max(indexProp ?? inner, 0), Math.max(count - 1, 0));
  const rootRef = useRef<HTMLElement>(null);
  const id = useId();
  const [hover, setHover] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);

  const latest = useRef({ indexProp, onIndexChange, count, loop });
  latest.current = { indexProp, onIndexChange, count, loop };

  const go = useCallback((target: number) => {
    const { count: n, loop: wrap, indexProp: controlled, onIndexChange: notify } = latest.current;
    if (n === 0) return;
    const next = wrap ? ((target % n) + n) % n : Math.min(Math.max(target, 0), n - 1);
    if (controlled === undefined) setInner(next);
    notify?.(next);
  }, []);
  const indexRef = useRef(index);
  indexRef.current = index;

  // Position is written as a variable, and the theme style translates / fades accordingly
  useLayoutEffect(() => {
    rootRef.current?.style.setProperty("--car-index", String(index));
  }, [index]);

  // Autoplay: does not play when hovered / focused / manually paused / page hidden / reduced motion requested
  const playing = Boolean(autoplay) && !paused && !hidden && count > 1 && !reducedMotion();
  const blocked = pauseOnHover && (hover || focusWithin);
  useEffect(() => {
    if (!autoplay || !playing || blocked) return;
    const timer = setInterval(() => go(indexRef.current + 1), autoplay);
    return () => clearInterval(timer);
  }, [autoplay, playing, blocked, go]);
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("input, textarea, select")) return;
    switch (event.key) {
      case "ArrowLeft":
        go(index - 1);
        break;
      case "ArrowRight":
        go(index + 1);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(count - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  // Drag / swipe: changes page when horizontal movement exceeds SWIPE pixels; vertical scrolling is not intercepted
  const start = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const from = start.current;
    start.current = null;
    if (!from) return;
    const dx = event.clientX - from.x;
    if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(event.clientY - from.y)) {
      go(index + (dx < 0 ? 1 : -1));
    }
  };

  const atStart = !loop && index === 0;
  const atEnd = !loop && index === count - 1;

  return (
    <section
      ref={rootRef}
      {...aria}
      aria-roledescription="carousel"
      data-slot="carousel"
      data-effect={effect}
      data-dot-position={dotPosition}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false);
      }}
    >
      <div
        data-slot="carousel-viewport"
        aria-live={playing && !blocked ? "off" : "polite"}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (start.current = null)}
      >
        <div data-slot="carousel-track">
          {slides.map((slide, i) => (
            <div
              key={i}
              id={`${id}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={labels.slide(i + 1, count)}
              data-slot="carousel-slide"
              data-active={i === index ? "" : undefined}
              inert={i !== index}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
      {arrows && count > 1 ? (
        <>
          <button
            type="button"
            data-slot="carousel-arrow"
            data-direction="prev"
            aria-label={labels.previous}
            disabled={atStart}
            onClick={() => go(index - 1)}
          >
            <Arrow dir="prev" />
          </button>
          <button
            type="button"
            data-slot="carousel-arrow"
            data-direction="next"
            aria-label={labels.next}
            disabled={atEnd}
            onClick={() => go(index + 1)}
          >
            <Arrow dir="next" />
          </button>
        </>
      ) : null}
      {dots && count > 1 ? (
        <div role="group" aria-label={labels.slides} data-slot="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              data-slot="carousel-dot"
              data-active={i === index ? "" : undefined}
              aria-label={labels.goTo(i + 1)}
              aria-current={i === index ? "true" : undefined}
              aria-controls={`${id}-${i}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      ) : null}
      {autoplay && count > 1 ? (
        <button
          type="button"
          data-slot="carousel-pause"
          data-paused={paused ? "" : undefined}
          aria-label={paused ? labels.play : labels.pause}
          onClick={() => setPaused((p) => !p)}
        >
          <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M5 3.5v9l7-4.5z" /> : <path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" />}
          </svg>
        </button>
      ) : null}
    </section>
  );
}
