import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import { Menu } from "../menu/index.ts";

type Without<T> = Omit<T, "className" | "style">;

export type MenubarProps = Without<BaseMenubar.Props>;

/**
 * Menubar: a row of top-level menus; once one is open, moving the mouse to an adjacent one switches directly, and Left/Right arrow keys move between them.
 * The popup, items, groups and separators of each menu reuse Menu's parts and theme style.
 */
function MenubarRoot(props: MenubarProps) {
  return <BaseMenubar {...props} data-slot="menubar" />;
}

function MenubarTrigger(props: Without<BaseMenu.Trigger.Props>) {
  return <BaseMenu.Trigger {...props} data-slot="menubar-trigger" />;
}

export const Menubar = Object.assign(MenubarRoot, {
  Menu,
  Trigger: MenubarTrigger,
  Content: Menu.Content,
  Item: Menu.Item,
  CheckboxItem: Menu.CheckboxItem,
  Group: Menu.Group,
  GroupLabel: Menu.GroupLabel,
  Separator: Menu.Separator,
});
