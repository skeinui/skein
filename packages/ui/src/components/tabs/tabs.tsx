import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { TabsVariant, UIColor, UISize } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface TabsProps extends Without<BaseTabs.Root.Props> {
  /**
   * Visual variant: an underline / a solid slider / a soft slider; how each one looks is up to the theme style.
   * @default "underline"
   */
  variant?: TabsVariant;
  /**
   * Colour of the selection indicator and highlight; the theme style picks the actual colours.
   * @default "primary"
   */
  color?: UIColor;
  /**
   * Size step.
   * @default "md"
   */
  size?: UISize;
  /**
   * Stretches the list to the full width, the tabs sharing it equally.
   * @default false
   */
  fullWidth?: boolean;
}

/**
 * Tabs: switches between panels of content in the same place, one tab per panel.
 * Compose `Tabs.List` with `Tabs.Tab value="…"` and a matching `Tabs.Panel value="…"`; `value` / `onValueChange` control the
 * selected tab (`defaultValue` for uncontrolled). `variant` / `color` / `size` set the look, `fullWidth` stretches the tabs.
 * Arrow keys move between tabs. For a compact value picker use Segmented; for app-level open-page tabs use PageTabs.
 *
 * Theme style: keyboard navigation, selected state and panel association all come from Base UI.
 */
function TabsRoot({
  variant = "underline",
  color = "primary",
  size = "md",
  fullWidth = false,
  ...rest
}: TabsProps) {
  return (
    <BaseTabs.Root
      {...rest}
      data-slot="tabs"
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-full-width={fullWidth ? "" : undefined}
    />
  );
}

export type TabsListProps = Without<BaseTabs.List.Props>;

/** Tab list, with a built-in selection indicator (underline / slider) whose position is computed by Base UI and written as CSS variables. */
function TabsList({ children, ...rest }: TabsListProps) {
  return (
    <BaseTabs.List {...rest} data-slot="tabs-list">
      {children}
      <BaseTabs.Indicator data-slot="tabs-indicator" />
    </BaseTabs.List>
  );
}

export type TabsTabProps = Without<BaseTabs.Tab.Props>;

function TabsTab(props: TabsTabProps) {
  return <BaseTabs.Tab {...props} data-slot="tabs-tab" />;
}

export type TabsPanelProps = Without<BaseTabs.Panel.Props>;

function TabsPanel(props: TabsPanelProps) {
  return <BaseTabs.Panel {...props} data-slot="tabs-panel" />;
}

export const Tabs = Object.assign(TabsRoot, { List: TabsList, Tab: TabsTab, Panel: TabsPanel });
