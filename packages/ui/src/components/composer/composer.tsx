import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type {
  ComponentPropsWithoutRef,
  FormEvent,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
  RefObject,
} from "react";
import type { ComposerStatus } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { useMentionMenu } from "../mentions/use-mention-menu.tsx";
import type { MentionOption } from "../mentions/index.ts";
import { useAutoGrow } from "./auto-grow.ts";
import type { ButtonProps } from "../button/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface ComposerLabels {
  /** Name of the input, default "Message". */
  input?: string;
  /** Name of the send button, default "Send message". */
  send?: string;
  /** Name of the send button when it becomes a stop button while generating, default "Stop generating". */
  stop?: string;
}

interface ComposerContext {
  value: string;
  setValue: (value: string) => void;
  status: ComposerStatus;
  disabled: boolean;
  canSubmit: boolean;
  submitOn: "enter" | "mod-enter";
  labels: Required<ComposerLabels>;
  submit: () => void;
  stop: () => void;
  textarea: RefObject<HTMLTextAreaElement | null>;
}

const Context = createContext<ComposerContext | null>(null);
function useComposer() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Composer parts must be used inside <Composer>");
  return ctx;
}

export interface ComposerProps extends Omit<Without<ComponentPropsWithoutRef<"form">>, "onSubmit"> {
  /** Entered text (controlled). */
  value?: string;
  /** Initial `value` when uncontrolled. */
  defaultValue?: string;
  /** Called with the new `value`; pass `value` as well to control it. */
  onValueChange?: (value: string) => void;
  /** Submit: Enter (or ⌘ / Ctrl + Enter) or click send. When controlled you clear `value` yourself; when uncontrolled it clears automatically after sending. */
  onSubmit?: (value: string) => void;
  /**
   * idle: idle, streaming: the assistant is replying: the send button becomes a stop button and submitting is no longer possible.
   * @default "idle"
   */
  status?: ComposerStatus;
  /** Click the stop button (when status is streaming). */
  onStop?: () => void;
  /** Disables the whole composer. */
  disabled?: boolean;
  /**
   * Whether it can be submitted, default "has non-whitespace text". When it can be sent with attachments but no text, compute it yourself and pass it in.
   */
  canSubmit?: boolean;
  /**
   * enter: Enter submits, Shift + Enter inserts a newline (default); mod-enter: ⌘ / Ctrl + Enter submits, Enter inserts a newline.
   * @default "enter"
   */
  submitOn?: "enter" | "mod-enter";
  labels?: ComposerLabels;
}

/**
 * Message input for AI chat: a growing text area with attachments, toolbar actions and a send / stop button.
 * Handle `onSubmit(value)` (uncontrolled it clears itself after sending; with `value` / `onValueChange` you clear it);
 * set `status="streaming"` while the assistant replies so Send becomes Stop and calls `onStop`. Enter submits and
 * Shift + Enter inserts a newline (`submitOn="mod-enter"` swaps them); Enter during IME composition never sends.
 * Pass `canSubmit` when attachments alone may be sent. Compose it from parts: `Composer.Shell` holds
 * `Composer.Attachments`, `Composer.TextArea` (with `@` / `/` `triggers`) and `Composer.Toolbar`
 * (`ToolbarStart` / `ToolbarEnd`, `Composer.Action`, `Composer.Send`); `Composer.Footer` is a note below.
 * For a plain multi-line form field use Textarea; for @-mentions in a form use Mentions.
 *
 * Theme style: the root is a `<form>` carrying `data-status` and `data-disabled`.
 */
function ComposerRoot({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  status = "idle",
  onStop,
  disabled = false,
  canSubmit: canSubmitProp,
  submitOn = "enter",
  labels,
  ...rest
}: ComposerProps) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : inner;
  const textarea = useRef<HTMLTextAreaElement>(null);
  const setValue = useCallback(
    (next: string) => {
      if (!controlled) setInner(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );
  const canSubmit = !disabled && status === "idle" && (canSubmitProp ?? value.trim() !== "");
  const submit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit?.(value);
    if (!controlled) setInner("");
  }, [canSubmit, controlled, onSubmit, value]);
  const l = useLabels("composer", labels);
  const resolved = useMemo<Required<ComposerLabels>>(
    () => ({ input: l.input, send: l.send, stop: l.stop }),
    [l.input, l.send, l.stop],
  );
  const ctx = useMemo<ComposerContext>(
    () => ({
      value,
      setValue,
      status,
      disabled,
      canSubmit,
      submitOn,
      labels: resolved,
      submit,
      stop: () => onStop?.(),
      textarea,
    }),
    [value, setValue, status, disabled, canSubmit, submitOn, resolved, submit, onStop],
  );
  return (
    <Context.Provider value={ctx}>
      <form
        {...rest}
        data-slot="composer"
        data-status={status}
        data-disabled={disabled ? "" : undefined}
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          submit();
        }}
      />
    </Context.Provider>
  );
}

/** Outer frame: clicking blank space inside it focuses the input. */
function ComposerShell(props: Without<ComponentPropsWithoutRef<"div">>) {
  const { textarea } = useComposer();
  return (
    <div
      {...props}
      data-slot="composer-shell"
      onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
        props.onPointerDown?.(e);
        const target = e.target as HTMLElement;
        if (!target.closest("button, a, input, textarea, select, [role='button']")) {
          e.preventDefault();
          textarea.current?.focus();
        }
      }}
    />
  );
}

/** Row above the input, holding attachments waiting to be sent (`AttachmentGroup`). */
function ComposerAttachments(props: Without<ComponentPropsWithoutRef<"div">>) {
  return <div {...props} data-slot="composer-attachments" />;
}

export interface ComposerTextAreaProps extends Omit<
  Without<ComponentPropsWithoutRef<"textarea">>,
  "value" | "defaultValue" | "onChange" | "disabled"
> {
  /**
   * Maximum number of rows it grows to, beyond which it scrolls inside, default 8.
   * @default 8
   */
  maxRows?: number;
  /**
   * Trigger character → candidates: type `@` to pick a person / file, `/` to pick a command. The key is the trigger character and the value is its candidates
   * (strings or `{ value, label }`). After selecting, text like `@ada ` is inserted into the input; the candidate list appears above the caret.
   */
  triggers?: Record<string, readonly (string | MentionOption)[]>;
  /** Called when a candidate is selected; prefix is the character that triggered it (record it here if you want to know who was mentioned). */
  onTriggerSelect?: (option: MentionOption, prefix: string) => void;
}

function ComposerTextArea({
  maxRows = 8,
  triggers,
  onTriggerSelect,
  onKeyDown,
  ...rest
}: ComposerTextAreaProps) {
  const { value, setValue, disabled, submitOn, labels, submit, textarea } = useComposer();

  useAutoGrow(textarea, value, maxRows);

  const menu = useMentionMenu({
    options: (prefix) => triggers?.[prefix] ?? [],
    prefixes: triggers ? Object.keys(triggers) : [],
    split: " ",
    value,
    setValue,
    getField: () => textarea.current,
    disabled,
    side: "top",
    multiline: true,
    onSelect: onTriggerSelect,
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // While the candidate list is open, up / down / Enter / Tab / Esc belong to it (it calls preventDefault, so nothing is submitted below)
    if (triggers) menu.inputProps.onKeyDown(e);
    onKeyDown?.(e);
    if (e.defaultPrevented || e.key !== "Enter") return;
    // Enter during IME composition is choosing characters, not submitting
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    const mod = e.metaKey || e.ctrlKey;
    const send = submitOn === "enter" ? !e.shiftKey && !mod : mod;
    if (send) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <>
      <textarea
        aria-label={labels.input}
        rows={1}
        {...rest}
        {...(triggers ? { ...menu.inputProps, onKeyDown: undefined } : null)}
        ref={textarea}
        data-slot="composer-textarea"
        value={value}
        disabled={disabled}
        onChange={(e) => (triggers ? menu.changeValue(e.target.value) : setValue(e.target.value))}
        onKeyDown={handleKeyDown}
      />
      {triggers ? menu.popup : null}
    </>
  );
}

/** Toolbar row below the input: attachment / mode actions on the left, send on the right. */
const ComposerToolbar = (props: Without<ComponentPropsWithoutRef<"div">>) => (
  <div {...props} data-slot="composer-toolbar" />
);
const ComposerToolbarStart = (props: Without<ComponentPropsWithoutRef<"div">>) => (
  <div {...props} data-slot="composer-toolbar-start" />
);
const ComposerToolbarEnd = (props: Without<ComponentPropsWithoutRef<"div">>) => (
  <div {...props} data-slot="composer-toolbar-end" />
);

export interface ComposerActionProps extends Omit<
  ButtonProps,
  "variant" | "color" | "size" | "iconOnly" | "children" | "aria-label"
> {
  /** Icon only, so the name is required. */
  "aria-label": string;
  children?: ReactNode;
}

/** An icon button in the toolbar (attachment, microphone, mode...): a small, subtle `Button` that does not submit the form. */
function ComposerAction(props: ComposerActionProps) {
  const { disabled } = useComposer();
  return (
    <Button
      variant="ghost"
      color="neutral"
      size="sm"
      iconOnly
      type="button"
      disabled={disabled}
      {...props}
    />
  );
}

const SendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
const StopIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export type ComposerSendProps = Omit<
  ButtonProps,
  "variant" | "color" | "size" | "iconOnly" | "radius" | "type" | "onClick" | "aria-label"
> & { "aria-label"?: string };

/**
 * Send button: when idle it is a submit button (disabled when there is nothing to send); while the assistant is replying (status = streaming) it becomes a stop button,
 * and clicking it triggers `onStop`. The name changes with the state (Send message / Stop generating).
 */
function ComposerSend({ "aria-label": label, children, ...rest }: ComposerSendProps) {
  const { status, canSubmit, disabled, labels, stop } = useComposer();
  const streaming = status === "streaming";
  return (
    <Button
      radius="full"
      size="sm"
      iconOnly
      {...rest}
      data-action={streaming ? "stop" : "send"}
      type={streaming ? "button" : "submit"}
      disabled={streaming ? false : !canSubmit || disabled}
      aria-label={label ?? (streaming ? labels.stop : labels.send)}
      onClick={streaming ? stop : undefined}
    >
      {children ?? (streaming ? <StopIcon /> : <SendIcon />)}
    </Button>
  );
}

/** A line of small text below the input area (e.g. "AI can make mistakes, please verify important information"). */
const ComposerFooter = (props: Without<ComponentPropsWithoutRef<"p">>) => (
  <p {...props} data-slot="composer-footer" />
);

export const Composer = Object.assign(ComposerRoot, {
  Shell: ComposerShell,
  Attachments: ComposerAttachments,
  TextArea: ComposerTextArea,
  Toolbar: ComposerToolbar,
  ToolbarStart: ComposerToolbarStart,
  ToolbarEnd: ComposerToolbarEnd,
  Action: ComposerAction,
  Send: ComposerSend,
  Footer: ComposerFooter,
});
