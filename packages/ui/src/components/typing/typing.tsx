import type { TypingVariant } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface TypingProps {
  /**
   * dots: three dots (default), pulse: a pulsing dot, spinner: a spinning ring, skeleton: an avatar plus a few lines of placeholder text.
   * @default "dots"
   */
  variant?: TypingVariant;
  /** Text read by screen readers (the root is `role="status"`); by default the locale's "Assistant is typing". */
  label?: string;
}

/**
 * Typing: a "the assistant is typing" indicator shown while a chat reply has not started yet.
 * `variant` picks dots, a pulse, a spinner or a skeleton; it has `role="status"` and screen readers read `label` once.
 * For general loading use Spinner; for animated text while a reply streams use ShimmerText.
 *
 * Theme style: the drawn dots / ring / placeholder bars are aria-hidden decoration; the animation is in the theme style and
 * stops under "reduced motion".
 */
export function Typing({ variant = "dots", label: labelProp }: TypingProps) {
  const t = useLabels("typing");
  const label = labelProp ?? t.typing;
  return (
    <span data-slot="typing" data-variant={variant} role="status" aria-label={label}>
      {variant === "dots" ? (
        <span data-slot="typing-dots" aria-hidden="true">
          <span data-slot="typing-dot" />
          <span data-slot="typing-dot" />
          <span data-slot="typing-dot" />
        </span>
      ) : variant === "pulse" ? (
        <span data-slot="typing-pulse" aria-hidden="true" />
      ) : variant === "spinner" ? (
        <span data-slot="typing-spinner" aria-hidden="true" />
      ) : (
        <>
          <span data-slot="typing-avatar" aria-hidden="true" />
          <span data-slot="typing-lines" aria-hidden="true">
            <span data-slot="typing-line" />
            <span data-slot="typing-line" />
            <span data-slot="typing-line" />
          </span>
        </>
      )}
    </span>
  );
}
