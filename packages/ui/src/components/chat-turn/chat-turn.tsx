import { useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, FormEvent, KeyboardEvent, ReactNode } from "react";
import { Avatar } from "../avatar/index.ts";
import type { AvatarProps } from "../avatar/index.ts";
import { Button } from "../button/index.ts";
import type { ButtonProps } from "../button/index.ts";
import { useAutoGrow } from "../composer/auto-grow.ts";
import { useConfig } from "../config-provider/context.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface ChatTurnRootProps extends Without<ComponentPropsWithoutRef<"article">> {
  /** Name of this turn, for screen readers; by default "Assistant" for the assistant and "You" for the user. */
  "aria-label"?: string;
}

/** An assistant turn: avatar on the left, content column on the right (text, sources, tool calls and action buttons all go in Body). */
function ChatTurnAssistant({ "aria-label": labelProp, ...rest }: ChatTurnRootProps) {
  const t = useLabels("chatTurn");
  const label = labelProp ?? t.assistant;
  return <article {...rest} aria-label={label} data-slot="chat-turn" data-role="assistant" />;
}

/** A user turn: a right-aligned bubble with action buttons below. */
function ChatTurnUser({ "aria-label": labelProp, ...rest }: ChatTurnRootProps) {
  const t = useLabels("chatTurn");
  const label = labelProp ?? t.user;
  return <article {...rest} aria-label={label} data-slot="chat-turn" data-role="user" />;
}

export interface ChatTurnAvatarProps extends Omit<AvatarProps, "size"> {
  /** For several consecutive assistant messages, only the first shows the avatar and the rest pass `false`: leaving an empty slot of the same width so the text aligns. Shown by default. */
  show?: boolean;
}

function ChatTurnAvatar({ show = true, ...rest }: ChatTurnAvatarProps) {
  return show ? (
    <span data-slot="chat-turn-avatar">
      <Avatar size="sm" {...rest} />
    </span>
  ) : (
    <span data-slot="chat-turn-avatar" data-hidden="" aria-hidden="true" />
  );
}

const ChatTurnBody = (props: Without<ComponentPropsWithoutRef<"div">>) => (
  <div {...props} data-slot="chat-turn-body" />
);
const ChatTurnBubble = (props: Without<ComponentPropsWithoutRef<"div">>) => (
  <div {...props} data-slot="chat-turn-bubble" />
);
const ChatTurnContent = (props: Without<ComponentPropsWithoutRef<"div">>) => (
  <div {...props} data-slot="chat-turn-content" />
);

export interface ChatTurnActionsProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Name of this group of actions, for screen readers, default "Message actions". */
  "aria-label"?: string;
}

/** A row of action buttons (copy, retry, like...): faded out normally, shown on hover or when keyboard focus is on this turn; always shown on touch devices. */
function ChatTurnActions({ "aria-label": labelProp, ...rest }: ChatTurnActionsProps) {
  const t = useLabels("chatTurn");
  const label = labelProp ?? t.actions;
  return <div {...rest} role="group" aria-label={label} data-slot="chat-turn-actions" />;
}

export interface ChatTurnActionProps extends Omit<
  ButtonProps,
  "variant" | "color" | "size" | "iconOnly" | "children" | "aria-label"
> {
  /** Icon only, so the name is required. */
  "aria-label": string;
  /** State of toggle-type actions (like / dislike), written as `aria-pressed`. */
  pressed?: boolean;
  children?: ReactNode;
}

/** An icon button: just a small, subtle `Button`. */
function ChatTurnAction({ pressed, ...rest }: ChatTurnActionProps) {
  return (
    <Button variant="ghost" color="neutral" size="sm" iconOnly aria-pressed={pressed} {...rest} />
  );
}

/** Text for the chat message parts (edit, version switch, send status). */
export interface ChatTurnLabels {
  save?: string;
  cancel?: string;
  group?: string;
  previous?: string;
  next?: string;
  sending?: string;
  failed?: string;
  retry?: string;
  /** Names of the assistant / user message, the actions area and the edit box. */
  assistant?: string;
  user?: string;
  actions?: string;
  edit?: string;
}

export interface ChatTurnEditProps extends Omit<
  Without<ComponentPropsWithoutRef<"form">>,
  "onSubmit" | "defaultValue"
> {
  /** Text before editing. */
  defaultValue: string;
  /** Save: the argument is the edited text (Save button or ⌘ / Ctrl + Enter). */
  onSave: (value: string) => void;
  /** Cancel (Cancel button or Esc). */
  onCancel: () => void;
  /** Name of the input, default "Edit message". */
  "aria-label"?: string;
  labels?: { save?: string; cancel?: string };
  /** Maximum number of rows it grows to, default 10. */
  maxRows?: number;
}

/**
 * Edit a user message: placed inside `ChatTurn.User` in place of `Bubble`. An input that grows with its content plus Save / Cancel;
 * Enter inserts a newline, ⌘ / Ctrl + Enter saves, Esc cancels; focuses on mount with the caret at the end; empty text cannot be saved.
 */
function ChatTurnEdit({
  defaultValue,
  onSave,
  onCancel,
  "aria-label": editLabel,
  labels: labelsProp,
  maxRows = 10,
  ...rest
}: ChatTurnEditProps) {
  const labels = useLabels("chatTurn", labelsProp);
  const label = editLabel ?? labels.edit;
  const [value, setValue] = useState(defaultValue);
  const textarea = useRef<HTMLTextAreaElement>(null);
  useAutoGrow(textarea, value, maxRows);
  // Focus on mount, caret at the end
  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  const canSave = value.trim() !== "";
  const save = () => {
    if (canSave) onSave(value);
  };
  return (
    <form
      {...rest}
      data-slot="chat-turn-edit"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        save();
      }}
    >
      <textarea
        ref={textarea}
        data-slot="chat-turn-edit-textarea"
        aria-label={label}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
            e.preventDefault();
            save();
          }
        }}
      />
      <div data-slot="chat-turn-edit-actions">
        <Button variant="outline" color="neutral" size="sm" type="button" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button size="sm" type="submit" disabled={!canSave}>
          {labels.save}
        </Button>
      </div>
    </form>
  );
}

export interface ChatTurnPagerProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Current version index (0-based). */
  index: number;
  /** Total number of versions; not rendered when fewer than 2. */
  count: number;
  onIndexChange: (index: number) => void;
  labels?: { group?: string; previous?: string; next?: string };
}

const Chevron = ({ direction }: { direction: "left" | "right" }) => (
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
    <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
  </svg>
);

/**
 * Switch between multiple reply versions of the same question (after regenerating): "‹ 2 / 3 ›".
 * Placed inside `ChatTurn.Actions`; the button for the direction at the end is disabled; number changes are announced (aria-live).
 */
function ChatTurnPager({
  index,
  count,
  onIndexChange,
  labels: labelsProp,
  ...rest
}: ChatTurnPagerProps) {
  const labels = useLabels("chatTurn", labelsProp);
  if (count < 2) return null;
  return (
    <div {...rest} role="group" aria-label={labels.group} data-slot="chat-turn-pager">
      <Button
        variant="ghost"
        color="neutral"
        size="sm"
        iconOnly
        type="button"
        aria-label={labels.previous}
        disabled={index <= 0}
        onClick={() => onIndexChange(index - 1)}
      >
        <Chevron direction="left" />
      </Button>
      <span data-slot="chat-turn-pager-count" aria-live="polite">
        {index + 1} / {count}
      </span>
      <Button
        variant="ghost"
        color="neutral"
        size="sm"
        iconOnly
        type="button"
        aria-label={labels.next}
        disabled={index >= count - 1}
        onClick={() => onIndexChange(index + 1)}
      >
        <Chevron direction="right" />
      </Button>
    </div>
  );
}

export interface ChatTurnStatusProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** sending: being sent, failed: send failed (with retry). */
  state: "sending" | "failed";
  /** Click "Retry" on failure; without it there is no retry button. */
  onRetry?: () => void;
  labels?: { sending?: string; failed?: string; retry?: string };
}

/** Send status of a message: sending is `role="status"`, failed is `role="alert"` (announced immediately by screen readers) and can be retried. */
function ChatTurnStatus({ state, onRetry, labels: labelsProp, ...rest }: ChatTurnStatusProps) {
  const labels = useLabels("chatTurn", labelsProp);
  return (
    <div
      {...rest}
      role={state === "failed" ? "alert" : "status"}
      data-slot="chat-turn-status"
      data-state={state}
    >
      <span>{state === "failed" ? labels.failed : labels.sending}</span>
      {state === "failed" && onRetry ? (
        <button type="button" data-slot="chat-turn-status-retry" onClick={onRetry}>
          {labels.retry}
        </button>
      ) : null}
    </div>
  );
}

export interface ChatTurnTimeProps extends Without<ComponentPropsWithoutRef<"time">> {
  /** Time: a Date, a timestamp or an ISO string. */
  value: Date | string | number;
  /** time shows only the time (default), datetime includes the date. */
  display?: "time" | "datetime";
  /** Locale, defaults to the ConfigProvider locale, then the browser's. */
  locale?: string;
}

/** Timestamp of a message: `<time datetime>`, formatted by locale, hover (title) shows the full date and time. */
function ChatTurnTime({ value, display = "time", locale: localeProp, ...rest }: ChatTurnTimeProps) {
  const config = useConfig();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const locale = localeProp ?? config.locale;
  const text = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
    ...(display === "datetime" ? { dateStyle: "medium" as const } : null),
  }).format(date);
  const full = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "medium" }).format(
    date,
  );
  return (
    <time {...rest} data-slot="chat-turn-time" dateTime={date.toISOString()} title={full}>
      {text}
    </time>
  );
}

/**
 * A message in a chat, used to compose the assistant / user layouts:
 * put `Avatar` + `Body` (`Content`, `Actions`...) in `<ChatTurn.Assistant>`, and `Bubble` (`Content`) and `Actions` in `<ChatTurn.User>`.
 * Each one is an `article` with a name, so inside `ChatThread` (`role="log"`) screen readers can read them one by one.
 */
export const ChatTurn = {
  Assistant: ChatTurnAssistant,
  User: ChatTurnUser,
  Avatar: ChatTurnAvatar,
  Body: ChatTurnBody,
  Bubble: ChatTurnBubble,
  Content: ChatTurnContent,
  Actions: ChatTurnActions,
  Action: ChatTurnAction,
  Edit: ChatTurnEdit,
  Pager: ChatTurnPager,
  Status: ChatTurnStatus,
  Time: ChatTurnTime,
};
