import type { ReactNode } from "react";
import type { TableToolbarLabels } from "../../locales/messages.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { Button } from "../button/index.ts";
import { SearchInput } from "../input/index.ts";
import type { InputWidth } from "../../contract.ts";
import { Flex } from "../layout/index.ts";
import { QueryBuilder } from "../query-builder/index.ts";
import type { QueryBuilderCapabilities, QueryField, QueryFilter } from "../query-builder/index.ts";

export interface TableToolbarProps {
  /** What is typed in the search box. The box shows when `onSearch` is given. */
  keyword?: string;
  onKeywordChange?: (keyword: string) => void;
  /** Called on Enter (not while an input method is composing), the search button and the clear button. */
  onSearch?: (keyword: string) => void;
  /** Hint in the search box. */
  searchPlaceholder?: string;
  /**
   * Width of the search box: `sm` 10rem, `md` 14rem, `lg` 20rem.
   * @default "lg"
   */
  searchWidth?: InputWidth;
  /** What can be filtered: the conditions as chips with a "Filter" button. Shown when `onFilterChange` is given. */
  fields?: readonly QueryField[];
  /** The filter in use. */
  filter?: QueryFilter;
  onFilterChange?: (filter: QueryFilter | undefined) => void;
  /** What the backend can do (see QueryBuilder). */
  capabilities?: QueryBuilderCapabilities;
  /** Clear the keyword and the filter: the "Reset" button shows when this is given and there is a keyword or a filter. */
  onReset?: () => void;
  /** More in the row of the search, after the filter. */
  children?: ReactNode;
  /** A row under the search, on the left: "Save as a view". */
  below?: ReactNode;
  /** On the right: usually TableTools. */
  tools?: ReactNode;
  /** Texts for another language; the default follows the `locale` of ConfigProvider. */
  labels?: Partial<TableToolbarLabels>;
}

/**
 * Table toolbar: the row above a table: the search box and the conditions (QueryBuilder) on the left, the table's tools (TableTools) on the right, and a "Reset" when something is set.
 * It holds no state: `keyword` and `filter` are yours, and `onSearch` / `onFilterChange` tell you when to ask the list again.
 * Each part shows when its props are given, so a table with only a search box, or only tools, is the same component.
 */
export function TableToolbar({
  keyword = "",
  onKeywordChange,
  onSearch,
  searchPlaceholder,
  searchWidth = "lg",
  fields,
  filter,
  onFilterChange,
  capabilities,
  onReset,
  children,
  below,
  tools,
  labels,
}: TableToolbarProps) {
  const t = { ...useLabels("tableToolbar"), ...labels };
  const hasSearch = Boolean(onSearch);
  const hasFilter = Boolean(onFilterChange && fields);
  const main = hasSearch || hasFilter || onReset || children;
  return (
    <Flex justify="between" align="start" gap="md">
      <Flex direction="column" gap="none" grow>
        {main ? (
          <Flex gap="sm" align="center" wrap>
            {hasSearch ? (
              <SearchInput
                width={searchWidth}
                size="sm"
                aria-label={t.search}
                placeholder={searchPlaceholder}
                value={keyword}
                onValueChange={onKeywordChange}
                onSearch={(value) => onSearch?.(value)}
              />
            ) : null}
            {hasFilter ? (
              <QueryBuilder
                fields={[...(fields ?? [])]}
                value={filter}
                onChange={(next) => onFilterChange?.(next)}
                capabilities={capabilities}
              />
            ) : null}
            {onReset && (keyword || filter) ? (
              <Button variant="ghost" size="sm" onClick={onReset}>
                {t.reset}
              </Button>
            ) : null}
            {children}
          </Flex>
        ) : null}
        {below}
      </Flex>
      {tools}
    </Flex>
  );
}
