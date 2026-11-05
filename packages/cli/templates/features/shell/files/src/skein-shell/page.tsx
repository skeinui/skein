import { Flex, Text, Title } from "@skeinui/ui";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePagePath } from "./keep-alive-outlet";
import { usePageTitles } from "./store";

/**
 * A page's frame: title, description and actions on top, then the content. The title (or `tabTitle`, when the
 * title isn't plain text) also names the page's tab and ends its breadcrumb when it isn't a menu item itself
 * (a detail page).
 */
export function Page({
  title,
  tabTitle,
  description,
  actions,
  children,
}: {
  title?: ReactNode;
  tabTitle?: string;
  description?: ReactNode;
  actions?: ReactNode;
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
    <div className="page">
      <Flex direction="column" gap="lg">
        {title || actions ? (
          <Flex align="start" justify="between" gap="md" wrap>
            <Flex direction="column" gap="xs">
              {title ? <Title level={3}>{title}</Title> : null}
              {description ? <Text tone="secondary">{description}</Text> : null}
            </Flex>
            {actions ? <Flex gap="sm">{actions}</Flex> : null}
          </Flex>
        ) : null}
        {children}
      </Flex>
    </div>
  );
}
