import { useState } from "react";
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
  /**
   * What is typed in the search box. The box shows when `onSearch` is given. Leave it out and the box keeps what is typed itself (and "Reset"
   * clears it); give it to set the text from outside, such as when a saved search is picked.
   */
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
 * It holds no search state: `filter` is yours, and `onSearch` / `onFilterChange` tell you when to ask the list again (the typed text is the box's own unless you pass `keyword`).
 * Each part shows when its props are given, so a table with only a search box, or only tools, is the same component.
 */
export function TableToolbar({
  keyword: keywordProp,
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
  const [typed, setTyped] = useState("");
  const keyword = keywordProp ?? typed;
  const changeKeyword = (next: string) => {
    setTyped(next);
    onKeywordChange?.(next);
  };
  const hasSearch = Boolean(onSearch);
  const hasFilter = Boolean(onFilterChange && fields);
  const main = hasSearch || hasFilter || onReset || children;
  const reset =
    onReset && (keyword || filter) ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setTyped("");
          onReset();
        }}
      >
        {t.reset}
      </Button>
    ) : null;
  /** The conditions with their "Filter" and "Reset": one line with the search box while there are none, a row of their own under it once there are chips */
  const builder = hasFilter ? (
    <QueryBuilder
      fields={[...(fields ?? [])]}
      value={filter}
      onChange={(next) => onFilterChange?.(next)}
      capabilities={capabilities}
    >
      {reset}
    </QueryBuilder>
  ) : null;
  const chipped = hasFilter && Boolean(filter);
  return (
    <Flex direction="column" gap="sm">
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
                  onValueChange={changeKeyword}
                  onSearch={(value) => onSearch?.(value)}
                />
              ) : null}
              {chipped ? null : builder}
              {hasFilter ? null : reset}
              {children}
            </Flex>
          ) : null}
        </Flex>
        {tools}
      </Flex>
      {/* Under the search and the tools, so the chips have the whole width: beside the tools they would wrap early and leave the space under them empty */}
      {chipped ? builder : null}
      {below}
    </Flex>
  );
}
