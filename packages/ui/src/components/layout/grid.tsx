import { createElement } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { BREAKPOINT_NAMES, GRID_COLUMNS } from "../../contract.ts";
import type { Breakpoint, Gap, LayoutTag } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

const MAX_COLUMNS = 12;

export interface GridProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Which element to render as (semantics). */
  as?: LayoutTag;
  /**
   * A fixed number of columns (1–12). Mutually exclusive with minColumnWidth; if neither is given it is 1 column.
   * @default 1
   */
  columns?: number;
  /**
   * Adapt by column width: each column is at least this wide, and as many columns as fit are used (fewer automatically as the screen narrows).
   * Use it for responsive layouts without writing breakpoints.
   */
  minColumnWidth?: "xs" | "sm" | "md" | "lg";
  /**
   * A main column and one side column of a fixed width: `end` puts it after the main one, `start` before it. Give it two children (the main one first, whichever side the side column is on shows the second). Below 64rem the two stack, the main one first. `columns` and `minColumnWidth` are not used with it.
   */
  aside?: "start" | "end";
  /**
   * The width of the side column of `aside`: sm 14rem, md 20rem, lg 26rem.
   * @default "md"
   */
  asideWidth?: "sm" | "md" | "lg";
  /**
   * Spacing between cells, from the theme style's spacing scale.
   * @default "md"
   */
  gap?: Gap;
  /**
   * Alignment within a cell.
   * @default "stretch"
   */
  align?: "start" | "center" | "end" | "stretch";
}

/** Grid layout: a fixed number of columns, or adapt to a minimum column width; use Grid.Item's span to make an item span several columns. */
export function Grid({
  as = "div",
  columns,
  minColumnWidth,
  aside,
  asideWidth = "md",
  gap = "md",
  align = "stretch",
  ...rest
}: GridProps) {
  const cols =
    columns === undefined ? undefined : Math.max(1, Math.min(Math.round(columns), MAX_COLUMNS));
  return createElement(as, {
    ...rest,
    "data-slot": "grid",
    "data-columns": minColumnWidth || aside ? undefined : (cols ?? 1),
    "data-min-column": aside ? undefined : minColumnWidth,
    "data-aside": aside,
    "data-aside-width": aside ? asideWidth : undefined,
    "data-gap": gap,
    "data-align": align,
  });
}

export interface GridItemProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Which element to render as (semantics). */
  as?: LayoutTag;
  /**
   * How many columns to span (1–12); when it exceeds the total column count it spans the full row.
   * @default 1
   */
  span?: number;
}

function GridItem({ as = "div", span = 1, ...rest }: GridItemProps) {
  return createElement(as, {
    ...rest,
    "data-slot": "grid-item",
    "data-span": Math.max(1, Math.min(Math.round(span), MAX_COLUMNS)),
  });
}

Grid.Item = GridItem;

export interface RowProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Which element to render as (semantics). */
  as?: LayoutTag;
  /**
   * Gap between columns, from the theme style's spacing scale; give a pair `[horizontal, vertical]` to set them separately.
   * @default "none"
   */
  gutter?: Gap | readonly [Gap, Gap];
  /**
   * Main-axis distribution (horizontal).
   * @default "start"
   */
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  /**
   * Cross-axis alignment (vertical).
   * @default "stretch"
   */
  align?: "start" | "center" | "end" | "stretch";
  /**
   * Whether to wrap when a row is full.
   * @default true
   */
  wrap?: boolean;
}

/**
 * A row of the 24-column grid: put Col inside it, widths are split by span (how many of the 24 parts it takes), and a row wraps automatically once it has 24 parts.
 * Difference from Grid: Row / Col have offset, order and responsive props that vary with screen width, and are for page-level layout;
 * Grid is a two-dimensional CSS grid, suited to card walls.
 */
export function Row({
  as = "div",
  gutter = "none",
  justify = "start",
  align = "stretch",
  wrap = true,
  ...rest
}: RowProps) {
  const [gx, gy] = Array.isArray(gutter) ? gutter : [gutter, gutter];
  return createElement(as, {
    ...rest,
    "data-slot": "row",
    "data-gutter": gx,
    "data-gutter-y": gy,
    "data-justify": justify,
    "data-align": align,
    "data-nowrap": wrap ? undefined : "",
  });
}

/** Col settings at a given screen-width breakpoint. */
export interface ColResponsive {
  /** Columns taken out of 24 at this breakpoint (0 hides it). */
  span?: number;
  /** Empty columns on the left at this breakpoint (0–24). */
  offset?: number;
  /** Ordering at this breakpoint, smaller numbers first. */
  order?: number;
}

export interface ColProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Which element to render as (semantics). */
  as?: LayoutTag;
  /** How many of the 24 parts it takes (0–24); 0 hides it; if not given it follows content width. */
  span?: number;
  /** How many parts of empty space on the left (0–24). */
  offset?: number;
  /** Ordering, smaller numbers first (0–24). */
  order?: number;
  /** Settings when the screen width is >= the corresponding breakpoint; a number is shorthand for span; see BREAKPOINTS for breakpoints, and larger breakpoints override step by step. */
  xs?: number | ColResponsive;
  /** Settings from 576px wide up (number = span). */
  sm?: number | ColResponsive;
  /** Settings from 768px wide up (number = span). */
  md?: number | ColResponsive;
  /** Settings from 992px wide up (number = span). */
  lg?: number | ColResponsive;
  /** Settings from 1200px wide up (number = span). */
  xl?: number | ColResponsive;
  /** Settings from 1600px wide up (number = span). */
  xxl?: number | ColResponsive;
}

const clampInt = (n: number | undefined) =>
  n === undefined ? undefined : Math.max(0, Math.min(Math.round(n), GRID_COLUMNS));

/** A column of the grid, placed inside a Row. */
export function Col({
  as = "div",
  span,
  offset,
  order,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  ...rest
}: ColProps) {
  const attrs: Record<string, number | undefined> = {
    "data-span": clampInt(span),
    "data-offset": clampInt(offset),
    "data-order": clampInt(order),
  };
  const responsive: Record<Breakpoint, number | ColResponsive | undefined> = {
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
  };
  for (const name of BREAKPOINT_NAMES) {
    const v = responsive[name];
    if (v === undefined) continue;
    const r = typeof v === "number" ? { span: v } : v;
    attrs[`data-${name}-span`] = clampInt(r.span);
    attrs[`data-${name}-offset`] = clampInt(r.offset);
    attrs[`data-${name}-order`] = clampInt(r.order);
  }
  return createElement(as, { ...rest, ...attrs, "data-slot": "col" });
}
