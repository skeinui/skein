import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import type { FieldVariant, UISize } from "../../contract.ts";
import { Checkbox } from "../checkbox/index.ts";
import { useFieldDefaults } from "../field/context.ts";
import { Input } from "../input/index.ts";
import { Popover } from "../popover/index.ts";
import { Tag } from "../tag/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface CascaderOption {
  value: string;
  /** Text shown in the column and in the selected path (also what search matches). */
  label: string;
  disabled?: boolean;
  children?: CascaderOption[];
  /** Has a next level but not loaded yet: shows an expand arrow, and onLoadChildren is called on first expand. */
  lazy?: boolean;
}

interface CascaderBaseProps {
  /** The option tree (`CascaderOption`: `value`, `label`, nested `children`, `lazy` for async loading); one column per level. */
  options: CascaderOption[];
  /** Text shown while empty; defaults to the language pack's "Select". */
  placeholder?: ReactNode;
  /**
   * Separator between path levels in the trigger.
   * @default " / "
   */
  separator?: string;
  /**
   * Expand on click, or when the mouse moves over.
   * @default "click"
   */
  expandTrigger?: "click" | "hover";
  /**
   * In single selection allow selecting non-leaf nodes (commits on click, no need to reach the last level).
   * @default false
   */
  changeOnSelect?: boolean;
  /**
   * Shows a clear button when there is a value.
   * @default false
   */
  clearable?: boolean;
  /**
   * Shows a search box at the top of the overlay: after typing, the list becomes the matching full paths.
   * @default false
   */
  searchable?: boolean;
  /** Placeholder (and accessible name) of the search box when `searchable`; defaults to the language pack's "Search". */
  searchPlaceholder?: string;
  /**
   * Called when expanding an option that is lazy and has no children yet; the argument is the path up to it. If it returns a Promise,
   * the option shows a spinner while loading; after getting the data the consumer updates options (fills in children, or removes lazy if there are no children).
   */
  onLoadChildren?: (path: string[]) => void | Promise<void>;
  variant?: FieldVariant;
  size?: UISize;
  fullWidth?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  /** Text when there are no options (or the search has no results); defaults to the language pack's "No data". */
  emptyText?: ReactNode;
  "aria-label"?: string;
}

export interface CascaderSingleProps extends CascaderBaseProps {
  /**
   * Multiple selection: each option has a checkbox, checking a parent node checks all available leaves under it,
   * and `value` becomes an array of leaf paths.
   * @default false
   */
  multiple?: false;
  /** Selected path: an array of values from the first level to the last. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (path: string[]) => void;
}

export interface CascaderMultipleProps extends CascaderBaseProps {
  /** Multiple selection: each option has a checkbox, and checking a parent node checks all available leaves under it. */
  multiple: true;
  /** Array of selected leaf paths. */
  value?: string[][];
  defaultValue?: string[][];
  onValueChange?: (paths: string[][]) => void;
  /** Maximum number of tags shown in the trigger; the rest collapse into "+N". */
  maxTagCount?: number;
}

export type CascaderProps = CascaderSingleProps | CascaderMultipleProps;

const Chevron = ({ dir }: { dir: "down" | "right" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={dir === "down" ? "m6 9 6 6 6-6" : "m9 6 6 6-6 6"} />
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

const Spinner = () => (
  <svg data-slot="cascader-spinner" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
    <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SEP = "\u0000";
const keyOf = (path: string[]) => path.join(SEP);
const expandable = (option: CascaderOption) => !!option.children?.length || !!option.lazy;

/** Takes the option of each level along the path; stops at the level where the path does not match. */
function walk(options: CascaderOption[], path: string[]): CascaderOption[] {
  const found: CascaderOption[] = [];
  let level = options;
  for (const value of path) {
    const option = level.find((o) => o.value === value);
    if (!option) break;
    found.push(option);
    level = option.children ?? [];
  }
  return found;
}

/** All selectable leaf paths under an option (disabled ones do not count); an option without children is itself a leaf. */
function leafPaths(option: CascaderOption, prefix: string[]): string[][] {
  if (option.disabled) return [];
  const path = [...prefix, option.value];
  if (!option.children?.length) return [path];
  return option.children.flatMap((child) => leafPaths(child, path));
}

/** For search: all leaf paths whose "path text contains the keyword" (with changeOnSelect, non-leaves count too). */
function search(
  options: CascaderOption[],
  query: string,
  includeBranches: boolean,
  prefix: CascaderOption[] = [],
): CascaderOption[][] {
  const out: CascaderOption[][] = [];
  const q = query.toLowerCase();
  for (const option of options) {
    if (option.disabled) continue;
    const chain = [...prefix, option];
    const isLeaf = !option.children?.length;
    if ((isLeaf || includeBranches) && chain.some((o) => o.label.toLowerCase().includes(q))) {
      out.push(chain);
    }
    if (option.children?.length)
      out.push(...search(option.children, query, includeBranches, chain));
  }
  return out;
}

/**
 * Cascader: the trigger looks like Select, and opening it shows a side-by-side multi-column menu. The value in single selection is one path, in multiple selection several leaf paths;
 * supports search (filtering by full path) and async loading (children of a lazy node are fetched only on first expand).
 * Keyboard: up / down move, right expands into the next column, left goes back, Enter selects, Space toggles (multiple selection).
 */
export function Cascader(props: CascaderProps) {
  const {
    options,
    placeholder: placeholderProp,
    separator = " / ",
    expandTrigger = "click",
    changeOnSelect = false,
    clearable = false,
    searchable = false,
    searchPlaceholder: searchPlaceholderProp,
    onLoadChildren,
    variant,
    size,
    fullWidth = false,
    invalid,
    disabled = false,
    emptyText: emptyTextProp,
    "aria-label": ariaLabel,
  } = props;
  const c = useLabels("common");
  const t = useLabels("cascader");
  const placeholder = placeholderProp ?? c.select;
  const searchPlaceholder = searchPlaceholderProp ?? c.search;
  const emptyText = emptyTextProp ?? c.noData;
  const multiple = props.multiple === true;
  const field = useFieldDefaults();

  const [inner, setInner] = useState<string[] | string[][]>(props.defaultValue ?? []);
  const rawValue = props.value !== undefined ? props.value : inner;
  // The single-selection path / multi-selection path array are unified and handled as a "path array"
  const paths: string[][] = multiple
    ? (rawValue as string[][])
    : (rawValue as string[]).length
      ? [rawValue as string[]]
      : [];
  const selected = useMemo(() => new Set(paths.map(keyOf)), [paths]);
  const singleValue = multiple ? [] : (rawValue as string[]);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string[]>(singleValue);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set());
  const panel = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const focusRequest = useRef<{ level: number; value?: string } | null>(null);

  const commitPaths = (next: string[][]) => {
    if (multiple) {
      if (props.value === undefined) setInner(next);
      (props as CascaderMultipleProps).onValueChange?.(next);
    } else {
      const path = next[0] ?? [];
      if (props.value === undefined) setInner(path);
      (props as CascaderSingleProps).onValueChange?.(path);
    }
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setActive(singleValue.length ? singleValue : (paths[0] ?? []));
      const last = paths[0]?.length ? paths[0] : null;
      focusRequest.current = searchable
        ? null
        : last
          ? {
              level: Math.min(last.length - 1, 0) === 0 && multiple ? 0 : last.length - 1,
              value: last[last.length - 1],
            }
          : { level: 0 };
    }
  };

  const findFocusTarget = (): HTMLElement | null => {
    const root = panel.current;
    if (!root) return null;
    if (searchable && !focusRequest.current) return searchInput.current;
    const request = focusRequest.current;
    if (!request) return null;
    const menu = root.querySelector<HTMLElement>(
      `[data-slot="cascader-menu"][data-level="${request.level}"]`,
    );
    if (!menu) return null;
    const items = [
      ...menu.querySelectorAll<HTMLElement>('[data-slot="cascader-option"]:not([data-disabled])'),
    ];
    return (
      (request.value !== undefined ? items.find((e) => e.dataset.value === request.value) : null) ??
      items[0] ??
      null
    );
  };

  // After left / right keys change columns, wait for the new column to render before focusing
  useEffect(() => {
    if (!focusRequest.current) return;
    const target = findFocusTarget();
    if (target) {
      target.focus();
      focusRequest.current = null;
    }
  });

  const load = (path: string[]) => {
    const id = keyOf(path);
    const result = onLoadChildren?.(path);
    if (!result || typeof result.then !== "function") return;
    setLoading((prev) => new Set(prev).add(id));
    const done = () =>
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    result.then(done, done);
  };
  /** Expands an option: if it is lazy and has no children yet, also loads them. */
  const expand = (option: CascaderOption, level: number) => {
    const path = [...active.slice(0, level), option.value];
    setActive(path);
    if (option.lazy && !option.children?.length && !loading.has(keyOf(path))) load(path);
    return path;
  };

  const columns: CascaderOption[][] = [options];
  {
    let level = options;
    for (const v of active) {
      const option = level.find((o) => o.value === v);
      if (!option || !option.children?.length) break;
      level = option.children;
      columns.push(level);
    }
  }

  const togglePaths = (leaves: string[][], on: boolean) => {
    const remove = new Set(leaves.map(keyOf));
    const rest = paths.filter((p) => !remove.has(keyOf(p)));
    commitPaths(on ? [...rest, ...leaves] : rest);
  };
  const checkState = (option: CascaderOption, level: number) => {
    const leaves = leafPaths(option, active.slice(0, level));
    const count = leaves.filter((p) => selected.has(keyOf(p))).length;
    return {
      leaves,
      checked: leaves.length > 0 && count === leaves.length,
      indeterminate: count > 0 && count < leaves.length,
    };
  };

  const select = (option: CascaderOption, level: number) => {
    if (option.disabled) return;
    if (expandable(option)) {
      const path = expand(option, level);
      if (!multiple && changeOnSelect) commitPaths([path]);
      return;
    }
    const path = [...active.slice(0, level), option.value];
    if (multiple) {
      const { checked } = checkState(option, level);
      togglePaths([path], !checked);
    } else {
      setActive(path);
      commitPaths([path]);
      setOpen(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, option: CascaderOption, level: number) => {
    const el = event.currentTarget;
    const siblings = [
      ...(el.parentElement?.querySelectorAll<HTMLElement>(
        '[data-slot="cascader-option"]:not([data-disabled])',
      ) ?? []),
    ];
    const index = siblings.indexOf(el);
    const handled = () => {
      event.preventDefault();
      event.stopPropagation();
    };
    switch (event.key) {
      case "ArrowDown":
        handled();
        siblings[Math.min(index + 1, siblings.length - 1)]?.focus();
        break;
      case "ArrowUp":
        handled();
        if (index === 0 && searchable) searchInput.current?.focus();
        else siblings[Math.max(index - 1, 0)]?.focus();
        break;
      case "Home":
        handled();
        siblings[0]?.focus();
        break;
      case "End":
        handled();
        siblings[siblings.length - 1]?.focus();
        break;
      case "ArrowRight":
        if (expandable(option) && !option.disabled) {
          handled();
          expand(option, level);
          focusRequest.current = { level: level + 1 };
        }
        break;
      case "ArrowLeft":
        if (level > 0) {
          handled();
          const parent = active[level - 1];
          setActive(active.slice(0, level));
          focusRequest.current = { level: level - 1, value: parent };
        }
        break;
      case "Enter":
        handled();
        select(option, level);
        break;
      case " ":
        handled();
        if (multiple && !expandable(option)) select(option, level);
        else if (multiple) {
          const { leaves, checked } = checkState(option, level);
          togglePaths(leaves, !checked);
        } else select(option, level);
        break;
    }
  };

  // Search results: each result is a full path
  const results = query.trim() ? search(options, query.trim(), changeOnSelect && !multiple) : null;
  const selectResult = (chain: CascaderOption[]) => {
    const path = chain.map((o) => o.value);
    if (multiple) {
      const leaf = chain[chain.length - 1]!;
      const leaves = leafPaths(leaf, path.slice(0, -1));
      const all = leaves.length > 0 && leaves.every((p) => selected.has(keyOf(p)));
      togglePaths(leaves, !all);
    } else {
      setActive(path);
      commitPaths([path]);
      setOpen(false);
    }
  };

  const pathLabel = (path: string[]) => {
    const found = walk(options, path);
    return found.length === path.length && path.length > 0
      ? found.map((o) => o.label).join(separator)
      : null;
  };
  const shownPaths = paths.filter((p) => pathLabel(p) !== null);
  const text = !multiple && shownPaths.length ? pathLabel(shownPaths[0]!) : null;
  const maxTagCount = multiple ? (props as CascaderMultipleProps).maxTagCount : undefined;
  const visibleTags = maxTagCount !== undefined ? shownPaths.slice(0, maxTagCount) : shownPaths;
  const hiddenCount = shownPaths.length - visibleTags.length;
  const hasValue = shownPaths.length > 0;
  const isInvalid = invalid ?? false;

  const visibleText: string | undefined = multiple
    ? hasValue
      ? shownPaths.map(pathLabel).join(", ")
      : typeof placeholder === "string"
        ? placeholder
        : undefined
    : (text ?? (typeof placeholder === "string" ? placeholder : undefined));

  const triggerProps = {
    "data-slot": "cascader-trigger",
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

  const triggerBody = multiple ? (
    <>
      {hasValue ? (
        <span data-slot="cascader-tags">
          {visibleTags.map((path) => (
            <Tag
              key={keyOf(path)}
              size="sm"
              disabled={disabled}
              onRemove={() => togglePaths([path], false)}
            >
              {pathLabel(path)}
            </Tag>
          ))}
          {hiddenCount > 0 ? <Tag size="sm">+{hiddenCount}</Tag> : null}
        </span>
      ) : (
        <span data-slot="cascader-value" data-placeholder="">
          {placeholder}
        </span>
      )}
      <span data-slot="cascader-icon">
        <Chevron dir="down" />
      </span>
    </>
  ) : (
    <>
      <span data-slot="cascader-value" data-placeholder={text === null ? "" : undefined}>
        {text ?? placeholder}
      </span>
      <span data-slot="cascader-icon">
        <Chevron dir="down" />
      </span>
    </>
  );

  return (
    <div data-slot="cascader" data-full-width={fullWidth ? "" : undefined}>
      <Popover open={open} onOpenChange={onOpenChange}>
        {multiple ? (
          // The multi-select trigger has clickable tags (with delete buttons), so it cannot be a <button>; it is replaced with a div with a role
          <Popover.Trigger
            {...triggerProps}
            nativeButton={false}
            render={
              <div
                role="combobox"
                aria-haspopup="listbox"
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
        <Popover.Content
          align="start"
          sideOffset={4}
          aria-label={ariaLabel ?? t.options}
          initialFocus={() => {
            const target = findFocusTarget();
            if (target) focusRequest.current = null;
            return target ?? true;
          }}
        >
          <div data-slot="cascader-panel" data-searching={results ? "" : undefined} ref={panel}>
            {searchable ? (
              <div data-slot="cascader-search">
                <Input
                  size="sm"
                  fullWidth
                  ref={searchInput}
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  value={query}
                  onValueChange={setQuery}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      panel.current
                        ?.querySelector<HTMLElement>(
                          '[data-slot="cascader-option"]:not([data-disabled])',
                        )
                        ?.focus();
                    }
                  }}
                />
              </div>
            ) : null}
            <div data-slot="cascader-columns">
              {results ? (
                results.length === 0 ? (
                  <div data-slot="cascader-empty">{emptyText}</div>
                ) : (
                  <div
                    role="listbox"
                    aria-multiselectable={multiple || undefined}
                    data-slot="cascader-menu"
                    data-results=""
                    aria-label={t.results}
                  >
                    {results.map((chain) => {
                      const path = chain.map((o) => o.value);
                      const leaves = leafPaths(chain[chain.length - 1]!, path.slice(0, -1));
                      const isSelected =
                        leaves.length > 0 && leaves.every((p) => selected.has(keyOf(p)));
                      return (
                        <div
                          key={keyOf(path)}
                          role="option"
                          tabIndex={-1}
                          aria-selected={isSelected}
                          data-slot="cascader-option"
                          data-value={keyOf(path)}
                          data-selected={isSelected ? "" : undefined}
                          onClick={() => selectResult(chain)}
                          onKeyDown={(event) => {
                            const items = [
                              ...event.currentTarget.parentElement!.querySelectorAll<HTMLElement>(
                                '[data-slot="cascader-option"]',
                              ),
                            ];
                            const i = items.indexOf(event.currentTarget);
                            if (event.key === "ArrowDown") {
                              event.preventDefault();
                              items[Math.min(i + 1, items.length - 1)]?.focus();
                            } else if (event.key === "ArrowUp") {
                              event.preventDefault();
                              if (i === 0) searchInput.current?.focus();
                              else items[i - 1]?.focus();
                            } else if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectResult(chain);
                            }
                          }}
                        >
                          {multiple ? (
                            <span
                              data-slot="cascader-option-check"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                tabIndex={-1}
                                aria-label={chain.map((o) => o.label).join(separator)}
                                checked={isSelected}
                                onCheckedChange={() => selectResult(chain)}
                              />
                            </span>
                          ) : null}
                          <span data-slot="cascader-option-label">
                            {chain.map((o) => o.label).join(separator)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : options.length === 0 ? (
                <div data-slot="cascader-empty">{emptyText}</div>
              ) : (
                columns.map((column, level) => (
                  <div
                    key={level}
                    role="listbox"
                    aria-multiselectable={multiple || undefined}
                    data-slot="cascader-menu"
                    data-level={level}
                    aria-label={t.level(level + 1)}
                  >
                    {column.map((option) => {
                      const canExpand = expandable(option);
                      const path = [...active.slice(0, level), option.value];
                      const isActive = active[level] === option.value;
                      const isLoading = loading.has(keyOf(path));
                      const state = multiple ? checkState(option, level) : null;
                      const isSelected = multiple
                        ? !!state && (state.checked || state.indeterminate)
                        : singleValue[level] === option.value;
                      return (
                        <div
                          key={option.value}
                          role="option"
                          tabIndex={-1}
                          aria-selected={isSelected}
                          // role=option does not allow aria-expanded; when there is a next level, data-has-children lets the theme style draw the arrow
                          aria-disabled={option.disabled || undefined}
                          aria-busy={isLoading || undefined}
                          data-slot="cascader-option"
                          data-value={option.value}
                          data-active={isActive ? "" : undefined}
                          data-selected={isSelected ? "" : undefined}
                          data-has-children={canExpand ? "" : undefined}
                          data-loading={isLoading ? "" : undefined}
                          data-disabled={option.disabled ? "" : undefined}
                          onClick={() => select(option, level)}
                          onMouseEnter={() => {
                            if (expandTrigger === "hover" && canExpand && !option.disabled)
                              expand(option, level);
                          }}
                          onKeyDown={(event) => onKeyDown(event, option, level)}
                        >
                          {state ? (
                            <span
                              data-slot="cascader-option-check"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                tabIndex={-1}
                                aria-label={option.label}
                                checked={state.checked}
                                indeterminate={state.indeterminate}
                                disabled={option.disabled || state.leaves.length === 0}
                                onCheckedChange={() => togglePaths(state.leaves, !state.checked)}
                              />
                            </span>
                          ) : null}
                          <span data-slot="cascader-option-label">{option.label}</span>
                          {isLoading ? (
                            <span data-slot="cascader-option-arrow">
                              <Spinner />
                            </span>
                          ) : canExpand ? (
                            <span data-slot="cascader-option-arrow">
                              <Chevron dir="right" />
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </Popover.Content>
      </Popover>
      {clearable && hasValue && !disabled ? (
        <button
          type="button"
          data-slot="cascader-clear"
          aria-label={c.clear}
          onClick={() => {
            commitPaths([]);
            setActive([]);
          }}
        >
          <Cross />
        </button>
      ) : null}
    </div>
  );
}
