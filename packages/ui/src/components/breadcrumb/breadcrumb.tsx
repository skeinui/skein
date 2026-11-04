import { createContext, useContext } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useLabels } from "../../locales/use-labels.ts";

/** Icon display: `all` shows every item's (items with `icon`), `first` keeps only the first item's, `none` shows none. */
export type BreadcrumbIcons = "all" | "first" | "none";
/** Separator style: `chevron` a right-pointing small arrow, `slash` a slash. */
export type BreadcrumbSeparatorStyle = "chevron" | "slash";

/**
 * Default look of the breadcrumb: provided by an outer component (`AdminLayout`, per settings); `Breadcrumb`'s own `icons` / `separatorStyle` win.
 */
export const BreadcrumbDefaults = createContext<{
  icons?: BreadcrumbIcons;
  separatorStyle?: BreadcrumbSeparatorStyle;
}>({});

export interface BreadcrumbItem {
  /** Icon before this item (whether it is shown is decided by `icons`). */
  icon?: ReactNode;
  /** Text of this level. */
  label: ReactNode;
  /** With href it renders as a link; without it is plain text (the last item is always the current page). */
  href?: string;
  /** Click handler (e.g. router navigation); makes the item a link even without `href`. Not called for the last item. */
  onClick?: () => void;
}

export interface BreadcrumbProps extends Omit<
  ComponentPropsWithoutRef<"nav">,
  "className" | "style" | "children"
> {
  /** The path from the root to the current page (`BreadcrumbItem`: `label`, `href` / `onClick`, `icon`); the last item is the current page. */
  items: BreadcrumbItem[];
  /** Custom separator; when given, `separatorStyle` is ignored. */
  separator?: ReactNode;
  /**
   * Separator style: `chevron` (a right-pointing small arrow) or `slash`.
   * @default "chevron"
   */
  separatorStyle?: BreadcrumbSeparatorStyle;
  /**
   * Icon display. Inside AdminLayout the breadcrumb takes the layout's setting; this prop wins over it.
   * @default "all"
   */
  icons?: BreadcrumbIcons;
}

const DefaultSeparator = () => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/**
 * Breadcrumb: the path from the root to the current page (`items`, each with `label` and an optional `href`).
 * The last item is the current page (marked `aria-current="page"`, never a link); `separatorStyle` and `icons` set the look.
 */
export function Breadcrumb({
  items,
  separator,
  separatorStyle: separatorStyleProp,
  icons: iconsProp,
  ...rest
}: BreadcrumbProps) {
  const t = useLabels("breadcrumb");
  const defaults = useContext(BreadcrumbDefaults);
  const icons = iconsProp ?? defaults.icons ?? "all";
  const separatorStyle = separatorStyleProp ?? defaults.separatorStyle ?? "chevron";
  return (
    <nav aria-label={t.navigation} {...rest} data-slot="breadcrumb" data-icons={icons}>
      <ol data-slot="breadcrumb-list">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const showIcon = item.icon != null && (icons === "all" || (icons === "first" && i === 0));
          const content = (
            <>
              {showIcon ? (
                <span data-slot="breadcrumb-icon" aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}
              {item.label}
            </>
          );
          return (
            <li key={i} data-slot="breadcrumb-item">
              {last ? (
                <span data-slot="breadcrumb-page" aria-current="page">
                  {content}
                </span>
              ) : item.href || item.onClick ? (
                <a
                  data-slot="breadcrumb-link"
                  href={item.href}
                  onClick={
                    item.onClick
                      ? (e) => {
                          if (!item.href) e.preventDefault();
                          item.onClick?.();
                        }
                      : undefined
                  }
                >
                  {content}
                </a>
              ) : (
                <span data-slot="breadcrumb-page">{content}</span>
              )}
              {last ? null : (
                <span
                  data-slot="breadcrumb-separator"
                  data-variant={separator === undefined ? separatorStyle : undefined}
                  aria-hidden="true"
                >
                  {separator ?? (separatorStyle === "slash" ? "/" : <DefaultSeparator />)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
