import { useId } from "react";
import type { ReactNode } from "react";
import type { SuggestionsLayout } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface SuggestionItem {
  /** Unique key; the title is used if omitted. */
  id?: string;
  /** Visible text of the suggestion; also the prompt sent when `prompt` is omitted. */
  title: string;
  /** A line of description under the title (not shown in the chips layout). */
  description?: string;
  /** Prompt sent on click; the title if omitted. */
  prompt?: string;
  /** Icon before the title. */
  icon?: ReactNode;
}

export interface SuggestionsProps {
  /** This group of suggestions. */
  items: SuggestionItem[];
  /** An item was clicked: the argument is that item (use `item.prompt ?? item.title` for the text to send). */
  onSelect?: (item: SuggestionItem) => void;
  /**
   * grid: card grid (default), list: vertical list, chips: a row of small pills (without descriptions).
   * @default "grid"
   */
  layout?: SuggestionsLayout;
  /** Large heading on top, e.g. "What can I help with?". */
  title?: ReactNode;
  /** Description under the heading. */
  description?: ReactNode;
  /** Name of this group when there is no `title` (for screen readers); by default the locale's "Suggestions". */
  "aria-label"?: string;
}

/**
 * Starter prompts in an empty conversation state: a heading plus a group of clickable suggestions. Data-driven (`items` is serializable), with three layouts (card grid / vertical / pills),
 * and a click hands that item to `onSelect` (usually to fill the input or send directly). Each item is a native button, usable with keyboard Tab / Enter / Space.
 */
export function Suggestions({
  items,
  onSelect,
  layout = "grid",
  title,
  description,
  "aria-label": label,
}: SuggestionsProps) {
  const t = useLabels("suggestions");
  const titleId = useId();
  return (
    <div
      role="group"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : (label ?? t.label)}
      data-slot="suggestions"
      data-layout={layout}
    >
      {title || description ? (
        <div data-slot="suggestions-header">
          {title ? (
            <p id={titleId} data-slot="suggestions-title">
              {title}
            </p>
          ) : null}
          {description ? <p data-slot="suggestions-description">{description}</p> : null}
        </div>
      ) : null}
      <div data-slot="suggestions-items">
        {items.map((item) => (
          <button
            key={item.id ?? item.title}
            type="button"
            data-slot="suggestions-item"
            onClick={() => onSelect?.(item)}
          >
            {item.icon ? (
              <span data-slot="suggestions-item-icon" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            <span data-slot="suggestions-item-text">
              <span data-slot="suggestions-item-title">{item.title}</span>
              {item.description && layout !== "chips" ? (
                <span data-slot="suggestions-item-description">{item.description}</span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
