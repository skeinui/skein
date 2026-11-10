import { useState } from "react";
import { Spinner } from "../spinner/index.ts";
import { ClearIcon, SearchIcon } from "./icons.tsx";
import { InputGroup } from "./input.tsx";
import type { InputGroupInputProps, InputGroupProps } from "./input.tsx";
import { useLabels } from "../../locales/use-labels.ts";

export interface SearchInputLabels {
  search: string;
  clear: string;
}

export interface SearchInputProps
  extends
    Omit<
      InputGroupInputProps,
      "type" | "size" | "width" | "value" | "defaultValue" | "onValueChange"
    >,
    Pick<InputGroupProps, "variant" | "size" | "fullWidth" | "width"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called on Enter (not during IME composition), clicking the search button, or clicking the clear button (where source is "clear"); not while `loading`. */
  onSearch?: (value: string, source: "enter" | "button" | "clear") => void;
  /**
   * Show a clear button when there is content.
   * @default true
   */
  clearable?: boolean;
  /**
   * Searching: the search button is replaced by a spinner (with `aria-busy`), and searching cannot be triggered again.
   * @default false
   */
  loading?: boolean;
  labels?: Partial<SearchInputLabels>;
}

/**
 * Search box: a search button (the magnifier) at the end, and a clear button before it when there is content. There is no icon in front: two magnifiers side by side say the same thing twice.
 * Enter and the button both trigger onSearch (Enter during IME composition does not count); Esc clears.
 */
export function SearchInput({
  variant,
  size,
  fullWidth,
  width,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSearch,
  clearable = true,
  loading = false,
  labels,
  onKeyDown,
  ...rest
}: SearchInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const l = useLabels("searchInput", labels);
  const set = (next: string) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };
  const search = (source: "enter" | "button" | "clear", v = value) => {
    if (!loading) onSearch?.(v, source);
  };
  const clear = () => {
    set("");
    onSearch?.("", "clear");
  };
  const keyDown = (event: Parameters<NonNullable<SearchInputProps["onKeyDown"]>>[0]) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    if (event.key === "Enter") search("enter");
    else if (event.key === "Escape" && value) {
      event.preventDefault();
      set("");
    }
  };
  return (
    <InputGroup variant={variant} size={size} fullWidth={fullWidth} width={width}>
      <InputGroup.Input
        enterKeyHint="search"
        {...rest}
        type="text"
        value={value}
        onValueChange={set}
        onKeyDown={keyDown}
      />
      <InputGroup.Suffix>
        {clearable && value && !rest.disabled ? (
          <InputGroup.Action aria-label={l.clear} onClick={clear}>
            <ClearIcon />
          </InputGroup.Action>
        ) : null}
        <InputGroup.Action
          aria-label={l.search}
          disabled={rest.disabled}
          aria-busy={loading || undefined}
          onClick={() => search("button")}
        >
          {loading ? (
            <Spinner size="sm" aria-label={l.search} role="presentation" />
          ) : (
            <SearchIcon />
          )}
        </InputGroup.Action>
      </InputGroup.Suffix>
    </InputGroup>
  );
}
