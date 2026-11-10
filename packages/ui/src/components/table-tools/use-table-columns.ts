import { useState } from "react";
import type { TableToolsColumn } from "./table-tools.tsx";

/**
 * Which columns a table shows and in which order, for the columns button of `TableTools`: all of `keys` shown, in that order, until the user
 * changes it. Returns `shown` (the keys to render, in order) and `tools`, the props to spread into `TableTools`: `<TableTools {...cols.tools} />`.
 * `label` gives a column's name in the menu.
 */
export function useTableColumns<K extends string>(keys: readonly K[], label: (key: K) => string) {
  const [order, setOrder] = useState<K[]>([...keys]);
  const [visible, setVisible] = useState<string[]>([...keys]);
  const columns: TableToolsColumn[] = order.map((key) => ({ key, label: label(key) }));
  return {
    /** The keys of the columns to render, in their order. */
    shown: order.filter((key) => visible.includes(key)),
    /** The columns, in their order, and which are shown: `TableTools` props. */
    tools: {
      columns,
      visible,
      onVisibleChange: setVisible,
      onOrderChange: (next: string[]) => setOrder(next as K[]),
    },
  };
}
