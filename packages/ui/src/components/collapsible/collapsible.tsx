import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";

type Without<T> = Omit<T, "className" | "style">;

export type CollapsibleProps = Without<BaseCollapsible.Root.Props>;

/**
 * Collapsible: a single expand / collapse region, a trigger button plus a panel, for "show more" or "advanced options".
 * Compose `Collapsible.Trigger` + `Collapsible.Panel`; `open` / `onOpenChange` (or `defaultOpen`) control it.
 * For a group of sections where only one is expanded at a time use Accordion.
 *
 * Theme style: expanded state, keyboard and `aria-expanded` / `aria-controls` come from Base UI.
 */
function CollapsibleRoot(props: CollapsibleProps) {
  return <BaseCollapsible.Root {...props} data-slot="collapsible" />;
}

export interface CollapsibleTriggerProps extends Without<BaseCollapsible.Trigger.Props> {
  /**
   * The expand arrow after the trigger button.
   * @default true
   */
  icon?: boolean;
}

/** Trigger button: text plus an arrow that flips when expanded. */
function CollapsibleTrigger({ children, icon = true, ...rest }: CollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger {...rest} data-slot="collapsible-trigger">
      {children}
      {icon ? (
        <span data-slot="collapsible-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      ) : null}
    </BaseCollapsible.Trigger>
  );
}

export type CollapsiblePanelProps = Without<BaseCollapsible.Panel.Props>;

function CollapsiblePanel({ children, ...rest }: CollapsiblePanelProps) {
  return (
    <BaseCollapsible.Panel {...rest} data-slot="collapsible-panel">
      <div data-slot="collapsible-content">{children}</div>
    </BaseCollapsible.Panel>
  );
}

export const Collapsible = Object.assign(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Panel: CollapsiblePanel,
});
