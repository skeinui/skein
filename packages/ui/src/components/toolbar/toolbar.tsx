import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import type { ButtonVariant, UIColor, UISize } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { Separator } from "../separator/index.ts";

type Without<T> = Omit<T, "className" | "style">;

export type ToolbarProps = Without<BaseToolbar.Root.Props>;

/**
 * Toolbar: a row of related controls (buttons, toggles, inputs) such as an editor's formatting bar.
 * Compose `Toolbar.Button`, `Toolbar.Group` and `Toolbar.Separator`; arrow keys move focus between the controls, so the
 * whole toolbar is a single tab stop. For a plain row of buttons with no keyboard grouping use ButtonGroup.
 *
 * Theme style: behavior comes from Base UI; `Toolbar.Button` reuses Button's theme style.
 */
function ToolbarRoot(props: ToolbarProps) {
  return <BaseToolbar.Root {...props} data-slot="toolbar" />;
}

export type ToolbarGroupProps = Without<BaseToolbar.Group.Props>;

function ToolbarGroup(props: ToolbarGroupProps) {
  return <BaseToolbar.Group {...props} data-slot="toolbar-group" />;
}

export type ToolbarButtonProps = Without<BaseToolbar.Button.Props> & {
  /**
   * Visual variant; how each one looks is up to the theme style.
   * @default "ghost"
   */
  variant?: ButtonVariant;
  /**
   * Semantic colour; the theme style picks the actual colours.
   * @default "neutral"
   */
  color?: UIColor;
  /**
   * Size step.
   * @default "md"
   */
  size?: UISize;
};

/** Button in the toolbar: a small ghost button by default, reusing Button's theme style for its look. */
function ToolbarButton({
  variant = "ghost",
  color = "neutral",
  size = "md",
  ...rest
}: ToolbarButtonProps) {
  return (
    <BaseToolbar.Button {...rest} render={<Button variant={variant} color={color} size={size} />} />
  );
}

function ToolbarSeparator() {
  return <BaseToolbar.Separator render={<Separator orientation="vertical" />} />;
}

export const Toolbar = Object.assign(ToolbarRoot, {
  Group: ToolbarGroup,
  Button: ToolbarButton,
  Separator: ToolbarSeparator,
});
