import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { UIColor, UISize } from "../../contract.ts";

export interface TimelineItem {
  /** Main text of the event. */
  title: ReactNode;
  /** Optional secondary text under the title. */
  description?: ReactNode;
  /** Time or date text shown on the left of the timeline. */
  time?: ReactNode;
  /** Icon inside the dot; a small solid dot if omitted. */
  icon?: ReactNode;
  /** Set the color of this item individually; if omitted, the whole timeline's color is used. */
  color?: UIColor;
  /** An in-progress item: the dot has a breathing animation, usually placed last. */
  pending?: boolean;
}

export interface TimelineProps extends Omit<
  ComponentPropsWithoutRef<"ol">,
  "className" | "style" | "children"
> {
  /** Events in display order, top to bottom (`{ title, description, time, icon, color, pending }`). */
  items: TimelineItem[];
  /**
   * Color used by items with no individually specified color.
   * @default "primary"
   */
  color?: UIColor;
  /**
   * Size step of the dots, spacing and text.
   * @default "md"
   */
  size?: UISize;
}

/** Timeline: data-driven, laid out vertically, each item is time + dot / icon (with a line connecting to the next item) + title / description. */
export function Timeline({ items, color = "primary", size = "md", ...rest }: TimelineProps) {
  const hasTime = items.some((item) => item.time != null);
  return (
    <ol {...rest} data-slot="timeline" data-size={size} data-has-time={hasTime ? "" : undefined}>
      {items.map((item, i) => (
        <li
          key={i}
          data-slot="timeline-item"
          data-color={item.color ?? color}
          data-pending={item.pending ? "" : undefined}
          aria-current={item.pending ? "step" : undefined}
        >
          {hasTime ? <span data-slot="timeline-time">{item.time}</span> : null}
          <span data-slot="timeline-separator" aria-hidden="true">
            <span data-slot="timeline-dot" data-has-icon={item.icon ? "" : undefined}>
              {item.icon}
            </span>
            {i < items.length - 1 ? <span data-slot="timeline-connector" /> : null}
          </span>
          <span data-slot="timeline-content">
            <span data-slot="timeline-title">{item.title}</span>
            {item.description ? (
              <span data-slot="timeline-description">{item.description}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
