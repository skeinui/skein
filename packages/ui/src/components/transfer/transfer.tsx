import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { UISize } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { Checkbox } from "../checkbox/index.ts";
import { Input } from "../input/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface TransferItem {
  /** Unique key; `value` holds the keys of the items on the right. */
  key: string;
  /** Text shown in the list; the search filters on it. */
  label: string;
  /** Disabled items cannot be selected, and are not selected by "select all". */
  disabled?: boolean;
}

export interface TransferProps {
  /** All selectable items (both sides combined). */
  items: TransferItem[];
  /** Keys of the items already on the right (the target list). */
  value?: string[];
  /**
   * Initial `value` when uncontrolled.
   * @default []
   */
  defaultValue?: string[];
  /** Called with the new keys after a move; pass `value` as well to control it. */
  onValueChange?: (keys: string[]) => void;
  /**
   * Titles of the left and right lists.
   * @default ["Source", "Target"]
   */
  titles?: [ReactNode, ReactNode];
  /**
   * Show a search box above each list, filtering by label; "select all" then only acts on the filtered items.
   * @default false
   */
  searchable?: boolean;
  /** Placeholder (and accessible name) of the search boxes, default the locale's "Search". */
  searchPlaceholder?: string;
  /** Text when a list is empty (or the search has no results), default the locale's "No data". */
  emptyText?: ReactNode;
  /**
   * Only allow moving from left to right; items on the right cannot be moved back (the right list has no checkboxes).
   * @default false
   */
  oneWay?: boolean;
  /**
   * Disables the whole transfer.
   * @default false
   */
  disabled?: boolean;
  /**
   * Size step: row height and font size.
   * @default "md"
   */
  size?: UISize;
  /**
   * Accessible text of the two move buttons: [move to right, move back to left].
   * @default ["Move to target", "Move to source"]
   */
  moveLabels?: [string, string];
  /** Accessible name, when there is no visible label. */
  "aria-label"?: string;
}

const Arrow = ({ dir }: { dir: "right" | "left" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={dir === "right" ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
  </svg>
);

interface ListProps {
  title: ReactNode;
  side: "source" | "target";
  items: TransferItem[];
  checked: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (keys: string[], on: boolean) => void;
  searchable: boolean;
  searchPlaceholder: string;
  emptyText: ReactNode;
  disabled: boolean;
  /** When false it is display only: no checkboxes (the right list in one-way transfer). */
  selectable: boolean;
}

function TransferList({
  title,
  side,
  items,
  checked,
  onToggle,
  onToggleAll,
  searchable,
  searchPlaceholder,
  emptyText,
  disabled,
  selectable,
}: ListProps) {
  const t = useLabels("transfer");
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items;
  }, [items, query]);
  const enabled = shown.filter((item) => !item.disabled);
  const checkedCount = items.filter((item) => checked.has(item.key)).length;
  const allChecked = enabled.length > 0 && enabled.every((item) => checked.has(item.key));
  const someChecked = enabled.some((item) => checked.has(item.key));

  return (
    // role="group" rather than <section>: a named section is a region landmark, which would add two landmarks per transfer
    <div
      role="group"
      data-slot="transfer-list"
      data-side={side}
      aria-label={typeof title === "string" ? title : side}
    >
      <div data-slot="transfer-header">
        {selectable ? (
          <Checkbox
            aria-label={t.selectAll}
            checked={allChecked}
            indeterminate={!allChecked && someChecked}
            disabled={disabled || enabled.length === 0}
            onCheckedChange={(on) =>
              onToggleAll(
                enabled.map((item) => item.key),
                on,
              )
            }
          />
        ) : null}
        <span data-slot="transfer-title">{title}</span>
        <span data-slot="transfer-count">
          {checkedCount}/{items.length}
        </span>
      </div>
      {searchable ? (
        <div data-slot="transfer-search">
          <Input
            size="sm"
            fullWidth
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
        </div>
      ) : null}
      <div data-slot="transfer-body" role="group">
        {shown.length === 0 ? (
          <div data-slot="transfer-empty">{emptyText}</div>
        ) : (
          shown.map((item) => (
            <div
              key={item.key}
              data-slot="transfer-item"
              data-checked={checked.has(item.key) ? "" : undefined}
              data-disabled={item.disabled || disabled ? "" : undefined}
            >
              {selectable ? (
                <Checkbox
                  checked={checked.has(item.key)}
                  disabled={disabled || item.disabled}
                  onCheckedChange={() => onToggle(item.key)}
                >
                  {item.label}
                </Checkbox>
              ) : (
                <span data-slot="transfer-label">{item.label}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Transfer: two lists side by side for choosing a subset of `items`: check items on one side and move them across with
 * the buttons in the middle. The value is the keys on the right (`value` / `onValueChange`); `searchable` adds a filter,
 * `oneWay` only moves to the right. For a few options use CheckboxGroup or a multiple Select.
 */
export function Transfer({
  items,
  value: valueProp,
  defaultValue = [],
  onValueChange,
  titles = ["Source", "Target"],
  searchable = false,
  searchPlaceholder: searchPlaceholderProp,
  emptyText: emptyTextProp,
  oneWay = false,
  disabled = false,
  size = "md",
  moveLabels = ["Move to target", "Move to source"],
  "aria-label": ariaLabel,
}: TransferProps) {
  const c = useLabels("common");
  const emptyText = emptyTextProp ?? c.noData;
  const searchPlaceholder = searchPlaceholderProp ?? c.search;
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const [checkedSource, setCheckedSource] = useState<Set<string>>(new Set());
  const [checkedTarget, setCheckedTarget] = useState<Set<string>>(new Set());

  const targetSet = useMemo(() => new Set(value), [value]);
  const source = items.filter((item) => !targetSet.has(item.key));
  const target = items.filter((item) => targetSet.has(item.key));

  const commit = (keys: string[]) => {
    if (valueProp === undefined) setInner(keys);
    onValueChange?.(keys);
  };
  const toggle = (set: Set<string>, setter: (s: Set<string>) => void) => (key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };
  const toggleAll =
    (set: Set<string>, setter: (s: Set<string>) => void) => (keys: string[], on: boolean) => {
      const next = new Set(set);
      for (const key of keys) {
        if (on) next.add(key);
        else next.delete(key);
      }
      setter(next);
    };

  const movable = (list: TransferItem[], checked: Set<string>) =>
    list.filter((item) => checked.has(item.key) && !item.disabled).map((item) => item.key);
  const toTarget = movable(source, checkedSource);
  const toSource = movable(target, checkedTarget);

  return (
    <div
      data-slot="transfer"
      data-size={size}
      data-disabled={disabled ? "" : undefined}
      role="group"
      aria-label={ariaLabel}
    >
      <TransferList
        title={titles[0]}
        side="source"
        items={source}
        checked={checkedSource}
        onToggle={toggle(checkedSource, setCheckedSource)}
        onToggleAll={toggleAll(checkedSource, setCheckedSource)}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        disabled={disabled}
        selectable
      />
      <div data-slot="transfer-actions">
        <Button
          variant="outline"
          size="sm"
          iconOnly
          aria-label={moveLabels[0]}
          disabled={disabled || toTarget.length === 0}
          onClick={() => {
            commit([...value, ...toTarget]);
            setCheckedSource(new Set());
          }}
        >
          <Arrow dir="right" />
        </Button>
        {oneWay ? null : (
          <Button
            variant="outline"
            size="sm"
            iconOnly
            aria-label={moveLabels[1]}
            disabled={disabled || toSource.length === 0}
            onClick={() => {
              const moving = new Set(toSource);
              commit(value.filter((key) => !moving.has(key)));
              setCheckedTarget(new Set());
            }}
          >
            <Arrow dir="left" />
          </Button>
        )}
      </div>
      <TransferList
        title={titles[1]}
        side="target"
        items={target}
        checked={checkedTarget}
        onToggle={toggle(checkedTarget, setCheckedTarget)}
        onToggleAll={toggleAll(checkedTarget, setCheckedTarget)}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        disabled={disabled}
        selectable={!oneWay}
      />
    </div>
  );
}
