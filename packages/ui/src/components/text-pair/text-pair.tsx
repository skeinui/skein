import type { ReactNode } from "react";
import { Flex } from "../layout/index.ts";
import { Text } from "../typography/index.ts";

export interface TextPairProps {
  /** The first line: the name, the subject, a link. */
  title: ReactNode;
  /** The line under it, in the secondary color: the email, the domain, a preview. */
  description?: ReactNode;
  /** After the title, on the same line: a Tag ("VIP", "You"), an icon. */
  extra?: ReactNode;
  /**
   * Draw the title in bold. Turn it off for a title that is a link, which has its own look.
   * @default true
   */
  strong?: boolean;
  /** Cut the description to one line with an ellipsis. */
  ellipsis?: boolean;
}

/**
 * Text pair: two lines that belong together, the thing and what describes it: a person's name over their email, a subject over its preview, a company over its domain.
 * The cell of a table's first column, a row of a list. `extra` sits after the title (a Tag, an icon).
 */
export function TextPair({ title, description, extra, strong = true, ellipsis }: TextPairProps) {
  const first = <Text strong={strong}>{title}</Text>;
  return (
    <Flex direction="column" gap="xs">
      {extra ? (
        <Flex align="center" gap="xs">
          {first}
          {extra}
        </Flex>
      ) : (
        first
      )}
      {description ? (
        <Text tone="secondary" ellipsis={ellipsis}>
          {description}
        </Text>
      ) : null}
    </Flex>
  );
}
