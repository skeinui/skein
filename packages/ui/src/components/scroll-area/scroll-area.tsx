import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ReactNode } from "react";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

export interface ScrollAreaProps extends Omit<
  BaseScrollArea.Root.Props,
  "className" | "style" | "children" | "render"
> {
  /**
   * Which direction's scrollbar to show.
   * @default "vertical"
   */
  orientation?: ScrollAreaOrientation;
  children?: ReactNode;
}

/**
 * ScrollArea: a scrollable box with a themed scrollbar, for content taller (or wider, `orientation`) than its space.
 * There is no height prop: put it in a parent with a height (or max height) and it fills the parent and scrolls inside it.
 * For a fade at the edges instead of a scrollbar use ScrollShadow.
 *
 * Theme style: scrolling itself is native, and the scrollbar (track, thumb) is drawn by the theme style.
 */
export function ScrollArea({ orientation = "vertical", children, ...rest }: ScrollAreaProps) {
  const vertical = orientation !== "horizontal";
  const horizontal = orientation !== "vertical";
  return (
    <BaseScrollArea.Root {...rest} data-slot="scroll-area">
      <BaseScrollArea.Viewport data-slot="scroll-area-viewport">
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      {vertical ? (
        <BaseScrollArea.Scrollbar data-slot="scroll-area-scrollbar" orientation="vertical">
          <BaseScrollArea.Thumb data-slot="scroll-area-thumb" />
        </BaseScrollArea.Scrollbar>
      ) : null}
      {horizontal ? (
        <BaseScrollArea.Scrollbar data-slot="scroll-area-scrollbar" orientation="horizontal">
          <BaseScrollArea.Thumb data-slot="scroll-area-thumb" />
        </BaseScrollArea.Scrollbar>
      ) : null}
      {vertical && horizontal ? <BaseScrollArea.Corner data-slot="scroll-area-corner" /> : null}
    </BaseScrollArea.Root>
  );
}
