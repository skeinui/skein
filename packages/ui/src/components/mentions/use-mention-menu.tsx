import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Popover } from "../popover/index.ts";
import { caretRect } from "./caret.ts";
import type { MentionOption } from "./mentions.tsx";
import { useLabels } from "../../locales/use-labels.ts";

export const normalize = (option: string | MentionOption): MentionOption =>
  typeof option === "string" ? { value: option } : option;

interface Trigger {
  prefix: string;
  start: number;
  query: string;
}

/** The nearest trigger character before the caret: it must be at the start or after whitespace, with no whitespace between it and the caret (and not already at split). */
export function findTrigger(
  text: string,
  caret: number,
  prefixes: readonly string[],
  split: string,
) {
  const before = text.slice(0, caret);
  let best: Trigger | null = null;
  for (const prefix of prefixes) {
    const at = before.lastIndexOf(prefix);
    if (at < 0) continue;
    if (at > 0 && !/\s/.test(before[at - 1]!)) continue;
    const query = before.slice(at + prefix.length);
    if (/\s/.test(query) || (split.trim() === "" ? false : query.includes(split))) continue;
    if (!best || at > best.start) best = { prefix, start: at, query };
  }
  return best;
}

export const defaultFilter = (query: string, option: MentionOption) => {
  const q = query.toLowerCase();
  const label = typeof option.label === "string" ? option.label.toLowerCase() : "";
  return option.value.toLowerCase().includes(q) || label.includes(q);
};

type OptionList = readonly (string | MentionOption)[];

export interface UseMentionMenuOptions {
  /** Candidates; when a function is given they are fetched per trigger character (e.g. @ for people, / for commands). */
  options: OptionList | ((prefix: string) => OptionList);
  prefixes: readonly string[];
  split: string;
  value: string;
  setValue: (next: string) => void;
  /** Get the current input element (input or textarea), used to compute and set the caret position. */
  getField: () => HTMLInputElement | HTMLTextAreaElement | null;
  disabled?: boolean;
  readOnly?: boolean;
  filterOption?: false | ((query: string, option: MentionOption) => boolean);
  onSelect?: (option: MentionOption, prefix: string) => void;
  onSearch?: (query: string, prefix: string) => void;
  side?: "top" | "bottom";
  /** Multi-line (textarea) cannot take role=combobox / aria-expanded. */
  multiline: boolean;
}

/**
 * All the logic of "pop up a candidate list next to the caret": find the trigger character, filter, keyboard (up / down / Enter / Tab / Esc), insert text after selection and place the caret,
 * overlay positioning. Used by both `Mentions` and `Composer`; returns the props to spread onto the input element and the overlay to render beside it.
 */
export function useMentionMenu({
  options,
  prefixes,
  split,
  value,
  setValue,
  getField,
  disabled = false,
  readOnly = false,
  filterOption,
  onSelect,
  onSearch,
  side = "bottom",
  multiline,
}: UseMentionMenuOptions) {
  const t = useLabels("mentions");
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const pendingCaret = useRef<number | null>(null);
  const listId = useRef(`mentions-${Math.random().toString(36).slice(2, 8)}`).current;

  const trigger = !disabled && !readOnly ? findTrigger(value, caret, prefixes, split) : null;
  const filter = filterOption === undefined ? defaultFilter : filterOption;
  const source = trigger ? (typeof options === "function" ? options(trigger.prefix) : options) : [];
  const items = trigger
    ? source.map(normalize).filter((o) => (filter ? filter(trigger.query, o) : true))
    : [];
  const open = focused && trigger !== null && items.length > 0 && dismissed !== trigger.start;
  const activeIndex = Math.min(active, Math.max(items.length - 1, 0));

  const choose = (option: MentionOption) => {
    if (!trigger || option.disabled) return;
    const inserted = trigger.prefix + option.value + split;
    const next = value.slice(0, trigger.start) + inserted + value.slice(caret);
    pendingCaret.current = trigger.start + inserted.length;
    setValue(next);
    setCaret(pendingCaret.current);
    onSelect?.(option, trigger.prefix);
  };

  // After selection put the caret after the inserted content (once the new value has rendered into the input)
  useLayoutEffect(() => {
    if (pendingCaret.current === null) return;
    getField()?.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  });

  // When the trigger character changes (or is gone), reset the highlight and the "dismissed" flag
  const triggerKey = trigger ? `${trigger.start}:${trigger.query}` : "";
  const lastKey = useRef(triggerKey);
  if (lastKey.current !== triggerKey) {
    lastKey.current = triggerKey;
    setActive(0);
    if (trigger && dismissed !== null && dismissed !== trigger.start) setDismissed(null);
    if (!trigger && dismissed !== null) setDismissed(null);
  }

  // Tell the caller the query changed after rendering, not during it: onSearch usually sets the caller's own state
  // (e.g. options fetched for the query), which React doesn't allow while this component renders
  const latest = useRef({ trigger, onSearch });
  latest.current = { trigger, onSearch };
  const searchedKey = useRef(triggerKey);
  useEffect(() => {
    if (searchedKey.current === triggerKey) return;
    searchedKey.current = triggerKey;
    const { trigger: current, onSearch: notify } = latest.current;
    if (current) notify?.(current.query, current.prefix);
  }, [triggerKey]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!open) return;
    const enabledIdx = items.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    if (enabledIdx.length === 0) return;
    const pos = enabledIdx.indexOf(activeIndex);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActive(enabledIdx[(pos + delta + enabledIdx.length) % enabledIdx.length]!);
    } else if (event.key === "Enter" || event.key === "Tab") {
      const option = items[activeIndex];
      if (option && !option.disabled) {
        event.preventDefault();
        choose(option);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (trigger) setDismissed(trigger.start);
    }
  };

  const syncCaret = () => {
    const el = getField();
    if (el) setCaret(el.selectionStart ?? el.value.length);
  };

  /** The input value changed: store it and remember the caret. */
  const changeValue = (next: string) => {
    setValue(next);
    const el = getField();
    setCaret(el?.selectionStart ?? next.length);
  };

  const inputProps = {
    onKeyDown,
    onSelect: syncCaret,
    onFocus: () => {
      setFocused(true);
      syncCaret();
    },
    onBlur: () => setFocused(false),
    // <textarea> must not have role="combobox" (ARIA in HTML), so no aria-expanded either;
    // a single-line <input> can, and is labelled the full combobox way
    ...(multiline ? null : { role: "combobox", "aria-expanded": open }),
    "aria-autocomplete": "list" as const,
    "aria-haspopup": "listbox" as const,
    "aria-controls": open ? listId : undefined,
    "aria-activedescendant": open ? `${listId}-${activeIndex}` : undefined,
  };

  const popup: ReactNode = (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        // Only Esc counts; clicking the input itself also counts as "outside", but that moves the caret and should not close
        if (!next && details?.reason === "escape-key" && trigger) setDismissed(trigger.start);
      }}
    >
      <Popover.Content
        // Focus always stays in the input; the overlay is only a container, and the listbox inside it carries the semantics
        role="presentation"
        side={side}
        align="start"
        sideOffset={4}
        anchor={{
          getBoundingClientRect: () => {
            const el = getField();
            return el ? caretRect(el, trigger?.start ?? caret) : new DOMRect();
          },
        }}
        initialFocus={false}
        finalFocus={false}
      >
        <div role="listbox" id={listId} aria-label={t.suggestions} data-slot="mentions-list">
          {items.map((option, i) => (
            <div
              key={option.value}
              role="option"
              id={`${listId}-${i}`}
              aria-selected={i === activeIndex}
              aria-disabled={option.disabled || undefined}
              data-slot="mentions-option"
              data-active={i === activeIndex ? "" : undefined}
              data-disabled={option.disabled ? "" : undefined}
              // Do not let the input lose focus
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => !option.disabled && setActive(i)}
              onClick={() => choose(option)}
            >
              {option.label ?? option.value}
            </div>
          ))}
        </div>
      </Popover.Content>
    </Popover>
  );

  return { inputProps, popup, open, changeValue };
}
