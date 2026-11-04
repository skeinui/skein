import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { BorderBeamTrigger, UIRadius } from "../../contract.ts";

export interface BorderBeamStop {
  /** Any CSS color of this stop (e.g. "#7c3aed", "var(--ui-primary)"). */
  color: string;
  /** 0–100: position of the gradient stop within the visible beam segment; a transparent transition is left at the tail. */
  percent: number;
}

export interface BorderBeamProps {
  /** The content being decorated. */
  children?: ReactNode;
  /** Beam color: a single color string, or an array of gradient stops (the first is at the head of the beam). Uses the primary color if not given. */
  color?: string | BorderBeamStop[];
  /**
   * Number of beams, evenly distributed along the border.
   * @default 1
   */
  count?: number;
  /**
   * Time (seconds) for a beam to complete one lap.
   * @default 6
   */
  duration?: number;
  /**
   * Beam line width (pixels).
   * @default 1
   */
  lineWidth?: number;
  /**
   * Length of the beam (head to tail), in pixels.
   * @default 100
   */
  size?: number;
  /**
   * Distance (pixels) the beam layer extends outward from the container edge.
   * @default 0
   */
  outset?: number;
  /**
   * `always` flows all the time, `hover` shows only when the mouse is over / focus enters.
   * @default "always"
   */
  trigger?: BorderBeamTrigger;
  /**
   * Border radius; it must match the wrapped content (the beam is drawn along it).
   * @default "lg"
   */
  radius?: UIRadius;
  /**
   * The container hugs the content's size (buttons, badges, avatars and the like). By default the container fills the available width like a block (cards, panels),
   * and in a horizontal flex it is also stretched to the same height as its neighbors, so the beam leaves the content's border; turn on `fit` for such cases.
   * @default false
   */
  fit?: boolean;
}

/** A beam is cut into this many small segments; each travels along the border on its own, with color and opacity changing segment by segment, so the tail can bend around corners */
const SEGMENTS = 16;
/** Gradient stops are mapped into the first 80%, and the last 20% fades out by opacity alone */
const TAIL = 0.2;

const stopsOf = (color: BorderBeamProps["color"]): BorderBeamStop[] =>
  color === undefined
    ? [{ color: "var(--ui-c-primary)", percent: 0 }]
    : typeof color === "string"
      ? [{ color, percent: 0 }]
      : [...color].sort((a, b) => a.percent - b.percent);

/** The color at t (0 = head, 1 = tail) in the beam: interpolated between the two adjacent stops with color-mix, without parsing colors. */
function colorAt(stops: BorderBeamStop[], t: number): string {
  const p = Math.min(Math.max(t / (1 - TAIL), 0), 1) * 100;
  const first = stops[0]!;
  if (stops.length === 1 || p <= first.percent) return first.color;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]!;
    const b = stops[i]!;
    if (p <= b.percent) {
      const f = b.percent === a.percent ? 1 : ((p - a.percent) / (b.percent - a.percent)) * 100;
      return `color-mix(in oklab, ${b.color} ${f.toFixed(1)}%, ${a.color})`;
    }
  }
  return stops[stops.length - 1]!.color;
}

/** Perimeter of the rounded rectangle (pixels). */
const perimeter = (w: number, h: number, r: number) => {
  const radius = Math.min(r, w / 2, h / 2);
  return 2 * (w - 2 * radius) + 2 * (h - 2 * radius) + 2 * Math.PI * radius;
};

/**
 * Border beam: adds a continuously flowing decorative highlight around a container's border (login panel, recommendation card, AI module, key CTA).
 * Purely decorative, `aria-hidden` and does not intercept the mouse; it does not replace the border of focus, validation or business states.
 *
 * A beam is a string of small segments running along the rounded rectangle border (SVG stroke-dash, each with its own color and opacity),
 * so at corners the tail bends along, rather than a whole square gradient suddenly covering two edges at once at a corner.
 * Drawing and animation live in the theme style; the component only measures the container and writes values as CSS variables; the whole layer is hidden when the system asks for reduced motion.
 */
export function BorderBeam({
  children,
  color,
  count = 1,
  duration = 6,
  lineWidth = 1,
  size = 100,
  outset = 0,
  trigger = "always",
  radius = "lg",
  fit = false,
}: BorderBeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const n = Math.max(1, Math.floor(count));
  const stops = stopsOf(color);
  const stopsKey = JSON.stringify(stops);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = (name: string, value: string) => el.style.setProperty(name, value);
    set("--bb-duration", `${duration}s`);
    set("--bb-line", `${lineWidth}px`);
    set("--bb-outset", `${outset}px`);
    set("--bb-count", String(n));
    // Lengths are converted by perimeter: the path is normalized with pathLength=1000, --bb-seg is how much one segment takes (per mille), --bb-segfrac is its fraction of a lap
    const measure = () => {
      const w = el.offsetWidth + outset * 2;
      const h = el.offsetHeight + outset * 2;
      // The radius cannot exceed half the short side ("full" is 9999px); rx / ry are written as the same number, otherwise SVG clamps rx by width and ry by height separately, making the ends of a pill shape elliptical
      const r = Math.min(
        parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
        el.offsetWidth / 2,
        el.offsetHeight / 2,
      );
      set("--bb-r", `${r}px`);
      const total = Math.max(perimeter(w, h, r + outset), 1);
      const frac = Math.min(size / total, 1) / SEGMENTS;
      set("--bb-seg", String(frac * 1000 * 1.25));
      set("--bb-segfrac", String(frac));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [duration, lineWidth, outset, n, size, radius]);

  const segments = Array.from({ length: n * SEGMENTS }, (_, j) => {
    const beam = Math.floor(j / SEGMENTS);
    const k = j % SEGMENTS;
    const t = (k + 0.5) / SEGMENTS;
    return {
      j,
      beam,
      k,
      color: colorAt(JSON.parse(stopsKey) as BorderBeamStop[], t),
      opacity: (1 - t) ** 1.4,
    };
  });

  return (
    <div
      ref={ref}
      data-slot="border-beam"
      data-radius={radius}
      data-trigger={trigger}
      data-fit={fit ? "" : undefined}
    >
      {children}
      <svg data-slot="border-beam-layer" aria-hidden="true" focusable="false">
        {segments.map(({ j, beam, k, color: c, opacity }) => (
          <rect
            key={j}
            data-slot="border-beam-beam"
            pathLength={1000}
            ref={(el) => {
              el?.style.setProperty("--bb-i", String(beam));
              el?.style.setProperty("--bb-k", String(k));
              el?.style.setProperty("--bb-c", c);
              el?.style.setProperty("--bb-o", opacity.toFixed(3));
            }}
          />
        ))}
      </svg>
    </div>
  );
}
