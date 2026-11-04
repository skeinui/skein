import { arrayMove, Sortable } from "../sortable/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface QueueItem {
  /** Unique, stable id (keeps the item's identity while reordering). */
  id: string;
  /** The queued content (plain text, also the name of the handle and the remove button). */
  text: string;
}

export interface QueueLabels {
  /** Title, default "Queued". */
  title?: string;
  /** Name of the remove button, default `Remove ${text}`. */
  remove?: (text: string) => string;
  /** Notice when the queue is empty, default "Nothing queued". */
  empty?: string;
  /** Name of the list, default "Queued messages". */
  list?: string;
}

export interface QueueProps {
  /** Queued messages (in send order). The order is owned by the caller. */
  items: QueueItem[];
  /** Fired after drag / keyboard reordering or removal; the argument is the new queue. */
  onChange: (items: QueueItem[]) => void;
  labels?: QueueLabels;
}

const CloseIcon = () => (
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
);

/**
 * Pending-send queue: messages the user keeps typing while the assistant is still generating, lined up in send order, which can be reordered by dragging the handle (or by keyboard) and can be removed.
 * Order and removal are owned by the caller and passed back through `onChange`; the drag, keyboard and screen-reader announcements for reordering reuse Sortable.
 */
export function Queue({ items, onChange, labels: labelsProp }: QueueProps) {
  const labels = useLabels("queue", labelsProp);
  return (
    <div data-slot="queue">
      <div data-slot="queue-header">
        <span data-slot="queue-title">{labels.title}</span>
        <span data-slot="queue-count">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div data-slot="queue-empty">{labels.empty}</div>
      ) : (
        <Sortable
          aria-label={labels.list}
          items={items.map((item) => ({
            id: item.id,
            label: item.text,
            content: (
              <span data-slot="queue-item">
                <span data-slot="queue-text">{item.text}</span>
                <button
                  type="button"
                  data-slot="queue-remove"
                  aria-label={labels.remove(item.text)}
                  onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                >
                  <CloseIcon />
                </button>
              </span>
            ),
          }))}
          onReorder={(_, { from, to }) => onChange(arrayMove(items, from, to))}
        />
      )}
    </div>
  );
}
