import type { ReactNode } from "react";
import { useLabels } from "../../locales/use-labels.ts";

export interface ThreadItem {
  /** Unique id of the conversation; matched against `value` and passed to `onValueChange`. */
  id: string;
  /** Conversation title. */
  title: string;
  /** Line under the title: a preview of the last reply. */
  preview?: string;
  /** Supplementary info on the right, such as the date or unread count. */
  meta?: ReactNode;
  /** Icon / avatar before the title. */
  icon?: ReactNode;
}

export interface ThreadListProps {
  /** Conversations to list, in display order (`{ id, title, preview, meta, icon }`). */
  items: ThreadItem[];
  /** Id of the currently open conversation. */
  value?: string | null;
  /** A conversation was clicked. */
  onValueChange?: (id: string) => void;
  /** Content shown when there are no conversations. */
  empty?: ReactNode;
  /** Name of this list, for screen readers, default "Conversations". */
  "aria-label"?: string;
}

/**
 * Conversation list (chat sidebar / conversation picker): each row is an icon, a title, a line of preview and supplementary info on the right.
 * The current conversation is written as `aria-current="true"` and highlighted; each row is a native button, usable with Tab / Enter / Space.
 * Overlong titles and previews are truncated, so rows fit in a narrow sidebar.
 */
export function ThreadList({
  items,
  value,
  onValueChange,
  empty,
  "aria-label": labelProp,
}: ThreadListProps) {
  const t = useLabels("threadList");
  const label = labelProp ?? t.label;
  return (
    <nav data-slot="thread-list" aria-label={label}>
      {items.length === 0 && empty ? <div data-slot="thread-list-empty">{empty}</div> : null}
      {items.length > 0 ? (
        <ul data-slot="thread-list-items">
          {items.map((item) => {
            const selected = item.id === value;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  data-slot="thread-list-item"
                  data-selected={selected ? "" : undefined}
                  aria-current={selected ? "true" : undefined}
                  onClick={() => onValueChange?.(item.id)}
                >
                  {item.icon ? (
                    <span data-slot="thread-list-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  ) : null}
                  <span data-slot="thread-list-content">
                    <span data-slot="thread-list-title">{item.title}</span>
                    {item.preview ? (
                      <span data-slot="thread-list-preview">{item.preview}</span>
                    ) : null}
                  </span>
                  {item.meta ? <span data-slot="thread-list-meta">{item.meta}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </nav>
  );
}
