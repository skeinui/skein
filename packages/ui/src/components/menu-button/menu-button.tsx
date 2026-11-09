import type { ReactNode } from "react";
import { Button } from "../button/index.ts";
import type { ButtonProps } from "../button/index.ts";
import { Menu } from "../menu/index.ts";

export interface MenuButtonItem {
  /** Unique key; passed to the overall `onSelect`. */
  key: string;
  /** Text of the menu item. */
  label: ReactNode;
  disabled?: boolean;
  /** Destructive action such as delete; the color is decided by the theme style. */
  danger?: boolean;
  /** Called on selection (also triggers the overall onSelect). */
  onSelect?: () => void;
}

export interface MenuButtonSeparator {
  /** Marks this entry as a separator line between menu items. */
  type: "separator";
  /** Optional React key; the index is used when omitted. */
  key?: string;
}

export type MenuButtonEntry = MenuButtonItem | MenuButtonSeparator;

export interface MenuButtonProps extends Pick<
  ButtonProps,
  "variant" | "color" | "size" | "radius" | "fullWidth" | "startContent" | "loading"
> {
  /** The button's text. */
  children: ReactNode;
  /** The actions the menu lists. */
  items: readonly MenuButtonEntry[];
  /** Called with the key of the chosen item. */
  onSelect?: (key: string) => void;
  /** The menu's accessible name; defaults to the button's text when that is a string. */
  menuLabel?: string;
  /**
   * Which side of the button the menu lines up with.
   * @default "start"
   */
  align?: "start" | "center" | "end";
  /** Disabled; a menu without items is disabled too. */
  disabled?: boolean;
  /** Open state of the menu: controlled / uncontrolled initial value / change callback. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const isSeparator = (e: MenuButtonEntry): e is MenuButtonSeparator =>
  "type" in e && e.type === "separator";

const Chevron = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Menu button: one button that opens a list of actions and reports the one chosen: "Assign to…", "Insert a reply…", "Add a follower…", where nothing stays selected
 * afterwards (a Select would hold a value; a menu holds none). `children` is the button's text, `items` (`{ key, label, disabled, danger, onSelect }` or `{ type: "separator" }`)
 * fill the menu, and `onSelect(key)` reports the chosen item.
 * For a main action with related ones use SplitButton; to build the menu from parts (groups, checkbox items, submenus) use Menu.
 *
 * Theme style: the button and the menu are Button and Menu: arrow keys, first-letter jump and Esc to close come from Base UI.
 */
export function MenuButton({
  children,
  items,
  onSelect,
  menuLabel,
  align = "start",
  disabled,
  variant = "outline",
  color = "neutral",
  size,
  radius,
  fullWidth,
  startContent,
  loading,
  open,
  defaultOpen,
  onOpenChange,
}: MenuButtonProps) {
  const label = menuLabel ?? (typeof children === "string" ? children : undefined);
  return (
    <Menu open={open} defaultOpen={defaultOpen} onOpenChange={(next) => onOpenChange?.(next)}>
      <Menu.Trigger
        render={
          <Button
            variant={variant}
            color={color}
            size={size}
            radius={radius}
            fullWidth={fullWidth}
            startContent={startContent}
            loading={loading}
            disabled={disabled || items.length === 0}
            endContent={<Chevron />}
          />
        }
      >
        {children}
      </Menu.Trigger>
      <Menu.Content align={align} aria-label={label}>
        {items.map((entry, index) =>
          isSeparator(entry) ? (
            <Menu.Separator key={entry.key ?? `separator-${index}`} />
          ) : (
            <Menu.Item
              key={entry.key}
              color={entry.danger ? "danger" : "default"}
              disabled={entry.disabled}
              onClick={() => {
                entry.onSelect?.();
                onSelect?.(entry.key);
              }}
            >
              {entry.label}
            </Menu.Item>
          ),
        )}
      </Menu.Content>
    </Menu>
  );
}
