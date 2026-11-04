import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode, RefObject } from "react";

export interface AnchorItem {
  /** Link pointing to an element id on the page, e.g. "#usage". */
  href: string;
  /** Link text. */
  title: ReactNode;
  /** Child links, shown indented, and they take part in scroll highlighting too. */
  children?: AnchorItem[];
}

/** The element the page scrolls in: an element, a ref, or a function returning an element; the whole window if not given. */
export type AnchorContainer =
  | HTMLElement
  | RefObject<HTMLElement | null>
  | (() => HTMLElement | null);

export interface AnchorProps {
  /** The links (`AnchorItem`: `href` to an element id, `title`, optional nested `children`). */
  items: readonly AnchorItem[];
  /**
   * vertical is a table of contents with a vertical line on the left, horizontal is a row of links with a horizontal line below.
   * @default "vertical"
   */
  direction?: "vertical" | "horizontal";
  /** Scroll container of the page: an element, a ref, or a function returning one. Defaults to the window. */
  container?: AnchorContainer;
  /**
   * How many pixels from the container top the target counts as "arrived"; the same distance is left when jumping on click (e.g. the page has a fixed top bar).
   * @default 0
   */
  offset?: number;
  /**
   * A target counts as current when its top is within this many pixels below offset.
   * @default 5
   */
  bounds?: number;
  /** The currently highlighted link (href), controlled; when not passed it is computed automatically from scrolling. */
  value?: string;
  defaultValue?: string;
  /** The highlighted link changed (by scrolling or clicking). */
  onValueChange?: (href: string) => void;
  /**
   * Smooth scrolling when jumping on click (automatically off when the user has set "reduce motion").
   * @default true
   */
  smooth?: boolean;
  /**
   * After a click, change the URL hash to this link (replaceState, no history entry).
   * @default false
   */
  updateHash?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

function resolveContainer(container: AnchorContainer | undefined): HTMLElement | null {
  if (!container) return null;
  if (typeof container === "function") return container();
  if (container instanceof HTMLElement) return container;
  return container.current;
}

const targetOf = (href: string) => {
  if (!href.startsWith("#") || href.length < 2) return null;
  return document.getElementById(decodeURIComponent(href.slice(1)));
};

const flatten = (items: readonly AnchorItem[]): AnchorItem[] =>
  items.flatMap((item) => [item, ...flatten(item.children ?? [])]);

/**
 * In-page table of contents: clicking a link scrolls to its section, and the section in view is highlighted while scrolling.
 * Pass `items` (`href: "#id"`, `title`, nested `children`); `direction` lays it out vertically or as a horizontal row,
 * `container` sets the scroll container, `offset` accounts for a fixed top bar, and `value` / `onValueChange` control the highlighted link (computed from scrolling when not passed).
 * For page-to-page navigation use Breadcrumb, Tabs or Link.
 *
 * Theme style: below the current item an indicator line moves with it; its position is a dynamic value and the component writes no style:
 * a ref sets the current link's position relative to the root as --anchor-x / --anchor-y / --anchor-w / --anchor-h (pixels, no unit),
 * which the theme style uses for positioning and the sliding animation.
 */
export function Anchor({
  items,
  direction = "vertical",
  container,
  offset = 0,
  bounds = 5,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  smooth = true,
  updateHash = false,
  ...aria
}: AnchorProps) {
  const [inner, setInner] = useState(defaultValue);
  const active = valueProp !== undefined ? valueProp : inner;
  const rootRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const locked = useRef(false);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flat = flatten(items);
  const hrefs = flat.map((i) => i.href).join("\n");

  const activate = useCallback(
    (href: string) => {
      if (valueProp === undefined) setInner(href);
      if (href !== active) onValueChange?.(href);
    },
    [valueProp, active, onValueChange],
  );

  // Scroll highlight: among targets whose top has passed offset + bounds, take the one closest to the top; when scrolled to the bottom take the last one
  const compute = useCallback(() => {
    if (locked.current) return;
    const scroller = resolveContainer(container);
    const base = scroller ? scroller.getBoundingClientRect().top : 0;
    let best: { href: string; top: number } | null = null;
    let last: string | null = null;
    for (const item of flat) {
      const el = targetOf(item.href);
      if (!el) continue;
      last = item.href;
      const top = el.getBoundingClientRect().top - base;
      if (top <= offset + bounds && (!best || top > best.top)) best = { href: item.href, top };
    }
    const doc = document.documentElement;
    const atBottom = scroller
      ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1 &&
        scroller.scrollHeight > scroller.clientHeight
      : window.scrollY + window.innerHeight >= doc.scrollHeight - 1 &&
        doc.scrollHeight > window.innerHeight;
    const next = atBottom && last ? last : (best?.href ?? "");
    if (next && next !== active) activate(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hrefs, container, offset, bounds, active, activate]);

  useEffect(() => {
    const scroller = resolveContainer(container);
    const target: HTMLElement | Window = scroller ?? window;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    compute();
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [compute, container]);

  useEffect(() => () => clearTimeout(unlockTimer.current), []);

  // The indicator line follows the current link; re-measure when the root size changes (font change, window resize)
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const place = () => {
      const link = root.querySelector<HTMLElement>('[data-slot="anchor-link"][data-active]');
      if (!link) return;
      const a = link.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      root.style.setProperty("--anchor-x", String(a.left - r.left));
      root.style.setProperty("--anchor-y", String(a.top - r.top));
      root.style.setProperty("--anchor-w", String(a.width));
      root.style.setProperty("--anchor-h", String(a.height));
    };
    place();
    const raf = requestAnimationFrame(() => setReady(true));
    if (typeof ResizeObserver === "undefined") return () => cancelAnimationFrame(raf);
    const observer = new ResizeObserver(place);
    observer.observe(root);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [active, hrefs, direction]);

  const go = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const el = targetOf(href);
    if (!el) return; // no target: behave as a plain link
    event.preventDefault();
    const scroller = resolveContainer(container);
    const base = scroller ? scroller.getBoundingClientRect().top : 0;
    const delta = el.getBoundingClientRect().top - base - offset;
    const behavior: ScrollBehavior =
      smooth && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "smooth"
        : "auto";
    // During smooth scrolling other sections are passed; meanwhile the scroll highlight is not allowed to overwrite the item just clicked
    locked.current = true;
    const unlock = () => {
      clearTimeout(unlockTimer.current);
      locked.current = false;
    };
    clearTimeout(unlockTimer.current);
    unlockTimer.current = setTimeout(unlock, behavior === "smooth" ? 1000 : 50);
    (scroller ?? window).addEventListener("scrollend", unlock, { once: true });
    (scroller ?? window).scrollBy({ top: delta, behavior });
    activate(href);
    if (updateHash) history.replaceState(null, "", href);
  };

  const renderList = (list: readonly AnchorItem[], level: number): ReactNode => (
    <ul data-slot="anchor-list" data-level={level}>
      {list.map((item) => (
        <li key={item.href} data-slot="anchor-item">
          <a
            href={item.href}
            data-slot="anchor-link"
            data-active={item.href === active ? "" : undefined}
            aria-current={item.href === active ? "location" : undefined}
            onClick={(event) => go(event, item.href)}
          >
            {item.title}
          </a>
          {item.children?.length ? renderList(item.children, level + 1) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <nav
      ref={rootRef}
      {...aria}
      data-slot="anchor"
      data-direction={direction}
      data-empty={flat.some((i) => i.href === active) ? undefined : ""}
      data-ready={ready ? "" : undefined}
    >
      <span data-slot="anchor-ink" aria-hidden="true" />
      {renderList(items, 1)}
    </nav>
  );
}
