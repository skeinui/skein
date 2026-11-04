import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { UIOrientation } from "../../contract.ts";

export interface SeparatorProps extends Omit<
  BaseSeparator.Props,
  "className" | "style" | "render" | "orientation"
> {
  /**
   * Direction of the line, also written to `aria-orientation`.
   * @default "horizontal"
   */
  orientation?: UIOrientation;
}

/** Separator: horizontal or vertical, with thickness and color decided by the theme style. */
export function Separator({ orientation = "horizontal", ...rest }: SeparatorProps) {
  return <BaseSeparator {...rest} orientation={orientation} data-slot="separator" />;
}
