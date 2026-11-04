import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";

export interface ViewerItem {
  src: string;
  alt?: string;
}

export interface ImageLabels {
  preview: string;
  close: string;
  zoomIn: string;
  zoomOut: string;
  rotateLeft: string;
  rotateRight: string;
  reset: string;
  previous: string;
  next: string;
  /** Name of the toolbar. */
  tools: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;
const STEP = 1.25;
const clamp = (n: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));

const Icon = ({ d }: { d: string }) => (
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
    <path d={d} />
  </svg>
);
const PATH = {
  zoomIn: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3M11 8v6M8 11h6",
  zoomOut: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3M8 11h6",
  rotateLeft: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
  rotateRight: "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",
  reset: "M4 4h6M4 4v6M20 20h-6M20 20v-6M4 20h6M4 20v-6M20 4h-6M20 4v6",
  prev: "m15 6-6 6 6 6",
  next: "m9 6 6 6-6 6",
  close: "M6 6l12 12M18 6 6 18",
};

export interface ViewerProps {
  items: ViewerItem[];
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: ImageLabels;
}

/** Fullscreen preview: zoom, rotate, drag, previous / next. Transforms are handed to the theme style through CSS variables; the component writes no style. */
export function Viewer({ items, index, onIndexChange, open, onOpenChange, labels }: ViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const offset = useRef({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const item = items[index];
  const many = items.length > 1;

  const apply = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    el.style.setProperty("--pv-x", String(offset.current.x));
    el.style.setProperty("--pv-y", String(offset.current.y));
  }, []);
  // Callback ref: the image mounts late inside the Dialog's Portal, so whenever it mounts (or re-renders) write the current zoom / rotation / position as variables
  const setImg = (el: HTMLImageElement | null) => {
    imgRef.current = el;
    if (!el) return;
    el.style.setProperty("--pv-scale", String(scale));
    el.style.setProperty("--pv-rot", String(rotate));
    el.style.setProperty("--pv-x", String(offset.current.x));
    el.style.setProperty("--pv-y", String(offset.current.y));
  };

  const reset = useCallback(() => {
    setScale(1);
    setRotate(0);
    offset.current = { x: 0, y: 0 };
    apply();
  }, [apply]);
  // Opening and switching images both start from scratch
  useEffect(() => {
    if (open) reset();
  }, [open, index, reset]);

  const zoom = (factor: number) =>
    setScale((s) => {
      const next = clamp(s * factor);
      if (next <= 1) {
        offset.current = { x: 0, y: 0 };
        apply();
      }
      return next;
    });
  const go = (delta: number) => {
    if (!many) return;
    onIndexChange((index + delta + items.length) % items.length);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    switch (event.key) {
      case "ArrowLeft":
        go(-1);
        break;
      case "ArrowRight":
        go(1);
        break;
      case "+":
      case "=":
        zoom(STEP);
        break;
      case "-":
        zoom(1 / STEP);
        break;
      case "0":
        reset();
        break;
      case "r":
        setRotate((r) => r + 90);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const onPointerDown = (event: PointerEvent<HTMLImageElement>) => {
    if (scale <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      px: event.clientX,
      py: event.clientY,
      ox: offset.current.x,
      oy: offset.current.y,
    };
  };
  const onPointerMove = (event: PointerEvent<HTMLImageElement>) => {
    const d = drag.current;
    if (!d) return;
    offset.current = { x: d.ox + event.clientX - d.px, y: d.oy + event.clientY - d.py };
    apply();
  };
  const endDrag = () => {
    drag.current = null;
  };

  const button = (
    label: string,
    path: string,
    onClick: () => void,
    disabled?: boolean,
  ): ReactNode => (
    <button
      type="button"
      data-slot="image-preview-button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon d={path} />
    </button>
  );

  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop data-slot="image-preview-backdrop" />
        <BaseDialog.Popup
          data-slot="image-preview"
          aria-label={item?.alt || "Image preview"}
          onKeyDown={onKeyDown}
        >
          <div
            data-slot="image-preview-stage"
            onWheel={(event) => zoom(event.deltaY < 0 ? STEP : 1 / STEP)}
            onClick={(event) => {
              // Click blank space outside the image to close
              if (event.target === event.currentTarget) onOpenChange(false);
            }}
          >
            {item ? (
              <img
                ref={setImg}
                data-slot="image-preview-img"
                data-zoomed={scale > 1 ? "" : undefined}
                src={item.src}
                alt={item.alt ?? ""}
                draggable={false}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              />
            ) : null}
          </div>
          {many ? (
            <>
              <button
                type="button"
                data-slot="image-preview-nav"
                data-direction="prev"
                aria-label={labels.previous}
                onClick={() => go(-1)}
              >
                <Icon d={PATH.prev} />
              </button>
              <button
                type="button"
                data-slot="image-preview-nav"
                data-direction="next"
                aria-label={labels.next}
                onClick={() => go(1)}
              >
                <Icon d={PATH.next} />
              </button>
            </>
          ) : null}
          <div data-slot="image-preview-toolbar" role="toolbar" aria-label={labels.tools}>
            {many ? (
              <span data-slot="image-preview-counter" aria-live="polite">
                {index + 1} / {items.length}
              </span>
            ) : null}
            {button(labels.zoomOut, PATH.zoomOut, () => zoom(1 / STEP), scale <= MIN_SCALE)}
            {button(labels.zoomIn, PATH.zoomIn, () => zoom(STEP), scale >= MAX_SCALE)}
            {button(labels.rotateLeft, PATH.rotateLeft, () => setRotate((r) => r - 90))}
            {button(labels.rotateRight, PATH.rotateRight, () => setRotate((r) => r + 90))}
            {button(labels.reset, PATH.reset, reset)}
          </div>
          <BaseDialog.Close
            data-slot="image-preview-close"
            aria-label={labels.close}
            title={labels.close}
          >
            <Icon d={PATH.close} />
          </BaseDialog.Close>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
