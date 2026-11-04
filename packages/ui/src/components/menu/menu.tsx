import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { ReactNode } from "react";
import type { OverlayAlign, OverlaySide } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export type MenuProps = BaseMenu.Root.Props;

/**
 * Dropdown list of actions opened from a trigger button: `<Menu.Trigger>` opens `<Menu.Content>`, which holds `Menu.Item`s (`onClick`, `color="danger"`),
 * `Menu.CheckboxItem`, `Menu.Group` + `Menu.GroupLabel` and `Menu.Separator`. `open` / `onOpenChange` control it; choosing an item or pressing Esc closes it,
 * and arrow keys and first-letter jump move through the items. For choosing a form value use Select; for a right-click menu use ContextMenu; for an app menu bar use Menubar.
 *
 * Theme style: arrow keys, first-letter jump, Esc to close and collision flipping all come from Base UI.
 */
export function Menu(props: MenuProps) {
  return <BaseMenu.Root {...props} />;
}

export type MenuTriggerProps = Without<BaseMenu.Trigger.Props>;

/** Trigger element. To use your own button pass render: `<Menu.Trigger render={<Button />}>Open</Menu.Trigger>`. */
function MenuTrigger(props: MenuTriggerProps) {
  return <BaseMenu.Trigger {...props} />;
}

export interface MenuContentProps extends Without<BaseMenu.Popup.Props> {
  /**
   * Which side of the trigger the menu opens on.
   * @default "bottom"
   */
  side?: OverlaySide;
  /**
   * Alignment of the menu against the trigger.
   * @default "start"
   */
  align?: OverlayAlign;
  /**
   * Gap in pixels between the trigger and the menu.
   * @default 4
   */
  sideOffset?: number;
  /** The menu items. */
  children?: ReactNode;
}

/** The popup holding the items, positioned next to the trigger (`side` / `align` / `sideOffset`) and portaled to `<body>`. */
function MenuContent({
  side = "bottom",
  align = "start",
  sideOffset = 4,
  children,
  ...popup
}: MenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        data-slot="menu-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <BaseMenu.Popup {...popup} data-slot="menu">
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export interface MenuItemProps extends Without<BaseMenu.Item.Props> {
  /**
   * danger marks destructive actions such as delete; the color is decided by the theme style.
   * @default "default"
   */
  color?: "default" | "danger";
}

function MenuItem({ color = "default", ...rest }: MenuItemProps) {
  return <BaseMenu.Item {...rest} data-slot="menu-item" data-color={color} />;
}

export interface MenuCheckboxItemProps extends Without<BaseMenu.CheckboxItem.Props> {
  children?: ReactNode;
}

/** Checkable menu item; the check is drawn by the theme style (the component keeps only an indicator with a slot). */
function MenuCheckboxItem({ children, ...rest }: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem {...rest} data-slot="menu-checkbox-item">
      <BaseMenu.CheckboxItemIndicator data-slot="menu-item-indicator" keepMounted>
        <svg viewBox="0 0 17 18" aria-hidden="true">
          <polyline
            points="1 9 7 14 15 4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
          />
        </svg>
      </BaseMenu.CheckboxItemIndicator>
      {children}
    </BaseMenu.CheckboxItem>
  );
}

export type MenuGroupProps = Without<BaseMenu.Group.Props>;

function MenuGroup(props: MenuGroupProps) {
  return <BaseMenu.Group {...props} data-slot="menu-group" />;
}

export type MenuGroupLabelProps = Without<BaseMenu.GroupLabel.Props>;

function MenuGroupLabel(props: MenuGroupLabelProps) {
  return <BaseMenu.GroupLabel {...props} data-slot="menu-group-label" />;
}

export type MenuSeparatorProps = Without<BaseSeparator.Props>;

function MenuSeparator(props: MenuSeparatorProps) {
  return <BaseSeparator {...props} data-slot="menu-separator" />;
}

Menu.Trigger = MenuTrigger;
Menu.Content = MenuContent;
Menu.Item = MenuItem;
Menu.CheckboxItem = MenuCheckboxItem;
Menu.Group = MenuGroup;
Menu.GroupLabel = MenuGroupLabel;
Menu.Separator = MenuSeparator;
