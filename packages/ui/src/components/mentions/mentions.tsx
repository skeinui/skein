import { useRef, useState } from "react";
import type { ReactNode } from "react";
import type { FieldVariant, UISize } from "../../contract.ts";
import { Input, Textarea } from "../input/index.ts";
import { useMentionMenu } from "./use-mention-menu.tsx";

export interface MentionOption {
  /** Content inserted into the text after selection (the part after the prefix). */
  value: string;
  /** Content shown in the list, defaults to value; can be a node such as an avatar. */
  label?: ReactNode;
  disabled?: boolean;
}

export interface MentionsProps {
  /** Candidates; when there are only names you can pass a string array directly. */
  options: readonly (string | MentionOption)[];
  /**
   * Trigger characters; can give several, such as ["@", "#"].
   * @default "@"
   */
  prefix?: string | readonly string[];
  /**
   * Characters appended after the inserted content on selection.
   * @default " "
   */
  split?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Callback when a candidate is selected; prefix is the character that triggered it. */
  onSelect?: (option: MentionOption, prefix: string) => void;
  /** Callback when the text after typing @ changes; use it when candidates are fetched from the server, and set filterOption to false at the same time. */
  onSearch?: (query: string, prefix: string) => void;
  /** Filter rule; by default case-insensitive containment match against value and string label. false means no filtering (candidates are supplied by the consumer). */
  filterOption?: false | ((query: string, option: MentionOption) => boolean);
  /**
   * Multi-line input (textarea); false is a single-line input.
   * @default true
   */
  multiline?: boolean;
  /** Visible text rows of the textarea (only with `multiline`). */
  rows?: number;
  placeholder?: string;
  variant?: FieldVariant;
  size?: UISize;
  fullWidth?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  /** Text can be selected and copied but not edited; no candidate list opens (nor does it when disabled). */
  readOnly?: boolean;
  /**
   * Whether the candidate list appears above or below the caret.
   * @default "bottom"
   */
  side?: "top" | "bottom";
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/**
 * Mentions: typing a trigger character (default `@`) in the input pops up a candidate list next to the caret, and selecting one inserts the content into the text.
 * The input is still Input / Textarea with focus always staying inside it, and the list is read the combobox way (aria-activedescendant).
 * The value is just plain text; if the consumer wants to know who was mentioned, it parses the text by prefix itself.
 */
export function Mentions({
  options: optionsProp,
  prefix = "@",
  split = " ",
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSelect,
  onSearch,
  filterOption,
  multiline = true,
  rows,
  placeholder,
  variant,
  size,
  fullWidth = false,
  invalid,
  disabled = false,
  readOnly = false,
  side = "bottom",
  name,
  ...aria
}: MentionsProps) {
  const prefixes = typeof prefix === "string" ? [prefix] : prefix;
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const wrapRef = useRef<HTMLDivElement>(null);

  const field = () =>
    wrapRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      '[data-slot="textarea"], [data-slot="input"]',
    ) ?? null;

  const setValue = (next: string) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const menu = useMentionMenu({
    options: optionsProp,
    prefixes,
    split,
    value,
    setValue,
    getField: field,
    disabled,
    readOnly,
    filterOption,
    onSelect,
    onSearch,
    side,
    multiline,
  });

  const common = {
    value,
    onValueChange: menu.changeValue,
    placeholder,
    disabled,
    readOnly,
    variant,
    size,
    fullWidth,
    invalid,
    ...menu.inputProps,
    ...aria,
  };

  return (
    <div
      ref={wrapRef}
      data-slot="mentions"
      data-full-width={fullWidth ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
    >
      {multiline ? <Textarea {...common} rows={rows} /> : <Input {...common} />}
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {menu.popup}
    </div>
  );
}
