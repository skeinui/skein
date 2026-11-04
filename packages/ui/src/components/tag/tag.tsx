import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { TagVariant, UIColor, UIRadius, UISize } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface TagProps extends Omit<
  ComponentPropsWithoutRef<"span">,
  "className" | "style" | "color"
> {
  /**
   * Visual variant; how each one looks is up to the theme style.
   * @default "soft"
   */
  variant?: TagVariant;
  /**
   * Semantic colour; the theme style picks the actual colours.
   * @default "neutral"
   */
  color?: UIColor;
  /**
   * Size step.
   * @default "md"
   */
  size?: UISize;
  /** Corner radius step; when omitted the theme style decides. */
  radius?: UIRadius;
  /** When given, a remove button is shown and called on click; whether it is actually removed is up to the caller. */
  onRemove?: () => void;
  /** Accessible name of the remove button; when omitted it is the locale's "Remove" text. */
  removeLabel?: string;
  /**
   * Disabled; the remove button can't be clicked either.
   * @default false
   */
  disabled?: boolean;
  children?: ReactNode;
}

/**
 * Tag: a small labelled chip for selected items, filter conditions and keywords, optionally removable.
 * `variant` / `color` / `size` / `radius` set its look; `onRemove` adds an × button (the caller removes it from its own list).
 * For a status or count marker use Badge; for typing a list of tags use TagInput.
 */
export function Tag({
  variant = "soft",
  color = "neutral",
  size = "md",
  radius,
  onRemove,
  removeLabel: removeLabelProp,
  disabled = false,
  children,
  ...rest
}: TagProps) {
  const c = useLabels("common");
  const removeLabel = removeLabelProp ?? c.remove;
  return (
    <span
      {...rest}
      data-slot="tag"
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-radius={radius}
      data-disabled={disabled ? "" : undefined}
    >
      <span data-slot="tag-label">{children}</span>
      {onRemove ? (
        <button
          type="button"
          data-slot="tag-remove"
          aria-label={removeLabel}
          disabled={disabled}
          onClick={onRemove}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      ) : null}
    </span>
  );
}
