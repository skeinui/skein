import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { UISize } from "../../contract.ts";
import { Empty } from "../empty/index.ts";
import { Spinner } from "../spinner/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style" | "title">;

export interface ListItemProps extends Without<ComponentPropsWithoutRef<"li">> {
  /** Avatar / icon on the left. */
  avatar?: ReactNode;
  /** Main line of the item. */
  title?: ReactNode;
  /** Secondary text under the title. */
  description?: ReactNode;
  /** Extra content on the right (time, status, thumbnail). */
  extra?: ReactNode;
  /** Actions on the far right (links, buttons), with separators added between them automatically. */
  actions?: readonly ReactNode[];
}

/** List item: avatar, title, description, extra content and actions on the right; you can also put children directly and lay them out yourself. */
function ListItem({
  avatar,
  title,
  description,
  extra,
  actions,
  children,
  ...rest
}: ListItemProps) {
  const hasMeta = avatar || title || description;
  return (
    <li {...rest} data-slot="list-item">
      {hasMeta ? (
        <div data-slot="list-meta">
          {avatar ? <div data-slot="list-avatar">{avatar}</div> : null}
          <div data-slot="list-content">
            {title ? <div data-slot="list-title">{title}</div> : null}
            {description ? <div data-slot="list-description">{description}</div> : null}
          </div>
        </div>
      ) : null}
      {children}
      {extra ? <div data-slot="list-extra">{extra}</div> : null}
      {actions?.length ? (
        <ul data-slot="list-actions">
          {actions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export interface ListItemData extends ListItemProps {
  /** Unique key of the item (React key). */
  key: string;
}

export interface ListProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Data-driven: each item is the props of `List.Item` plus a `key`. Can be omitted, and you put `List.Item` as children yourself. */
  items?: readonly ListItemData[];
  /** Content above the items (e.g. a heading or toolbar). */
  header?: ReactNode;
  /** Content below the items (e.g. a "Load more" button). */
  footer?: ReactNode;
  /**
   * Outer border + left and right padding of items.
   * @default false
   */
  bordered?: boolean;
  /**
   * Divider lines between items.
   * @default true
   */
  split?: boolean;
  /**
   * Vertical padding of the items.
   * @default "md"
   */
  size?: UISize;
  /**
   * Loading: the list fades, becomes unclickable, and a spinner is shown in the middle.
   * @default false
   */
  loading?: boolean;
  /** Content shown when there are no items: a string is shown in an `Empty`, a node as it is. Defaults to the locale's "No data". */
  empty?: ReactNode;
}

/**
 * List: a column of entries with avatar / title / description / actions, for vertical content streams such as messages, feeds and search results.
 * Semantically `<li>` inside `<ul>`; `aria-busy` is set while loading. For row and column alignment like a table use Table, not this.
 */
function ListRoot({
  items,
  header,
  footer,
  bordered = false,
  split = true,
  size = "md",
  loading = false,
  empty: emptyProp,
  children,
  ...rest
}: ListProps) {
  const t = useLabels("list");
  const empty = emptyProp ?? t.empty;
  const c = useLabels("common");
  const hasItems = items ? items.length > 0 : Boolean(children);
  return (
    <div
      {...rest}
      data-slot="list"
      data-bordered={bordered ? "" : undefined}
      data-split={split ? "" : undefined}
      data-size={size}
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
    >
      {header ? <div data-slot="list-header">{header}</div> : null}
      {hasItems ? (
        <ul data-slot="list-items">
          {items?.map(({ key, ...item }) => (
            <ListItem key={key} {...item} />
          ))}
          {children}
        </ul>
      ) : (
        <div data-slot="list-empty">
          {typeof empty === "string" ? <Empty description={empty} size="sm" /> : empty}
        </div>
      )}
      {footer ? <div data-slot="list-footer">{footer}</div> : null}
      {loading ? (
        <div data-slot="list-loading">
          <Spinner aria-label={c.loading} />
        </div>
      ) : null}
    </div>
  );
}

export const List = Object.assign(ListRoot, { Item: ListItem });
