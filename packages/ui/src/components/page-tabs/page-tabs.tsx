import { useId, useLayoutEffect, useRef, useState } from "react";
import type {
  ComponentPropsWithoutRef,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { UISize } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { ContextMenu } from "../context-menu/index.ts";
import { closeTabs, isClosable, keysToClose, moveTab, pinTab } from "./model.ts";
import type { CloseScope, PageTab } from "./model.ts";

type Without<T> = Omit<T, "className" | "style" | "children" | "onSelect">;

export type PageTabsVariant = "card" | "chrome" | "line";

export interface PageTabsLabels {
  /** Name of the tab bar. */
  tabs: string;
  /** Name of the close button on each tab. */
  close: (title: string) => string;
  /** Context menu. */
  closeTab: string;
  closeOthers: string;
  closeLeft: string;
  closeRight: string;
  closeAll: string;
  pin: string;
  unpin: string;
  refresh: string;
  /** Scroll buttons at both ends when there are too many tabs. */
  scrollStart: string;
  scrollEnd: string;
  /** Announcement after keyboard / menu actions. */
  closed: (title: string) => string;
  closedMany: (count: number) => string;
  moved: (title: string, position: number, total: number) => string;
  pinned: (title: string) => string;
  unpinned: (title: string) => string;
  /** Keyboard hint (screen readers read it on the tab). */
  hint: string;
}

export interface PageTabsProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** The open tabs, in display order. Owned by the caller: update it in `onTabsChange` after closing / pinning / drag-reordering. */
  tabs: readonly PageTab[];
  /** Key of the current tab. */
  activeKey: string;
  /** A tab was clicked; it is also called when closing the current tab switches to a neighboring one. */
  onActiveKeyChange: (key: string) => void;
  /**
   * Gives the whole new array after tabs are added / removed, reordered or pinned. Only when passed can tabs be closed, drag-reordered and pinned; otherwise it is just a row of switchable tabs.
   * When the current tab is closed, it is called first, then `onActiveKeyChange` gives the new current item.
   */
  onTabsChange?: (tabs: readonly PageTab[]) => void;
  /** When given, the context menu has "Refresh" (e.g. together with `KeepAlive`'s `versions` to remount this page). */
  onRefresh?: (key: string) => void;
  /**
   * The context menu has "Pin / Unpin". `onTabsChange` must also be passed.
   * @default false
   */
  pinnable?: boolean;
  /**
   * Look: card is a small bordered card, chrome is browser-tab style (the selected one joins the content below), line is an underline.
   * @default "card"
   */
  variant?: PageTabsVariant;
  /**
   * Tab height: 28 / 36 / 44px.
   * @default "md"
   */
  size?: UISize;
  /** Whether tabs can be dragged to reorder, by default yes when `onTabsChange` is passed. */
  draggable?: boolean;
  labels?: Partial<PageTabsLabels>;
}

/** The horizontal distance the element is currently being animated through (0 when there is no animation). */
function animatedX(el: HTMLElement) {
  if (typeof el.getAnimations !== "function" || el.getAnimations().length === 0) return 0;
  const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(el).transform);
  return m ? Number(m[1].split(",")[4]) || 0 : 0;
}

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const ChevronIcon = ({ back }: { back?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={back ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
  </svg>
);

/**
 * Page tab bar (like browser tabs, the common "opened pages" in admin consoles): switch, close, pin, drag-reorder, context menu
 * (close others / left / right / all, pin, refresh), and scroll buttons at both ends when there are too many.
 * It knows nothing about routing: tabs are data (`tabs` + `activeKey`), clicks and closes are handed back through callbacks, and you navigate yourself in the callback.
 * Together with `KeepAlive` the state of pages before closing can be kept around.
 *
 * Keyboard: arrow keys move focus between tabs, Home / End go to the ends, Enter / Space switch, `Delete` closes, `Alt + Left/Right` reorders;
 * each action is announced with `role="status"`. Middle-click on a tab also closes it.
 */
export function PageTabs({
  tabs,
  activeKey,
  onActiveKeyChange,
  onTabsChange,
  onRefresh,
  pinnable = false,
  variant = "card",
  size = "md",
  draggable: draggableProp,
  labels: labelsProp,
  // aria-label / aria-labelledby are for the tablist: the outer div has no role and must not carry these two attributes (axe: aria-prohibited-attr)
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...rest
}: PageTabsProps) {
  const labels = useLabels("pageTabs", labelsProp);
  const uid = useId();
  const hintId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<{ key: string; index: number } | null>(null);
  const [overflow, setOverflow] = useState({ start: false, end: false });
  const lefts = useRef(new Map<string, number>());
  const settle = useRef<{ key: string; left: number } | null>(null);
  const suppressClick = useRef(false);
  const pendingFocus = useRef<string | null>(null);
  const dragKey = useRef<string | null>(null);
  /** While dragging: which tab is grabbed, where on the tab the pointer grabbed it, and the pointer's current x coordinate. */
  const drag = useRef<{ key: string; grab: number; pointer: number } | null>(null);
  const editable = onTabsChange !== undefined;
  const canDrag = draggableProp ?? editable;
  const shown = preview ? moveTab(tabs, preview.key, preview.index) : tabs;

  const itemOf = (key: string) =>
    [
      ...(listRef.current?.querySelectorAll<HTMLElement>('[data-slot="page-tabs-item"]') ?? []),
    ].find((el) => el.dataset.key === key);

  /** Close a batch of tabs: hand back a new array, and if the current item was closed switch to a neighboring one (if the clicked tab is still there, switch to it). */
  const closeKeys = (keys: readonly string[], scope: CloseScope, clicked: string) => {
    if (!onTabsChange) return;
    const result = closeTabs(tabs, keys, activeKey);
    if (result.tabs === tabs) return;
    let next = result.activeKey;
    if (scope !== "self" && scope !== "all" && !result.tabs.some((t) => t.key === activeKey))
      next = clicked;
    onTabsChange(result.tabs);
    if (next !== activeKey) onActiveKeyChange(next);
    const removed = tabs.filter((t) => keys.includes(t.key));
    setStatus(
      removed.length === 1 ? labels.closed(removed[0].title) : labels.closedMany(removed.length),
    );
  };

  const reorder = (tab: PageTab, index: number) => {
    if (!onTabsChange) return;
    const next = moveTab(tabs, tab.key, index);
    if (next === tabs) return;
    onTabsChange(next);
    setStatus(labels.moved(tab.title, next.findIndex((t) => t.key === tab.key) + 1, next.length));
  };

  const togglePin = (tab: PageTab) => {
    if (!onTabsChange) return;
    const next = pinTab(tabs, tab.key, !tab.pinned);
    onTabsChange(next);
    setStatus(tab.pinned ? labels.unpinned(tab.title) : labels.pinned(tab.title));
  };

  // Scroll buttons: appear when content is wider than the container, and each end disappears when scrolled to that end
  const measureOverflow = () => {
    const el = listRef.current;
    if (!el) return;
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setOverflow((o) => (o.start === start && o.end === end ? o : { start, end }));
  };
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    measureOverflow();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measureOverflow);
    ro.observe(el);
    return () => ro.disconnect();
  });

  // Scroll the current tab into view. Only adjust the list's own scrollLeft: scrollIntoView also scrolls the whole page (when a page has several tab bars,
  // mounting would scroll the page down to the bottom-most one)
  useLayoutEffect(() => {
    const list = listRef.current;
    const el = itemOf(activeKey);
    if (!list || !el) return;
    const start = el.offsetLeft;
    const end = start + el.offsetWidth;
    if (start < list.scrollLeft) list.scrollLeft = start;
    else if (end > list.scrollLeft + list.clientWidth) list.scrollLeft = end - list.clientWidth;
  }, [activeKey]);

  // After a keyboard move, give focus back to this tab (browsers drop focus when the node is moved)
  useLayoutEffect(() => {
    const key = pendingFocus.current;
    if (key === null) return;
    pendingFocus.current = null;
    itemOf(key)?.querySelector<HTMLElement>('[role="tab"]')?.focus();
  }, [tabs]);

  // A tab changed position: slide smoothly from the old position to the new one (FLIP). The position used is the layout position (offsetLeft, excluding animation), and when interrupted it continues from the currently visible position
  useLayoutEffect(() => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    for (const el of listRef.current?.querySelectorAll<HTMLElement>(
      '[data-slot="page-tabs-item"]',
    ) ?? []) {
      const key = el.dataset.key!;
      const left = el.offsetLeft;
      next.set(key, left);
      if (reduced || typeof el.animate !== "function" || key === dragKey.current) continue;
      let from: number | undefined;
      if (settle.current?.key === key) {
        // The tab just released: settles into the new position from where it was seen at release
        from = settle.current.left - el.getBoundingClientRect().left;
        settle.current = null;
      } else {
        const before = lefts.current.get(key);
        if (before !== undefined && Math.abs(before - left) >= 1)
          from = before - left + animatedX(el);
      }
      if (from === undefined || Math.abs(from) < 1) continue;
      for (const a of el.getAnimations()) a.cancel();
      el.animate([{ transform: `translateX(${from}px)` }, { transform: "translateX(0)" }], {
        duration: 200,
        easing: "cubic-bezier(0.2, 0, 0, 1)",
      });
    }
    lefts.current = next;
  });

  /** Place the dragged tab under the pointer (position is written as CSS variables, not through rendering). */
  const placeDrag = () => {
    const d = drag.current;
    const list = listRef.current;
    if (!d || !list) return;
    const el = itemOf(d.key);
    if (!el) return;
    const x = d.pointer - list.getBoundingClientRect().left + list.scrollLeft;
    el.style.setProperty("--drag-x", `${x - d.grab - el.offsetLeft}px`);
  };

  const begin = (down: ReactPointerEvent<HTMLElement>, tab: PageTab) => {
    if (!canDrag || !editable) return;
    if (down.pointerType === "mouse" && down.button !== 0) return;
    const list = listRef.current;
    const item = itemOf(tab.key);
    if (!list || !item) return;
    // Where on the tab the pointer grabbed it; keep this relative position while dragging
    const grab = down.clientX - item.getBoundingClientRect().left;
    let started = false;
    let pointer = down.clientX;
    let last = -1;

    const retarget = () => {
      const x = pointer - list.getBoundingClientRect().left + list.scrollLeft;
      const index = [...list.querySelectorAll<HTMLElement>('[data-slot="page-tabs-item"]')]
        .filter((el) => el.dataset.key !== tab.key)
        .filter((el) => el.offsetLeft + el.offsetWidth / 2 < x).length;
      if (index === last) return;
      last = index;
      setPreview({ key: tab.key, index });
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key);
      itemOf(tab.key)?.style.removeProperty("--drag-x");
      dragKey.current = null;
      drag.current = null;
      setPreview(null);
    };
    const move = (e: PointerEvent) => {
      pointer = e.clientX;
      if (!started) {
        if (Math.abs(e.clientX - down.clientX) < 4) return;
        started = true;
        dragKey.current = tab.key;
        drag.current = { key: tab.key, grab, pointer };
        setPreview({ key: tab.key, index: tabs.findIndex((t) => t.key === tab.key) });
      }
      if (drag.current) drag.current.pointer = pointer;
      placeDrag();
      retarget();
    };
    const up = () => {
      if (!started) return stop();
      const el = itemOf(tab.key);
      if (el) settle.current = { key: tab.key, left: el.getBoundingClientRect().left };
      const at = last;
      stop();
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      if (at >= 0) reorder(tab, at);
    };
    const cancel = () => stop();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key);
  };

  // A tab changed position during dragging (other tabs made way): place the dragged one under the pointer again
  useLayoutEffect(() => {
    if (preview) placeDrag();
  });

  const keyDown = (e: ReactKeyboardEvent<HTMLElement>, tab: PageTab, index: number) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const before = rtl ? "ArrowRight" : "ArrowLeft";
    const after = rtl ? "ArrowLeft" : "ArrowRight";
    const focusAt = (i: number) => {
      const target = shown[Math.min(Math.max(i, 0), shown.length - 1)];
      itemOf(target.key)?.querySelector<HTMLElement>('[role="tab"]')?.focus();
    };
    if (e.altKey && (e.key === before || e.key === after)) {
      if (!canDrag || !editable) return;
      e.preventDefault();
      pendingFocus.current = tab.key;
      reorder(tab, e.key === before ? index - 1 : index + 1);
      return;
    }
    if (e.key === before) focusAndStop(e, () => focusAt(index - 1));
    else if (e.key === after) focusAndStop(e, () => focusAt(index + 1));
    else if (e.key === "Home") focusAndStop(e, () => focusAt(0));
    else if (e.key === "End") focusAndStop(e, () => focusAt(shown.length - 1));
    else if (e.key === "Delete" && editable && isClosable(tab)) {
      e.preventDefault();
      // After closing, focus goes to a neighboring tab
      const neighbour = shown[index + 1] ?? shown[index - 1];
      if (neighbour) pendingFocus.current = neighbour.key;
      closeKeys([tab.key], "self", tab.key);
    }
  };
  const focusAndStop = (e: ReactKeyboardEvent<HTMLElement>, fn: () => void) => {
    e.preventDefault();
    fn();
  };

  const scrollBy = (dir: -1 | 1) => {
    const el = listRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" });
  };

  const focusable = shown.some((t) => t.key === activeKey) ? activeKey : shown[0]?.key;

  return (
    <div
      {...rest}
      data-slot="page-tabs"
      data-variant={variant}
      data-size={size}
      data-dragging={preview ? "" : undefined}
    >
      {overflow.start ? (
        <button
          type="button"
          data-slot="page-tabs-scroll"
          data-direction="start"
          tabIndex={-1}
          aria-label={labels.scrollStart}
          onClick={() => scrollBy(-1)}
        >
          <ChevronIcon back />
        </button>
      ) : null}
      <div
        ref={listRef}
        data-slot="page-tabs-list"
        role="tablist"
        aria-label={ariaLabelledby ? undefined : (ariaLabel ?? labels.tabs)}
        aria-labelledby={ariaLabelledby}
        onScroll={measureOverflow}
      >
        {shown.map((tab, index) => {
          const active = tab.key === activeKey;
          const closable = editable && isClosable(tab);
          const count = (scope: CloseScope) => keysToClose(shown, scope, tab.key).length;
          return (
            <ContextMenu key={tab.key}>
              <ContextMenu.Trigger render={<div />}>
                {/* The trigger is a shell for the context menu only, out of the layout; the tab itself is inside */}
                <div
                  data-slot="page-tabs-item"
                  data-key={tab.key}
                  data-active={active ? "" : undefined}
                  data-pinned={tab.pinned ? "" : undefined}
                  data-dragging={preview?.key === tab.key ? "" : undefined}
                >
                  <button
                    type="button"
                    role="tab"
                    id={`${uid}-${tab.key}`}
                    data-slot="page-tabs-tab"
                    aria-selected={active}
                    aria-describedby={editable ? hintId : undefined}
                    tabIndex={tab.key === focusable ? 0 : -1}
                    title={tab.title}
                    onClick={() => (suppressClick.current ? undefined : onActiveKeyChange(tab.key))}
                    onKeyDown={(e) => keyDown(e, tab, index)}
                    onPointerDown={(e) => begin(e, tab)}
                    // Middle button: close (block the browser's autoscroll on press)
                    onMouseDown={(e) => e.button === 1 && e.preventDefault()}
                    onAuxClick={(e) => {
                      if (e.button === 1 && closable) {
                        e.preventDefault();
                        closeKeys([tab.key], "self", tab.key);
                      }
                    }}
                  >
                    {tab.icon ? <span data-slot="page-tabs-icon">{tab.icon}</span> : null}
                    <span data-slot="page-tabs-title">{tab.title}</span>
                  </button>
                  {closable ? (
                    // Outside the tab (not inside it): the tab itself is a button, and a button cannot be nested inside
                    <button
                      type="button"
                      data-slot="page-tabs-close"
                      tabIndex={-1}
                      aria-label={labels.close(tab.title)}
                      onClick={() => closeKeys([tab.key], "self", tab.key)}
                    >
                      <CloseIcon />
                    </button>
                  ) : null}
                </div>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                {onRefresh ? (
                  <ContextMenu.Item onClick={() => onRefresh(tab.key)}>
                    {labels.refresh}
                  </ContextMenu.Item>
                ) : null}
                {pinnable && editable ? (
                  <ContextMenu.Item onClick={() => togglePin(tab)}>
                    {tab.pinned ? labels.unpin : labels.pin}
                  </ContextMenu.Item>
                ) : null}
                {(onRefresh || (pinnable && editable)) && editable ? (
                  <ContextMenu.Separator />
                ) : null}
                {editable ? (
                  <>
                    <ContextMenu.Item
                      disabled={count("self") === 0}
                      onClick={() =>
                        closeKeys(keysToClose(shown, "self", tab.key), "self", tab.key)
                      }
                    >
                      {labels.closeTab}
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      disabled={count("others") === 0}
                      onClick={() =>
                        closeKeys(keysToClose(shown, "others", tab.key), "others", tab.key)
                      }
                    >
                      {labels.closeOthers}
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      disabled={count("left") === 0}
                      onClick={() =>
                        closeKeys(keysToClose(shown, "left", tab.key), "left", tab.key)
                      }
                    >
                      {labels.closeLeft}
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      disabled={count("right") === 0}
                      onClick={() =>
                        closeKeys(keysToClose(shown, "right", tab.key), "right", tab.key)
                      }
                    >
                      {labels.closeRight}
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      disabled={count("all") === 0}
                      onClick={() => closeKeys(keysToClose(shown, "all", tab.key), "all", tab.key)}
                    >
                      {labels.closeAll}
                    </ContextMenu.Item>
                  </>
                ) : null}
              </ContextMenu.Content>
            </ContextMenu>
          );
        })}
      </div>
      {overflow.end ? (
        <button
          type="button"
          data-slot="page-tabs-scroll"
          data-direction="end"
          tabIndex={-1}
          aria-label={labels.scrollEnd}
          onClick={() => scrollBy(1)}
        >
          <ChevronIcon />
        </button>
      ) : null}
      {editable ? (
        <>
          <span id={hintId} hidden>
            {labels.hint}
          </span>
          <span data-slot="page-tabs-status" role="status" aria-live="polite">
            {status}
          </span>
        </>
      ) : null}
    </div>
  );
}
