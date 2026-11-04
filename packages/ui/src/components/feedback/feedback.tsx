import { useId, useState } from "react";
import type { FeedbackValue } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface FeedbackLabels {
  /** Name of the button group, default "Rate this response". */
  group?: string;
  /** Default "Good response". */
  up?: string;
  /** Default "Bad response". */
  down?: string;
  /** Title of the form after a thumbs down, default "What went wrong?". */
  reasons?: string;
  /** Name of the additional notes input, default "Additional feedback (optional)". */
  comment?: string;
  /** Default "Send". */
  submit?: string;
  /** Message after submitting, default "Thanks for your feedback". */
  thanks?: string;
}

export interface FeedbackSubmit {
  value: FeedbackValue;
  /** Selected reasons (the original text from `reasons`). */
  reasons: string[];
  comment: string;
}

export interface FeedbackProps {
  /** Current rating; if omitted the component manages it itself (uncontrolled). Clicking the same button again cancels the rating (null). */
  value?: FeedbackValue | null;
  defaultValue?: FeedbackValue | null;
  onValueChange?: (value: FeedbackValue | null) => void;
  /**
   * Whether to ask for a reason after a thumbs down: if given, a small form expands under the buttons (multi-select reasons + additional notes + send),
   * otherwise only the thumbs down is recorded. What the reason texts are and which ones exist is up to the caller.
   */
  reasons?: readonly string[];
  /** The reason form was sent. */
  onSubmit?: (feedback: FeedbackSubmit) => void;
  labels?: FeedbackLabels;
}

const ThumbIcon = ({ down }: { down?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {down ? (
      <>
        <path d="M17 14V2" />
        <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
      </>
    ) : (
      <>
        <path d="M7 10v12" />
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
      </>
    )}
  </svg>
);

/**
 * Rating of a reply: two toggle buttons, 👍 / 👎 (`aria-pressed`, click again to cancel); after a thumbs down a small form can expand to ask for a reason
 * (multi-select reasons + additional notes), and after sending it is replaced by a confirmation line. The caller owns the rating and form submission; the component only handles interaction and screen reader text.
 */
export function Feedback({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  reasons,
  onSubmit,
  labels: labelsProp,
}: FeedbackProps) {
  const labels = useLabels("feedback", labelsProp);
  const id = useId();
  const [inner, setInner] = useState<FeedbackValue | null>(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const [picked, setPicked] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const choose = (next: FeedbackValue) => {
    const result = value === next ? null : next;
    if (valueProp === undefined) setInner(result);
    setPicked([]);
    setComment("");
    setSent(false);
    onValueChange?.(result);
  };

  const askWhy = value === "down" && reasons !== undefined && !sent;

  return (
    <div data-slot="feedback" data-value={value ?? undefined}>
      <div data-slot="feedback-group" role="group" aria-label={labels.group}>
        {(["up", "down"] as const).map((v) => (
          <button
            key={v}
            type="button"
            data-slot="feedback-button"
            data-value={v}
            aria-pressed={value === v}
            aria-label={v === "up" ? labels.up : labels.down}
            onClick={() => choose(v)}
          >
            <ThumbIcon down={v === "down"} />
          </button>
        ))}
      </div>
      {askWhy ? (
        <form
          data-slot="feedback-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.({ value: "down", reasons: picked, comment: comment.trim() });
            setSent(true);
          }}
        >
          <fieldset data-slot="feedback-reasons">
            <legend data-slot="feedback-legend">{labels.reasons}</legend>
            {reasons.map((reason) => (
              <label key={reason} data-slot="feedback-reason">
                <input
                  type="checkbox"
                  checked={picked.includes(reason)}
                  onChange={(e) =>
                    setPicked((all) =>
                      e.target.checked ? [...all, reason] : all.filter((r) => r !== reason),
                    )
                  }
                />
                <span>{reason}</span>
              </label>
            ))}
          </fieldset>
          <textarea
            data-slot="feedback-comment"
            id={`${id}-comment`}
            rows={2}
            value={comment}
            aria-label={labels.comment}
            placeholder={labels.comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" data-slot="feedback-submit">
            {labels.submit}
          </button>
        </form>
      ) : null}
      <div data-slot="feedback-thanks" role="status">
        {sent ? labels.thanks : null}
      </div>
    </div>
  );
}
