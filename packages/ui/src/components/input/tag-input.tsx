import { useRef, useState } from "react";
import { Tag } from "../tag/index.ts";
import { InputGroup } from "./input.tsx";
import type { InputGroupInputProps, InputGroupProps } from "./input.tsx";
import { useLabels } from "../../locales/use-labels.ts";

export interface TagInputProps
  extends
    Omit<InputGroupInputProps, "size" | "value" | "defaultValue" | "onValueChange" | "type">,
    Pick<InputGroupProps, "variant" | "size" | "fullWidth"> {
  /** Existing tags. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  /** Maximum number of tags; no more are added once full. */
  max?: number;
  /**
   * Allow duplicates; when not allowed, duplicates are ignored.
   * @default false
   */
  allowDuplicates?: boolean;
  /**
   * Besides Enter, typing these characters also submits the current text; pasting also splits on them.
   * @default [","]
   */
  separators?: string[];
  /** Text for which it returns false does not become a tag. */
  validate?: (tag: string) => boolean;
  /**
   * When the input loses focus, uncommitted text is also added.
   * @default false
   */
  addOnBlur?: boolean;
  /** Name of the remove button, default `Remove ${tag}`. */
  removeLabel?: (tag: string) => string;
}

/**
 * Tag input: existing tags and the input are laid out in the same box, Enter or a separator submits a tag,
 * and Backspace on an empty input deletes the last one. Tags are removable Tags.
 */
export function TagInput({
  variant,
  size,
  fullWidth,
  value: valueProp,
  defaultValue = [],
  onValueChange,
  max,
  allowDuplicates = false,
  separators = [","],
  validate,
  addOnBlur = false,
  removeLabel: removeLabelProp,
  onKeyDown,
  onBlur,
  onPaste,
  ...rest
}: TagInputProps) {
  const t = useLabels("tagInput");
  const removeLabel = removeLabelProp ?? t.remove;
  const [inner, setInner] = useState(defaultValue);
  const tags = valueProp ?? inner;
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const commit = (next: string[]) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  /** Add a batch of text, returning how many were actually added. */
  const add = (raw: string[]) => {
    let next = tags;
    for (const piece of raw) {
      const tag = piece.trim();
      if (!tag) continue;
      if (max !== undefined && next.length >= max) break;
      if (!allowDuplicates && next.includes(tag)) continue;
      if (validate && !validate(tag)) continue;
      next = [...next, tag];
    }
    if (next !== tags) commit(next);
    return next !== tags;
  };
  const split = (s: string) =>
    separators.reduce<string[]>((parts, sep) => parts.flatMap((p) => p.split(sep)), [s]);

  const submit = () => {
    add([text]);
    setText("");
  };
  const remove = (index: number) => {
    commit(tags.filter((_, i) => i !== index));
    input.current?.focus();
  };

  const keyDown = (event: Parameters<NonNullable<TagInputProps["onKeyDown"]>>[0]) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Backspace" && text === "" && tags.length > 0) {
      commit(tags.slice(0, -1));
    }
  };
  const paste = (event: Parameters<NonNullable<TagInputProps["onPaste"]>>[0]) => {
    onPaste?.(event);
    if (event.defaultPrevented) return;
    const pasted = event.clipboardData.getData("text");
    const parts = split(pasted);
    if (parts.length > 1) {
      event.preventDefault();
      add(parts);
    }
  };
  const change = (value: string) => {
    const last = value[value.length - 1];
    if (last !== undefined && separators.includes(last)) {
      add(split(value));
      setText("");
    } else setText(value);
  };

  return (
    <InputGroup variant={variant} size={size} fullWidth={fullWidth}>
      {tags.length > 0 ? (
        <span data-slot="input-group-tags">
          {tags.map((tag, i) => (
            <Tag
              key={`${tag}-${i}`}
              size="sm"
              disabled={rest.disabled}
              removeLabel={removeLabel(tag)}
              onRemove={() => remove(i)}
            >
              {tag}
            </Tag>
          ))}
        </span>
      ) : null}
      <InputGroup.Input
        {...rest}
        ref={input}
        type="text"
        value={text}
        onValueChange={change}
        onKeyDown={keyDown}
        onPaste={paste}
        onBlur={(event) => {
          onBlur?.(event);
          if (addOnBlur && text) submit();
        }}
        readOnly={rest.readOnly || (max !== undefined && tags.length >= max)}
      />
    </InputGroup>
  );
}
