import type { ReactNode } from "react";
import type { TableAlign, TableFixed, TableSort, UISize } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { Button } from "../button/index.ts";
import { Checkbox } from "../checkbox/index.ts";
import { Flex } from "../layout/index.ts";
import { Popconfirm } from "../popconfirm/index.ts";
import { Table } from "../table/index.ts";

export interface DataTableColumn<Row> {
  /** Identifies the column (the key of its cells and of the sort); also the field of the row shown when there is no `render`. */
  key: string;
  /** Text of the header. */
  title: ReactNode;
  /** What the cell shows for a row; without it, the row's field named `key` as text (a string, a number or a boolean; anything else needs a `render`). */
  render?: (row: Row, index: number) => ReactNode;
  /** Horizontal alignment of the header and the cells. */
  align?: TableAlign;
  /** Column width (px): once set, this column has a fixed width. */
  width?: number;
  /** Smallest width (px) the column shrinks to in a narrow table: a title that should stay readable instead of wrapping to a few characters per line. */
  minWidth?: number;
  /** Sticks to the left (start) or right (end) edge while the table scrolls sideways. */
  fixed?: TableFixed;
  /** The header gets a sort button; the sort itself is yours (`sort` / `onSortChange`). */
  sortable?: boolean;
  /** Keep the header and the cells of the column on one line (`white-space: nowrap`): a date, an id. */
  nowrap?: boolean;
}

/** An action in the last column of a row: a ghost button, or one that asks first when it has `confirm`. */
export interface DataTableAction {
  /** Identifies the action in the row. */
  key: string;
  /** Text of the button. */
  label: ReactNode;
  /** `danger` for a destructive action such as delete. */
  color?: "primary" | "danger" | "neutral";
  disabled?: boolean;
  /**
   * Asks before it runs: the question (shown in a popover with the action's label as the confirm button), or
   * `{ title, description, confirmLabel, cancelLabel }`. While the promise `onClick` returns is pending, the confirm button spins.
   */
  confirm?:
    | ReactNode
    | {
        title: ReactNode;
        description?: ReactNode;
        confirmLabel?: ReactNode;
        cancelLabel?: ReactNode;
      };
  /** What the action does. When it returns a promise (of anything), the confirm button spins until it settles. */
  onClick: () => unknown;
}

export interface DataTableSort {
  /** The `key` of the column. */
  key: string;
  order: TableSort;
}

export interface DataTableProps<Row> {
  /** The columns, in order. */
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  /** A row's identity: the name of a field holding a string or a number, or a function. */
  rowKey: (keyof Row & string) | ((row: Row, index: number) => string);
  /** The table is loading: the body fades and cannot be clicked; with no rows, the empty row says "Loading…". */
  loading?: boolean;
  /** What the table says when there are no rows; defaults to the locale's "No data". */
  empty?: ReactNode;
  /**
   * The actions of a row, in order. Falsy entries are skipped, so a permission reads naturally:
   * `(row) => [can("edit") && { key: "edit", label: "Edit", onClick: … }]`. A row with none has an empty cell.
   */
  actions?: (row: Row, index: number) => readonly (DataTableAction | false | null | undefined)[];
  /** Keys of the selected rows; giving it (with `onSelectedChange`) adds the checkbox column. */
  selected?: readonly string[];
  onSelectedChange?: (keys: string[]) => void;
  /** The column the rows are sorted by, and how. */
  sort?: DataTableSort | null;
  /**
   * A sort button was clicked: the next sort, which goes ascending, then descending, then (`null`) back to none.
   * Sorting the rows (or asking the server to) is yours.
   */
  onSortChange?: (sort: DataTableSort | null) => void;
  /** Size step of the rows. */
  size?: UISize;
  striped?: boolean;
  bordered?: boolean;
  /**
   * Highlight rows on hover.
   * @default true
   */
  hoverable?: boolean;
  /**
   * Keep the header in view and scroll only the rows: the table fills the height of its parent, which has to be constrained (a box with a height, or a flex column that has one: `Card fill`, `Flex grow`). Without it the table is as tall as its rows and the page scrolls.
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * The key of the row the page is showing (the one whose details are open beside the table): it is highlighted and has `aria-current`.
   * It has nothing to do with `selected`, the ticked rows.
   */
  activeKey?: string;
  /**
   * Makes the rows clickable (pointer, focus ring, Enter / Space on a focused row): called with the row. A click on a link, a button, an input
   * or anything else inside the row that does something of its own (the checkbox, the actions, a popover's content) does not count, and neither
   * does one that ends a text selection.
   */
  onRowClick?: (row: Row, index: number) => void;
}

/** Things in a row that do something of their own: a click on them is not a click on the row. */
const OWN_ACTION =
  'a, button, input, select, textarea, label, summary, [role="button"], [role="checkbox"], [role="switch"], [role="menuitem"], [role="combobox"]';

/** Is this click on the row itself: inside the row (a popover's content is portalled, but its events still bubble here), not on something with an action, not the end of a text selection. */
function isRowClick(row: HTMLElement, target: EventTarget): boolean {
  if (!(target instanceof Element) || !row.contains(target)) return false;
  const own = target.closest(OWN_ACTION);
  if (own && row.contains(own)) return false;
  return !window.getSelection()?.toString();
}

/** A field shown without `render`: text, a number or a boolean as it reads; anything else needs a `render`. */
const plainText = (value: unknown) =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean" ||
  typeof value === "bigint"
    ? String(value)
    : "";

const NEXT_SORT: Record<string, TableSort | null> = { none: "asc", asc: "desc", desc: null };

/**
 * A table from data: `columns` and `rows`, with the loading and empty states, an optional checkbox column
 * (`selected` / `onSelectedChange`), sorting (`sort` / `onSortChange`) and an actions column (`actions`) whose buttons
 * can ask for confirmation first. It is the table of a list page, ready made; for anything beyond it (expandable rows,
 * editable cells, a footer), use `Table` and its parts.
 *
 * Theme style: it is Table, Checkbox, Button and Popconfirm and has no slot of its own.
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty,
  actions,
  selected,
  onSelectedChange,
  sort,
  onSortChange,
  size,
  striped,
  bordered,
  hoverable = true,
  stickyHeader = false,
  activeKey,
  onRowClick,
}: DataTableProps<Row>) {
  const t = useLabels("dataTable");
  const keyOf = (row: Row, index: number) =>
    typeof rowKey === "function" ? rowKey(row, index) : String(row[rowKey]);
  const keys = rows.map(keyOf);
  const selectable = selected !== undefined && onSelectedChange !== undefined;
  const chosen = selected ?? [];
  const allSelected = keys.length > 0 && keys.every((k) => chosen.includes(k));
  // The actions column exists when actions are given; its width is that of the buttons
  const hasActions = actions !== undefined;
  const span = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <Table
      size={size}
      striped={striped}
      bordered={bordered}
      hoverable={hoverable}
      stickyHeader={stickyHeader}
      loading={loading}
    >
      <Table.Header>
        <Table.Row>
          {selectable ? (
            <Table.Head kind="select">
              <Checkbox
                aria-label={t.selectAll}
                checked={allSelected}
                indeterminate={!allSelected && keys.some((k) => chosen.includes(k))}
                onCheckedChange={(checked) => onSelectedChange(checked ? keys : [])}
              />
            </Table.Head>
          ) : null}
          {columns.map((c) => {
            const order = sort?.key === c.key ? sort.order : undefined;
            return (
              <Table.Head
                key={c.key}
                align={c.align}
                width={c.width}
                minColumnWidth={c.minWidth}
                fixed={c.fixed}
                nowrap={c.nowrap}
                sortable={c.sortable}
                sort={order}
                onSort={
                  c.sortable
                    ? () => {
                        const next = NEXT_SORT[order ?? "none"];
                        onSortChange?.(next ? { key: c.key, order: next } : null);
                      }
                    : undefined
                }
              >
                {c.title}
              </Table.Head>
            );
          })}
          {hasActions ? <Table.Head aria-label={t.actions} /> : null}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.length === 0 ? (
          <Table.Empty colSpan={span}>{loading ? t.loading : (empty ?? t.empty)}</Table.Empty>
        ) : (
          rows.map((row, index) => {
            const key = keys[index]!;
            const isSelected = chosen.includes(key);
            return (
              <Table.Row
                key={key}
                selected={selectable ? isSelected : undefined}
                active={activeKey !== undefined && activeKey === key}
                interactive={onRowClick ? true : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={
                  onRowClick
                    ? (event) => {
                        if (!isRowClick(event.currentTarget, event.target)) return;
                        onRowClick(row, index);
                      }
                    : undefined
                }
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        // Only a key pressed on the row itself: Enter / Space in a field or on a button inside is theirs
                        if (event.target !== event.currentTarget) return;
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        onRowClick(row, index);
                      }
                    : undefined
                }
              >
                {selectable ? (
                  <Table.Cell kind="select">
                    <Checkbox
                      aria-label={t.selectRow}
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        onSelectedChange(
                          checked ? [...chosen, key] : chosen.filter((k) => k !== key),
                        )
                      }
                    />
                  </Table.Cell>
                ) : null}
                {columns.map((c) => (
                  <Table.Cell key={c.key} align={c.align} fixed={c.fixed} nowrap={c.nowrap}>
                    {c.render
                      ? c.render(row, index)
                      : plainText((row as Record<string, unknown>)[c.key])}
                  </Table.Cell>
                ))}
                {hasActions ? (
                  <Table.Cell>
                    <Flex gap="xs">
                      {(actions(row, index) ?? [])
                        .filter((a): a is DataTableAction => Boolean(a))
                        .map((a) => (
                          <ActionButton key={a.key} action={a} />
                        ))}
                    </Flex>
                  </Table.Cell>
                ) : null}
              </Table.Row>
            );
          })
        )}
      </Table.Body>
    </Table>
  );
}

function ActionButton({ action }: { action: DataTableAction }) {
  const button = (
    <Button
      size="sm"
      variant="ghost"
      color={action.color}
      disabled={action.disabled}
      onClick={action.confirm === undefined ? () => void action.onClick() : undefined}
    >
      {action.label}
    </Button>
  );
  if (action.confirm === undefined) return button;
  const ask =
    typeof action.confirm === "object" && action.confirm !== null && "title" in action.confirm
      ? action.confirm
      : { title: action.confirm };
  return (
    <Popconfirm
      tone={action.color === "danger" ? "danger" : "default"}
      title={ask.title}
      description={"description" in ask ? ask.description : undefined}
      confirmLabel={("confirmLabel" in ask ? ask.confirmLabel : undefined) ?? action.label}
      cancelLabel={"cancelLabel" in ask ? ask.cancelLabel : undefined}
      onConfirm={async () => {
        await action.onClick();
      }}
    >
      {button}
    </Popconfirm>
  );
}
