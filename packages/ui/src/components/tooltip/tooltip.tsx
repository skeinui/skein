import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";
import type { OverlayAlign, OverlaySide } from "../../contract.ts";

export interface TooltipProps extends Pick<
  BaseTooltip.Root.Props,
  "open" | "defaultOpen" | "onOpenChange" | "disabled" | "trackCursorAxis"
> {
  /** Content in the bubble. */
  content: ReactNode;
  /** Trigger element; must be a single element that can take a ref and events (a button, a link, or your own component all work). */
  children: ReactElement;
  /**
   * Which side of the trigger it appears on; it flips when there isn't room.
   * @default "top"
   */
  side?: OverlaySide;
  /**
   * Alignment along that side.
   * @default "center"
   */
  align?: OverlayAlign;
  /**
   * Distance between the bubble and the trigger element (px).
   * @default 8
   */
  sideOffset?: number;
  /**
   * How long to hover before it appears (milliseconds); if omitted, the TooltipProvider's value is used.
   * @default 600
   */
  delay?: number;
  /**
   * How long it stays after the pointer leaves (milliseconds).
   * @default 0
   */
  closeDelay?: number;
  /**
   * Whether to include a small arrow pointing at the trigger element.
   * @default false
   */
  arrow?: boolean;
}

/**
 * Tooltip: a short text bubble shown when its trigger is hovered or focused, closed by Esc or leaving.
 * Wrap the trigger as `children` (a single element) and put the text in `content`; `side` / `align` / `sideOffset` place it,
 * `delay` / `closeDelay` time it, `arrow` adds a pointer. Wrap several in `Tooltip.Provider` to share the delay.
 * For interactive or richer content use Popover; for a preview of a link use PreviewCard.
 *
 * Theme style: behavior (delay, focus, Esc to close, collision flipping) comes from Base UI, and the look is decided by the
 * theme style. The bubble is portaled to <body>, so theme style attributes must be on <html>.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  sideOffset = 8,
  delay,
  closeDelay,
  arrow = false,
  ...root
}: TooltipProps) {
  return (
    <BaseTooltip.Root {...root}>
      <BaseTooltip.Trigger delay={delay} closeDelay={closeDelay} render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          data-slot="tooltip-positioner"
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BaseTooltip.Popup data-slot="tooltip">
            {arrow ? <BaseTooltip.Arrow data-slot="tooltip-arrow" /> : null}
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

export type TooltipProviderProps = BaseTooltip.Provider.Props;

/** Lets a group of Tooltips share the appearance delay: moving to an adjacent trigger no longer waits. */
function TooltipProvider(props: TooltipProviderProps) {
  return <BaseTooltip.Provider {...props} />;
}

Tooltip.Provider = TooltipProvider;
