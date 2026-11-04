import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FieldVariant, UISize } from "../../contract.ts";
import { useFieldDefaults } from "../field/context.ts";
import { Input } from "../input/index.ts";
import { Popover } from "../popover/index.ts";
import { Tag } from "../tag/index.ts";
import { Tree } from "../tree/index.ts";
import type { TreeNode } from "../tree/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface TreeSelectNode {
  /** Unique id across the whole tree; this is what `value` holds. */
  id: string;
  /** It is what the trigger displays, so it must be text. */
  label: string;
  disabled?: boolean;
  children?: TreeSelectNode[];
  /** Has child nodes that are not loaded yet: calls onLoadChildren on first expand. */
  lazy?: boolean;
}

interface TreeSelectBaseProps {
  /** The tree data: top-level nodes, each nesting its `children`. */
  nodes: TreeSelectNode[];
  /** Text shown while empty, default the locale's "Select". */
  placeholder?: ReactNode;
  /**
   * Show a clear button when there is a value.
   * @default false
   */
  clearable?: boolean;
  /**
   * Show a search box at the top of the overlay: after typing, the tree keeps only matching nodes (along with ancestors).
   * @default false
   */
  searchable?: boolean;
  /** Placeholder (and accessible name) of the search box, default the locale's "Search". */
  searchPlaceholder?: string;
  /** Called when expanding a lazy node that has no children yet; if it returns a Promise the node shows a spinner while loading. */
  onLoadChildren?: (id: string) => void | Promise<void>;
  /**
   * Expand all nodes when opened.
   * @default false
   */
  defaultExpandAll?: boolean;
  /**
   * Visual variant of the trigger, as on Select; inside a Field it defaults to the Field's.
   * @default "outline"
   */
  variant?: FieldVariant;
  /**
   * Size step, as on Select; inside a Field it defaults to the Field's.
   * @default "md"
   */
  size?: UISize;
  /**
   * Fills the width of the parent.
   * @default false
   */
  fullWidth?: boolean;
  /** Shows the invalid state. */
  invalid?: boolean;
  /** Disables interaction. */
  disabled?: boolean;
  /** Content shown when the search has no matches, default the locale's "No results". */
  emptyText?: ReactNode;
  /** Accessible name, when there is no visible label. */
  "aria-label"?: string;
}

export interface TreeSelectSingleProps extends TreeSelectBaseProps {
  /**
   * Multiple selection: each node has a checkbox, and checking a parent checks all available leaves beneath it.
   * @default false
   */
  multiple?: false;
  /** Id of the selected node (nodes at any level can be selected). */
  value?: string | null;
  /** Initial `value` when uncontrolled. */
  defaultValue?: string | null;
  /** Called with the new `value`; pass `value` as well to control it. */
  onValueChange?: (id: string | null) => void;
}

export interface TreeSelectMultipleProps extends TreeSelectBaseProps {
  /** Multiple selection: each node has a checkbox, and checking a parent checks all available leaves beneath it. */
  multiple: true;
  /** Ids of selected leaf nodes (parents are derived from descendants and are not included). */
  value?: string[];
  /** Initial `value` when uncontrolled. */
  defaultValue?: string[];
  /** Called with the new `value`; pass `value` as well to control it. */
  onValueChange?: (ids: string[]) => void;
  /** Maximum number of tags shown in the trigger; the rest collapse into "+N". */
  maxTagCount?: number;
}

export type TreeSelectProps = TreeSelectSingleProps | TreeSelectMultipleProps;

const Chevron = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Cross = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

function useControlled<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const current = value !== undefined ? value : inner;
  const set = useCallback(
    (next: T) => {
      if (value === undefined) setInner(next);
      onChange?.(next);
    },
    [value, onChange],
  );
  return [current, set] as const;
}

interface Entry {
  node: TreeSelectNode;
  leaf: boolean;
}

function indexNodes(nodes: TreeSelectNode[], map = new Map<string, Entry>()) {
  for (const node of nodes) {
    map.set(node.id, { node, leaf: !node.children?.length && !node.lazy });
    if (node.children) indexNodes(node.children, map);
  }
  return map;
}

function allIds(nodes: TreeSelectNode[]): string[] {
  return nodes.flatMap((n) => [n.id, ...allIds(n.children ?? [])]);
}

/**
 * Tree select: the trigger looks like Select, and the popup holds a `Tree`. Single selection picks a node on click,
 * multiple selection checks boxes; supports search and async loading.
 * For flat data use Select; for two or three levels picked one level at a time use Cascader.
 */
export function TreeSelect(props: TreeSelectProps) {
  const {
    nodes,
    placeholder: placeholderProp,
    clearable,
    searchable,
    searchPlaceholder: searchPlaceholderProp,
    onLoadChildren,
    defaultExpandAll,
    variant,
    size,
    fullWidth,
    invalid,
    disabled,
    emptyText,
    "aria-label": ariaLabel,
  } = props;
  const c = useLabels("common");
  const t = useLabels("treeSelect");
  const placeholder = placeholderProp ?? c.select;
  const searchPlaceholder = searchPlaceholderProp ?? c.search;
  const multiple = props.multiple === true;
  const field = useFieldDefaults();

  const [single, setSingle] = useControlled<string | null>(
    multiple ? undefined : (props as TreeSelectSingleProps).value,
    (!multiple && (props as TreeSelectSingleProps).defaultValue) || null,
    multiple ? undefined : (props as TreeSelectSingleProps).onValueChange,
  );
  const [many, setMany] = useControlled<string[]>(
    multiple ? (props as TreeSelectMultipleProps).value : undefined,
    (multiple && (props as TreeSelectMultipleProps).defaultValue) || [],
    multiple ? (props as TreeSelectMultipleProps).onValueChange : undefined,
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const index = useMemo(() => indexNodes(nodes), [nodes]);
  const expandAll = useMemo(
    () => (defaultExpandAll ? allIds(nodes) : []),
    [nodes, defaultExpandAll],
  );

  const labelOf = (id: string) => index.get(id)?.node.label ?? null;
  const shownMany = many.filter((id) => index.get(id)?.leaf);
  const hasValue = multiple ? shownMany.length > 0 : single !== null && index.has(single);
  const text = !multiple && hasValue ? labelOf(single!) : null;
  const maxTagCount = multiple ? (props as TreeSelectMultipleProps).maxTagCount : undefined;
  const visibleTags = maxTagCount !== undefined ? shownMany.slice(0, maxTagCount) : shownMany;
  const hiddenCount = shownMany.length - visibleTags.length;
  const isInvalid = invalid ?? false;

  const visibleText: string | undefined = multiple
    ? hasValue
      ? shownMany.map(labelOf).join(", ")
      : typeof placeholder === "string"
        ? placeholder
        : undefined
    : (text ?? (typeof placeholder === "string" ? placeholder : undefined));

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const triggerProps = {
    "data-slot": "treeselect-trigger",
    "data-variant": variant ?? field?.variant ?? "outline",
    "data-size": size ?? field?.size ?? "md",
    "data-full-width": fullWidth ? "" : undefined,
    "data-invalid": isInvalid ? "" : undefined,
    "data-multiple": multiple ? "" : undefined,
    "aria-invalid": isInvalid || undefined,
    // The accessible name must contain the visible text (WCAG 2.5.3): the value (or placeholder) first, followed by the name given by the caller
    "aria-label": ariaLabel && visibleText ? `${visibleText}, ${ariaLabel}` : undefined,
    disabled,
  } as const;

  const removeOne = (id: string) => setMany(many.filter((x) => x !== id));

  const triggerBody = multiple ? (
    <>
      {hasValue ? (
        <span data-slot="treeselect-tags">
          {visibleTags.map((id) => (
            <Tag key={id} size="sm" disabled={disabled} onRemove={() => removeOne(id)}>
              {labelOf(id)}
            </Tag>
          ))}
          {hiddenCount > 0 ? <Tag size="sm">+{hiddenCount}</Tag> : null}
        </span>
      ) : (
        <span data-slot="treeselect-value" data-placeholder="">
          {placeholder}
        </span>
      )}
      <span data-slot="treeselect-icon">
        <Chevron />
      </span>
    </>
  ) : (
    <>
      <span data-slot="treeselect-value" data-placeholder={text === null ? "" : undefined}>
        {text ?? placeholder}
      </span>
      <span data-slot="treeselect-icon">
        <Chevron />
      </span>
    </>
  );

  // In multiple mode, Tree is given the leaves, and the checked state of parents is derived by it from descendants
  const treeNodes = nodes as TreeNode[];
  const common = {
    nodes: treeNodes,
    size: "sm" as const,
    block: true,
    filter: query.trim() || undefined,
    defaultExpanded: expandAll,
    onLoadChildren,
    emptyText,
    "aria-label": ariaLabel ?? t.options,
  };

  return (
    <div data-slot="treeselect" data-full-width={fullWidth ? "" : undefined}>
      <Popover open={open} onOpenChange={onOpenChange}>
        {multiple ? (
          // In multiple mode the trigger contains clickable tags (with remove buttons), so it cannot be a <button>
          <Popover.Trigger
            {...triggerProps}
            nativeButton={false}
            render={
              <div
                role="combobox"
                aria-haspopup="tree"
                aria-expanded={open}
                tabIndex={disabled ? -1 : 0}
              />
            }
          >
            {triggerBody}
          </Popover.Trigger>
        ) : (
          <Popover.Trigger {...triggerProps}>{triggerBody}</Popover.Trigger>
        )}
        <Popover.Content align="start" sideOffset={4} aria-label={ariaLabel ?? t.options}>
          <div data-slot="treeselect-panel">
            {searchable ? (
              <div data-slot="treeselect-search">
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
            <div data-slot="treeselect-tree">
              {multiple ? (
                <Tree
                  {...common}
                  checkable
                  checked={shownMany}
                  onCheckedChange={(ids) => setMany(ids.filter((id) => index.get(id)?.leaf))}
                />
              ) : (
                <Tree
                  {...common}
                  selected={single}
                  onSelectedChange={(id) => {
                    setSingle(id);
                    if (id !== null) onOpenChange(false);
                  }}
                />
              )}
            </div>
          </div>
        </Popover.Content>
      </Popover>
      {clearable && hasValue && !disabled ? (
        <button
          type="button"
          data-slot="treeselect-clear"
          aria-label={c.clear}
          onClick={() => (multiple ? setMany([]) : setSingle(null))}
        >
          <Cross />
        </button>
      ) : null}
    </div>
  );
}
