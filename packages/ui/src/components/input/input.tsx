import { Input as BaseInput } from "@base-ui/react/input";
import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { FieldVariant, InputWidth, UISize } from "../../contract.ts";
import { useFieldDefaults } from "../field/context.ts";

type Without<T> = Omit<T, "className" | "style">;

/** Mark invalid manually when not inside a Field; inside a Field the Field's validation state decides. */
const invalidProps = (invalid?: boolean) =>
  invalid ? ({ "data-invalid": "", "aria-invalid": true } as const) : null;

export interface InputProps extends Omit<Without<BaseInput.Props>, "size"> {
  /**
   * `outline` is the regular input with a background / border, `filled` a grey fill (HeroUI v3's primary / secondary).
   * Inside a Field it defaults to the Field's.
   * @default "outline"
   */
  variant?: FieldVariant;
  /**
   * Size step of the field (not the native character count, which is left out).
   * Inside a Field it defaults to the Field's.
   * @default "md"
   */
  size?: UISize;
  /** @default false */
  fullWidth?: boolean;
  invalid?: boolean;
}

/**
 * Single-line text input; accepts native input props (`type`, `maxLength`, `autoComplete`…).
 * `value` / `onValueChange` hold the text (a string). Inside a Field it takes the Field's variant / size and validation
 * state; outside, set `variant` / `size` / `invalid` yourself.
 * For icons or buttons inside the border use InputGroup; for passwords PasswordInput; for search SearchInput;
 * for numbers NumberField; for several lines Textarea.
 */
export function Input({ variant, size, fullWidth = false, invalid, ...rest }: InputProps) {
  const field = useFieldDefaults();
  return (
    <BaseInput
      {...rest}
      {...invalidProps(invalid)}
      data-slot="input"
      data-variant={variant ?? field?.variant ?? "outline"}
      data-size={size ?? field?.size ?? "md"}
      data-full-width={fullWidth ? "" : undefined}
    />
  );
}

/** Native textarea props (rows, cols, wrap, etc.) plus the value interface of Base UI Input. */
export interface TextareaProps
  extends
    Without<Omit<ComponentPropsWithoutRef<"textarea">, "value" | "defaultValue" | "onChange">>,
    Pick<BaseInput.Props, "value" | "defaultValue" | "onValueChange"> {
  /**
   * `outline` is the regular input with a background / border, `filled` a grey fill (HeroUI v3's primary / secondary).
   * Inside a Field it defaults to the Field's.
   * @default "outline"
   */
  variant?: FieldVariant;
  /**
   * Size step.
   * Inside a Field it defaults to the Field's.
   * @default "md"
   */
  size?: UISize;
  /** @default false */
  fullWidth?: boolean;
  invalid?: boolean;
  /**
   * Auto-grow with content: with `true` it is at least `rows` rows (default 2) with no upper limit; you can also pass `{ minRows, maxRows }`,
   * beyond `maxRows` the height is fixed and it scrolls inside. With auto-grow on, manual drag resizing is not possible.
   */
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  /**
   * Show a character count below the input ("n / max" when there is a `maxLength`, changing color at the limit). Counted by `value.length`, consistent with native `maxLength`.
   * @default false
   */
  showCount?: boolean;
}

/** Compute the height from the content: first release the height to measure scrollHeight, then clamp between the min / max rows; the height is written as --ta-height. */
function fitHeight(el: HTMLTextAreaElement, min: number, max: number | undefined) {
  const cs = getComputedStyle(el);
  const font = parseFloat(cs.fontSize) || 14;
  const line = parseFloat(cs.lineHeight) || font * 1.5;
  const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  const border = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
  // While measuring the height is auto, and in a horizontal flex it would be stretched to the neighbor's height, so the measurement would be the neighbor's height; do not let it be stretched right after measuring
  el.style.setProperty("align-self", "flex-start");
  el.style.setProperty("--ta-height", "auto");
  const content = el.scrollHeight;
  el.style.removeProperty("align-self");
  const lo = min * line + pad + border;
  const hi = max === undefined ? Infinity : max * line + pad + border;
  const want = content + border;
  el.style.setProperty("--ta-height", `${Math.min(Math.max(want, lo), hi)}px`);
  if (want > hi) el.setAttribute("data-overflow", "");
  else el.removeAttribute("data-overflow");
}

/**
 * Multi-line text input for longer free text (comments, descriptions); accepts native textarea props such as `rows` and `maxLength`.
 * `value` / `onValueChange` hold the text (a string); `autoSize` grows it with the content (optionally between `minRows` / `maxRows`), and `showCount` shows a character count.
 * Inside a Field it takes the Field's variant / size and validation state; outside, set `variant` / `size` / `invalid` yourself.
 * For a single line use Input; for a chat message box with send / attachments use Composer.
 *
 * Theme style: the same Base UI Input, just rendered as a <textarea>; auto-grow writes the height as --ta-height and marks data-overflow beyond `maxRows`.
 */
export function Textarea({
  variant,
  size,
  fullWidth = false,
  invalid,
  autoSize,
  showCount = false,
  rows,
  maxLength,
  ...rest
}: TextareaProps) {
  const field = useFieldDefaults();
  const ref = useRef<HTMLTextAreaElement>(null);
  const countId = useId();
  const controlled = rest.value;
  const [inner, setInner] = useState(
    typeof rest.defaultValue === "string" ? rest.defaultValue : "",
  );
  const length = String(controlled ?? inner).length;
  const auto = autoSize === true || typeof autoSize === "object";
  const minRows = (typeof autoSize === "object" ? autoSize.minRows : undefined) ?? rows ?? 2;
  const maxRows = typeof autoSize === "object" ? autoSize.maxRows : undefined;

  // Re-measure when the value changes or the width changes (line break positions change)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !auto) return;
    const run = () => fitHeight(el, minRows, maxRows);
    run();
    // When theme style / mode / theme changes, font size, line height and padding all change, so re-measure
    const theme = new MutationObserver(run);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-skein-theme",
        "data-skein-mode",
        "data-skein-color",
        "data-skein-density",
      ],
    });
    if (typeof ResizeObserver === "undefined") return () => theme.disconnect();
    let width = el.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (el.offsetWidth !== width) {
        width = el.offsetWidth;
        run();
      }
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      theme.disconnect();
    };
  }, [auto, minRows, maxRows, controlled, length]);

  const input = (
    <BaseInput
      {...(rest as BaseInput.Props)}
      {...invalidProps(invalid)}
      ref={ref as never}
      render={<textarea rows={rows} maxLength={maxLength} />}
      data-slot="textarea"
      data-variant={variant ?? field?.variant ?? "outline"}
      data-size={size ?? field?.size ?? "md"}
      data-full-width={fullWidth ? "" : undefined}
      data-autosize={auto ? "" : undefined}
      aria-describedby={
        [rest["aria-describedby"], showCount ? countId : undefined].filter(Boolean).join(" ") ||
        undefined
      }
      onValueChange={(value, details) => {
        if (controlled === undefined) setInner(value);
        rest.onValueChange?.(value, details);
      }}
    />
  );
  if (!showCount) return input;
  const atLimit = maxLength !== undefined && length >= maxLength;
  return (
    <div
      data-slot="textarea-wrapper"
      data-full-width={fullWidth ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
    >
      {input}
      <span id={countId} data-slot="textarea-count" data-limit={atLimit ? "" : undefined}>
        {maxLength !== undefined ? `${length} / ${maxLength}` : length}
      </span>
    </div>
  );
}

export interface InputGroupProps extends Without<ComponentPropsWithoutRef<"div">> {
  /**
   * `outline` is the regular input with a background / border, `filled` a grey fill (HeroUI v3's primary / secondary).
   * Inside a Field it defaults to the Field's.
   * @default "outline"
   */
  variant?: FieldVariant;
  /**
   * Size step.
   * Inside a Field it defaults to the Field's.
   * @default "md"
   */
  size?: UISize;
  /** @default false */
  fullWidth?: boolean;
  /** A set width (`sm` 10rem, `md` 14rem, `lg` 20rem) for a box that need not fill its row, such as the search above a table; `fullWidth` wins. */
  width?: InputWidth;
  children?: ReactNode;
}

/**
 * Text input with things attached inside its border: icons or text before / after it and small action buttons (show password, clear, search).
 * Compose `<InputGroup.Prefix>`, `<InputGroup.Input>` (takes the usual input props, `value`, `invalid`…), `<InputGroup.Suffix>` and `<InputGroup.Action aria-label>`;
 * `variant` / `size` / `fullWidth` go on the group (defaulting to the enclosing Field's). For a plain input without add-ons use Input.
 *
 * Theme style: the group handles the background / border / focus ring, and the input inside is transparent.
 * Focus, invalid and disabled states are read by the theme style from the inner input with :has(); the group itself does not manage state.
 */
export function InputGroup({
  variant,
  size,
  fullWidth = false,
  width,
  children,
  ...rest
}: InputGroupProps) {
  const field = useFieldDefaults();
  return (
    <div
      {...rest}
      data-slot="input-group"
      data-variant={variant ?? field?.variant ?? "outline"}
      data-size={size ?? field?.size ?? "md"}
      data-width={width}
      data-full-width={fullWidth ? "" : undefined}
    >
      {children}
    </div>
  );
}

export interface InputGroupInputProps extends Without<BaseInput.Props> {
  /** Mark invalid manually; the group reads the state with `:has()`. */
  invalid?: boolean;
}

function InputGroupInput({ invalid, ...rest }: InputGroupInputProps) {
  return <BaseInput {...rest} {...invalidProps(invalid)} data-slot="input-group-input" />;
}

export type InputGroupAffixProps = Without<ComponentPropsWithoutRef<"span">>;

/** Leading add-on (icon or text) before the input. */
function InputGroupPrefix(props: InputGroupAffixProps) {
  return <span {...props} data-slot="input-group-prefix" />;
}

/** Trailing add-on (icon, unit text) after the input. */
function InputGroupSuffix(props: InputGroupAffixProps) {
  return <span {...props} data-slot="input-group-suffix" />;
}

export type InputGroupActionProps = Without<ComponentPropsWithoutRef<"button">>;

/** Small button in the suffix position (show password, clear, search): icon only, so aria-label is required. */
function InputGroupAction(props: InputGroupActionProps) {
  return <button type="button" {...props} data-slot="input-group-action" />;
}

InputGroup.Input = InputGroupInput;
InputGroup.Action = InputGroupAction;
InputGroup.Prefix = InputGroupPrefix;
InputGroup.Suffix = InputGroupSuffix;
