import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { PageHeader } from "./page-header.tsx";
import type { PageHeaderProps } from "./page-header.tsx";

type Without<T> = Omit<T, "className" | "style" | "title">;

export interface PageProps
  extends
    Without<ComponentPropsWithoutRef<"div">>,
    Pick<PageHeaderProps, "title" | "description" | "actions" | "level"> {
  /** The bottom of the page: a PageFooter with the actions that finish it. */
  footer?: ReactNode;
  /**
   * Fill the height of the area the page is in (and let a Card `fill` take what is left of it) instead of growing with the content: what a table that scrolls its own rows under a fixed header needs.
   * @default false
   */
  fill?: boolean;
  children?: ReactNode;
}

/**
 * Page: the frame of one page of an app: a PageHeader (`title`, `description`, `actions`), the content, and a `footer`, with the padding and the space between them from the theme style, so every page of every app is framed the same way.
 * It is the look only: the tab, the breadcrumb and the route are the app's. For a page that scrolls its table under a fixed header use `fill`.
 */
export function Page({
  title,
  description,
  actions,
  level,
  footer,
  fill = false,
  children,
  ...rest
}: PageProps) {
  return (
    <div {...rest} data-slot="page" data-fill={fill ? "" : undefined}>
      <PageHeader title={title} description={description} actions={actions} level={level} />
      <div data-slot="page-body">{children}</div>
      {footer}
    </div>
  );
}
