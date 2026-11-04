import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import type { AccordionVariant } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface AccordionProps extends Without<BaseAccordion.Root.Props> {
  /** @default "divided" */
  variant?: AccordionVariant;
}

/**
 * Accordion: a stack of sections whose bodies expand and collapse under their title rows.
 * Compose `Accordion.Item` > `Accordion.Trigger` (the title row) + `Accordion.Panel` (the body); one item is open at a time
 * by default, `multiple` allows several. `value` / `onValueChange` (or `defaultValue`) hold the open items' values.
 * `variant` sets the look. For a single expand / collapse region use Collapsible.
 *
 * Theme style: expand / collapse, keyboard navigation and aria wiring come from Base UI.
 */
function AccordionRoot({ variant = "divided", ...rest }: AccordionProps) {
  return <BaseAccordion.Root {...rest} data-slot="accordion" data-variant={variant} />;
}

export type AccordionItemProps = Without<BaseAccordion.Item.Props>;

/** One section: holds a Trigger and a Panel; its `value` identifies it in the Accordion's `value`. */
function AccordionItem(props: AccordionItemProps) {
  return <BaseAccordion.Item {...props} data-slot="accordion-item" />;
}

export type AccordionTriggerProps = Without<BaseAccordion.Trigger.Props>;

/** Title row: Header + Trigger + expand arrow, all in one. */
function AccordionTrigger({ children, ...rest }: AccordionTriggerProps) {
  return (
    <BaseAccordion.Header data-slot="accordion-header">
      <BaseAccordion.Trigger {...rest} data-slot="accordion-trigger">
        {children}
        <span data-slot="accordion-icon" aria-hidden="true">
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
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

export type AccordionPanelProps = Without<BaseAccordion.Panel.Props>;

/** The collapsible body of an item. */
function AccordionPanel({ children, ...rest }: AccordionPanelProps) {
  return (
    <BaseAccordion.Panel {...rest} data-slot="accordion-panel">
      <div data-slot="accordion-content">{children}</div>
    </BaseAccordion.Panel>
  );
}

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Panel: AccordionPanel,
});
