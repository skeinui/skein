import { NavigationMenu as BaseNav } from "@base-ui/react/navigation-menu";

type Without<T> = Omit<T, "className" | "style">;

export type NavigationMenuProps = Without<BaseNav.Root.Props>;

/**
 * Site navigation: top-level entries are links or triggers with dropdown panels. The dropdown panels share one overlay, whose position and size transition smoothly when switching between items,
 * the overlay (Portal + positioning + viewport) is rendered automatically by the root component, and consumers only write List / Item / Trigger / Content / Link.
 */
function NavigationMenuRoot({ children, ...rest }: NavigationMenuProps) {
  return (
    <BaseNav.Root {...rest} data-slot="navigation-menu">
      {children}
      <BaseNav.Portal>
        <BaseNav.Positioner data-slot="navigation-menu-positioner" sideOffset={8} align="start">
          <BaseNav.Popup data-slot="navigation-menu-popup">
            <BaseNav.Viewport data-slot="navigation-menu-viewport" />
          </BaseNav.Popup>
        </BaseNav.Positioner>
      </BaseNav.Portal>
    </BaseNav.Root>
  );
}

export type NavigationMenuListProps = Without<BaseNav.List.Props>;

function NavigationMenuList(props: NavigationMenuListProps) {
  return <BaseNav.List {...props} data-slot="navigation-menu-list" />;
}

export type NavigationMenuItemProps = Without<BaseNav.Item.Props>;

function NavigationMenuItem(props: NavigationMenuItemProps) {
  return <BaseNav.Item {...props} data-slot="navigation-menu-item" />;
}

export type NavigationMenuTriggerProps = Without<BaseNav.Trigger.Props>;

/** Trigger with a dropdown panel, with an expand arrow on the right built in. */
function NavigationMenuTrigger({ children, ...rest }: NavigationMenuTriggerProps) {
  return (
    <BaseNav.Trigger {...rest} data-slot="navigation-menu-trigger">
      {children}
      <BaseNav.Icon data-slot="navigation-menu-icon">
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
          <path d="m6 9 6 6 6-6" />
        </svg>
      </BaseNav.Icon>
    </BaseNav.Trigger>
  );
}

export type NavigationMenuContentProps = Without<BaseNav.Content.Props>;

function NavigationMenuContent(props: NavigationMenuContentProps) {
  return <BaseNav.Content {...props} data-slot="navigation-menu-content" />;
}

export type NavigationMenuLinkProps = Without<BaseNav.Link.Props>;

function NavigationMenuLink(props: NavigationMenuLinkProps) {
  return <BaseNav.Link {...props} data-slot="navigation-menu-link" />;
}

export const NavigationMenu = Object.assign(NavigationMenuRoot, {
  List: NavigationMenuList,
  Item: NavigationMenuItem,
  Trigger: NavigationMenuTrigger,
  Content: NavigationMenuContent,
  Link: NavigationMenuLink,
});
