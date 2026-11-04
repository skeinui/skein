import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLabels } from "../../locales/use-labels.ts";

export interface QuoteLabels {
  /** Button that appears after selecting text, default "Quote". */
  quote?: string;
  /** Button to remove the quote, default "Remove quote". */
  remove?: string;
}

export interface QuoteProps {
  /** The quoted text. */
  children: ReactNode;
  /** Source ("Assistant", "You"), shown on the line above the quote. */
  source?: ReactNode;
  /** When given, a remove button appears at the top right (used by quotes in the input area); not given for quotes in sent messages. */
  onRemove?: () => void;
  labels?: Pick<QuoteLabels, "remove">;
}

/**
 * A quoted piece of text: a vertical line on the left, text shown up to a number of lines (the rest elided), with an optional source and remove button.
 * Placed in the input area to mean "the next message replies to this passage", and also placed in sent messages.
 */
export function Quote({ children, source, onRemove, labels: labelsProp }: QuoteProps) {
  const labels = useLabels("quote", labelsProp);
  return (
    <blockquote data-slot="quote">
      {source ? <span data-slot="quote-source">{source}</span> : null}
      <span data-slot="quote-text">{children}</span>
      {onRemove ? (
        <button
          type="button"
          data-slot="quote-remove"
          aria-label={labels.remove}
          onClick={onRemove}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </blockquote>
  );
}

export interface QuoteSelectionProps {
  /** Content that can be selected and quoted (e.g. an assistant reply). */
  children: ReactNode;
  /** The "Quote" button was clicked: the argument is the selected text. */
  onQuote: (text: string) => void;
  labels?: Pick<QuoteLabels, "quote">;
}

/**
 * Select text inside it and a "Quote" button appears above the selection; one click hands the selected text to `onQuote`.
 * The button follows right after the content, so after selecting text by keyboard (Shift + arrow keys) pressing Tab reaches it; pressing the button does not clear the selection.
 * The selection must lie entirely within this content, and the button disappears when the selection is cleared.
 */
export function QuoteSelection({ children, onQuote, labels: labelsProp }: QuoteSelectionProps) {
  const labels = useLabels("quote", labelsProp);
  const root = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    const onChange = () => {
      const el = root.current;
      const sel = document.getSelection();
      if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setText("");
        return;
      }
      const inside = (n: Node | null) => n !== null && el.contains(n);
      const selected = sel.toString().trim();
      if (!inside(sel.anchorNode) || !inside(sel.focusNode) || selected === "") {
        // When focus is on the button (keyboard reached it) the selection is still there, keep showing
        if (!el.contains(document.activeElement)) setText("");
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const box = el.getBoundingClientRect();
      el.style.setProperty("--quote-x", `${rect.left + rect.width / 2 - box.left}px`);
      el.style.setProperty("--quote-y", `${rect.top - box.top}px`);
      setText(selected);
    };
    document.addEventListener("selectionchange", onChange);
    return () => document.removeEventListener("selectionchange", onChange);
  }, []);

  // When the text is gone, do not keep the previous position
  useLayoutEffect(() => {
    if (text === "") {
      root.current?.style.removeProperty("--quote-x");
      root.current?.style.removeProperty("--quote-y");
    }
  }, [text]);

  return (
    <div ref={root} data-slot="quote-selection">
      {children}
      {text ? (
        <button
          type="button"
          data-slot="quote-selection-action"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const quoted = text;
            document.getSelection()?.removeAllRanges();
            setText("");
            onQuote(quoted);
          }}
        >
          {labels.quote}
        </button>
      ) : null}
    </div>
  );
}
