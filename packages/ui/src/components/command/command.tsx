import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { score } from "./filter.ts";
import { useLabels } from "../../locales/use-labels.ts";

export { score };

export interface CommandItem {
  /** Unique id, passed to `onSelect`. */
  key: string;
  /** Text shown and matched against the search term. */
  label: string;
  /** Icon shown before the label. */
  icon?: ReactNode;
  /** Shortcut hint shown on the right, e.g. "⌘K", "G D" (display only, it does not listen by itself). */
  shortcut?: string;
  /** Aliases that also match when searching. */
  keywords?: readonly string[];
  disabled?: boolean;
  /** Called when selected (also triggers the overall onSelect). */
  onSelect?: () => void;
}

export interface CommandGroup {
  /** Marks this entry as a group (an entry without it is a plain item). */
  type: "group";
  /** Unique id of the group. */
  key: string;
  /** Group heading, also the group's accessible name. */
  label: string;
  /** Commands in the group; a group with no match is hidden while searching. */
  items: readonly CommandItem[];
}

export type CommandEntry = CommandItem | CommandGroup;

export interface CommandProps {
  /** Commands: plain items and / or `{ type: "group" }` groups. Loose items are listed before the groups. */
  items: readonly CommandEntry[];
  /** Called with the item's key and the item when a command runs (Enter or click); the item's own `onSelect` runs too. */
  onSelect?: (key: string, item: CommandItem) => void;
  placeholder?: string;
  /** Text shown when nothing matches. */
  emptyText?: ReactNode;
  /** Accessible name of the input and the list. */
  "aria-label"?: string;
  /** Controlled search term. */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Auto-focus the input when opened (inside a Dialog the Dialog manages it, usually no need to pass). */
  autoFocus?: boolean;
}

const isGroup = (e: CommandEntry): e is CommandGroup => "type" in e && e.type === "group";

interface Row {
  group: CommandGroup | null;
  item: CommandItem;
}

/**
 * Command palette shown inline: a search box over a list of commands that filters and ranks them as you type.
 * Pass `items` (commands, optionally in `{ type: "group" }` groups) and handle `onSelect(key, item)`; each item can also
 * carry its own `onSelect`, `icon`, `shortcut` hint and search `keywords`. The search term is internal unless you pass
 * `query` / `onQueryChange`. Focus stays in the input: ↑ ↓ move (wrapping), Home / End, Enter runs (not during IME
 * composition). For a popup palette opened by a hotkey use CommandDialog; to pick a value in a form use Combobox or Autocomplete.
 *
 * Theme style: the list follows the combobox pattern (`aria-activedescendant`); the active row carries `data-active`,
 * disabled rows `data-disabled`.
 */
export function Command({
  items,
  onSelect,
  placeholder: placeholderProp,
  emptyText: emptyTextProp,
  query: queryProp,
  onQueryChange,
  autoFocus,
  ...aria
}: CommandProps) {
  const t = useLabels("command");
  const emptyText = emptyTextProp ?? t.empty;
  const placeholder = placeholderProp ?? t.placeholder;
  const [inner, setInner] = useState("");
  const query = queryProp ?? inner;
  const setQuery = (q: string) => {
    if (queryProp === undefined) setInner(q);
    onQueryChange?.(q);
    setActive(0);
  };
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  // Filter and sort: within a group sort by score, group order stays, empty groups are hidden; without a search term keep the original order
  const visible = useMemo(() => {
    const searching = query.trim().length > 0;
    const rank = (list: readonly CommandItem[]) =>
      list
        .map((item, index) => ({ item, index, s: score(query, item.label, item.keywords) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => (searching ? b.s - a.s || a.index - b.index : a.index - b.index))
        .map((r) => r.item);
    const sections: { group: CommandGroup | null; items: CommandItem[] }[] = [];
    const loose: CommandItem[] = [];
    for (const entry of items) {
      if (isGroup(entry)) {
        const rows = rank(entry.items);
        if (rows.length) sections.push({ group: entry, items: rows });
      } else loose.push(entry);
    }
    const looseRows = rank(loose);
    return looseRows.length ? [{ group: null, items: looseRows }, ...sections] : sections;
  }, [items, query]);

  const rows: Row[] = visible.flatMap((s) => s.items.map((item) => ({ group: s.group, item })));
  const enabled = rows.map((r, i) => (r.item.disabled ? -1 : i)).filter((i) => i >= 0);
  // When the current item lands on a disabled / out-of-range position, fall back to the first available one
  const activeRow = rows[active] && !rows[active]!.item.disabled ? active : (enabled[0] ?? -1);
  const optionId = (i: number) => `${listId}-${i}`;

  // Scroll the current item into the visible range of the list. Only adjust the list's own scrollTop: scrollIntoView would also scroll the whole page
  // (when Command is placed directly in the page, mounting would scroll the page to it)
  useEffect(() => {
    const list = listRef.current;
    const row = activeRow < 0 ? null : document.getElementById(`${listId}-${activeRow}`);
    if (!list || !row) return;
    const box = list.getBoundingClientRect();
    const at = row.getBoundingClientRect();
    if (at.top < box.top) list.scrollTop -= box.top - at.top;
    else if (at.bottom > box.bottom) list.scrollTop += at.bottom - box.bottom;
  }, [activeRow, listId]);

  const run = (row: Row | undefined) => {
    if (!row || row.item.disabled) return;
    row.item.onSelect?.();
    onSelect?.(row.item.key, row.item);
  };

  const move = (delta: number) => {
    if (!enabled.length) return;
    const at = enabled.indexOf(activeRow);
    setActive(enabled[(at + delta + enabled.length) % enabled.length]!);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    switch (event.key) {
      case "ArrowDown":
        move(1);
        break;
      case "ArrowUp":
        move(-1);
        break;
      case "Home":
        if (enabled.length) setActive(enabled[0]!);
        break;
      case "End":
        if (enabled.length) setActive(enabled[enabled.length - 1]!);
        break;
      case "Enter":
        run(rows[activeRow]);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  let counter = -1;
  return (
    <div data-slot="command">
      <div data-slot="command-input-wrap">
        <svg
          viewBox="0 0 24 24"
          width="1em"
          height="1em"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          data-slot="command-input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeRow >= 0 ? optionId(activeRow) : undefined}
          aria-label={aria["aria-label"] ?? placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={aria["aria-label"] ?? t.commands}
        data-slot="command-list"
      >
        {rows.length === 0 ? (
          <div data-slot="command-empty" role="presentation">
            {emptyText}
          </div>
        ) : (
          visible.map((section) => {
            const options = section.items.map((item) => {
              counter += 1;
              const index = counter;
              return (
                <div
                  key={item.key}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeRow}
                  aria-disabled={item.disabled || undefined}
                  data-slot="command-item"
                  data-active={index === activeRow ? "" : undefined}
                  data-disabled={item.disabled ? "" : undefined}
                  onPointerMove={() => !item.disabled && setActive(index)}
                  onClick={() => run(rows[index])}
                >
                  {item.icon ? (
                    <span data-slot="command-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  ) : null}
                  <span data-slot="command-label">{item.label}</span>
                  {item.shortcut ? <kbd data-slot="command-shortcut">{item.shortcut}</kbd> : null}
                </div>
              );
            });
            return section.group ? (
              <div
                key={section.group.key}
                role="group"
                aria-label={section.group.label}
                data-slot="command-group"
              >
                <div data-slot="command-group-title" aria-hidden="true">
                  {section.group.label}
                </div>
                {options}
              </div>
            ) : (
              options
            );
          })
        )}
      </div>
    </div>
  );
}

export interface CommandDialogProps extends CommandProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Close the palette after selecting, default on.
   * @default true
   */
  closeOnSelect?: boolean;
  /** Global shortcut to toggle open / close, e.g. `"mod+k"` (mod is ⌘ on Mac, Ctrl elsewhere). */
  hotkey?: string;
  /** Accessible name of the dialog; "Command palette" by default (from the ConfigProvider locale). */
  title?: string;
}

const matchHotkey = (event: globalThis.KeyboardEvent, hotkey: string) => {
  const parts = hotkey.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const wantMod = parts.includes("mod");
  const wantShift = parts.includes("shift");
  const wantAlt = parts.includes("alt");
  return (
    event.key.toLowerCase() === key &&
    (event.metaKey || event.ctrlKey) === wantMod &&
    event.shiftKey === wantShift &&
    event.altKey === wantAlt
  );
};

/**
 * Popup command palette: a Command inside a modal dialog, usually opened by a global `hotkey` such as `"mod+k"`.
 * Takes all Command props (`items`, `onSelect`, `query`, …) plus `open` / `onOpenChange`; it closes after a selection
 * unless `closeOnSelect={false}`. On open focus goes to the input, Esc closes, and focus then returns to where it was.
 * For an always-visible palette use Command.
 *
 * Theme style: built on Base UI Dialog; slots `command-backdrop` and `command-dialog` wrap the Command slots.
 */
export function CommandDialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  closeOnSelect = true,
  hotkey,
  title: titleProp,
  onSelect,
  ...command
}: CommandDialogProps) {
  const t = useLabels("command");
  const title = titleProp ?? t.title;
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const latest = useRef({ open, openProp, onOpenChange });
  latest.current = { open, openProp, onOpenChange };
  const setOpen = (next: boolean) => {
    if (latest.current.openProp === undefined) setInner(next);
    latest.current.onOpenChange?.(next);
  };

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (!matchHotkey(event, hotkey)) return;
      event.preventDefault();
      const next = !latest.current.open;
      if (latest.current.openProp === undefined) setInner(next);
      latest.current.onOpenChange?.(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  return (
    <BaseDialog.Root open={open} onOpenChange={setOpen}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop data-slot="command-backdrop" />
        <BaseDialog.Popup data-slot="command-dialog" aria-label={title}>
          <Command
            {...command}
            onSelect={(key, item) => {
              onSelect?.(key, item);
              if (closeOnSelect) setOpen(false);
            }}
          />
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
