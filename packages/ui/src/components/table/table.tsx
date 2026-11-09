import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type {
  ComponentPropsWithoutRef,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
  RefObject,
} from "react";
import { Input } from "../input/index.ts";
import { ScrollArea } from "../scroll-area/index.ts";
import { Select } from "../select/index.ts";
import type { SelectOption } from "../select/index.ts";
import type { TableAlign, TableFixed, TableSort, UISize } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface TableProps extends Without<ComponentPropsWithoutRef<"table">> {
  /**
   * Row height and padding step.
   * @default "md"
   */
  size?: UISize;
  /**
   * Zebra stripes.
   * @default false
   */
  striped?: boolean;
  /**
   * Highlight rows on hover.
   * @default true
   */
  hoverable?: boolean;
  /**
   * Outer frame: border + border radius.
   * @default false
   */
  bordered?: boolean;
  /**
   * Fixed header: the container takes the height of its parent and scrolls the rows inside it, the header stays. The parent has to have a constrained height: a box with a height, or a flex column that has one (`Card fill`, `Flex grow`); in a parent as tall as its content the table is as tall as its rows and the page scrolls.
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * Loading: the table body fades and is not clickable, and the table gets `aria-busy`.
   * @default false
   */
  loading?: boolean;
}

/**
 * The element that scrolls: the container itself, or, with a fixed header (the table is in a ScrollArea there, so the
 * scrollbar can be drawn by the theme style and stop below the header), the viewport of that ScrollArea.
 */
const VIEWPORT = ':scope > [data-slot="scroll-area"] > [data-slot="scroll-area-viewport"]';
const scrollerOf = (el: HTMLElement) => el.querySelector<HTMLElement>(VIEWPORT) ?? el;

/** Does the scroller's content overflow it (horizontal or vertical scrolling needed)? Re-evaluated as content and container size change. */
function useScrollable(ref: RefObject<HTMLElement | null>, inScrollArea: boolean) {
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const scroller = scrollerOf(el);
    const measure = () =>
      setScrollable(
        scroller.scrollWidth > scroller.clientWidth + 1 ||
          scroller.scrollHeight > scroller.clientHeight + 1,
      );
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    return () => observer.disconnect();
  }, [ref, inScrollArea]);
  return scrollable;
}

/**
 * Fixed columns: sticks `fixed` cells to the container's left / right edge. In each row, the widths of the preceding (following) fixed columns are accumulated and written as `--tbl-fixed`;
 * the innermost cell is marked `data-fixed-edge` (the theme style draws the scroll shadow next to it); the container's horizontal scroll position is written as `data-scroll-x`.
 * All of this writes DOM attributes directly and does not trigger re-renders; rows and cells render separately, so a MutationObserver follows changes.
 * It also handles resizable column widths: for columns whose header sets `width`, the sum of widths (columns without a width count as 96px each) is written as the table's `--tbl-sum` (and marked `data-sized`),
 * and the theme style uses it to lay the table out as fixed layout with an overall width not less than this sum, so column widths match the dragging exactly.
 */
function useFixedColumns(ref: RefObject<HTMLElement | null>, inScrollArea: boolean) {
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const scroller = scrollerOf(el);
    const max = scroller.scrollWidth - scroller.clientWidth;
    const x =
      max <= 1
        ? "none"
        : scroller.scrollLeft <= 1
          ? "start"
          : scroller.scrollLeft >= max - 1
            ? "end"
            : "middle";
    if (el.dataset.scrollX !== x) el.dataset.scrollX = x;
    // The scrollbar of a fixed header starts below the header: its height is the offset of the vertical track
    const head = el.querySelector("thead");
    if (head && scroller !== el) el.style.setProperty("--tbl-head-h", `${head.offsetHeight}px`);
    const table = el.querySelector("table");
    if (table) {
      const heads = [...table.querySelectorAll<HTMLElement>("thead tr:first-child > th")];
      const sized = heads.filter((th) => th.dataset.width !== undefined);
      const sum = sized.reduce((total, th) => total + Number(th.dataset.width), 0);
      if (sum > 0) {
        // Columns without a width (used to absorb the remaining space) keep at least FILLER_MIN, otherwise they get squeezed to 0 when the sum of column widths exceeds the container
        const total = sum + (heads.length - sized.length) * FILLER_MIN;
        table.style.setProperty("--tbl-sum", `${total}px`);
        table.setAttribute("data-sized", "");
      } else {
        table.style.removeProperty("--tbl-sum");
        table.removeAttribute("data-sized");
      }
    }
    // Zebra stripes: when the table body has expanded content rows, nth-child parity gets disrupted, so only data rows are counted and the even ones are marked data-stripe
    for (const body of el.querySelectorAll<HTMLElement>("tbody")) {
      const rows = [...body.children] as HTMLElement[];
      if (rows.some((r) => r.dataset.slot === "table-expanded-row")) {
        body.setAttribute("data-stripe-managed", "");
        rows
          .filter((r) => r.dataset.slot === "table-row")
          .forEach((r, i) => r.toggleAttribute("data-stripe", i % 2 === 1));
      } else if (body.hasAttribute("data-stripe-managed")) {
        body.removeAttribute("data-stripe-managed");
        for (const r of rows) r.removeAttribute("data-stripe");
      }
    }
    for (const tr of el.querySelectorAll("tr")) {
      const cells = [...tr.children] as HTMLElement[];
      const starts = cells.filter((c) => c.dataset.fixed === "start");
      const ends = cells.filter((c) => c.dataset.fixed === "end").reverse();
      for (const group of [starts, ends]) {
        let offset = 0;
        group.forEach((cell, i) => {
          cell.style.setProperty("--tbl-fixed", `${offset}px`);
          if (i === group.length - 1) cell.setAttribute("data-fixed-edge", "");
          else cell.removeAttribute("data-fixed-edge");
          offset += cell.offsetWidth;
        });
      }
    }
  }, [ref, inScrollArea]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const mutations =
      typeof MutationObserver === "undefined" ? null : new MutationObserver(() => update());
    mutations?.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-fixed", "data-width"],
    });
    const sizes = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    sizes?.observe(el);
    if (el.firstElementChild) sizes?.observe(el.firstElementChild);
    // With a fixed header the ScrollArea's viewport scrolls: scrolling is not the container's event then (scroll does not bubble)
    const scroller = scrollerOf(el);
    if (scroller !== el) {
      scroller.addEventListener("scroll", update, { passive: true });
      if (scroller.firstElementChild) sizes?.observe(scroller.firstElementChild);
    }
    return () => {
      mutations?.disconnect();
      sizes?.disconnect();
      if (scroller !== el) scroller.removeEventListener("scroll", update);
    };
  }, [ref, update, inScrollArea]);
  return update;
}

/** Table: semantic table structure wrapped in a container that handles scrolling. The look (row height, dividers, hover color) is all in the theme style. */
function TableRoot({
  size = "md",
  striped = false,
  hoverable = true,
  bordered = false,
  stickyHeader = false,
  loading = false,
  ...rest
}: TableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollable = useScrollable(ref, stickyHeader);
  const onScroll = useFixedColumns(ref, stickyHeader);
  const label = rest["aria-label"];
  // When content really overflows what scrolls and needs scrolling, it must be keyboard-focusable (so arrow keys can scroll it, WCAG 2.1.1)
  const focusable = scrollable
    ? { tabIndex: 0, ...(label ? { role: "region", "aria-label": label } : null) }
    : null;
  useEffect(() => {
    // With a fixed header the scroller is the ScrollArea's viewport, not an element of ours: the same attributes go on it
    const viewport = ref.current?.querySelector<HTMLElement>(VIEWPORT);
    if (!viewport) return;
    if (scrollable) {
      viewport.tabIndex = 0;
      if (typeof label === "string") {
        viewport.setAttribute("role", "region");
        viewport.setAttribute("aria-label", label);
      }
    } else {
      viewport.removeAttribute("tabindex");
      viewport.removeAttribute("role");
      viewport.removeAttribute("aria-label");
    }
  }, [scrollable, label, stickyHeader]);
  const table = (
    <table
      {...rest}
      data-slot="table"
      data-size={size}
      data-striped={striped ? "" : undefined}
      data-hoverable={hoverable ? "" : undefined}
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
    />
  );
  return (
    <div
      ref={ref}
      data-slot="table-container"
      data-bordered={bordered ? "" : undefined}
      data-sticky={stickyHeader ? "" : undefined}
      onScroll={stickyHeader ? undefined : onScroll}
      {...(stickyHeader ? null : focusable)}
    >
      {stickyHeader ? <ScrollArea orientation="both">{table}</ScrollArea> : table}
    </div>
  );
}

const TableHeader = (props: Without<ComponentPropsWithoutRef<"thead">>) => (
  <thead {...props} data-slot="table-header" />
);
const TableBody = (props: Without<ComponentPropsWithoutRef<"tbody">>) => (
  <tbody {...props} data-slot="table-body" />
);
const TableFooter = (props: Without<ComponentPropsWithoutRef<"tfoot">>) => (
  <tfoot {...props} data-slot="table-footer" />
);
const TableCaption = (props: Without<ComponentPropsWithoutRef<"caption">>) => (
  <caption {...props} data-slot="table-caption" />
);

export interface TableRowProps extends Without<ComponentPropsWithoutRef<"tr">> {
  /** Selected state: highlights this row and writes aria-selected. */
  selected?: boolean;
  /** This row is expanded (followed by `Table.ExpandedRow`): affects appearance only; the expand button's state is carried by `Table.ExpandButton` itself. */
  expanded?: boolean;
  /** The row the page is showing (the one whose details are open beside the table): highlighted like a selected row, and `aria-current`. Unlike `selected` it says nothing about ticking. */
  active?: boolean;
  /** The row does something when it is clicked (you write the `onClick`): the pointer shows it and the row has a focus ring (give it `tabIndex={0}` and an Enter / Space handler to reach it by keyboard). */
  interactive?: boolean;
}

function TableRow({ selected, expanded, active, interactive, ...rest }: TableRowProps) {
  return (
    <tr
      {...rest}
      data-slot="table-row"
      data-selected={selected ? "" : undefined}
      data-expanded={expanded ? "" : undefined}
      data-active={active ? "" : undefined}
      data-interactive={interactive ? "" : undefined}
      aria-selected={selected || undefined}
      aria-current={active ? "true" : undefined}
    />
  );
}

export interface TableHeadProps extends Omit<Without<ComponentPropsWithoutRef<"th">>, "align"> {
  /** Horizontal alignment of the content. */
  align?: TableAlign;
  /** select: the checkbox column, fixed narrow width and centered; expand: the column of the expand buttons. */
  kind?: "select" | "expand";
  /**
   * Fixed column: sticks to the container's left (start) / right (end) edge during horizontal scrolling. Fixed columns in a row must come first (last),
   * and the table needs horizontal width (e.g. give columns a minimum width) for it to actually scroll.
   */
  fixed?: TableFixed;
  /** Keep the header's text on one line (`white-space: nowrap`). */
  nowrap?: boolean;
  /** Sortable: the header gets an extra button and a sort icon. */
  sortable?: boolean;
  /** Current sort direction; if omitted, the table is not sorted by this column. */
  sort?: TableSort;
  /** Called when the sort button is clicked; the caller decides the next direction and updates `sort`. */
  onSort?: () => void;
  /** Column width (px), owned by the caller; once set, this column has a fixed width. To make the width follow dragging, combine with `resizable` + `onResize`. */
  width?: number;
  /** Smallest width (px) the column shrinks to when the table is narrower than its content wants (auto layout): a title that should stay readable. Not the minimum while resizing (that is `minWidth`). */
  minColumnWidth?: number;
  /** Resizable column width: the header's right edge gets a drag handle (pointer drag, or when focused the left / right arrow keys, Shift for a larger step, Home / End for min / max). */
  resizable?: boolean;
  /**
   * Minimum width (px) when resizing.
   * @default 48
   */
  minWidth?: number;
  /** Maximum width (px) when resizing; no limit if omitted. */
  maxWidth?: number;
  /** Dragging or a key press produced a new width: store it and pass it back to `width`. */
  onResize?: (width: number) => void;
  /** One resize ended: the pointer was released (the width is the last value; not triggered if it never moved), or after each key press. A good place to persist / send a request. */
  onResizeEnd?: (width: number) => void;
  /** Accessible name of the handle, default "Resize column". */
  resizeLabel?: string;
}

/** Minimum width (px) a column without a width takes in fixed layout. */
const FILLER_MIN = 96;
const RESIZE_MIN = 48;
const RESIZE_STEP = 10;
const RESIZE_STEP_LARGE = 50;

function SortIcon() {
  return (
    <span data-slot="table-sort-icon" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path data-part="up" d="m8 9 4-4 4 4" />
        <path data-part="down" d="m8 15 4 4 4-4" />
      </svg>
    </span>
  );
}

function TableHead({
  align,
  kind,
  fixed,
  nowrap,
  sortable,
  sort,
  onSort,
  width,
  minColumnWidth,
  resizable,
  minWidth = RESIZE_MIN,
  maxWidth,
  onResize,
  onResizeEnd,
  resizeLabel: resizeLabelProp,
  children,
  ...rest
}: TableHeadProps) {
  const t = useLabels("table");
  const resizeLabel = resizeLabelProp ?? t.resizeColumn;
  const ref = useRef<HTMLTableCellElement>(null);
  const drag = useRef<{ x: number; width: number; last: number | null } | null>(null);
  const [resizing, setResizing] = useState(false);
  // The width is written as a CSS variable (read by the theme style); a layout effect is used so fixed columns measure the new width
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (width === undefined) el.style.removeProperty("--tbl-col-w");
    else el.style.setProperty("--tbl-col-w", `${width}px`);
  }, [width]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (minColumnWidth === undefined) el.style.removeProperty("--tbl-col-min");
    else el.style.setProperty("--tbl-col-min", `${minColumnWidth}px`);
  }, [minColumnWidth]);

  const clamp = (w: number) => Math.min(Math.max(Math.round(w), minWidth), maxWidth ?? Infinity);
  const current = () => width ?? ref.current?.offsetWidth ?? minWidth;
  const direction = () =>
    ref.current && getComputedStyle(ref.current).direction === "rtl" ? -1 : 1;
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, width: current(), last: null };
    setResizing(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const start = drag.current;
    if (!start) return;
    const next = clamp(start.width + direction() * (e.clientX - start.x));
    start.last = next;
    onResize?.(next);
  };
  const endDrag = () => {
    const last = drag.current?.last;
    drag.current = null;
    setResizing(false);
    if (last != null) onResizeEnd?.(last);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const step = e.shiftKey ? RESIZE_STEP_LARGE : RESIZE_STEP;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = current() + direction() * step;
    else if (e.key === "ArrowLeft") next = current() - direction() * step;
    else if (e.key === "Home") next = minWidth;
    else if (e.key === "End" && maxWidth !== undefined) next = maxWidth;
    if (next === null) return;
    e.preventDefault();
    const width = clamp(next);
    onResize?.(width);
    onResizeEnd?.(width);
  };

  return (
    <th
      {...rest}
      ref={ref}
      data-slot="table-head"
      data-align={align}
      data-kind={kind}
      data-fixed={fixed}
      data-nowrap={nowrap ? "" : undefined}
      data-width={width}
      data-min-width={minColumnWidth}
      data-resizable={resizable ? "" : undefined}
      data-resizing={resizing ? "" : undefined}
      data-sortable={sortable ? "" : undefined}
      data-sort={sortable ? sort : undefined}
      aria-sort={
        sortable
          ? sort === "asc"
            ? "ascending"
            : sort === "desc"
              ? "descending"
              : "none"
          : undefined
      }
    >
      {sortable ? (
        <button type="button" data-slot="table-sort-button" onClick={onSort}>
          <span data-slot="table-head-content">{children}</span>
          <SortIcon />
        </button>
      ) : (
        children
      )}
      {resizable ? (
        <span
          data-slot="table-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label={resizeLabel}
          aria-valuenow={width}
          aria-valuemin={minWidth}
          aria-valuemax={maxWidth}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onKeyDown={onKeyDown}
        />
      ) : null}
    </th>
  );
}

export interface TableCellProps extends Omit<Without<ComponentPropsWithoutRef<"td">>, "align"> {
  /** Horizontal alignment of the content; write the same value as on the column's `Table.Head`. */
  align?: TableAlign;
  /** select: the checkbox column; expand: the column of the expand buttons (`Table.ExpandButton`). */
  kind?: "select" | "expand";
  /** Fixed column, same as `fixed` on `Table.Head`: write it on both the header and every cell of the same column. */
  fixed?: TableFixed;
  /** Keep the cell's content on one line (`white-space: nowrap`): a date, an id; write it on the header too. */
  nowrap?: boolean;
}

function TableCell({ align, kind, fixed, nowrap, ...rest }: TableCellProps) {
  return (
    <td
      {...rest}
      data-slot="table-cell"
      data-align={align}
      data-kind={kind}
      data-fixed={fixed}
      data-nowrap={nowrap ? "" : undefined}
    />
  );
}

export type TableEditValue = string | number | null;

export interface TableEditableCellProps extends Omit<
  Without<ComponentPropsWithoutRef<"td">>,
  "align" | "children" | "onChange"
> {
  /** Horizontal alignment of the content, same as `align` on `Table.Cell`. */
  align?: TableAlign;
  /** Fixed column, same as `fixed` on `Table.Cell`. */
  fixed?: TableFixed;
  /** Current value, owned by the caller. */
  value: TableEditValue;
  /** A new value was committed (Enter, blur, an option selected): store it and pass it back to `value`. Not triggered if the value did not change. */
  onCommit: (value: TableEditValue) => void;
  /**
   * Editing control: text, number (empty text commits null), select (requires `options`).
   * @default "text"
   */
  type?: "text" | "number" | "select";
  /** Choices of the select control (`type="select"`), `{ value, label }`. */
  options?: SelectOption[];
  /** Name of this column: must be included in the accessible names of the button and input (so screen readers know which column is being edited). */
  label: string;
  /** Validation: returning an error text blocks the commit, stays in edit mode and shows the error; returning empty means it passes. */
  validate?: (value: TableEditValue) => string | null | undefined;
  /**
   * Placeholder shown when the value is empty.
   * @default "—"
   */
  placeholder?: string;
  disabled?: boolean;
  /** Content shown normally; the value itself if omitted (select shows the option's text). */
  children?: ReactNode;
}

/**
 * Inline-edit cell: normally a button showing the value; click / Enter / F2 enters edit mode; Enter or blur commits, Esc cancels,
 * and if validation fails it stays in edit mode showing the error (reverting on blur). The value is owned by the caller; this only handles interaction.
 */
function TableEditableCell({
  align,
  fixed,
  value,
  onCommit,
  type = "text",
  options = [],
  label,
  validate,
  placeholder = "—",
  disabled,
  children,
  ...rest
}: TableEditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cellRef = useRef<HTMLTableCellElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef(false);
  const errorId = useId();

  const shown =
    type === "select"
      ? (options.find((o) => o.value === String(value))?.label ?? null)
      : value === null || value === ""
        ? null
        : String(value);
  const text = typeof shown === "string" || typeof shown === "number" ? String(shown) : "";

  const start = () => {
    // First measure the current width and write it as a CSS variable, which the theme style uses to lock this cell: the input being edited must not stretch the column however wide it is
    const width = cellRef.current?.offsetWidth ?? 0;
    if (width > 0) cellRef.current?.style.setProperty("--tbl-edit-w", `${width}px`);
    setDraft(value === null ? "" : String(value));
    setError(null);
    setEditing(true);
  };
  const exit = (focusTrigger: boolean) => {
    restoreFocus.current = focusTrigger;
    setEditing(false);
    setError(null);
  };
  // Select all when entering edit mode; return focus to the button after exiting (keyboard)
  useEffect(() => {
    if (editing) {
      input.current?.select();
      return;
    }
    cellRef.current?.style.removeProperty("--tbl-edit-w");
    if (restoreFocus.current) {
      restoreFocus.current = false;
      trigger.current?.focus();
    }
  }, [editing]);

  const parse = (raw: string): TableEditValue => {
    if (type !== "number") return raw;
    return raw.trim() === "" ? null : Number(raw);
  };
  const commit = (raw: string, focusTrigger: boolean) => {
    const next = parse(raw);
    if (typeof next === "number" && Number.isNaN(next)) {
      setError("Enter a number");
      return false;
    }
    const message = validate?.(next);
    if (message) {
      setError(message);
      return false;
    }
    if (next !== value && !(next === "" && value === null)) onCommit(next);
    exit(focusTrigger);
    return true;
  };

  return (
    <td
      {...rest}
      ref={cellRef}
      data-slot="table-cell"
      data-align={align}
      data-fixed={fixed}
      data-editable={disabled ? undefined : ""}
      data-editing={editing ? "" : undefined}
    >
      {disabled ? (
        (children ?? (text || placeholder))
      ) : editing ? (
        type === "select" ? (
          <Select
            size="sm"
            fullWidth
            aria-label={label}
            options={options}
            value={value === null ? null : String(value)}
            defaultOpen
            onValueChange={(v) => {
              if (v !== null) commit(v, true);
            }}
            onOpenChange={(open) => {
              if (!open) exit(true);
            }}
          />
        ) : (
          <>
            <Input
              ref={input}
              size="sm"
              fullWidth
              autoFocus
              type={type === "number" ? "number" : "text"}
              aria-label={label}
              aria-describedby={error ? errorId : undefined}
              invalid={!!error}
              value={draft}
              onValueChange={(v) => {
                setDraft(v);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit(draft, true);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  exit(true);
                }
              }}
              onBlur={() => {
                // Blur: commit if possible, revert if invalid
                if (!commit(draft, false)) exit(false);
              }}
            />
            {error ? (
              <span id={errorId} data-slot="table-edit-error" role="alert">
                {error}
              </span>
            ) : null}
          </>
        )
      ) : (
        <button
          ref={trigger}
          type="button"
          data-slot="table-edit-trigger"
          data-placeholder={text || children ? undefined : ""}
          // The name must contain the visible text (WCAG 2.5.3), followed by the column name
          aria-label={`${text || placeholder}, ${label}`}
          onClick={start}
          onKeyDown={(e) => {
            if (e.key === "F2") {
              e.preventDefault();
              start();
            }
          }}
        >
          {children ?? (text || placeholder)}
        </button>
      )}
    </td>
  );
}

export interface TableEmptyProps extends Without<ComponentPropsWithoutRef<"td">> {
  /** Number of columns to span. */
  colSpan: number;
}

/** Empty state row: one row spanning all columns, with the hint centered. */
function TableEmpty(props: TableEmptyProps) {
  return (
    <tr data-slot="table-row" data-empty="">
      <td {...props} data-slot="table-empty" />
    </tr>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export interface TableExpandButtonProps extends Omit<
  Without<ComponentPropsWithoutRef<"button">>,
  "onClick" | "children"
> {
  /** Whether it is expanded, owned by the caller. */
  expanded: boolean;
  /** Called on click: flip `expanded` for this row. */
  onToggle: () => void;
}

/** Expand / collapse button: placed in a cell with `kind="expand"`. `aria-controls` points to the id of the corresponding `Table.ExpandedRow`. */
function TableExpandButton({ expanded, onToggle, ...rest }: TableExpandButtonProps) {
  const t = useLabels("table");
  return (
    <button
      type="button"
      aria-label={expanded ? t.collapseRow : t.expandRow}
      {...rest}
      data-slot="table-expand-button"
      data-expanded={expanded ? "" : undefined}
      aria-expanded={expanded}
      onClick={onToggle}
    >
      <ChevronIcon />
    </button>
  );
}

export interface TableExpandedRowProps extends Without<ComponentPropsWithoutRef<"td">> {
  /** Number of columns to span (including the column of the expand button). */
  colSpan: number;
}

/** Expanded content row: directly after its data row, one cell spanning all columns. Rendered only when expanded. */
function TableExpandedRow(props: TableExpandedRowProps) {
  return (
    <tr data-slot="table-expanded-row">
      <td {...props} data-slot="table-expanded-cell" />
    </tr>
  );
}

export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Caption: TableCaption,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  Empty: TableEmpty,
  EditableCell: TableEditableCell,
  ExpandButton: TableExpandButton,
  ExpandedRow: TableExpandedRow,
});
