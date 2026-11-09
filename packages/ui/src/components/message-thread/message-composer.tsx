import type { ReactNode } from "react";
import type { MessageComposerLabels } from "../../locales/messages.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { Button } from "../button/index.ts";
import { Textarea } from "../input/index.ts";
import { Flex } from "../layout/index.ts";
import { Mentions } from "../mentions/index.ts";
import type { MentionOption } from "../mentions/index.ts";
import { Segmented } from "../segmented/index.ts";

/** One way of writing: a reply to the customer, an internal note. */
export interface ComposerMode {
  value: string;
  /** Name of the mode, in the switch above the box ("Reply", "Internal note"). */
  label: string;
  placeholder?: string;
  /** The people who can be mentioned with `@` in this mode (the box becomes a Mentions); none, a plain box. */
  mentions?: readonly (string | MentionOption)[];
  /** Text of the send button in this mode ("Send reply", "Add note"); the default "Send". */
  sendLabel?: string;
}

export interface MessageComposerProps {
  /** The ways of writing; a switch shows when there are two or more. */
  modes: readonly ComposerMode[];
  /** The mode in use. */
  mode: string;
  onModeChange: (mode: string) => void;
  /** What is typed. One draft: keep one per mode in your state when each mode should remember its own. */
  value: string;
  onValueChange: (value: string) => void;
  /** Called when the send button is pressed (or Ctrl / ⌘ + Enter) and there is something to send. */
  onSend: (value: string, mode: string) => void;
  /** Sending: the button spins and the box can not be sent again. */
  sending?: boolean;
  disabled?: boolean;
  /** Visible rows of the box. @default 4 */
  rows?: number;
  /** Tools above the box that depend on the mode: canned replies, a tone switch, an AI suggestion. A function gets the mode. */
  toolbar?: ReactNode | ((mode: string) => ReactNode);
  /** Texts for another language; the default follows the `locale` of ConfigProvider. */
  labels?: Partial<MessageComposerLabels>;
}

/**
 * Message composer: the box under a MessageThread to write the next message: a switch between the ways of writing (reply, internal note), a box that takes mentions where the mode has `mentions`, a `toolbar` for what you add, and a send button.
 * Everything is controlled: `mode`, `value` and `onSend` are yours. For the box of an AI chat use Composer.
 */
export function MessageComposer({
  modes,
  mode,
  onModeChange,
  value,
  onValueChange,
  onSend,
  sending = false,
  disabled = false,
  rows = 4,
  toolbar,
  labels,
}: MessageComposerProps) {
  const t = { ...useLabels("messageComposer"), ...labels };
  const current = modes.find((m) => m.value === mode) ?? modes[0];
  if (!current) return null;
  const empty = !value.trim();
  const send = () => {
    if (!empty && !sending && !disabled) onSend(value, current.value);
  };
  const tools = typeof toolbar === "function" ? toolbar(current.value) : toolbar;
  return (
    <Flex direction="column" gap="sm">
      <Flex justify="between" align="center" wrap gap="sm">
        {modes.length > 1 ? (
          <Segmented
            size="sm"
            aria-label={t.mode}
            value={current.value}
            onValueChange={onModeChange}
            options={modes.map((m) => ({ value: m.value, label: m.label }))}
          />
        ) : null}
        {tools}
      </Flex>
      {current.mentions ? (
        <Mentions
          fullWidth
          rows={rows}
          aria-label={current.label}
          placeholder={current.placeholder}
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          options={current.mentions}
        />
      ) : (
        <Textarea
          fullWidth
          autoSize={{ minRows: rows, maxRows: 14 }}
          aria-label={current.label}
          placeholder={current.placeholder}
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              send();
            }
          }}
        />
      )}
      <Flex justify="end">
        <Button loading={sending} disabled={disabled || empty} onClick={send}>
          {current.sendLabel ?? t.send}
        </Button>
      </Flex>
    </Flex>
  );
}
