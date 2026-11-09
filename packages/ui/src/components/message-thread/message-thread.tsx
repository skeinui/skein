import type { ReactNode } from "react";
import type { CalloutVariant, UIColor } from "../../contract.ts";
import type { MessageThreadLabels } from "../../locales/messages.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { Avatar } from "../avatar/index.ts";
import { Callout } from "../callout/index.ts";
import { useConfig } from "../config-provider/index.ts";
import { Flex } from "../layout/index.ts";
import { Link } from "../link/index.ts";
import { MentionText } from "../mention-text/index.ts";
import { RelativeTime } from "../relative-time/index.ts";
import { Tag } from "../tag/index.ts";
import { Paragraph, Text } from "../typography/index.ts";

export interface MessageAttachment {
  name: string;
  /** Size in bytes, shown as KB / MB. */
  size?: number;
  /** Where the file is: the name becomes a link. */
  href?: string;
}

export interface ThreadMessage {
  /** Identifies the message (React key). */
  id: string | number;
  /** Which kind of message it is: a key of `kinds`. */
  kind: string;
  /** Who wrote it. */
  author: string;
  /** Picture of the author; the initials of the name when omitted. */
  avatar?: string;
  /** When it was sent: a `Date`, an ISO string or a timestamp in milliseconds. */
  time: Date | string | number;
  /** The text; a string keeps its line breaks and shows its mentions in bold (`mentions`), anything else is shown as it is. */
  body: ReactNode;
  attachments?: readonly MessageAttachment[];
}

/** How one kind of message looks: its label and the Callout it sits in. */
export interface MessageKind {
  /** Name of the kind, shown as a tag after the author ("Customer", "Internal note"). */
  label: string;
  /** @default "outline" */
  variant?: CalloutVariant;
  /** @default "neutral" */
  color?: UIColor;
}

export interface MessageThreadProps {
  messages: readonly ThreadMessage[];
  /** The kinds of message and how each looks, by the `kind` of the messages. A message of a kind that is not here looks like `outline` / `neutral` without a tag. */
  kinds: Readonly<Record<string, MessageKind>>;
  /** Names that can be mentioned (without the trigger): `@name` in the text of a message is shown in bold. */
  mentions?: readonly string[];
  /** Say "5 minutes ago" instead of the date. @default false */
  relativeTime?: boolean;
  /** BCP 47 tag of the language of the dates; defaults to the `locale` of ConfigProvider. */
  locale?: string;
  /** Shown when there are no messages. */
  empty?: ReactNode;
  "aria-label"?: string;
  /** Texts for another language; the default follows the `locale` of ConfigProvider. */
  labels?: Partial<MessageThreadLabels>;
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const sizeOf = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * Message thread: a conversation as a column of messages: who wrote it, what kind of message it is (the customer's, the agent's, an internal note), when, the text with its mentions, and the files.
 * `messages` are the data and `kinds` say how each kind looks (a label, and the `variant` / `color` of the Callout it sits in). For the reply box under it see MessageComposer.
 * For a conversation with an AI assistant use ChatThread; this one is for people writing to each other.
 */
export function MessageThread({
  messages,
  kinds,
  mentions,
  relativeTime = false,
  locale: localeProp,
  empty,
  labels,
  ...rest
}: MessageThreadProps) {
  const t = { ...useLabels("messageThread"), ...labels };
  const config = useConfig();
  const locale = localeProp ?? config.locale;
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  if (messages.length === 0) return <Text tone="secondary">{empty ?? t.empty}</Text>;
  return (
    <Flex direction="column" gap="sm" role="log" aria-label={t.label} {...rest}>
      {messages.map((m) => {
        const kind = kinds[m.kind];
        const date = new Date(m.time);
        return (
          <Callout
            key={m.id}
            role="article"
            aria-label={m.author}
            variant={kind?.variant}
            color={kind?.color}
          >
            <Flex direction="column" gap="sm">
              <Flex align="center" gap="sm">
                <Avatar size="sm" src={m.avatar} alt="" fallback={initialsOf(m.author)} />
                <Text strong>{m.author}</Text>
                {kind ? (
                  <Tag size="sm" variant="outline" color={kind.color}>
                    {kind.label}
                  </Tag>
                ) : null}
                <Flex.Spacer />
                <Text tone="secondary">
                  {relativeTime ? (
                    <RelativeTime value={m.time} locale={locale} />
                  ) : (
                    <time dateTime={date.toISOString()}>{format.format(date)}</time>
                  )}
                </Text>
              </Flex>
              {typeof m.body === "string" ? (
                <Paragraph preserveWhitespace>
                  {mentions?.length ? (
                    <MentionText text={m.body} mentions={[...mentions]} />
                  ) : (
                    m.body
                  )}
                </Paragraph>
              ) : (
                m.body
              )}
              {m.attachments?.length ? (
                <Flex gap="xs" wrap aria-label={t.attachments}>
                  {m.attachments.map((a) => (
                    <Tag key={a.name} size="sm" variant="outline">
                      {a.href ? (
                        <Link external href={a.href}>
                          {a.name}
                        </Link>
                      ) : (
                        a.name
                      )}
                      {a.size === undefined ? "" : ` · ${sizeOf(a.size)}`}
                    </Tag>
                  ))}
                </Flex>
              ) : null}
            </Flex>
          </Callout>
        );
      })}
    </Flex>
  );
}
