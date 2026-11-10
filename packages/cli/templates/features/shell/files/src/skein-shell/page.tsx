import { Flex, PageHeader } from "@skeinui/ui";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePagePath } from "./keep-alive-outlet";
import { usePageTitles } from "./store";

/**
 * A page's frame: the PageHeader (title, description and actions: the theme style lays it out, so every page starts the same way) on top, then the content. The title (or `tabTitle`, when the
 * title isn't plain text) also names the page's tab and ends its breadcrumb when it isn't a menu item itself
 * (a detail page).
 */
export function Page({
  title,
  tabTitle,
  description,
  actions,
  fill = false,
  children,
}: {
  title?: ReactNode;
  tabTitle?: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Fill the height of the content area instead of growing with the content: what a table that scrolls its rows (`DataTable stickyHeader` in a `Card fill`) needs. */
  fill?: boolean;
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

  return (
    // The layout's content area has no padding of its own: the page decides
    <div className="page" data-fill={fill ? "" : undefined}>
      <Flex direction="column" gap="lg" grow={fill}>
        <PageHeader title={title} description={description} actions={actions} />
        {children}
      </Flex>
    </div>
  );
}
