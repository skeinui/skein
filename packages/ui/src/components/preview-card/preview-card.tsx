import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { OverlayAlign, OverlaySide } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export type PreviewCardProps = BasePreviewCard.Root.Props;

/** Hover card: a preview that appears on mouse hover or keyboard focus on a link. The look fully reuses Popover's theme style (the same slots). */
export function PreviewCard(props: PreviewCardProps) {
  return <BasePreviewCard.Root {...props} />;
}

function PreviewCardTrigger(props: Without<BasePreviewCard.Trigger.Props>) {
  return <BasePreviewCard.Trigger {...props} />;
}

export interface PreviewCardContentProps extends Without<BasePreviewCard.Popup.Props> {
  /**
   * Which side of the trigger the card opens on.
   * @default "bottom"
   */
  side?: OverlaySide;
  /**
   * Alignment of the card against the trigger.
   * @default "center"
   */
  align?: OverlayAlign;
  /**
   * Gap between the trigger and the card, in px.
   * @default 8
   */
  sideOffset?: number;
  /** The card's content. */
  children?: ReactNode;
}

function PreviewCardContent({
  side = "bottom",
  align = "center",
  sideOffset = 8,
  children,
  ...popup
}: PreviewCardContentProps) {
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner
        data-slot="popover-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <BasePreviewCard.Popup {...popup} data-slot="popover" data-preview="">
          {children}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}

/**
 * Title and description: Base UI's PreviewCard has neither part (Popover.Title / Description depend on Popover's context and would throw inside a hover card),
 * so these are plain elements that borrow Popover's slots (popover-title / popover-description), and look the same as in Popover.
 */
export type PreviewCardTitleProps = Without<ComponentPropsWithoutRef<"h2">>;

function PreviewCardTitle(props: PreviewCardTitleProps) {
  return <h2 {...props} data-slot="popover-title" />;
}

export type PreviewCardDescriptionProps = Without<ComponentPropsWithoutRef<"p">>;

function PreviewCardDescription(props: PreviewCardDescriptionProps) {
  return <p {...props} data-slot="popover-description" />;
}

PreviewCard.Trigger = PreviewCardTrigger;
PreviewCard.Title = PreviewCardTitle;
PreviewCard.Description = PreviewCardDescription;
PreviewCard.Content = PreviewCardContent;
