import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import type { OverlaySide } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { Popover } from "../popover/index.ts";
import { en } from "../../locales/en.ts";
import { useConfig } from "../config-provider/context.ts";

/** Element the step points to: a selector, the element itself, a ref, or a function returning an element (use a function / selector for elements that only exist after rendering). */
export type TourTarget =
  | string
  | HTMLElement
  | RefObject<HTMLElement | null>
  | (() => HTMLElement | null);

export interface TourStep {
  /** If omitted, it is a centered card with no highlight (good for an intro). */
  target?: TourTarget | null;
  /** Heading of the step's card. */
  title?: ReactNode;
  /** Body text of the step's card, explaining the highlighted element. */
  description?: ReactNode;
  /** Image or any node above the title. */
  cover?: ReactNode;
  /** Which side of the target the card appears on, default bottom; flips to the other side automatically if it does not fit. */
  side?: OverlaySide;
}

export interface TourLabels {
  prev: string;
  next: string;
  finish: string;
  close: string;
}

export interface TourProps {
  /**
   * The steps in order: `{ target, title, description, cover, side }`. `target` is a selector, an element, a ref or a
   * function returning the element; without one the step is a centered card.
   */
  steps: readonly TourStep[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Current step (starting from 0), controlled. */
  current?: number;
  /**
   * Initial `current` when uncontrolled.
   * @default 0
   */
  defaultCurrent?: number;
  onCurrentChange?: (current: number) => void;
  /** Called when the finish button on the last step is clicked (it closes afterwards). */
  onFinish?: () => void;
  /**
   * Mask with a cut-out highlight at the target; turn it off to leave only the card.
   * @default true
   */
  mask?: boolean;
  /**
   * Step progress: dots for dots, count for text “2 / 5”, false for none.
   * @default "dots"
   */
  indicators?: "dots" | "count" | false;
  /**
   * Close button in the top right; Esc also closes.
   * @default true
   */
  closable?: boolean;
  /** Button text (`prev`, `next`, `finish`, `close`), for switching languages. */
  labels?: Partial<TourLabels>;
}

function resolveTarget(target: TourTarget | null | undefined): HTMLElement | null {
  if (!target) return null;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  if (typeof target === "function") return target();
  if (target instanceof HTMLElement) return target;
  return target.current;
}

const DEFAULT_OFFSET = 14;

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);

/**
 * Guided tour: highlights one element on the page at a time, with a description card beside it and next / previous / finish.
 * `steps` lists `{ target, title, description, cover, side }` (a step without `target` is a centered intro card); `open` / `onOpenChange` show it,
 * `current` / `onCurrentChange` track the step, and `onFinish` fires on the last step's finish button. `mask`, `indicators` and `closable` tune the chrome; Esc closes.
 * The card flips to the other side automatically if it does not fit.
 * For a single hint next to an element use Popover or Tooltip.
 *
 * Theme style: the card is a Popover anchored to the target element, and the mask's cut-out is a
 * highlight box that follows the target, darkening the surroundings with a huge box-shadow. Position and size are dynamic values, so the component writes no style:
 * a ref sets the target's rectangle as --tour-x / --tour-y / --tour-w / --tour-h on the root (pixels, without units).
 */
export function Tour({
  steps,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  current: currentProp,
  defaultCurrent = 0,
  onCurrentChange,
  onFinish,
  mask = true,
  indicators = "dots",
  closable = true,
  labels: labelsProp,
}: TourProps) {
  const config = useConfig();
  const labels = { ...en.labels.tour, ...config.labels?.tour, ...labelsProp };
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : innerOpen;
  const [innerCurrent, setInnerCurrent] = useState(defaultCurrent);
  const current = Math.min(
    Math.max(currentProp !== undefined ? currentProp : innerCurrent, 0),
    Math.max(steps.length - 1, 0),
  );
  const step = steps[current];
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  // How far the card is from the target: decided by the theme style's --tour-offset (px), 14 if unset (cut-out margin 6 + gap 8)
  const [offset, setOffset] = useState(DEFAULT_OFFSET);
  // The mask and card are both attached under body, so nothing is output during server rendering and hydration, and they appear after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Closing can arrive from both the Popover's Esc callback and the document keydown; count it only once
  const closing = useRef(false);
  if (open) closing.current = false;
  const setOpen = (next: boolean) => {
    if (!next) {
      if (closing.current) return;
      closing.current = true;
    }
    if (openProp === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  const go = (index: number) => {
    if (currentProp === undefined) setInnerCurrent(index);
    onCurrentChange?.(index);
  };

  // Find the target element (re-find when the step changes or it opens; the target may have just been rendered)
  useLayoutEffect(() => {
    if (!open || !step) {
      setTarget(null);
      return;
    }
    const el = resolveTarget(step.target);
    setTarget(el);
    el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [open, step]);

  // Write the target's position into CSS variables; re-measure on window resize, scrolling of any ancestor, and the target's own size changes
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const fromSkin = Number.parseFloat(getComputedStyle(root).getPropertyValue("--tour-offset"));
    setOffset(Number.isFinite(fromSkin) ? fromSkin : DEFAULT_OFFSET);
    const place = () => {
      const rect = target?.getBoundingClientRect();
      root.style.setProperty("--tour-x", String(rect ? rect.left : 0));
      root.style.setProperty("--tour-y", String(rect ? rect.top : 0));
      root.style.setProperty("--tour-w", String(rect ? rect.width : 0));
      root.style.setProperty("--tour-h", String(rect ? rect.height : 0));
    };
    place();
    const raf = requestAnimationFrame(() => setReady(true));
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    const observer =
      target && typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    if (target) observer?.observe(target);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      observer?.disconnect();
    };
  }, [open, target]);

  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted || !open || !step) return null;

  const last = current === steps.length - 1;
  const card = (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={typeof step.title === "string" ? step.title : "Tour"}
      data-slot="tour-card"
      data-step={current}
    >
      {closable ? (
        <button
          type="button"
          aria-label={labels.close}
          data-slot="tour-close"
          onClick={() => setOpen(false)}
        >
          <CloseIcon />
        </button>
      ) : null}
      {step.cover ? <div data-slot="tour-cover">{step.cover}</div> : null}
      {step.title ? <div data-slot="tour-title">{step.title}</div> : null}
      {step.description ? <div data-slot="tour-description">{step.description}</div> : null}
      <div data-slot="tour-footer">
        {indicators === "dots" ? (
          <div data-slot="tour-indicators" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                data-slot="tour-indicator"
                data-active={i === current ? "" : undefined}
              />
            ))}
          </div>
        ) : indicators === "count" ? (
          <div data-slot="tour-indicators" data-count="">
            {current + 1} / {steps.length}
          </div>
        ) : (
          <div data-slot="tour-indicators" />
        )}
        <div data-slot="tour-actions">
          {current > 0 ? (
            <Button size="sm" variant="outline" onClick={() => go(current - 1)}>
              {labels.prev}
            </Button>
          ) : null}
          <Button
            ref={nextRef}
            size="sm"
            color="primary"
            onClick={() => {
              if (last) {
                onFinish?.();
                setOpen(false);
              } else go(current + 1);
            }}
          >
            {last ? labels.finish : labels.next}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {mask ? (
        <div
          ref={rootRef}
          data-slot="tour"
          data-ready={ready ? "" : undefined}
          data-no-target={target ? undefined : ""}
        >
          {/* Blocks clicks on the rest of the page; the highlight box above it is drawn only and takes no events */}
          <div data-slot="tour-mask" />
          {target ? <div data-slot="tour-spotlight" /> : null}
        </div>
      ) : (
        <div ref={rootRef} data-slot="tour" data-no-mask="" />
      )}
      {target ? (
        <Popover
          open
          onOpenChange={(next, details) => {
            // When the Popover handles Esc itself it stops the event, so the document listener never receives it; hence it is also handled here
            if (!next && details?.reason === "escape-key") setOpen(false);
          }}
        >
          <Popover.Content
            side={step.side ?? "bottom"}
            align="center"
            sideOffset={mask ? offset : 8}
            anchor={target}
            arrow
            aria-label={typeof step.title === "string" ? step.title : "Tour"}
            initialFocus={() => nextRef.current}
            finalFocus={false}
          >
            {card}
          </Popover.Content>
        </Popover>
      ) : (
        <div data-slot="tour-center">
          <div data-slot="popover">{card}</div>
        </div>
      )}
    </>,
    document.body,
  );
}
