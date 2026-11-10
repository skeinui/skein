import type { ComponentPropsWithoutRef } from "react";
import { Button } from "../button/index.ts";
import { Checkbox } from "../checkbox/index.ts";
import { Flex } from "../layout/index.ts";
import { Popover } from "../popover/index.ts";
import { Sortable, arrayMove } from "../sortable/index.ts";
import { Tooltip } from "../tooltip/index.ts";
import { useLabels } from "../../locales/use-labels.ts";
import type { TableToolsLabels } from "../../locales/messages.ts";
import { downloadCsv } from "./csv.ts";
import type { CsvData } from "./csv.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface TableToolsColumn {
  /** Identifies the column; what `visible` and `onOrderChange` use. */
  key: string;
  /** The column's name in the list. */
  label: string;
}

export interface TableToolsProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Reload the list: the refresh button is shown when this is given. */
  onRefresh?: () => void;
  /** The list is being reloaded: the refresh icon turns (and the button ignores clicks until it is done). */
  refreshing?: boolean;
  /**
   * The header is fixed and only the rows scroll (the table gets `stickyHeader`, the card `fill`, the page `fill`); the button is shown when
   * `onFixedChange` is given. `useFixedHeader` keeps the user's choice.
   */
  fixed?: boolean;
  onFixedChange?: (fixed: boolean) => void;
  /** The columns in their order: the button for which to show and where is shown when `columns`, `visible`, `onVisibleChange` and `onOrderChange` are all given. */
  columns?: readonly TableToolsColumn[];
  /** The keys of the columns shown. */
  visible?: readonly string[];
  /** A column was shown or hidden: the keys now shown, in the order of `columns`. */
  onVisibleChange?: (visible: string[]) => void;
  /** A column was moved: all keys in the new order. */
  onOrderChange?: (keys: string[]) => void;
  /** Download what the table shows as you do it yourself; the button is shown when this is given. For a CSV file give `exportCsv` instead. */
  onExport?: () => void;
  /**
   * Download what the table shows as a CSV file: called when the button is pressed (so it reads the rows on screen then) and gives the file's
   * name, the header row and the rows; the file is UTF-8 with a byte order mark, which Excel needs to read Chinese. The button is shown when this is given.
   */
  exportCsv?: () => CsvData;
  /** Texts of the buttons, for another language. */
  labels?: Partial<TableToolsLabels>;
}

const Icon = ({ children, spinning }: { children: React.ReactNode; spinning?: boolean }) => (
  <svg
    data-spinning={spinning ? "" : undefined}
    viewBox="0 0 24 24"
    width={16}
    height={16}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/**
 * TableTools: the tools of a table, on the right of its toolbar: refresh, a fixed header, which columns to show and in which order, and export.
 * Each button is shown when its props are given; what they do is yours (reload, `stickyHeader`, hide / move columns, write the file).
 * To keep the user's choice of a fixed header use `useFixedHeader`.
 */
export function TableTools({
  onRefresh,
  refreshing,
  fixed,
  onFixedChange,
  columns,
  visible,
  onVisibleChange,
  onOrderChange,
  onExport,
  exportCsv,
  labels,
  ...rest
}: TableToolsProps) {
  const t = { ...useLabels("tableTools"), ...labels };
  return (
    <div {...rest} data-slot="table-tools" aria-busy={refreshing || undefined}>
      <Flex gap="xs" align="center">
        {onRefresh ? (
          <Tooltip content={t.refresh}>
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              iconOnly
              aria-label={t.refresh}
              // While it reloads the icon itself turns; a second click would only start another request
              onClick={() => {
                if (!refreshing) onRefresh();
              }}
            >
              <Icon spinning={refreshing}>
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </Icon>
            </Button>
          </Tooltip>
        ) : null}
        {onFixedChange ? (
          <Tooltip content={t.fixed}>
            <Button
              variant={fixed ? "soft" : "ghost"}
              color={fixed ? "primary" : "neutral"}
              size="sm"
              iconOnly
              aria-label={t.fixed}
              aria-pressed={Boolean(fixed)}
              onClick={() => onFixedChange(!fixed)}
            >
              <Icon>
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
              </Icon>
            </Button>
          </Tooltip>
        ) : null}
        {columns && visible && onVisibleChange && onOrderChange ? (
          <Popover>
            <Tooltip content={t.columns}>
              <Popover.Trigger
                render={
                  <Button
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    iconOnly
                    aria-label={t.columns}
                  />
                }
              >
                <Icon>
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                </Icon>
              </Popover.Trigger>
            </Tooltip>
            <Popover.Content align="end">
              <div data-slot="table-tools-columns">
                <Sortable
                  variant="list"
                  aria-label={t.columns}
                  items={columns.map((c) => ({
                    id: c.key,
                    label: c.label,
                    content: (
                      <Checkbox
                        checked={visible.includes(c.key)}
                        onCheckedChange={(checked) =>
                          onVisibleChange(
                            checked
                              ? columns
                                  .map((x) => x.key)
                                  .filter((k) => k === c.key || visible.includes(k))
                              : visible.filter((k) => k !== c.key),
                          )
                        }
                      >
                        {c.label}
                      </Checkbox>
                    ),
                  }))}
                  onReorder={(_, { from, to }) =>
                    onOrderChange(arrayMove([...columns], from, to).map((c) => c.key))
                  }
                />
              </div>
            </Popover.Content>
          </Popover>
        ) : null}
        {onExport || exportCsv ? (
          <Tooltip content={t.export}>
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              iconOnly
              aria-label={t.export}
              onClick={() => {
                if (exportCsv) {
                  const { filename, headers, rows } = exportCsv();
                  downloadCsv(filename, headers, rows);
                }
                onExport?.();
              }}
            >
              <Icon>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </Icon>
            </Button>
          </Tooltip>
        ) : null}
      </Flex>
    </div>
  );
}
