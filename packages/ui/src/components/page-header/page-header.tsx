import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Text, Title } from "../typography/index.ts";

type Without<T> = Omit<T, "className" | "style" | "title" | "children">;

export interface PageHeaderProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** The title of the page. */
  title?: ReactNode;
  /** One line under the title: what the page is for. */
  description?: ReactNode;
  /** Above the title: the way back to the list this page belongs to, a link (`<RouterLink to="/tickets">Tickets</RouterLink>`). */
  back?: ReactNode;
  /** On the right of the title: the main action of the page (a primary Button) and what goes with it. Wraps under the title on a narrow screen. */
  actions?: ReactNode;
  /**
   * The heading level of the title (h1–h5); the type scale is the theme style's.
   * @default 3
   */
  level?: 1 | 2 | 3 | 4 | 5;
}

/**
 * Page header: the top of a page: its title and one line of description on the left, its actions on the right (a "New" button).
 * Every page of an app starts the same way, and the theme style decides how (the spacing, the type scale, how the actions wrap), so the pages of different apps look alike.
 * It is the look only: tabs, breadcrumbs and routing are the app's. Renders nothing when it has no title, description and actions.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  level = 3,
  ...rest
}: PageHeaderProps) {
  if (!title && !description && !actions && !back) return null;
  return (
    <div {...rest} data-slot="page-header">
      <div data-slot="page-header-main">
        {back ? <div data-slot="page-header-back">{back}</div> : null}
        {title ? <Title level={level}>{title}</Title> : null}
        {description ? <Text tone="secondary">{description}</Text> : null}
      </div>
      {actions ? <div data-slot="page-header-actions">{actions}</div> : null}
    </div>
  );
}
