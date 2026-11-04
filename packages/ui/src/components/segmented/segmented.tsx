import { useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import type { UISize } from "../../contract.ts";

export interface SegmentedOption {
  value: string;
  /** Visible text; omit for an icon-only option (then give it a `title`). */
  label?: ReactNode;
  /** Icon shown before the label. */
  icon?: ReactNode;
  /** Hover tooltip. Required when an option has only an icon and no label: it also serves as the accessible name. */
  title?: string;
  disabled?: boolean;
}

export interface SegmentedProps {
  /** Options; when there is only text you can pass a string array directly, and value and label both take that string. */
  options: readonly (string | SegmentedOption)[];
  /** Currently selected value, controlled. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** @default "md" */
  size?: UISize;
  /**
   * Fill the parent container's width, with options splitting it evenly.
   * @default false
   */
  fullWidth?: boolean;
  /** @default false */
  disabled?: boolean;
  /** Write a hidden input so it can be submitted with a native form. */
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const normalize = (option: string | SegmentedOption): SegmentedOption =>
  typeof option === "string" ? { value: option, label: option } : option;

/**
 * Segmented control: a compact row of mutually exclusive options, with a sliding background under the selected one, e.g. to switch a view (list / grid) or a period.
 * `options` is a string array or `{ value, label, icon, title, disabled }` objects; `value` / `onValueChange` hold the selected value; `fullWidth` splits the parent's width evenly.
 * The keyboard matches RadioGroup (arrow keys move and select, Home / End jump to the ends, only the selected item is in the tab order).
 * For choices with longer labels or descriptions in a form use RadioGroup; to switch panels of content use Tabs.
 *
 * Theme style: the semantics are radiogroup. The thumb position is a dynamic value and the component writes no style: it sets the selected item's left / width via ref as
 * --seg-x / --seg-w (pixels, without unit), which the theme style uses for positioning and the slide animation.
 */
export function Segmented({
  options: optionsProp,
  value: valueProp,
  defaultValue,
  onValueChange,
  size = "md",
  fullWidth = false,
  disabled = false,
  name,
  ...aria
}: SegmentedProps) {
  const options = optionsProp.map(normalize);
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const selectedIndex = options.findIndex((o) => o.value === value);

  const enabled = (o: SegmentedOption) => !disabled && !o.disabled;
  const firstEnabled = options.findIndex(enabled);
  // Only one option is in the tab order: the selected one, or the first available if none is selected
  const tabbable =
    selectedIndex >= 0 && enabled(options[selectedIndex]!) ? selectedIndex : firstEnabled;

  const select = (next: string) => {
    if (next === value) return;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const from = options.findIndex((o) => o.value === (event.target as HTMLElement).dataset.value);
    if (from < 0) return;
    const dir =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    let to = -1;
    if (dir !== 0) {
      for (let step = 1; step <= options.length; step++) {
        const i = (((from + dir * step) % options.length) + options.length) % options.length;
        if (enabled(options[i]!)) {
          to = i;
          break;
        }
      }
    } else if (event.key === "Home") to = firstEnabled;
    else if (event.key === "End") to = options.findLastIndex(enabled);
    else return;
    event.preventDefault();
    if (to < 0) return;
    const target = rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="segmented-item"]')[
      to
    ];
    target?.focus();
    select(options[to]!.value);
  };

  // The thumb follows the selected item; re-measure when the size changes (font change, container resize)
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const place = () => {
      const item = root.querySelectorAll<HTMLElement>('[data-slot="segmented-item"]')[
        selectedIndex
      ];
      if (!item) return;
      root.style.setProperty("--seg-x", String(item.offsetLeft));
      root.style.setProperty("--seg-w", String(item.offsetWidth));
    };
    place();
    // Enable the animation only after the first placement, so the thumb does not slide in from 0 on the initial render
    const raf = requestAnimationFrame(() => setReady(true));
    if (typeof ResizeObserver === "undefined") return () => cancelAnimationFrame(raf);
    const observer = new ResizeObserver(place);
    observer.observe(root);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [selectedIndex, options.length, size, fullWidth]);

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-disabled={disabled || undefined}
      {...aria}
      data-slot="segmented"
      data-size={size}
      data-full-width={fullWidth ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-empty={selectedIndex < 0 ? "" : undefined}
      data-ready={ready ? "" : undefined}
      onKeyDown={onKeyDown}
    >
      <span data-slot="segmented-thumb" aria-hidden="true" />
      {options.map((option, i) => {
        const selected = i === selectedIndex;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={i === tabbable ? 0 : -1}
            disabled={!enabled(option)}
            data-slot="segmented-item"
            title={option.title}
            // Option with only an icon and no text: title also serves as the accessible name
            aria-label={option.label === undefined ? option.title : undefined}
            data-value={option.value}
            data-selected={selected ? "" : undefined}
            data-disabled={!enabled(option) ? "" : undefined}
            onClick={() => select(option.value)}
          >
            {option.icon ? <span data-slot="segmented-icon">{option.icon}</span> : null}
            {option.label !== undefined ? (
              <span data-slot="segmented-label">{option.label}</span>
            ) : null}
          </button>
        );
      })}
      {name && value !== undefined ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  );
}
