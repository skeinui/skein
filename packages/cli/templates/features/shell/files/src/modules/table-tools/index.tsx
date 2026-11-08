import { Button, Checkbox, Flex, Popover, Sortable, Tooltip, arrayMove } from "@skeinui/ui";
import { Columns3, Download, RefreshCw } from "lucide-react";
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
  /** Download what the table shows. */
  onExport?: () => void;
}

/** The table's tools, on the right of its toolbar: refresh, which columns to show, export. Each is shown when its props are given. */
export function TableTools({
  onRefresh,
  refreshing,
  columns,
  visible,
  onVisibleChange,
  onOrderChange,
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
