import type { ReactNode } from "react";
import type { ButtonVariant, UIColor, UISize, UIRadius } from "../../contract.ts";
import { Button } from "../button/index.ts";
import type { ButtonProps } from "../button/index.ts";
import { ButtonGroup } from "../button-group/index.ts";
import { Menu } from "../menu/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface SplitButtonItem {
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

export interface SplitButtonSeparator {
  /** Marks this entry as a separator line between menu items. */
  type: "separator";
  /** Optional React key; the index is used when omitted. */
  key?: string;
}

export type SplitButtonEntry = SplitButtonItem | SplitButtonSeparator;

export interface SplitButtonProps extends Pick<
  ButtonProps,
  "onClick" | "loading" | "startContent"
> {
  /** Content of the main button. */
  children: ReactNode;
  /** Menu items that pop up when the arrow is clicked. */
  items: readonly SplitButtonEntry[];
  /** Called when a menu item is selected. */
  onSelect?: (key: string) => void;
  /** Variant of both halves (passed through ButtonGroup). */
  variant?: ButtonVariant;
  /** Colour of both halves (passed through ButtonGroup). */
  color?: UIColor;
  /** Size of both halves (passed through ButtonGroup). */
  size?: UISize;
  /** Radius step of both halves; only the outer corners are rounded. */
  radius?: UIRadius;
  /** Disables both the main button and the arrow button. */
  disabled?: boolean;
  /** Accessible name of the arrow button (it only has an icon); defaults to the locale's "More actions". */
  menuLabel?: string;
  /** Open state of the menu: controlled / uncontrolled initial value / change callback. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const isSeparator = (e: SplitButtonEntry): e is SplitButtonSeparator =>
  "type" in e && e.type === "separator";

const Chevron = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Split button: the main action on the left, with an arrow button attached on the right that opens a menu of related actions (corresponds to antd's `Dropdown.Button`).
 * `children` / `onClick` are the main button; `items` (`{ key, label, disabled, danger, onSelect }` or `{ type: "separator" }`) fill the menu, and `onSelect(key)` reports the chosen item.
 * `variant` / `color` / `size` / `radius` / `disabled` apply to both halves; give the arrow an accessible name with `menuLabel` (default "More actions").
 * For a single action use Button; for a menu without a main action use Menu.
 *
 * Theme style: joined together with ButtonGroup, and the menu uses Menu: arrow keys, first-letter jump and Esc to close come from Base UI; the arrow button carries `aria-haspopup="menu"`.
 */
export function SplitButton({
  children,
  items,
  onSelect,
  onClick,
  loading,
  startContent,
  variant,
  color,
  size,
  radius,
  disabled,
  menuLabel: menuLabelProp,
  open,
  defaultOpen,
  onOpenChange,
}: SplitButtonProps) {
  const t = useLabels("splitButton");
  const menuLabel = menuLabelProp ?? t.more;
  return (
    <ButtonGroup variant={variant} color={color} size={size} radius={radius} disabled={disabled}>
      <Button onClick={onClick} loading={loading} startContent={startContent}>
        {children}
      </Button>
      <Menu open={open} defaultOpen={defaultOpen} onOpenChange={(next) => onOpenChange?.(next)}>
        <Menu.Trigger render={<Button iconOnly aria-label={menuLabel} />}>
          <Chevron />
        </Menu.Trigger>
        <Menu.Content align="end">
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
    </ButtonGroup>
  );
}
