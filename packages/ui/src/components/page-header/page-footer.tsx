import type { ComponentPropsWithoutRef } from "react";
import { PAGE_FOOTER_ALIGNS } from "../../contract.ts";
import type { PageFooterAlign } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface PageFooterProps extends Without<ComponentPropsWithoutRef<"div">> {
  /**
   * Where the content sits in the bar: `end` for the actions of a form (Cancel, Save), `between` for a note on the left and actions on the right.
   * @default "end"
   */
  align?: PageFooterAlign;
  /**
   * Stay at the bottom edge of the scrolling area while the page scrolls, with a line above it, so the Save of a long form is always in reach.
   * @default false
   */
  sticky?: boolean;
}

/**
 * Page footer: the bar at the bottom of a page: the actions that finish it (Cancel, Save) or a line about it. `sticky` keeps it in view while a long page scrolls.
 * It is the page's own: for the footer of the whole app (the copyright line) use the `footer` of AdminLayout.
 */
export function PageFooter({ align = "end", sticky = false, ...rest }: PageFooterProps) {
  return (
    <div
      {...rest}
      data-slot="page-footer"
      data-align={PAGE_FOOTER_ALIGNS.includes(align) ? align : "end"}
      data-sticky={sticky ? "" : undefined}
    />
  );
}
