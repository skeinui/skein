import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import type { UIColor, UISize } from "../../contract.ts";

export interface RatingProps {
  /** Current rating value, controlled. */
  value?: number;
  /** @default 0 */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /**
   * Number of stars.
   * @default 5
   */
  max?: number;
  /**
   * Allow half stars (step 0.5).
   * @default false
   */
  allowHalf?: boolean;
  /**
   * Clicking the current value again resets it to zero.
   * @default true
   */
  allowClear?: boolean;
  /**
   * Read-only: display only, does not respond to mouse or keyboard, and is not in the tab order.
   * @default false
   */
  readOnly?: boolean;
  /** @default false */
  disabled?: boolean;
  /** @default "md" */
  size?: UISize;
  /** @default "warning" */
  color?: UIColor;
  /** Custom icon (e.g. a heart); a star if not passed; it is used both as the unselected base and the selected fill. */
  icon?: ReactNode;
  /** Write a hidden input so it can be submitted with a native form. */
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const Star = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5l2.94 6.1 6.56.9-4.8 4.6 1.2 6.6L12 17.6l-5.9 3.1 1.2-6.6-4.8-4.6 6.56-.9z" />
  </svg>
);

/**
 * Rating: a row of stars (`max`, default 5) to give or show a score; the value is one number (`value` / `onValueChange`).
 * `allowHalf` allows half stars, `allowClear` clears on clicking the current value again, `readOnly` just displays it.
 *
 * Theme style: the selected stars overlay a fill on the star beneath; a half star uses data-fill="half" so the theme style clips half.
 */
export function Rating({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max = 5,
  allowHalf = false,
  allowClear = true,
  readOnly = false,
  disabled = false,
  size = "md",
  color = "warning",
  icon,
  name,
  ...aria
}: RatingProps) {
  const [inner, setInner] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const value = valueProp !== undefined ? valueProp : inner;
  const step = allowHalf ? 0.5 : 1;
  const interactive = !readOnly && !disabled;
  const shown = interactive && hover !== null ? hover : value;

  const commit = (next: number) => {
    const clamped = Math.min(max, Math.max(0, next));
    if (valueProp === undefined) setInner(clamped);
    onValueChange?.(clamped);
  };
  const pick = (v: number) => commit(allowClear && v === value ? 0 : v);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!interactive) return;
    const keys: Record<string, number> = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      Home: 0,
      End: max,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    commit(keys[event.key]!);
  };

  const glyph = icon ?? <Star />;
  return (
    <span
      role="slider"
      tabIndex={interactive ? 0 : -1}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} / ${max}`}
      aria-readonly={readOnly || undefined}
      aria-disabled={disabled || undefined}
      {...aria}
      data-slot="rating"
      data-size={size}
      data-color={color}
      data-readonly={readOnly ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-hovering={interactive && hover !== null ? "" : undefined}
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const full = i + 1;
        const half = i + 0.5;
        const fill = shown >= full ? "full" : shown >= half ? "half" : "empty";
        return (
          <span key={i} data-slot="rating-item" data-fill={fill}>
            <span data-slot="rating-icon">{glyph}</span>
            <span data-slot="rating-icon-fill">{glyph}</span>
            {interactive ? (
              <>
                {allowHalf ? (
                  <span
                    data-slot="rating-hit"
                    data-half=""
                    onMouseEnter={() => setHover(half)}
                    onClick={() => pick(half)}
                  />
                ) : null}
                <span
                  data-slot="rating-hit"
                  onMouseEnter={() => setHover(full)}
                  onClick={() => pick(full)}
                />
              </>
            ) : null}
          </span>
        );
      })}
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </span>
  );
}
