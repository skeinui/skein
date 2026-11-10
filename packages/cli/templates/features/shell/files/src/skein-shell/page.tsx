import { Page as PageFrame } from "@skeinui/ui";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePagePath } from "./keep-alive-outlet";
import { usePageTitles } from "./store";

/**
 * A page's frame: the library's `Page` (a PageHeader with the title, description and actions, the content, a footer, all laid out by the theme style, so every page starts the same way) plus what only the app knows: the title (or `tabTitle`, when the
 * title isn't plain text) also names the page's tab and ends its breadcrumb when it isn't a menu item itself
 * (a detail page).
 */
export function Page({
  title,
  tabTitle,
  description,
  actions,
  footer,
  fill = false,
  loading,
  notFound,
  children,
}: {
  title?: ReactNode;
  tabTitle?: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** The bottom of the page: a `PageFooter` with the actions that finish it (Cancel, Save). */
  footer?: ReactNode;
  /** Fill the height of the content area instead of growing with the content: what a table that scrolls its rows (`DataTable stickyHeader` in a `Card fill`) needs. */
  fill?: boolean;
  /** The page's data is on its way: a spinner takes the place of the content, the header stays. */
  loading?: boolean;
  /** The page's thing is not there (a 404): this (an `Empty`) takes the place of the content. */
  notFound?: ReactNode;
  children?: ReactNode;
}) {
  // The path the page was opened at: a page kept alive in a background tab must not take the current one's
  const pathname = usePagePath();
  const [path] = useState(pathname);
  const name = tabTitle ?? (typeof title === "string" ? title : undefined);
  const setTitle = usePageTitles((s) => s.setTitle);
  useEffect(() => {
    if (name) setTitle(path, name);
  }, [path, name, setTitle]);

  // The frame is the library's Page: its padding, spacing, header and `fill` come from the theme style
  return (
    <PageFrame
      title={title}
      description={description}
      actions={actions}
      footer={footer}
      fill={fill}
      loading={loading}
      notFound={notFound}
    >
      {children}
    </PageFrame>
  );
}
