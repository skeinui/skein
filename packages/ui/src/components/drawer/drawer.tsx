import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import type { DrawerSide, DrawerSize } from "../../contract.ts";
import { Dialog } from "../dialog/index.ts";
import { DrawerSideContext, useDrawerSide } from "./context.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

const SWIPE = { left: "left", right: "right", top: "up", bottom: "down" } as const;

export interface DrawerProps extends Omit<BaseDrawer.Root.Props, "swipeDirection"> {
  /**
   * Which side it slides out from, which also decides the swipe-to-close direction.
   * @default "right"
   */
  side?: DrawerSide;
}

/**
 * Panel that slides in from an edge of the screen (`side`: right by default) over the page, for detail views, forms or mobile navigation.
 * Same structure as Dialog: `<Drawer.Trigger>` opens `<Drawer.Content size>`, which holds `Drawer.Title`, `Drawer.Description`, `Drawer.Body`, `Drawer.Footer`, `Drawer.Close`.
 * `open` / `onOpenChange` control it; Esc, the close button, the backdrop and swiping toward its side close it. For a centered modal use Dialog.
 *
 * Theme style: focus trapping, Esc to close, swipe to close and background scroll lock come from Base UI's Drawer; the backdrop and close button reuse Dialog's slots.
 */
export function Drawer({ side = "right", ...props }: DrawerProps) {
  return (
    <DrawerSideContext.Provider value={side}>
      <BaseDrawer.Root {...props} swipeDirection={SWIPE[side]} />
    </DrawerSideContext.Provider>
  );
}

function DrawerTrigger(props: Without<BaseDrawer.Trigger.Props>) {
  return <BaseDrawer.Trigger {...props} />;
}

export interface DrawerContentProps extends Without<BaseDrawer.Popup.Props> {
  /**
   * Width of a left / right drawer, height of a top / bottom one.
   * @default "md"
   */
  size?: DrawerSize;
  /**
   * Close button in the top right.
   * @default true
   */
  closeButton?: boolean;
}

/** Portal + backdrop + the drawer itself, all provided at once; the backdrop and close button reuse Dialog's slots. */
function DrawerContent({
  size = "md",
  closeButton = true,
  children,
  ...popup
}: DrawerContentProps) {
  const c = useLabels("common");
  const side = useDrawerSide();
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop data-slot="dialog-backdrop" />
      <BaseDrawer.Viewport data-slot="drawer-viewport">
        <BaseDrawer.Popup {...popup} data-slot="drawer" data-side={side} data-size={size}>
          <BaseDrawer.Content data-slot="drawer-content">{children}</BaseDrawer.Content>
          {closeButton ? (
            <BaseDrawer.Close data-slot="dialog-close" aria-label={c.close}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </BaseDrawer.Close>
          ) : null}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

Drawer.Trigger = DrawerTrigger;
Drawer.Content = DrawerContent;
Drawer.Title = Dialog.Title;
Drawer.Description = Dialog.Description;
Drawer.Body = Dialog.Body;
Drawer.Footer = Dialog.Footer;
Drawer.Close = Dialog.Close;
