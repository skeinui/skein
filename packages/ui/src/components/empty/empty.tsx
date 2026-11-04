import type { ReactNode } from "react";
import type { UISize } from "../../contract.ts";

type DivProps = Omit<
  import("react").ComponentPropsWithoutRef<"div">,
  "className" | "style" | "title"
>;

export interface EmptyProps extends DivProps {
  /** Icon / illustration, placed at the top. */
  icon?: ReactNode;
  /** Short headline, e.g. "No results". */
  title?: ReactNode;
  /** Supporting text under the title: why it is empty or what to do next. */
  description?: ReactNode;
  /** Action area below, usually one or two buttons. */
  actions?: ReactNode;
  /**
   * Size step (padding and title size).
   * @default "md"
   */
  size?: UISize;
}

/** Empty state: placeholder message when there is no data or no search results. Data-driven, every part is optional. */
export function Empty({ icon, title, description, actions, size = "md", ...rest }: EmptyProps) {
  return (
    <div {...rest} data-slot="empty" data-size={size}>
      {icon ? (
        <div data-slot="empty-icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      {title ? <div data-slot="empty-title">{title}</div> : null}
      {description ? <div data-slot="empty-description">{description}</div> : null}
      {actions ? <div data-slot="empty-actions">{actions}</div> : null}
    </div>
  );
}
