import { Button, Checkbox, Flex, Popover, Sortable, Tooltip, arrayMove } from "@skeinui/ui";
import { Columns3, Download, PanelTop, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTableToolsTranslation } from "./locales";

export interface ToolColumn {
  key: string;
  label: string;
}

export interface TableToolsProps {
  /** Reload the list. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** The columns in their order, the keys of the ones shown, and what changed: shown or hidden, moved. */
  columns?: ToolColumn[];
  visible?: readonly string[];
  onVisibleChange?: (visible: string[]) => void;
  onOrderChange?: (keys: string[]) => void;
  /** The header is fixed and only the rows scroll (the page passes it on: `Page fill`, `Card fill`, `DataTable stickyHeader`), and what changed. See `useFixedHeader`. */
  fixed?: boolean;
  onFixedChange?: (fixed: boolean) => void;
  /** Download what the table shows. */
  onExport?: () => void;
}

/**
 * Whether a table keeps its header fixed and scrolls only its rows, for the toggle of `TableTools`: `initial` until
 * the user chooses, then what they chose, remembered per `key` in this browser.
 */
export function useFixedHeader(key: string, initial = true) {
  const storageKey = `table-fixed-header:${key}`;
  const [fixed, setFixed] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === null ? initial : saved === "1";
    } catch {
      return initial;
    }
  });
  const change = (next: boolean) => {
    setFixed(next);
    try {
      localStorage.setItem(storageKey, next ? "1" : "0");
    } catch {
      // storage can be blocked: the choice then lasts until the page is closed
    }
  };
  return [fixed, change] as const;
}

/** The table's tools, on the right of its toolbar: refresh, fixed header, which columns to show, export. Each is shown when its props are given. */
export function TableTools({
  onRefresh,
  refreshing,
  columns,
  visible,
  onVisibleChange,
  onOrderChange,
  fixed,
  onFixedChange,
  onExport,
}: TableToolsProps) {
  const { t } = useTableToolsTranslation();
  return (
    <div className="table-tools">
      <Flex gap="xs" align="center">
        {onRefresh ? (
          <Tooltip content={t("refresh")}>
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              iconOnly
              aria-label={t("refresh")}
              loading={refreshing}
              onClick={onRefresh}
            >
              <RefreshCw size={16} />
            </Button>
          </Tooltip>
        ) : null}
        {onFixedChange ? (
          <Tooltip content={t("fixed")}>
            <Button
              variant={fixed ? "soft" : "ghost"}
              color={fixed ? "primary" : "neutral"}
              size="sm"
              iconOnly
              aria-label={t("fixed")}
              aria-pressed={Boolean(fixed)}
              onClick={() => onFixedChange(!fixed)}
            >
              <PanelTop size={16} />
            </Button>
          </Tooltip>
        ) : null}
        {columns && visible && onVisibleChange && onOrderChange ? (
          <Popover>
            <Tooltip content={t("columns")}>
              <Popover.Trigger
                render={
                  <Button
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    iconOnly
                    aria-label={t("columns")}
                  />
                }
              >
                <Columns3 size={16} />
              </Popover.Trigger>
            </Tooltip>
            <Popover.Content align="end">
              <div className="table-columns">
                <Sortable
                  variant="list"
                  aria-label={t("columns")}
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
                    onOrderChange(arrayMove(columns, from, to).map((c) => c.key))
                  }
                />
              </div>
            </Popover.Content>
          </Popover>
        ) : null}
        {onExport ? (
          <Tooltip content={t("export")}>
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              iconOnly
              aria-label={t("export")}
              onClick={onExport}
            >
              <Download size={16} />
            </Button>
          </Tooltip>
        ) : null}
      </Flex>
    </div>
  );
}
