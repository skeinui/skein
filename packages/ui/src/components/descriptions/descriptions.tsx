import type { ReactNode } from "react";
import type { UISize } from "../../contract.ts";

export interface DescriptionsItem {
  /** Key in the list; if omitted the index is used. */
  key?: string;
  /** Field name, e.g. "Email". */
  label: ReactNode;
  value?: ReactNode;
  /** Number of columns it spans, default 1; wraps to the next row automatically when it exceeds the columns left in the row. */
  span?: number;
}

export interface DescriptionsProps {
  /** The label / value pairs, laid out in rows of `column` items (`DescriptionsItem`: `label`, `value`, `span`). */
  items: readonly DescriptionsItem[];
  /** Heading above the list. */
  title?: ReactNode;
  /** Content on the right of the title row (e.g. an "Edit" button). */
  extra?: ReactNode;
  /**
   * Items per row (1–8). Each item's label and value count as one item; every row is filled, the last item
   * stretching over the columns left.
   * @default 3
   */
  column?: number;
  /**
   * Draw grid lines, and the label has a background (table style).
   * @default false
   */
  bordered?: boolean;
  /**
   * horizontal: label to the left of value; vertical: label above value.
   * @default "horizontal"
   */
  layout?: "horizontal" | "vertical";
  /**
   * Size step: row spacing / cell padding.
   * @default "md"
   */
  size?: UISize;
  /**
   * Add a colon after the label; not added when bordered or vertical.
   * @default true
   */
  colon?: boolean;
}

const MAX_COLUMN = 8;

/**
 * Lays the column span of each item into rows: when a row cannot fit it, wrap, and the last item of each row fills the remaining columns,
 * so every row is full (consistent with antd) and there are no empty cells at the end of a row.
 */
function layoutSpans(items: readonly DescriptionsItem[], column: number): number[] {
  const spans = items.map((item) => Math.max(1, Math.min(Math.round(item.span ?? 1), column)));
  let used = 0;
  spans.forEach((span, i) => {
    if (used + span > column) {
      // Does not fit: the previous item fills the previous row, and the current item starts a new row
      spans[i - 1]! += column - used;
      used = 0;
    }
    used += span;
    if (used === column) used = 0;
  });
  if (used > 0 && spans.length > 0) spans[spans.length - 1]! += column - used;
  return spans;
}

/** Descriptions list: a group of "name — content" pairs laid out in multiple columns, often used to show fields on a detail page. */
export function Descriptions({
  items,
  title,
  extra,
  column: columnProp = 3,
  bordered = false,
  layout = "horizontal",
  size = "md",
  colon = true,
}: DescriptionsProps) {
  const column = Math.max(1, Math.min(Math.round(columnProp), MAX_COLUMN));
  const spans = layoutSpans(items, column);
  return (
    <div
      data-slot="descriptions"
      data-bordered={bordered ? "" : undefined}
      data-layout={layout}
      data-size={size}
      data-column={column}
      data-colon={colon && !bordered && layout === "horizontal" ? "" : undefined}
    >
      {title || extra ? (
        <div data-slot="descriptions-header">
          <div data-slot="descriptions-title">{title}</div>
          {extra ? <div data-slot="descriptions-extra">{extra}</div> : null}
        </div>
      ) : null}
      <dl data-slot="descriptions-list">
        {items.map((item, i) => (
          <div key={item.key ?? i} data-slot="descriptions-item" data-span={spans[i]}>
            <dt data-slot="descriptions-label">{item.label}</dt>
            <dd data-slot="descriptions-value">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
