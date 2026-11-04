import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { DialogSize } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

export type DialogProps = BaseDialog.Root.Props;

/**
 * Modal window over the page for a focused task or message: `<Dialog.Trigger>` opens `<Dialog.Content>`, which holds `Dialog.Title`, `Dialog.Description`,
 * `Dialog.Body` and `Dialog.Footer` (put `Dialog.Close` or your buttons there). `open` / `onOpenChange` control it; Esc, the close button
 * (`closeButton`, on by default) and clicking the backdrop close it, focus stays inside while open, and `size` sets the width.
 * For a yes / no confirmation use ConfirmDialog or AlertDialog; for a panel sliding in from an edge use Drawer; for non-modal floating content use Popover.
 *
 * Theme style: focus trapping, Esc to close and background scroll lock all come from Base UI.
 */
export function Dialog(props: DialogProps) {
  return <BaseDialog.Root {...props} />;
}

export type DialogTriggerProps = Without<BaseDialog.Trigger.Props>;

function DialogTrigger(props: DialogTriggerProps) {
  return <BaseDialog.Trigger {...props} />;
}

export interface DialogContentProps extends Without<BaseDialog.Popup.Props> {
  /**
   * Width step; the actual width comes from the theme style.
   * @default "md"
   */
  size?: DialogSize;
  /**
   * Close button in the top right, shown by default.
   * @default true
   */
  closeButton?: boolean;
  children?: ReactNode;
}

/** Portal + backdrop + scroll container + the dialog itself, all provided at once. */
function DialogContent({
  size = "md",
  closeButton = true,
  children,
  ...popup
}: DialogContentProps) {
  const c = useLabels("common");
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop data-slot="dialog-backdrop" />
      <BaseDialog.Viewport data-slot="dialog-viewport">
        <BaseDialog.Popup {...popup} data-slot="dialog" data-size={size}>
          {children}
          {closeButton ? (
            <BaseDialog.Close data-slot="dialog-close" aria-label={c.close}>
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
            </BaseDialog.Close>
          ) : null}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

export type DialogTitleProps = Without<BaseDialog.Title.Props>;

function DialogTitle(props: DialogTitleProps) {
  return <BaseDialog.Title {...props} data-slot="dialog-title" />;
}

export type DialogDescriptionProps = Without<BaseDialog.Description.Props>;

function DialogDescription(props: DialogDescriptionProps) {
  return <BaseDialog.Description {...props} data-slot="dialog-description" />;
}

export type DialogBodyProps = Without<ComponentPropsWithoutRef<"div">>;

/** Body area. Not a Base UI part, just a hook for theme styles to attach spacing and scrolling. */
function DialogBody(props: DialogBodyProps) {
  return <div {...props} data-slot="dialog-body" />;
}

export type DialogFooterProps = Without<ComponentPropsWithoutRef<"div">>;

/** Action area at the bottom, usually holding cancel / confirm buttons. */
function DialogFooter(props: DialogFooterProps) {
  return <div {...props} data-slot="dialog-footer" />;
}

export type DialogCloseProps = Without<BaseDialog.Close.Props>;

function DialogClose(props: DialogCloseProps) {
  return <BaseDialog.Close {...props} />;
}

Dialog.Trigger = DialogTrigger;
Dialog.Content = DialogContent;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;
Dialog.Close = DialogClose;
