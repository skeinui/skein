import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import type { SortableOrientation, SortableVariant } from "../../contract.ts";
import { en } from "../../locales/en.ts";
import { useConfig } from "../config-provider/context.ts";

export interface SortableItem {
  /** Unique, stable id; `onReorder` reports the new order as these ids. */
  id: string;
  /** Plain-text name: used for the drag handle's accessible name and screen reader announcements. */
  label: string;
  /** Content to display; falls back to label if omitted. */
  content?: ReactNode;
  disabled?: boolean;
}

export interface SortableMove {
  id: string;
  from: number;
  to: number;
}

export interface SortableLabels {
  /** Name of the handle: defaults to `Reorder ${label}`. */
  handle: (label: string) => string;
  /** Description of the handle (read out by screen readers on the handle). */
  instructions: string;
  pickedUp: (label: string, position: number, total: number) => string;
  moved: (label: string, position: number, total: number) => string;
  dropped: (label: string, position: number, total: number) => string;
  cancelled: (label: string) => string;
}

export interface SortableProps {
  /** Current order. The caller owns the order: update it in onReorder after a drag / keyboard move. */
  items: SortableItem[];
  /** Called on every order change: the new id order and the details of this move (once per keyboard step, but only on release for the pointer). */
  onReorder: (ids: string[], move: SortableMove) => void;
  /**
   * Layout direction; decides which pair of arrow keys moves an item.
   * @default "vertical"
   */
  orientation?: SortableOrientation;
  /**
   * Visual variant; how each one looks is up to the theme style: `tile` is a card per item, `list` plain rows that light
   * up under the pointer (for a short list inside a popover or menu).
   * @default "tile"
   */
  variant?: SortableVariant;
  /** Name of the whole list. */
  "aria-label"?: string;
  labels?: Partial<SortableLabels>;
}

/** Moves one item of the array to another position and returns a new array (the original is not modified). */
export function arrayMove<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

const GripIcon = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <circle cx="6" cy="3.5" r="1.2" />
    <circle cx="10" cy="3.5" r="1.2" />
    <circle cx="6" cy="8" r="1.2" />
    <circle cx="10" cy="8" r="1.2" />
    <circle cx="6" cy="12.5" r="1.2" />
    <circle cx="10" cy="12.5" r="1.2" />
  </svg>
);

interface Drag {
  id: string;
  from: number;
  /** Center coordinates (along the drag direction) of the remaining items when the drag starts. */
  centers: number[];
  start: number;
  target: number;
}

/**
 * Sortable list whose items the user reorders by dragging a handle, or with the keyboard (Space to pick up, arrow keys to move, Space to drop, Esc to cancel).
 * The caller owns the order: pass `items` (`{ id, label, content, disabled }`) and update them in `onReorder(ids, move)`, e.g. with the exported `arrayMove`.
 * `orientation` lays it out vertically (default) or horizontally; moves are announced to screen readers.
 * For cards moved between columns use Kanban.
 *
 * Theme style: while dragging, the dragged item follows the pointer (--sort-offset) and an insertion line is drawn at the target position (data-drop).
 */
export function Sortable({
  items,
  onReorder,
  orientation = "vertical",
  variant = "tile",
  "aria-label": ariaLabel,
  labels: labelsProp,
}: SortableProps) {
  const config = useConfig();
  const labels = { ...en.labels.sortable, ...config.labels?.sortable, ...labelsProp };
  const hintId = useId();
  const horizontal = orientation === "horizontal";
  const listRef = useRef<HTMLUListElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const original = useRef<string[]>([]);
  const refocus = useRef<string | null>(null);
  const [status, setStatus] = useState("");
  const ids = items.map((i) => i.id);

  // After a keyboard move the list is re-sorted and moved DOM nodes lose focus, so focus is returned to the handle here
  useEffect(() => {
    if (!refocus.current) return;
    listRef.current?.querySelector<HTMLElement>(`[data-handle-id="${refocus.current}"]`)?.focus();
    refocus.current = null;
  });

  const itemEls = () => [
    ...(listRef.current?.querySelectorAll<HTMLElement>(':scope > [data-slot="sortable-item"]') ??
      []),
  ];

  const commit = (from: number, to: number, announce?: "moved" | "dropped") => {
    if (from === to) return;
    const item = items[from]!;
    onReorder(arrayMove(ids, from, to), { id: item.id, from, to });
    if (announce) setStatus(labels[announce](item.label, to + 1, items.length));
  };

  // ---------- pointer ----------
  const axis = (e: { clientX: number; clientY: number }) => (horizontal ? e.clientX : e.clientY);
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const els = itemEls();
    const centers = els
      .map((el, i) => {
        const r = el.getBoundingClientRect();
        return i === index ? null : horizontal ? r.left + r.width / 2 : r.top + r.height / 2;
      })
      .filter((c): c is number => c !== null);
    try {
      // After capture, move / up are still received when the pointer leaves the handle; with no active pointer (e.g. synthetic events in tests) it throws, which is ignored
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
    setDrag({ id: items[index]!.id, from: index, centers, start: axis(event), target: index });
  };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const pos = axis(event);
    const target = drag.centers.filter((c) => c < pos).length;
    const el = itemEls()[drag.from];
    el?.style.setProperty("--sort-offset", `${pos - drag.start}px`);
    if (target !== drag.target) setDrag({ ...drag, target });
  };
  const endDrag = (apply: boolean) => {
    if (!drag) return;
    itemEls()[drag.from]?.style.removeProperty("--sort-offset");
    const { from, target } = drag;
    setDrag(null);
    if (apply) commit(from, target, "dropped");
  };

  // ---------- keyboard ----------
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const item = items[index]!;
    const isGrabbed = grabbed === item.id;
    const key = event.key;
    if (key === " " || key === "Enter") {
      event.preventDefault();
      if (!isGrabbed) {
        original.current = ids;
        setGrabbed(item.id);
        setStatus(labels.pickedUp(item.label, index + 1, items.length));
      } else {
        setGrabbed(null);
        setStatus(labels.dropped(item.label, index + 1, items.length));
      }
      return;
    }
    if (!isGrabbed) return;
    if (key === "Escape") {
      event.preventDefault();
      const from = index;
      const to = original.current.indexOf(item.id);
      setGrabbed(null);
      if (to >= 0 && to !== from) {
        refocus.current = item.id;
        onReorder(original.current, { id: item.id, from, to });
      }
      setStatus(labels.cancelled(item.label));
      return;
    }
    const back = horizontal ? "ArrowLeft" : "ArrowUp";
    const forward = horizontal ? "ArrowRight" : "ArrowDown";
    const to =
      key === back
        ? index - 1
        : key === forward
          ? index + 1
          : key === "Home"
            ? 0
            : key === "End"
              ? items.length - 1
              : null;
    if (to === null) return;
    event.preventDefault();
    if (to < 0 || to >= items.length) return;
    // A disabled target position cannot be skipped over: stay in place
    if (items[to]!.disabled) return;
    refocus.current = item.id;
    commit(index, to, "moved");
  };

  // While dragging, the drop point must be marked: before the "target-th item other than the dragged one", or after the last item
  const others = drag ? items.filter((i) => i.id !== drag.id) : [];
  const dropBefore = drag && drag.target < others.length ? others[drag.target]!.id : null;
  const dropAfter = drag && drag.target >= others.length ? others[others.length - 1]?.id : null;

  return (
    <div data-slot="sortable-root" data-orientation={orientation} data-variant={variant}>
      <ul
        ref={listRef}
        data-slot="sortable"
        data-orientation={orientation}
        data-variant={variant}
        data-dragging={drag ? "" : undefined}
        aria-label={ariaLabel}
      >
        {items.map((item, index) => {
          const isGrabbed = grabbed === item.id;
          const isDragging = drag?.id === item.id;
          return (
            <li
              key={item.id}
              data-slot="sortable-item"
              data-dragging={isDragging ? "" : undefined}
              data-grabbed={isGrabbed ? "" : undefined}
              data-disabled={item.disabled ? "" : undefined}
              data-drop={
                item.id === dropBefore ? "before" : item.id === dropAfter ? "after" : undefined
              }
            >
              <button
                type="button"
                data-slot="sortable-handle"
                data-handle-id={item.id}
                aria-label={labels.handle(item.label)}
                aria-describedby={hintId}
                aria-pressed={isGrabbed}
                aria-roledescription="sortable"
                disabled={item.disabled}
                onPointerDown={(e) => onPointerDown(e, index)}
                onPointerMove={onPointerMove}
                onPointerUp={() => endDrag(true)}
                onPointerCancel={() => endDrag(false)}
                onKeyDown={(e) => onKeyDown(e, index)}
                onBlur={() => {
                  if (isGrabbed) {
                    setGrabbed(null);
                    setStatus(labels.dropped(item.label, index + 1, items.length));
                  }
                }}
              >
                <GripIcon />
              </button>
              <div data-slot="sortable-content">{item.content ?? item.label}</div>
            </li>
          );
        })}
      </ul>
      <span id={hintId} data-slot="sortable-status">
        {labels.instructions}
      </span>
      <span data-slot="sortable-status" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
