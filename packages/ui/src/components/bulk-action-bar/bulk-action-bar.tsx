import { useLayoutEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { BULK_ACTION_BAR_FLOATS, BULK_ACTION_BAR_PLACEMENTS } from "../../contract.ts";
import type { BulkActionBarFloat, BulkActionBarPlacement } from "../../contract.ts";
import type { BulkActionBarLabels } from "../../locales/messages.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { Button } from "../button/index.ts";
import { Flex } from "../layout/index.ts";
import { Text } from "../typography/index.ts";

export interface BulkActionBarProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "className" | "style" | "children"
> {
  /** How many rows are selected; the bar shows only when it is above 0. */
  count: number;
  /** Clear the selection: the "Clear" button shows when this is given. */
  onClear?: () => void;
  /**
   * Where it sits: `top` is above the table (put it before it, in place of its toolbar), `bottom` below it (put it after).
   * @default "top"
   */
  placement?: BulkActionBarPlacement;
  /**
   * Float: the bar is laid over the edge of the table it is next to instead of taking room in the flow, with a shadow, so the rows do not jump when it appears: the bottom edge of the table above it (`placement="bottom"`, put it right after the table) or the top edge of the table below it (`"top"`, put it right before). Off, it is a plain bar in the flow.
   * @default false
   */
  floating?: boolean;
  /**
   * With `floating`: `inside` lays the bar on the table, over its last (or first) rows; `outside` lays it on what is beyond the edge of the table (the pagination below it, the toolbar above it). Neither takes room in the flow.
   * @default "inside"
   */
  floatingIn?: BulkActionBarFloat;
  /**
   * With `floating`: the distance (px) from the table's edge line, to the top or to the bottom (by `placement`, and `inside` or `outside`); a negative number moves it the other way, across the line.
   * @default 8
   */
  offset?: number;
  /** The actions on the selection: buttons, a MenuButton… */
  children?: ReactNode;
  /** Texts for another language; the default follows the `locale` of ConfigProvider. */
  labels?: Partial<BulkActionBarLabels>;
}

/**
 * Bulk action bar: "3 selected" with the actions on those rows and a button to clear the selection, shown while rows of a table are ticked.
 * `count` is the number selected (0 hides it), `children` are the actions, `onClear` clears; `placement` puts it above (`top`) or below (`bottom`) the table, and `floating` lays it over the edge of the table instead of in the flow.
 * For the tools of the table itself use TableTools.
 */
export function BulkActionBar({
  count,
  onClear,
  placement = "top",
  floating = false,
  floatingIn = "inside",
  offset,
  children,
  labels,
  ...rest
}: BulkActionBarProps) {
  const t = { ...useLabels("bulkActionBar"), ...labels };
  const ref = useRef<HTMLDivElement>(null);
  // The distance is a dynamic value: written as a CSS variable, which the theme style reads (the component writes no style of its own)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (offset === undefined) el.style.removeProperty("--bulk-action-bar-offset");
    else el.style.setProperty("--bulk-action-bar-offset", `${offset}px`);
  }, [offset, count]);
  if (count <= 0) return null;
  const bar = (
    <div
      ref={ref}
      role="toolbar"
      aria-label={t.label}
      {...rest}
      data-slot="bulk-action-bar"
      data-placement={BULK_ACTION_BAR_PLACEMENTS.includes(placement) ? placement : "top"}
      data-floating={floating ? "" : undefined}
      data-floating-in={
        floating && BULK_ACTION_BAR_FLOATS.includes(floatingIn) ? floatingIn : undefined
      }
    >
      <Text role="status">{t.selected(count)}</Text>
      <Flex gap="sm" align="center" wrap>
        {children}
      </Flex>
      {onClear ? (
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          startContent={
            <svg
              viewBox="0 0 24 24"
              width={14}
              height={14}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          }
          onClick={onClear}
        >
          {t.clear}
        </Button>
      ) : null}
    </div>
  );
  // Floating: the bar is absolute on a zero-height anchor, so it takes no room and needs no positioned container
  return floating ? (
    <div data-slot="bulk-action-bar-anchor" data-placement={placement}>
      {bar}
    </div>
  ) : (
    bar
  );
}
