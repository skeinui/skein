import { Activity, useLayoutEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Without<T> = Omit<T, "className" | "style" | "children">;

export type KeepAliveTransition = "none" | "fade" | "slide-up" | "slide-right" | "zoom";

export interface KeepAliveProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Which item is currently shown (e.g. the current route path, the current tab key). */
  activeKey: string;
  /**
   * Keys of the items to keep (e.g. the currently open tabs). Items not in it are dropped and their state is cleared: close a tab and its page is gone.
   * If not given, all visited items are kept (limited by `max`). The current item is unaffected by it and is always shown.
   */
  keepKeys?: readonly string[];
  /** Maximum number of items kept at once; when exceeded, the least recently viewed is dropped. Unlimited by default. */
  max?: number;
  /** To make an item start over (refresh): increment its number by 1 and it will be remounted. */
  versions?: Readonly<Record<string, number>>;
  /**
   * Enter animation when switching to an item; the style is decided by the theme style; none under "reduced motion".
   * @default "none"
   */
  transition?: KeepAliveTransition;
  /** Content of the current item. After switching away, the item keeps **the last content it received** and is no longer updated. */
  children?: ReactNode;
}

/**
 * Keep-alive: keeps visited pages in memory (hidden rather than unmounted), so state, typed content and scroll position are still there when you switch back.
 * Unrelated to routing: you tell it which item is current (`activeKey`) and that item's content (`children`), and it keeps and hides them.
 * Hiding uses React's `Activity`: state is preserved, but effects (subscriptions, timers) are paused and resumed on return.
 *
 * Each item lives in its own pane (`overflow: auto`) that scrolls itself: browsers discard the scroll position of hidden elements, and here it is restored when shown again.
 * Deeper scroll containers inside the page are not handled; the page must handle them itself if they need to be kept.
 */
export function KeepAlive({
  activeKey,
  keepKeys,
  max,
  versions,
  transition = "none",
  children,
  ...rest
}: KeepAliveProps) {
  // The last content each item received. Ordered by first appearance: switching does not reorder the DOM (reordering makes panes lose their scroll position)
  const nodes = useRef(new Map<string, ReactNode>());
  /** Most recently viewed go at the end; when over max, drop from the front (least recently viewed). */
  const recent = useRef<string[]>([]);
  const scrolls = useRef(new Map<string, { top: number; left: number }>());
  const rootRef = useRef<HTMLDivElement>(null);

  nodes.current.set(activeKey, children);
  recent.current = [...recent.current.filter((k) => k !== activeKey), activeKey];
  const keep = keepKeys ? new Set(keepKeys) : null;
  for (const key of nodes.current.keys()) {
    if (key !== activeKey && keep && !keep.has(key)) drop(key);
  }
  if (max !== undefined) {
    while (nodes.current.size > Math.max(max, 1)) {
      const oldest = recent.current.find((k) => k !== activeKey);
      if (oldest === undefined) break;
      drop(oldest);
    }
  }
  function drop(key: string) {
    nodes.current.delete(key);
    scrolls.current.delete(key);
    recent.current = recent.current.filter((k) => k !== key);
  }

  // This item is shown again: put its scroll position back
  useLayoutEffect(() => {
    const pane = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="keep-alive-pane"]') ?? []),
    ].find((el) => el.dataset.key === activeKey);
    const saved = scrolls.current.get(activeKey);
    if (pane && saved) {
      pane.scrollTop = saved.top;
      pane.scrollLeft = saved.left;
    }
  }, [activeKey]);

  return (
    <div {...rest} ref={rootRef} data-slot="keep-alive" data-transition={transition}>
      {[...nodes.current].map(([key, node]) => {
        const active = key === activeKey;
        return (
          <Activity
            key={`${key}\u0000${versions?.[key] ?? 0}`}
            mode={active ? "visible" : "hidden"}
          >
            <div
              data-slot="keep-alive-pane"
              data-key={key}
              data-active={active ? "" : undefined}
              onScroll={(e) =>
                scrolls.current.set(key, {
                  top: e.currentTarget.scrollTop,
                  left: e.currentTarget.scrollLeft,
                })
              }
            >
              {node}
            </div>
          </Activity>
        );
      })}
    </div>
  );
}
