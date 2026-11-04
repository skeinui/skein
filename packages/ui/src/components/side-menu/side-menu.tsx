import { createContext, useCallback, useContext, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useSidebarPanel } from "../sidebar/index.ts";
import { Popover } from "../popover/index.ts";
import { Tooltip } from "../tooltip/index.ts";

/** An item in the menu: a leaf (selected when clicked) or a submenu with children. */
export interface SideMenuItem {
  /** Unique key across the whole menu; used by `selectedKey`, `openKeys` and `onSelect`. */
  key: string;
  /** Visible text of the item. */
  label: ReactNode;
  /** Icon in front (the only thing left when collapsed to a narrow rail). */
  icon?: ReactNode;
  /** When given it renders as a link `<a>`, otherwise a button. */
  href?: string;
  /** Greyed out; can't be selected or opened. */
  disabled?: boolean;
  /** Semantic color for dangerous actions (e.g. "Log out"). */
  danger?: boolean;
  /** Tooltip text and accessible name when collapsed to a narrow rail; may be omitted when label is a string. */
  title?: string;
  children?: SideMenuEntry[];
}

export interface SideMenuGroup {
  /** Marks this entry as a non-clickable group of items under a heading. */
  type: "group";
  /** Unique key of the group (used as the React key). */
  key: string;
  /** Heading shown above the group's items. */
  label: ReactNode;
  children: SideMenuEntry[];
}

export interface SideMenuDivider {
  /** Marks this entry as a separator line between items. */
  type: "divider";
  /** Optional React key; the index is used when omitted. */
  key?: string;
}

export type SideMenuEntry = SideMenuItem | SideMenuGroup | SideMenuDivider;

export interface SideMenuProps {
  /** Menu tree: items (nest submenus via `children`), `{ type: "group" }` headings and `{ type: "divider" }` lines. */
  items: SideMenuEntry[];
  /** Controlled selected item. */
  selectedKey?: string | null;
  defaultSelectedKey?: string | null;
  /** Called when the selection changes. For an item with href that you want to navigate yourself (router), call `event.preventDefault()` here. */
  onSelect?: (key: string, item: SideMenuItem, event: MouseEvent<HTMLElement>) => void;
  /** Controlled expanded items. */
  openKeys?: string[];
  /** Initial `openKeys` when uncontrolled; if omitted, the ancestors of the selected item are open. */
  defaultOpenKeys?: string[];
  onOpenChange?: (openKeys: string[]) => void;
  /** Collapse to a narrow rail showing only icons. Inside `Sidebar`, if not passed it follows the sidebar's collapsed state. */
  collapsed?: boolean;
  /** Light / dark. If not given: inside a Sidebar it follows the Sidebar, used alone it is light. */
  theme?: "light" | "dark";
  /**
   * Look: `default` is each theme style's own menu style; `modern` has taller items (42px) and a larger border radius, selected / hover is a light primary-colored background with primary-colored text,
   * and submenus have no guide line on the left.
   * @default "default"
   */
  variant?: "default" | "modern";
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

interface Ctx {
  collapsed: boolean;
  selectedKey: string | null;
  parentsOfSelected: Set<string>;
  openKeys: Set<string>;
  toggle: (key: string) => void;
  select: (item: SideMenuItem, event: MouseEvent<HTMLElement>) => void;
  tabKey: string | null;
  setTabKey: (key: string) => void;
  theme?: "light" | "dark";
  variant?: "default" | "modern";
}

const MenuContext = createContext<Ctx | null>(null);
/** Clicking a leaf in a popup submenu must close the overlay. */
const PopupContext = createContext<{ close: () => void } | null>(null);

const isItem = (e: SideMenuEntry): e is SideMenuItem => !("type" in e && e.type);

/** Find the keys of all ancestor submenus of a key; returns null if not found. */
function pathTo(entries: SideMenuEntry[], key: string, trail: string[] = []): string[] | null {
  for (const entry of entries) {
    if (isItem(entry)) {
      if (entry.key === key) return trail;
      if (entry.children) {
        const found = pathTo(entry.children, key, [...trail, entry.key]);
        if (found) return found;
      }
    } else if (entry.type === "group") {
      const found = pathTo(entry.children, key, trail);
      if (found) return found;
    }
  }
  return null;
}

function firstKey(entries: SideMenuEntry[]): string | null {
  for (const entry of entries) {
    if (isItem(entry)) return entry.key;
    if (entry.type === "group") {
      const k = firstKey(entry.children);
      if (k) return k;
    }
  }
  return null;
}

const textOf = (item: SideMenuItem) =>
  item.title ?? (typeof item.label === "string" ? item.label : undefined);

const ChevronIcon = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function Content({ item, withArrow }: { item: SideMenuItem; withArrow?: boolean }) {
  return (
    <>
      {item.icon ? (
        <span data-slot="sidemenu-icon" aria-hidden="true">
          {item.icon}
        </span>
      ) : null}
      <span data-slot="sidemenu-label">{item.label}</span>
      {withArrow ? (
        <span data-slot="sidemenu-arrow" aria-hidden="true">
          <ChevronIcon />
        </span>
      ) : null}
    </>
  );
}

function Leaf({ item, level }: { item: SideMenuItem; level: number }) {
  const ctx = useContext(MenuContext)!;
  const popup = useContext(PopupContext);
  const selected = ctx.selectedKey === item.key;
  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    ctx.select(item, event);
    popup?.close();
  };
  const common = {
    "data-slot": "sidemenu-link",
    "data-key": item.key,
    "aria-current": selected ? ("page" as const) : undefined,
    tabIndex: ctx.tabKey === item.key ? 0 : -1,
    onFocus: () => ctx.setTabKey(item.key),
    onClick,
  };
  const label = textOf(item);
  const link = item.href ? (
    <a
      {...common}
      href={item.disabled ? undefined : item.href}
      aria-disabled={item.disabled || undefined}
      aria-label={ctx.collapsed && !popup ? label : undefined}
    >
      <Content item={item} />
    </a>
  ) : (
    <button
      {...common}
      type="button"
      disabled={item.disabled}
      aria-label={ctx.collapsed && !popup ? label : undefined}
    >
      <Content item={item} />
    </button>
  );
  return (
    <li
      data-slot="sidemenu-item"
      data-level={level}
      data-selected={selected ? "" : undefined}
      data-disabled={item.disabled ? "" : undefined}
      data-danger={item.danger ? "" : undefined}
    >
      {ctx.collapsed && !popup && level === 1 && label ? (
        <Tooltip content={label} side="right">
          {link}
        </Tooltip>
      ) : (
        link
      )}
    </li>
  );
}

function Submenu({ item, level }: { item: SideMenuItem; level: number }) {
  const ctx = useContext(MenuContext)!;
  const popup = useContext(PopupContext);
  const panelId = useId();
  const [flyOpen, setFlyOpen] = useState(false);
  const hasSelected = ctx.parentsOfSelected.has(item.key);
  const open = ctx.openKeys.has(item.key);
  const flyout = ctx.collapsed && !popup;
  const common = {
    "data-slot": "sidemenu-trigger",
    "data-key": item.key,
    tabIndex: ctx.tabKey === item.key ? 0 : -1,
    onFocus: () => ctx.setTabKey(item.key),
  };
  const rootProps = {
    "data-slot": "sidemenu-submenu",
    "data-level": level,
    "data-open": !flyout && open ? "" : undefined,
    "data-has-selected": hasSelected ? "" : undefined,
    "data-disabled": item.disabled ? "" : undefined,
  };

  if (flyout) {
    return (
      <li {...rootProps} data-flyout-open={flyOpen ? "" : undefined}>
        <Popover open={flyOpen} onOpenChange={setFlyOpen}>
          <Popover.Trigger
            {...common}
            openOnHover
            delay={80}
            closeDelay={150}
            disabled={item.disabled}
            aria-label={textOf(item)}
            render={<button type="button" />}
          >
            <Content item={item} />
          </Popover.Trigger>
          <Popover.Content side="right" align="start" sideOffset={4}>
            <PopupContext.Provider value={{ close: () => setFlyOpen(false) }}>
              <MenuContext.Provider value={{ ...ctx, collapsed: false }}>
                <div
                  data-slot="sidemenu"
                  data-popup=""
                  data-theme={ctx.theme}
                  data-variant={ctx.variant === "modern" ? "modern" : undefined}
                >
                  <ul data-slot="sidemenu-list">{renderEntries(item.children ?? [], 1)}</ul>
                </div>
              </MenuContext.Provider>
            </PopupContext.Provider>
          </Popover.Content>
        </Popover>
      </li>
    );
  }

  return (
    <li {...rootProps}>
      <button
        {...common}
        type="button"
        data-level={level}
        aria-expanded={open}
        aria-controls={panelId}
        disabled={item.disabled}
        onClick={() => ctx.toggle(item.key)}
      >
        <Content item={item} withArrow />
      </button>
      <div id={panelId} data-slot="sidemenu-panel" data-open={open ? "" : undefined}>
        <div data-slot="sidemenu-panel-inner">
          <ul data-slot="sidemenu-list">{renderEntries(item.children ?? [], level + 1)}</ul>
        </div>
      </div>
    </li>
  );
}

function renderEntries(entries: SideMenuEntry[], level: number): ReactNode {
  return entries.map((entry, index) => {
    if (!isItem(entry)) {
      if (entry.type === "divider") {
        return (
          <li
            key={entry.key ?? `divider-${index}`}
            aria-hidden="true"
            data-slot="sidemenu-divider"
          />
        );
      }
      return (
        <li key={entry.key} data-slot="sidemenu-group" data-level={level}>
          <div data-slot="sidemenu-group-title">{entry.label}</div>
          <ul data-slot="sidemenu-list">{renderEntries(entry.children, level)}</ul>
        </li>
      );
    }
    return entry.children?.length ? (
      <Submenu key={entry.key} item={entry} level={level} />
    ) : (
      <Leaf key={entry.key} item={entry} level={level} />
    );
  });
}

const FOCUSABLE = '[data-slot="sidemenu-link"],[data-slot="sidemenu-trigger"]';

/**
 * Side menu: a navigation tree that can expand / collapse, data-driven (`items`). Leaves are links or buttons, items with `children` are submenus,
 * and there are also group titles and separators. When collapsed to a narrow rail only icons are shown, hovering a leaf shows its description, and hovering a submenu pops up an overlay;
 * inside `Sidebar` it follows the sidebar's collapsing automatically. Keyboard: Up/Down move between visible items, Right expands / enters a submenu,
 * Left collapses / returns to the parent, Home / End go to the first / last.
 */
export function SideMenu({
  items,
  selectedKey: selectedProp,
  defaultSelectedKey = null,
  onSelect,
  openKeys: openProp,
  defaultOpenKeys,
  onOpenChange,
  collapsed: collapsedProp,
  theme,
  variant = "default",
  ...aria
}: SideMenuProps) {
  const panel = useSidebarPanel();
  const collapsed = collapsedProp ?? panel.collapsed;

  const [innerSelected, setInnerSelected] = useState<string | null>(defaultSelectedKey);
  const selectedKey = selectedProp !== undefined ? selectedProp : innerSelected;

  const [innerOpen, setInnerOpen] = useState<string[]>(
    () => defaultOpenKeys ?? (defaultSelectedKey ? (pathTo(items, defaultSelectedKey) ?? []) : []),
  );
  const openList = openProp ?? innerOpen;
  const openKeys = useMemo(() => new Set(openList), [openList]);

  const parentsOfSelected = useMemo(
    () => new Set(selectedKey ? (pathTo(items, selectedKey) ?? []) : []),
    [items, selectedKey],
  );

  const [focused, setFocused] = useState<string | null>(null);
  const tabKey = focused ?? selectedKey ?? firstKey(items);

  const latest = useRef({ openList, onOpenChange, openProp, onSelect, selectedProp });
  latest.current = { openList, onOpenChange, openProp, onSelect, selectedProp };

  const setOpen = useCallback((next: string[]) => {
    if (latest.current.openProp === undefined) setInnerOpen(next);
    latest.current.onOpenChange?.(next);
  }, []);
  const toggle = useCallback(
    (key: string) => {
      const list = latest.current.openList;
      setOpen(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
    },
    [setOpen],
  );
  const select = useCallback((item: SideMenuItem, event: MouseEvent<HTMLElement>) => {
    if (latest.current.selectedProp === undefined) setInnerSelected(item.key);
    latest.current.onSelect?.(item.key, item, event);
  }, []);

  const ctx: Ctx = {
    collapsed,
    selectedKey,
    parentsOfSelected,
    openKeys,
    toggle,
    select,
    tabKey,
    setTabKey: setFocused,
    theme,
    variant,
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (!target.matches(FOCUSABLE)) return;
    const nav = event.currentTarget;
    const visible = Array.from(nav.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) =>
        !(el as HTMLButtonElement).disabled &&
        el.getAttribute("aria-disabled") !== "true" &&
        !el.closest('[data-slot="sidemenu-panel"]:not([data-open])'),
    );
    const at = visible.indexOf(target);
    const go = (el: HTMLElement | undefined) => {
      if (!el) return;
      event.preventDefault();
      el.focus();
    };
    const isTrigger = target.matches('[data-slot="sidemenu-trigger"]');
    const expanded = target.getAttribute("aria-expanded") === "true";
    switch (event.key) {
      case "ArrowDown":
        go(visible[at + 1]);
        break;
      case "ArrowUp":
        go(visible[at - 1]);
        break;
      case "Home":
        go(visible[0]);
        break;
      case "End":
        go(visible[visible.length - 1]);
        break;
      case "ArrowRight":
        if (isTrigger && !collapsed) {
          event.preventDefault();
          if (!expanded) toggle(target.dataset.key!);
          else go(visible[at + 1]);
        }
        break;
      case "ArrowLeft": {
        if (isTrigger && expanded) {
          event.preventDefault();
          toggle(target.dataset.key!);
          break;
        }
        const panel = target.closest('[data-slot="sidemenu-panel"]');
        go(panel?.previousElementSibling as HTMLElement | undefined);
        break;
      }
    }
  };

  return (
    <MenuContext.Provider value={ctx}>
      <nav
        {...aria}
        data-slot="sidemenu"
        data-collapsed={collapsed ? "" : undefined}
        data-theme={theme}
        data-variant={variant === "modern" ? "modern" : undefined}
        onKeyDown={onKeyDown}
      >
        <ul data-slot="sidemenu-list">{renderEntries(items, 1)}</ul>
      </nav>
    </MenuContext.Provider>
  );
}
