import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ReactNode } from "react";
import type { OverlayAlign, OverlaySide } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export type PopoverProps = BasePopover.Root.Props;

/** Click-triggered overlay: unlike Tooltip it can hold interactive content, and only closes on click outside or Esc. */
export function Popover(props: PopoverProps) {
  return <BasePopover.Root {...props} />;
}

export type PopoverTriggerProps = Without<BasePopover.Trigger.Props>;

/** Trigger element. To use your own button pass render: `<Popover.Trigger render={<Button />}>Open</Popover.Trigger>`. */
function PopoverTrigger(props: PopoverTriggerProps) {
  return <BasePopover.Trigger {...props} />;
}

export interface PopoverContentProps extends Without<BasePopover.Popup.Props> {
  /**
   * Which side of the trigger the popup opens on.
   * @default "bottom"
   */
  side?: OverlaySide;
  /**
   * Alignment of the popup against the trigger.
   * @default "center"
   */
  align?: OverlayAlign;
  /**
   * Gap between the trigger (or anchor) and the popup, in px.
   * @default 8
   */
  sideOffset?: number;
  /** When not anchored to the trigger, give an element or a virtual element ({ getBoundingClientRect }); e.g. to follow the caret inside an input. */
  anchor?: BasePopover.Positioner.Props["anchor"];
  /**
   * Draw an arrow pointing at the trigger.
   * @default false
   */
  arrow?: boolean;
  /** The popup's content. */
  children?: ReactNode;
}

function PopoverContent({
  side = "bottom",
  align = "center",
  sideOffset = 8,
  anchor,
  arrow = false,
  children,
  ...popup
}: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        data-slot="popover-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        anchor={anchor}
      >
        <BasePopover.Popup {...popup} data-slot="popover">
          {arrow ? <BasePopover.Arrow data-slot="popover-arrow" /> : null}
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export type PopoverTitleProps = Without<BasePopover.Title.Props>;

function PopoverTitle(props: PopoverTitleProps) {
  return <BasePopover.Title {...props} data-slot="popover-title" />;
}

export type PopoverDescriptionProps = Without<BasePopover.Description.Props>;

function PopoverDescription(props: PopoverDescriptionProps) {
  return <BasePopover.Description {...props} data-slot="popover-description" />;
}

export type PopoverCloseProps = Without<BasePopover.Close.Props>;

function PopoverClose(props: PopoverCloseProps) {
  return <BasePopover.Close {...props} data-slot="popover-close" />;
}

Popover.Trigger = PopoverTrigger;
Popover.Content = PopoverContent;
Popover.Title = PopoverTitle;
Popover.Description = PopoverDescription;
Popover.Close = PopoverClose;
