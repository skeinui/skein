import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Flex } from "../layout/index.ts";
import { ScrollArea } from "../scroll-area/index.ts";
import { Spinner } from "../spinner/index.ts";
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
  /** The data of the page is on its way: a spinner takes the place of the content (the header and the frame stay). */
  loading?: boolean;
  /** The page's thing is not there (a 404, no permission): this (an `Empty`, a `Text`) takes the place of the content, and wins over `loading`. */
  notFound?: ReactNode;
  children?: ReactNode;
}

/**
 * Page: the frame of one page of an app: a PageHeader (`title`, `description`, `actions`), the content, and a `footer`, with the padding and the space between them from the theme style, so every page of every app is framed the same way.
 * It is the look only: the tab, the breadcrumb and the route are the app's. For a page that scrolls its table under a fixed header use `fill`.
 * The page scrolls on its own, inside its frame (a `ScrollArea`), so the area it is in (the content of an app shell) does not need to; with `fill` it does not scroll and takes the height of the area.
 * `loading` and `notFound` stand in for the content while a detail page's data loads or when it is not there, so the page keeps its frame in every state.
 */
export function Page({
  title,
  description,
  actions,
  level,
  footer,
  fill = false,
  loading = false,
  notFound,
  children,
  ...rest
}: PageProps) {
  const content = (
    <div data-slot="page-content" data-fill={fill ? "" : undefined}>
      <PageHeader title={title} description={description} actions={actions} level={level} />
      <div data-slot="page-body">
        {notFound ? (
          notFound
        ) : loading ? (
          <Flex justify="center">
            <Spinner />
          </Flex>
        ) : (
          children
        )}
      </div>
      {footer}
    </div>
  );
  // A page that fills its area does not scroll (its table does); any other scrolls inside the frame, with the theme style's scrollbar
  return (
    <div {...rest} data-slot="page" data-fill={fill ? "" : undefined}>
      {fill ? content : <ScrollArea>{content}</ScrollArea>}
    </div>
  );
}
