import { Fragment } from "react";
import { Text } from "../typography/index.ts";

export interface MentionTextProps {
  /** The text, which may hold mentions such as `@Ada Lin`. */
  text: string;
  /** The names that can be mentioned (the whole name of each, without the trigger): `["Ada Lin", "Ben Carter"]`. Only a mention of one of these is shown. */
  mentions: readonly string[];
  /**
   * What a mention starts with; the same as the `trigger` of the Mentions input.
   * @default "@"
   */
  trigger?: string;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Mention text: a message with the mentions in it shown in bold, the companion of the Mentions input (what is typed there is shown here).
 * `text` is the message, `mentions` the names someone can be mentioned by: `@Ada Lin` is bold, `@someone-else` is plain text. It renders text only, so put it in a Text or a Paragraph.
 */
export function MentionText({ text, mentions, trigger = "@" }: MentionTextProps) {
  // The longest first: "@Ada Lin" must not stop at "@Ada" when both are names
  const tokens = [...mentions].sort((a, b) => b.length - a.length).map((m) => `${trigger}${m}`);
  if (tokens.length === 0 || !tokens.some((t) => text.includes(t))) return <>{text}</>;
  const parts = text.split(new RegExp(`(${tokens.map(escape).join("|")})`));
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>{tokens.includes(part) ? <Text strong>{part}</Text> : part}</Fragment>
      ))}
    </>
  );
}
