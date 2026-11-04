import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { BREAKPOINT_NAMES, BREAKPOINTS } from "../../contract.ts";
import type { Breakpoint } from "../../contract.ts";

/** A number, or given per breakpoint (xs / sm / md / lg / xl / xxl), taking the largest one the viewport width has reached. */
export type MasonryResponsive = number | Partial<Record<Breakpoint, number>>;

export interface MasonryItem<T = unknown> {
  /** Unique key of the item; also reported in `onLayoutChange`. */
  key: string | number;
  /** Your own stored data, passed to `itemRender`. */
  data?: T;
  /** Content height (pixels), used to estimate positions before the first layout; afterwards the measured value is used. */
  height?: number;
  /** Pinned to a column index (0-based); if not given it goes into the shortest column at that moment. */
  column?: number;
  /** Content of the item; takes precedence over `itemRender`. */
  children?: ReactNode;
}

export interface MasonryProps<T = unknown> {
  /** Data-driven items; can be omitted, and you write each item directly as children. */
  items?: MasonryItem<T>[];
  /** Render one item: when data-driven, use it to draw `item.data`. */
  itemRender?: (item: MasonryItem<T>) => ReactNode;
  /** The items, written directly (when `items` isn't given). */
  children?: ReactNode;
  /**
   * Number of columns; can be given per breakpoint.
   * @default 3
   */
  columns?: MasonryResponsive;
  /**
   * Gap between items (pixels, any value outside the theme style's scale): one number covers both horizontal and vertical, `[horizontal, vertical]` sets them separately; can be given per breakpoint.
   * @default 0
   */
  gutter?: MasonryResponsive | [MasonryResponsive, MasonryResponsive];
  /** After each layout, which column each item landed in. */
  onLayoutChange?: (layout: { key: string | number; column: number }[]) => void;
  /** Name of the whole list, used by screen readers. */
  "aria-label"?: string;
}

/** The value for the largest breakpoint the viewport width has reached; when no breakpoint in the object matches, take the smallest one. */
export function resolveResponsive(
  value: MasonryResponsive | undefined,
  width: number,
  fallback: number,
) {
  if (value === undefined) return fallback;
  if (typeof value === "number") return value;
  for (let i = BREAKPOINT_NAMES.length - 1; i >= 0; i--) {
    const name = BREAKPOINT_NAMES[i]!;
    if (width >= BREAKPOINTS[name] && value[name] !== undefined) return value[name]!;
  }
  const first = BREAKPOINT_NAMES.find((name) => value[name] !== undefined);
  return first ? value[first]! : fallback;
}

/** Greedy layout: each item goes into the shortest column at that moment (ties take the leftmost), and pinned ones go into their specified column. */
export function layoutMasonry(
  heights: number[],
  columns: number,
  gapY: number,
  fixed: (number | undefined)[] = [],
) {
  const colHeights = Array.from({ length: columns }, () => 0);
  const placed = heights.map((height, i) => {
    const want = fixed[i];
    const col =
      want !== undefined
        ? Math.min(Math.max(Math.floor(want), 0), columns - 1)
        : colHeights.indexOf(Math.min(...colHeights));
    const y = colHeights[col]!;
    colHeights[col] = y + height + gapY;
    return { column: col, y };
  });
  const tallest = Math.max(0, ...colHeights);
  return { placed, height: placed.length ? Math.max(tallest - gapY, 0) : 0 };
}

function useViewportWidth() {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 0 : window.innerWidth));
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

/**
 * Multi-column layout where each item goes into the shortest column, so content of uneven height (images, cards) packs tightly.
 * Pass `items` (`{ key, data, height?, column? }`) with `itemRender`, or write the items as children; `columns` and `gutter` take a number or per-breakpoint values.
 * It re-lays out when the width changes or an item's height changes (e.g. an image finished loading); DOM order is the item order, so keyboard and screen readers follow it.
 * For equal-height rows use the Row / Col grid.
 *
 * Theme style: positions are written as CSS variables (`--ms-col` / `--ms-y`) from numbers the component measured; horizontal position and width are computed by CSS from the column count,
 * so when the window gets wider or narrower the column width follows immediately and heights are laid out again; height changes of items (images finished loading) also trigger a re-layout.
 * Content is hidden before layout, so server rendering does not flash a pile of overlapping items. DOM order is the item order, and keyboard and screen readers follow it.
 */
export function Masonry<T = unknown>({
  items,
  itemRender,
  children,
  columns = 3,
  gutter = 0,
  onLayoutChange,
  "aria-label": ariaLabel,
}: MasonryProps<T>) {
  const rootRef = useRef<HTMLUListElement>(null);
  const [ready, setReady] = useState(false);
  const width = useViewportWidth();
  const lastLayout = useRef("");
  const callback = useRef(onLayoutChange);
  callback.current = onLayoutChange;

  const entries: { key: string | number; node: ReactNode; height?: number; column?: number }[] =
    items
      ? items.map((item) => ({
          key: item.key,
          node: item.children ?? itemRender?.(item) ?? null,
          height: item.height,
          column: item.column,
        }))
      : Children.toArray(children).map((child, i) => ({
          // Children.toArray prefixes keys with something like ".$"; strip it, so the key given in callbacks is the one you wrote
          key: isValidElement(child) && child.key !== null ? child.key.replace(/^\.\$?/, "") : i,
          node: child,
        }));

  const cols = Math.max(1, Math.floor(resolveResponsive(columns, width, 3)));
  const [gutterX, gutterY] = Array.isArray(gutter) ? gutter : [gutter, gutter];
  const gx = resolveResponsive(gutterX, width, 0);
  const gy = resolveResponsive(gutterY, width, 0);
  const signature = entries.map((e) => `${e.key}:${e.column ?? ""}:${e.height ?? ""}`).join("|");

  const compute = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>(':scope > [data-slot="masonry-item"]')];
    // Write the column count and gap first: item widths are computed from them, and heights must be measured at that width
    root.style.setProperty("--ms-cols", String(cols));
    root.style.setProperty("--ms-gx", `${gx}px`);
    root.style.setProperty("--ms-gy", `${gy}px`);
    const heights = nodes.map((el, i) => el.offsetHeight || entries[i]?.height || 0);
    const { placed, height } = layoutMasonry(
      heights,
      cols,
      gy,
      entries.map((e) => e.column),
    );
    nodes.forEach((el, i) => {
      el.style.setProperty("--ms-col", String(placed[i]!.column));
      el.style.setProperty("--ms-y", `${placed[i]!.y}px`);
    });
    root.style.setProperty("--ms-height", `${height}px`);
    const summary = placed.map((p, i) => `${entries[i]?.key}:${p.column}`).join("|");
    if (summary !== lastLayout.current) {
      lastLayout.current = summary;
      callback.current?.(placed.map((p, i) => ({ key: entries[i]!.key, column: p.column })));
    }
  }, [cols, gx, gy, signature]);

  // Items or column count changed: lay out before painting
  useLayoutEffect(() => {
    compute();
    setReady(true);
  }, [compute]);

  // Re-layout when the container width changes (column width changed) or an item grows / shrinks by itself (image finished loading)
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(compute);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    root
      .querySelectorAll(':scope > [data-slot="masonry-item"]')
      .forEach((el) => observer.observe(el));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [compute]);

  return (
    <ul
      ref={rootRef}
      data-slot="masonry"
      data-ready={ready ? "" : undefined}
      aria-label={ariaLabel}
    >
      {entries.map(({ key, node }) => (
        <li key={key} data-slot="masonry-item">
          {node}
        </li>
      ))}
    </ul>
  );
}
