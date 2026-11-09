import type { ReactNode } from "react";
import type { TagVariant, UIColor, UIRadius, UISize } from "../../contract.ts";
import { Tag } from "../tag/index.ts";

/** How one value of an enum looks. */
export interface EnumTagOption {
  /** The text shown. */
  label: ReactNode;
  /** @default "neutral" */
  color?: UIColor;
  /** The look of this value, over the `variant` of the tag: an urgent priority can be `solid` while the others are `soft`. */
  variant?: TagVariant;
}

export interface EnumTagProps {
  /** The value to show. */
  value: string;
  /** Every value and how it looks, by value. A value that is not here shows as it is, in neutral. */
  options: Readonly<Record<string, EnumTagOption>>;
  /** @default "soft" */
  variant?: TagVariant;
  /** @default "md" */
  size?: UISize;
  radius?: UIRadius;
}

/**
 * Enum tag: the value of a field with a fixed set of values (a status, a priority, a plan) as a Tag whose text and colour come from a table: `options[value]`.
 * Write the table once for a field and each use is `<EnumTag value={ticket.status} options={STATUS} />`, instead of a component per field.
 * For a free label use Tag.
 */
export function EnumTag({ value, options, variant = "soft", size, radius }: EnumTagProps) {
  const option = options[value];
  return (
    <Tag variant={option?.variant ?? variant} color={option?.color} size={size} radius={radius}>
      {option ? option.label : value}
    </Tag>
  );
}
