import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type { ReactNode } from "react";
import type { OverlayAlign, OverlaySide } from "../../contract.ts";
import { Menu } from "../menu/index.ts";

type Without<T> = Omit<T, "className" | "style">;

export type ContextMenuProps = BaseContextMenu.Root.Props;

/** Context menu: opens on right click (long press on touch) over the trigger area. Menu items, groups and separators all reuse the Menu parts and theme styles. */
export function ContextMenu(props: ContextMenuProps) {
  return <BaseContextMenu.Root {...props} />;
}

function ContextMenuTrigger(props: Without<BaseContextMenu.Trigger.Props>) {
  return <BaseContextMenu.Trigger {...props} data-slot="context-menu-trigger" />;
}

export interface ContextMenuContentProps extends Without<BaseContextMenu.Popup.Props> {
  /**
   * Which side of the pointer position the menu opens on.
   * @default "bottom"
   */
  side?: OverlaySide;
  /**
   * Alignment of the menu against the pointer position.
   * @default "start"
   */
  align?: OverlayAlign;
  /**
   * Gap in pixels between the pointer position and the menu.
   * @default 2
   */
  sideOffset?: number;
  /** The menu items. */
  children?: ReactNode;
}

function ContextMenuContent({
  side = "bottom",
  align = "start",
  sideOffset = 2,
  children,
  ...popup
}: ContextMenuContentProps) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner
        data-slot="menu-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <BaseContextMenu.Popup {...popup} data-slot="menu">
          {children}
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}

ContextMenu.Trigger = ContextMenuTrigger;
ContextMenu.Content = ContextMenuContent;
ContextMenu.Item = Menu.Item;
ContextMenu.CheckboxItem = Menu.CheckboxItem;
ContextMenu.Group = Menu.Group;
ContextMenu.GroupLabel = Menu.GroupLabel;
ContextMenu.Separator = Menu.Separator;
