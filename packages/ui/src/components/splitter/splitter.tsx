import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { useLabels } from "../../locales/use-labels.ts";

/** Size: a number is pixels, a string can be "30%" or "120px". */
type PanelSize = number | string;

export interface SplitterPanelProps {
  children?: ReactNode;
  /** Initial size: a number is pixels, or a string such as "30%" / "120px"; panels without one split the remaining space equally. */
  defaultSize?: PanelSize;
  /** Minimum size, px number or "30%" / "120px" string; dragging will not go past it. */
  min?: PanelSize;
  /** Maximum size, px number or "30%" / "120px" string; dragging will not go past it. */
  max?: PanelSize;
}

export interface SplitterProps {
  /**
   * horizontal: panels side by side, the drag bar is vertical; vertical: stacked top to bottom.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /** Pixel size of each panel, controlled; without it the splitter is uncontrolled (panels start at their `defaultSize`). */
  sizes?: readonly number[];
  /** Called during dragging (on every change) with the pixel size of each panel. */
  onResize?: (sizes: number[]) => void;
  /** Called when the mouse is released / keyboard adjustment ends. */
  onResizeEnd?: (sizes: number[]) => void;
  /**
   * When disabled it cannot be dragged or adjusted with the keyboard.
   * @default false
   */
  disabled?: boolean;
  /** Accessible name of the drag bar; defaults to the locale's "Resize". */
  handleLabel?: string;
  children?: ReactNode;
}

/** Just a marker declaring a panel; rendering is done by Splitter; rendered on its own it simply shows its content. */
function SplitterPanel({ children }: SplitterPanelProps) {
  return <>{children}</>;
}

const KEY_STEP = 10;
const KEY_STEP_LARGE = 50;

function toPx(value: PanelSize | undefined, total: number): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return undefined;
  return value.trim().endsWith("%") ? (n / 100) * total : n;
}

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

interface PanelSpec {
  defaultSize?: PanelSize;
  min?: PanelSize;
  max?: PanelSize;
}

/** Initial sizes: panels with defaultSize take their space first, the rest split what remains equally, then each is clamped to its own min / max. */
function distribute(specs: PanelSpec[], total: number): number[] {
  const fixed = specs.map((s) => toPx(s.defaultSize, total));
  const used = fixed.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const free = fixed.filter((v) => v === undefined).length;
  const share = free > 0 ? Math.max(total - used, 0) / free : 0;
  return specs.map((s, i) => {
    const raw = fixed[i] ?? share;
    return clamp(raw, toPx(s.min, total) ?? 0, toPx(s.max, total) ?? total);
  });
}

/**
 * Resizable split layout: several panels side by side (or stacked), with divider bars between them that the user drags, or moves with the keyboard (arrow keys, Home / End), to resize.
 * Put `Splitter.Panel` children inside (each with `defaultSize` / `min` / `max`, px or "30%"); `orientation` picks side by side or stacked.
 * Sizes are uncontrolled by default; pass `sizes` (px) with `onResize` to control them, or use `onResizeEnd` to persist them after a drag.
 * The last panel always fills the remaining space, so it absorbs any extra / missing space when the container grows or shrinks, and the other panels keep their proportions.
 *
 * Theme style: sizes are dynamic values and the component writes no style: a ref sets each panel's pixel size as its own --splitter-size, and the theme style uses it for flex-basis.
 */
export function Splitter({
  orientation = "horizontal",
  sizes: sizesProp,
  onResize,
  onResizeEnd,
  disabled = false,
  handleLabel: handleLabelProp,
  children,
}: SplitterProps) {
  const t = useLabels("splitter");
  const handleLabel = handleLabelProp ?? t.resize;
  const panels = Children.toArray(children).filter(
    isValidElement,
  ) as React.ReactElement<SplitterPanelProps>[];
  const specs: PanelSpec[] = panels.map((p) => ({
    defaultSize: p.props.defaultSize,
    min: p.props.min,
    max: p.props.max,
  }));
  const specKey = JSON.stringify(specs);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const baseId = useId();
  const [total, setTotal] = useState<number | null>(null);
  const prevTotal = useRef<number | null>(null);
  const [inner, setInner] = useState<number[] | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const horizontal = orientation === "horizontal";

  // Measure the container length along the layout direction; if it changed, scale the existing sizes proportionally
  const measure = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = horizontal ? rect.width : rect.height;
    if (next <= 0) return;
    const before = prevTotal.current;
    prevTotal.current = next;
    setTotal(next);
    if (before !== null && before !== next) {
      setInner((prev) => (prev ? prev.map((s) => (s * next) / before) : prev));
    }
  }, [horizontal]);

  useLayoutEffect(() => {
    measure();
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  // If the panel count / constraints changed, discard the dragged sizes and redistribute from defaultSize
  useEffect(() => {
    setInner(null);
  }, [specKey, orientation]);

  const initial = useMemo(
    () => (total === null ? null : distribute(specs, total)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [total, specKey],
  );
  const current: number[] | null = sizesProp ? [...sizesProp] : (inner ?? initial);
  const currentRef = useRef(current);
  currentRef.current = current;

  // Write the sizes onto each panel; the last panel is not written so that it absorbs the remaining space
  useLayoutEffect(() => {
    panelRefs.current.forEach((el, i) => {
      if (!el) return;
      if (current && i < panels.length - 1)
        el.style.setProperty("--splitter-size", String(current[i]));
      else el.style.removeProperty("--splitter-size");
    });
  });

  const limits = (i: number) => {
    const t = total ?? 0;
    return {
      min: toPx(specs[i]?.min, t) ?? 0,
      max: toPx(specs[i]?.max, t) ?? t,
    };
  };

  /** Moves divider number index by delta pixels: of the two panels around it, one grows and one shrinks, neither going past its min / max. */
  const move = (index: number, delta: number, base: number[]): number[] => {
    const a = base[index]!;
    const b = base[index + 1]!;
    const la = limits(index);
    const lb = limits(index + 1);
    const low = Math.max(la.min - a, b - lb.max);
    const high = Math.min(la.max - a, b - lb.min);
    const d = low > high ? 0 : clamp(delta, low, high);
    const next = base.slice();
    next[index] = a + d;
    next[index + 1] = b - d;
    return next;
  };

  const commit = (next: number[]) => {
    currentRef.current = next;
    if (!sizesProp) setInner(next);
    onResize?.(next);
  };

  const drag = useRef<{ index: number; start: number; base: number[] } | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLElement>, index: number) => {
    if (disabled || !currentRef.current) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = {
      index,
      start: horizontal ? event.clientX : event.clientY,
      base: currentRef.current.slice(),
    };
    setDragging(index);
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const pos = horizontal ? event.clientX : event.clientY;
    commit(move(d.index, pos - d.start, d.base));
  };
  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    drag.current = null;
    setDragging(null);
    if (currentRef.current) onResizeEnd?.(currentRef.current);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    const base = currentRef.current;
    if (disabled || !base) return;
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const back = horizontal ? "ArrowLeft" : "ArrowUp";
    const forward = horizontal ? "ArrowRight" : "ArrowDown";
    let delta: number | null = null;
    if (event.key === back) delta = -step;
    else if (event.key === forward) delta = step;
    else if (event.key === "Home") delta = -Infinity;
    else if (event.key === "End") delta = Infinity;
    if (delta === null) return;
    event.preventDefault();
    commit(move(index, delta, base));
    onResizeEnd?.(currentRef.current!);
  };

  return (
    <div
      ref={rootRef}
      data-slot="splitter"
      data-orientation={orientation}
      data-ready={current ? "" : undefined}
      data-dragging={dragging !== null ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
    >
      {panels.map((panel, i) => {
        const last = i === panels.length - 1;
        // aria-valuemin / max: the percentage of the pair's total taken by the previous panel; the lower / upper bounds are determined by the min / max sizes of both sides
        const pair = current ? current[i]! + (current[i + 1] ?? 0) : 0;
        const a = limits(i);
        const b = limits(i + 1);
        const lowPct = pair ? (Math.max(a.min, pair - b.max) / pair) * 100 : 0;
        const highPct = pair ? (Math.min(a.max, pair - b.min) / pair) * 100 : 100;
        return (
          <Fragment key={panel.key ?? i}>
            <div
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              id={`${baseId}-${i}`}
              data-slot="splitter-panel"
              data-last={last ? "" : undefined}
            >
              {panel.props.children}
            </div>
            {last ? null : (
              <div data-slot="splitter-bar" data-active={dragging === i ? "" : undefined}>
                <div
                  role="separator"
                  tabIndex={disabled ? -1 : 0}
                  aria-label={handleLabel}
                  aria-orientation={horizontal ? "vertical" : "horizontal"}
                  aria-controls={`${baseId}-${i}`}
                  aria-valuenow={
                    pair && current ? Math.round((current[i]! / pair) * 100) : undefined
                  }
                  aria-valuemin={Math.round(lowPct)}
                  aria-valuemax={Math.round(highPct)}
                  aria-disabled={disabled || undefined}
                  data-slot="splitter-handle"
                  data-active={dragging === i ? "" : undefined}
                  onPointerDown={(e) => onPointerDown(e, i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onKeyDown={(e) => onKeyDown(e, i)}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

Splitter.Panel = SplitterPanel;
