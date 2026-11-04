import { useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import { useLabels } from "../../locales/use-labels.ts";
import { BreadcrumbDefaults } from "../breadcrumb/index.ts";
import type { BreadcrumbIcons, BreadcrumbSeparatorStyle } from "../breadcrumb/index.ts";
import { Drawer } from "../drawer/index.ts";
import { Menu } from "../menu/index.ts";
import { Sidebar } from "../sidebar/index.ts";
import { SideMenu } from "../side-menu/index.ts";
import type { SideMenuEntry } from "../side-menu/index.ts";
import { activeTopOf, firstLeaf } from "./nav.ts";
import type { AdminNavItem } from "./nav.ts";
import { applyThemeVars, sidebarTheme, themeVars } from "./theme.ts";
import type { AdminLayoutSettingsValue } from "./settings.ts";
import type { ColorMode } from "./theme.ts";

type Without<T> = Omit<T, "className" | "style" | "children" | "onSelect">;

/** Six layouts: side (sidebar), side + header, top (top bar), mix (top bar level 1 + sidebar level 2), column (icon column + level-2 menu column), boxed (content is a rounded card). */
export type AdminLayoutMode = "side" | "top" | "mix" | "column" | "boxed";

/** Where the toolbar (`actions`: user, messages, light/dark toggle...) goes in the side layout: `sidebar` at the bottom of the sidebar (no header), `header` on the right of the header above the content area. */
export type AdminLayoutToolbar = "sidebar" | "header";

export interface AdminLayoutLabels {
  /** Name of the primary navigation (the top bar's navigation, the column layout's icon column). */
  navigation: string;
  /** Name of the side menu. */
  menu: string;
  /** The header's "open menu" button on narrow screens. */
  openMenu: string;
  /** Name of the level-2 menu in the column layout, and its collapse / expand button. */
  subNavigation: string;
  collapseSubNavigation: string;
  expandSubNavigation: string;
  /** Built-in buttons on the right of the tab row: refresh the current page, maximize / restore the content area. */
  refresh: string;
  maximize: string;
  restore: string;
}

export interface AdminLayoutProps extends Without<ComponentPropsWithoutRef<"div">> {
  /**
   * An exported settings object (JSON exported by the `AdminLayoutSettings` panel, or the value of `useAdminLayoutSettings`): one prop applies layout, menu style and
   * theme; `tabs` is not rendered when `showTabs` is false. The individual props below (`layout`, `menuVariant`, `semiDark`) win when set.
   * The custom theme (primary / secondary / status colors / background / panel / sidebar color, radius, density) is also in `settings.themeOverrides`: colors are dynamic values and the component writes no style,
   * computing CSS variables and setting them on the element with a ref (recomputed when switching light/dark mode). See `themeVars`, `AdminLayoutSettings`.
   * The tab style (`tabVariant`) is a prop of your own `PageTabs` and the theme style belongs to `ConfigProvider`; neither is managed here.
   */
  settings?: Partial<
    Pick<
      AdminLayoutSettingsValue,
      | "layout"
      | "menuVariant"
      | "semiDark"
      | "showTabs"
      | "themeOverrides"
      | "headerFollowsSidebar"
      | "breadcrumbIcons"
      | "breadcrumbSeparator"
      | "toolbar"
      | "showBreadcrumb"
    >
  >;
  /**
   * Layout: `side`, `top`, `mix` (top level in the header, level 2 in the sidebar), `column` (an icon rail + a menu column) or `boxed` (the content is a rounded card). Defaults to `settings.layout`.
   * @default "side"
   */
  layout?: AdminLayoutMode;
  /** Navigation tree. Data-driven: owned by the caller, the component knows nothing about routes. */
  items: readonly AdminNavItem[];
  /** Key of the navigation item (leaf) for the current page; which top-level item is selected and which sidebar group is expanded are derived from it. */
  activeKey?: string | null;
  /** A leaf was clicked (clicking a top-level item with children goes to its first child). For an item with `href` that you want to navigate yourself (router), call `event.preventDefault()` here. */
  onNavigate?: (key: string, item: AdminNavItem, event: MouseEvent<HTMLElement>) => void;
  /** Brand (logo + name). In the side layout it is at the top of the sidebar; in other layouts at the far left of the header. */
  logo?: ReactNode;
  /** Small mark shown instead of `logo` when the sidebar collapses to a narrow strip (icon only, no name); without it `logo` is still shown. The context switcher is not shown in the strip. */
  logoMark?: ReactNode;
  /** Context switcher next to the logo (tenant, workspace...). In the side layout it is below the logo. */
  context?: ReactNode;
  /** Actions at the far right of the header (notifications, user menu...). The side layout has no header, so they go at the bottom of the sidebar. */
  actions?: ReactNode;
  /** Breadcrumb in the header (not every layout needs it). */
  breadcrumb?: ReactNode;
  /** A row above the content, usually holding `PageTabs`. On narrow screens a button to open the sidebar appears on its left. */
  tabs?: ReactNode;
  /** Footer. */
  footer?: ReactNode;
  /**
   * Footer is fixed at the bottom (with a top border); otherwise it scrolls with the content.
   * @default false
   */
  footerFixed?: boolean;
  /** Boxed layout: the background behind the content card. */
  background?: ReactNode;
  /**
   * Content area maximized: header, sidebar and navigation are hidden, leaving only the tabs, content and footer.
   * @default false
   */
  maximized?: boolean;
  /**
   * When provided (and `tabs` is passed), a "maximize / restore" button appears on the right of the tab row (clicking calls it, and you update `maximized`). When maximized the header and
   * sidebar are hidden but the tab row stays, so the restore button is always reachable. Without a tab bar there is no button (as in the console: it is part of the tab bar).
   */
  onMaximizedChange?: (maximized: boolean) => void;
  /** When provided (and `tabs` is passed), a "refresh current page" button appears on the right of the tab row (together with `KeepAlive`'s `versions` it remounts the current page); without a tab bar there is none. */
  onRefresh?: () => void;
  /**
   * Semi Dark: when the page is in light mode, the navigation areas (sidebar, both columns of the column layout, header) are forced dark; the content area and tab bar are unchanged. `auto` (default) follows the theme style
   * (antd has a dark sidebar by default, others light), `on` dark, `off` light. Has no effect when the sidebar color is customized (`colors.sidebar` in `themeOverrides` decides),
   * or when the page itself is in dark mode.
   */
  semiDark?: "auto" | "on" | "off";
  /**
   * Header breadcrumb icons: `all` shows every item's (items with `BreadcrumbItem.icon`), `first` keeps only the first item's, `none` shows none.
   * Passed to the inner `Breadcrumb` via context (its own `icons` wins). Defaults to `settings.breadcrumbIcons`, then `all`.
   * @default "all"
   */
  breadcrumbIcons?: BreadcrumbIcons;
  /**
   * Position of the toolbar (`actions`) in the side layout: `sidebar` (bottom of the sidebar) or `header` (right of a header above the content). In other layouts `actions` are already in the header and unaffected. Defaults to `settings.toolbar`.
   * @default "sidebar"
   */
  toolbar?: AdminLayoutToolbar;
  /**
   * Header breadcrumb separator style: `chevron` small arrow, `slash` slash. Defaults to `settings.breadcrumbSeparator`, then `chevron`.
   * @default "chevron"
   */
  breadcrumbSeparator?: BreadcrumbSeparatorStyle;
  /**
   * Navigation menu appearance: `default` is the theme style's own look; `modern` has taller items and a light primary background for the selected one (the console's "Sidebar style"). Defaults to `settings.menuVariant`.
   * @default "default"
   */
  menuVariant?: "default" | "modern";
  /** Sidebar collapsed to an icon-only strip (side / mix / boxed); in the column layout it is the level-2 menu column collapsing. Controlled. */
  collapsed?: boolean;
  /**
   * Initial `collapsed` when uncontrolled.
   * @default false
   */
  defaultCollapsed?: boolean;
  /** Called with the new `collapsed`; pass `collapsed` as well to control it. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Built-in texts to override (see its Labels type below); by default they follow the ConfigProvider locale. */
  labels?: Partial<AdminLayoutLabels>;
  /**
   * Where the theme is written: `layout` (default) only applies inside AdminLayout; `document` writes to `<html>`, so overlays (menus, dialogs,
   * tooltips... rendered in a Portal, outside AdminLayout) change too; use it for a consistent look across the whole app.
   * @default "layout"
   */
  themeScope?: "layout" | "document";
  /** Page content. Use `KeepAlive` to keep pages that were navigated away from. */
  children?: ReactNode;
}

const MenuIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const RefreshIcon = () => (
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
    <path d="M21 12a9 9 0 0 0-15.5-6.2L3 8M3 3v5h5M3 12a9 9 0 0 0 15.5 6.2L21 16M21 21v-5h-5" />
  </svg>
);

const MaximizeIcon = ({ restore = false }: { restore?: boolean }) => (
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
    <path
      d={
        restore
          ? "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"
          : "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
      }
    />
  </svg>
);

const ChevronIcon = ({ down = false, back = false }: { down?: boolean; back?: boolean }) => (
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
    <path d={down ? "m6 9 6 6 6-6" : back ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
  </svg>
);

type Navigate = NonNullable<AdminLayoutProps["onNavigate"]>;

/** One navigation item in the top bar / column: a link if it has `href`, otherwise a button. For an item with children, clicking goes to its first leaf. */
function NavAnchor({
  item,
  active,
  slot,
  onNavigate,
  children,
}: {
  item: AdminNavItem;
  active: boolean;
  slot: string;
  onNavigate?: Navigate;
  children: ReactNode;
}) {
  const target = firstLeaf(item);
  const shared = {
    "data-slot": slot,
    "data-active": active ? "" : undefined,
    "aria-current": active ? ("page" as const) : undefined,
    title: item.title,
    onClick: (event: MouseEvent<HTMLElement>) => onNavigate?.(target.key, target, event),
  };
  return target.href !== undefined && !item.disabled ? (
    <a {...shared} href={target.href}>
      {children}
    </a>
  ) : (
    <button {...shared} type="button" disabled={item.disabled}>
      {children}
    </button>
  );
}

const itemContent = (item: AdminNavItem) => (
  <>
    {item.icon ? <span data-slot="admin-layout-nav-icon">{item.icon}</span> : null}
    <span data-slot="admin-layout-nav-label">{item.label}</span>
  </>
);

/**
 * Primary navigation in the header. `top`: an item with children opens a dropdown menu (two levels); `mix`: clicking goes straight to the first child,
 * and the children's menu is shown in the sidebar.
 */
function HeaderNav({
  items,
  activeKey,
  variant,
  label,
  onNavigate,
}: {
  items: readonly AdminNavItem[];
  activeKey: string | null | undefined;
  variant: "top" | "mix";
  label: string;
  onNavigate?: Navigate;
}) {
  const activeTop = activeTopOf(items, activeKey);
  return (
    <nav data-slot="admin-layout-nav" aria-label={label}>
      {items.map((item) => {
        const active = item === activeTop;
        if (variant === "top" && item.children?.length) {
          return (
            <Menu key={item.key}>
              <Menu.Trigger
                data-slot="admin-layout-nav-item"
                data-active={active ? "" : undefined}
                disabled={item.disabled}
              >
                {itemContent(item)}
                <span data-slot="admin-layout-nav-chevron">
                  <ChevronIcon down />
                </span>
              </Menu.Trigger>
              <Menu.Content align="start">
                {item.children.map((sub) => {
                  const leaf = firstLeaf(sub);
                  return (
                    <Menu.Item
                      key={sub.key}
                      disabled={sub.disabled}
                      render={leaf.href !== undefined ? <a href={leaf.href} /> : undefined}
                      onClick={(event) => onNavigate?.(leaf.key, leaf, event)}
                    >
                      {sub.icon}
                      {sub.label}
                    </Menu.Item>
                  );
                })}
              </Menu.Content>
            </Menu>
          );
        }
        return (
          <NavAnchor
            key={item.key}
            item={item}
            active={active}
            slot="admin-layout-nav-item"
            onNavigate={onNavigate}
          >
            {itemContent(item)}
          </NavAnchor>
        );
      })}
    </nav>
  );
}

/**
 * Whole-page frame: `layout` chooses how header, navigation, tab bar, content and footer are arranged. Data-driven, knows nothing about routes:
 * navigation is a tree (`items`) plus the current item (`activeKey`); clicks are handed back via `onNavigate` and you navigate in the callback.
 *
 * - `side`: the whole left column is the sidebar (logo, navigation), the right has tabs, content and footer. The toolbar (`actions`) is at the bottom of the sidebar by default, with no header;
 *   `toolbar="header"` moves it to the right of the header above the content area, with the breadcrumb on the left; when the toolbar is at the bottom of the sidebar, passing a breadcrumb also adds a header holding only the breadcrumb.
 * - `top`: the header holds the logo and primary navigation (items with children are dropdown menus), below are tabs, content and footer.
 * - `mix`: the header holds the logo and primary navigation; the sidebar shows the children of whichever item is selected.
 * - `column`: below the header, on the left is a primary icon column, next to it a column with the selected item's submenu (collapsible), then the content.
 * - `boxed`: the sidebar blends into the page background and the content is a rounded card.
 *
 * Narrow screens (below md): the sidebar becomes a drawer; for top / mix / column the navigation moves into a drawer opened by the "open menu" button on the left of the header.
 * Reuses the library's `Sidebar`, `SideMenu`, `Menu`, `Drawer`; put `PageTabs` in the tab bar and `KeepAlive` in the content.
 */
export function AdminLayout({
  settings,
  layout: layoutProp,
  items,
  activeKey,
  onNavigate,
  logo,
  logoMark,
  context,
  actions,
  breadcrumb,
  tabs: tabsProp,
  footer,
  footerFixed = false,
  background,
  maximized = false,
  onMaximizedChange,
  onRefresh,
  menuVariant: menuVariantProp,
  semiDark: semiDarkProp,
  breadcrumbIcons,
  breadcrumbSeparator,
  toolbar: toolbarProp,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  labels: labelsProp,
  themeScope = "layout",
  children,
  ...rest
}: AdminLayoutProps) {
  const layout = layoutProp ?? settings?.layout ?? "side";
  const menuVariant = menuVariantProp ?? settings?.menuVariant ?? "default";
  const theme = settings?.themeOverrides;
  const semiDarkPref = semiDarkProp ?? settings?.semiDark ?? "auto";
  const tabs = settings?.showTabs === false ? undefined : tabsProp;
  const labels = useLabels("adminLayout", labelsProp);
  const rootRef = useRef<HTMLDivElement>(null);
  const mode = useColorMode(rootRef);
  // Semi Dark: only applies when the page is light and the sidebar color is not customized (a customized sidebar color decides by its own lightness; dark mode is already dark)
  const customSidebar = Boolean(theme?.colors?.sidebar);
  const semiActive = mode === "light" && !customSidebar;
  const semiDark = semiActive && semiDarkPref === "on";
  const navTheme: "light" | "dark" | undefined = customSidebar
    ? theme
      ? sidebarTheme(theme)
      : undefined
    : semiDark
      ? "dark"
      : semiActive && semiDarkPref === "off"
        ? "light"
        : undefined;
  const themeKey = theme ? JSON.stringify(theme) : "";
  useLayoutEffect(() => {
    const el = themeScope === "document" ? document.documentElement : rootRef.current;
    if (!el || !theme) return;
    return applyThemeVars(el, themeVars(theme, mode));
    // theme is compared by content (themeKey), so a caller writing a fresh object on every render does not cause repeated writes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeKey, mode, themeScope]);
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? innerCollapsed;
  const setCollapsed = (next: boolean) => {
    if (collapsedProp === undefined) setInnerCollapsed(next);
    onCollapsedChange?.(next);
  };
  const [mobileOpen, setMobileOpen] = useState(false);

  const entries = items as unknown as SideMenuEntry[];
  const activeTop = activeTopOf(items, activeKey);
  /** Mix / column: the sidebar (level-2 menu) shows the children of the selected top-level item. */
  const subItems = (activeTop?.children ?? []) as unknown as SideMenuEntry[];
  const select = (key: string, item: SideMenuEntry, event: MouseEvent<HTMLElement>) =>
    onNavigate?.(key, item as AdminNavItem, event);

  /** For top / mix / column, narrow-screen navigation uses the drawer opened by the header button; for side / boxed it uses the sidebar's own drawer (`Sidebar.Trigger`). */
  const hasNav = layout === "top" || layout === "mix" || layout === "column";
  const toolbar = toolbarProp ?? settings?.toolbar ?? "sidebar";
  const crumb = breadcrumb && settings?.showBreadcrumb !== false ? breadcrumb : null;
  /** In the side layout the header is inside the content area: when the toolbar is in the header, or when there is a breadcrumb to show. */
  const headerInset = layout === "side" && (toolbar === "header" || Boolean(crumb));
  /** The toolbar is in the header (other than the side layout, the actions of every layout are already in the header). */
  const actionsInHeader = layout !== "side" || toolbar === "header";
  const brand = logo ? <div data-slot="admin-layout-logo">{logo}</div> : null;
  /** On narrow screens the sidebar is a drawer and the logo is not visible: in the side layout put one more next to the toggle button at the top (header or tab row), hidden on desktop. */
  const mobileBrand = logo ? <div data-slot="admin-layout-mobile-logo">{logo}</div> : null;
  const ctx = context ? <div data-slot="admin-layout-context">{context}</div> : null;

  const header = maximized ? null : (
    <header data-slot="admin-layout-header">
      {hasNav ? (
        <button
          type="button"
          data-slot="admin-layout-menu-button"
          aria-label={labels.openMenu}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon />
        </button>
      ) : null}
      {headerInset ? (
        // Header is inside the content area (logo and context are in the sidebar): on narrow screens the sidebar is a drawer, and the button that opens it goes on the left of the header
        <span data-slot="admin-layout-sidebar-trigger">
          <Sidebar.Trigger />
        </span>
      ) : null}
      {headerInset ? mobileBrand : null}
      {headerInset ? null : brand}
      {headerInset ? null : ctx}
      {layout === "top" || layout === "mix" ? (
        <HeaderNav
          items={items}
          activeKey={activeKey}
          variant={layout}
          label={labels.navigation}
          onNavigate={onNavigate}
        />
      ) : null}
      {crumb ? <div data-slot="admin-layout-breadcrumb">{crumb}</div> : null}
      {actions && actionsInHeader ? <div data-slot="admin-layout-actions">{actions}</div> : null}
    </header>
  );

  /** Main area: tab row, content, footer. In side / mix / boxed it is `Sidebar.Inset`. */
  const mainChildren = (
    <>
      {background ? <div data-slot="admin-layout-background">{background}</div> : null}
      <div data-slot="admin-layout-body">
        {tabs || (!maximized && (layout === "side" || layout === "boxed") && !headerInset) ? (
          <div data-slot="admin-layout-bar">
            {!maximized && (layout === "side" || layout === "boxed") && !headerInset ? (
              // Sidebar.Trigger occupies data-slot itself, so the hook goes on an outer layer
              <span data-slot="admin-layout-sidebar-trigger">
                <Sidebar.Trigger />
              </span>
            ) : null}
            {!maximized && layout === "side" && !headerInset ? mobileBrand : null}
            {tabs}
            {/* Refresh / maximize belong to the tab bar: without tabs there are none */}
            {tabs && (onRefresh || onMaximizedChange) ? (
              <div data-slot="admin-layout-bar-actions">
                {onRefresh ? (
                  <button
                    type="button"
                    data-slot="admin-layout-bar-button"
                    aria-label={labels.refresh}
                    title={labels.refresh}
                    onClick={onRefresh}
                  >
                    <RefreshIcon />
                  </button>
                ) : null}
                {onMaximizedChange ? (
                  <button
                    type="button"
                    data-slot="admin-layout-bar-button"
                    aria-label={maximized ? labels.restore : labels.maximize}
                    title={maximized ? labels.restore : labels.maximize}
                    aria-pressed={maximized}
                    onClick={() => onMaximizedChange(!maximized)}
                  >
                    <MaximizeIcon restore={maximized} />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        <div data-slot="admin-layout-content">{children}</div>
        {footer ? (
          <footer data-slot="admin-layout-footer" data-fixed={footerFixed ? "" : undefined}>
            {footer}
          </footer>
        ) : null}
      </div>
    </>
  );

  const sidebarFor = (menuItems: SideMenuEntry[], withChrome: boolean) => (
    <Sidebar
      collapsible="icon"
      theme={navTheme}
      variant={layout === "boxed" ? "inset" : "sidebar"}
      aria-label={labels.menu}
    >
      {withChrome && (brand || ctx) ? (
        <Sidebar.Header>
          {brand}
          {logoMark ? <div data-slot="admin-layout-logo-mark">{logoMark}</div> : null}
          {ctx}
        </Sidebar.Header>
      ) : null}
      <Sidebar.Content>
        <SideMenu
          items={menuItems}
          selectedKey={activeKey ?? null}
          onSelect={select}
          aria-label={labels.menu}
          variant={menuVariant}
        />
      </Sidebar.Content>
      {withChrome && actions && !actionsInHeader ? (
        <Sidebar.Footer>
          <div data-slot="admin-layout-actions">{actions}</div>
        </Sidebar.Footer>
      ) : null}
      {layout !== "boxed" ? <Sidebar.Rail /> : null}
    </Sidebar>
  );

  const withProvider = (sidebar: ReactNode) => (
    <Sidebar.Provider
      open={!collapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      // The mix layout's sidebar only has the level-2 menu, and narrow-screen navigation uses the header drawer; its keyboard shortcut is not wanted either
      shortcut={layout === "mix" ? false : "b"}
    >
      {maximized ? null : sidebar}
      <Sidebar.Inset>
        {headerInset ? header : null}
        {mainChildren}
      </Sidebar.Inset>
    </Sidebar.Provider>
  );

  let frame: ReactNode;
  if (layout === "side" || layout === "boxed") {
    frame = (
      <>
        {layout === "boxed" ? header : null}
        {withProvider(sidebarFor(entries, layout !== "boxed"))}
      </>
    );
  } else if (layout === "mix") {
    frame = (
      <>
        {header}
        {withProvider(subItems.length > 0 ? sidebarFor(subItems, false) : null)}
      </>
    );
  } else if (layout === "column") {
    frame = (
      <>
        {header}
        <div data-slot="admin-layout-row">
          {maximized ? null : (
            <>
              <nav data-slot="admin-layout-rail" aria-label={labels.navigation}>
                {items.map((item) => (
                  <NavAnchor
                    key={item.key}
                    item={item}
                    active={item === activeTop}
                    slot="admin-layout-rail-item"
                    onNavigate={(key, target, event) => {
                      setCollapsed(false);
                      onNavigate?.(key, target, event);
                    }}
                  >
                    {itemContent(item)}
                  </NavAnchor>
                ))}
              </nav>
              {subItems.length > 0 ? (
                <>
                  <div
                    data-slot="admin-layout-subnav"
                    data-collapsed={collapsed ? "" : undefined}
                    inert={collapsed}
                  >
                    <SideMenu
                      items={subItems}
                      selectedKey={activeKey ?? null}
                      onSelect={select}
                      aria-label={labels.subNavigation}
                      variant={menuVariant}
                      theme={navTheme}
                    />
                  </div>
                  <button
                    type="button"
                    data-slot="admin-layout-subnav-toggle"
                    data-collapsed={collapsed ? "" : undefined}
                    aria-expanded={!collapsed}
                    aria-label={
                      collapsed ? labels.expandSubNavigation : labels.collapseSubNavigation
                    }
                    onClick={() => setCollapsed(!collapsed)}
                  >
                    <ChevronIcon back={!collapsed} />
                  </button>
                </>
              ) : null}
            </>
          )}
          <main data-slot="admin-layout-main">{mainChildren}</main>
        </div>
      </>
    );
  } else {
    frame = (
      <>
        {header}
        <main data-slot="admin-layout-main">{mainChildren}</main>
      </>
    );
  }

  return (
    <div
      {...rest}
      ref={rootRef}
      // data-theme-color: makes the theme style re-derive tokens on this element (hover color, radius steps...); when written to <html> they are recomputed anyway
      data-theme-color={theme && themeScope === "layout" ? "custom" : undefined}
      data-sidebar-color={theme?.colors?.sidebar ? "" : undefined}
      data-semi-dark={semiDark ? "" : undefined}
      data-nav-theme={navTheme}
      data-header-follow={settings?.headerFollowsSidebar === false ? "off" : undefined}
      data-slot="admin-layout"
      data-layout={layout}
      data-header-inset={headerInset && !maximized ? "" : undefined}
      data-maximized={maximized ? "" : undefined}
      data-collapsed={collapsed ? "" : undefined}
    >
      <BreadcrumbDefaults.Provider
        value={{
          icons: breadcrumbIcons ?? settings?.breadcrumbIcons,
          separatorStyle: breadcrumbSeparator ?? settings?.breadcrumbSeparator,
        }}
      >
        {frame}
      </BreadcrumbDefaults.Provider>
      {hasNav ? (
        // Narrow screens: the button on the left of the header opens this drawer, which holds the full navigation tree
        <Drawer side="left" open={mobileOpen} onOpenChange={setMobileOpen}>
          <Drawer.Content size="sm" closeButton={false} aria-label={labels.menu}>
            <div data-slot="admin-layout-drawer">
              {logo ? <div data-slot="admin-layout-drawer-header">{logo}</div> : null}
              <SideMenu
                items={entries}
                selectedKey={activeKey ?? null}
                aria-label={labels.menu}
                variant={menuVariant}
                onSelect={(key, item, event) => {
                  setMobileOpen(false);
                  select(key, item, event);
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer>
      ) : null}
    </div>
  );
}

/** Whether it is currently light or dark: takes the nearest ancestor with `data-mode` (or `<html>` if none) and follows it. */
function useColorMode(ref: { current: HTMLElement | null }): ColorMode {
  const [mode, setMode] = useState<ColorMode>("light");
  useLayoutEffect(() => {
    const read = () => {
      const el = ref.current?.closest<HTMLElement>("[data-mode]") ?? document.documentElement;
      setMode(el.dataset.mode === "dark" ? "dark" : "light");
    };
    read();
    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode"],
      subtree: true,
    });
    return () => observer.disconnect();
  }, [ref]);
  return mode;
}
