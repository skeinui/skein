import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import type { DialogSize } from "../../contract.ts";
import { Dialog } from "../dialog/index.ts";
import type { DialogContentProps } from "../dialog/index.ts";

type Without<T> = Omit<T, "className" | "style">;

export type AlertDialogProps = BaseAlertDialog.Root.Props;

/**
 * AlertDialog: a modal dialog that requires an explicit answer before continuing (delete, irreversible actions).
 * Clicking the backdrop does not casually close it, there is no top-right close button by default, and the user must use
 * the buttons in `AlertDialog.Footer` (wrap them in `AlertDialog.Close`). Compose `AlertDialog.Trigger` + `AlertDialog.Content`
 * (with Title / Description / Body / Footer); `open` / `onOpenChange` control it. For a ready-made confirm prompt use
 * ConfirmDialog or Popconfirm; for a dialog that may be dismissed freely use Dialog.
 *
 * Theme style: its appearance fully reuses Dialog's theme style (same slots); the popup carries `data-alert`.
 */
export function AlertDialog(props: AlertDialogProps) {
  return <BaseAlertDialog.Root {...props} />;
}

function AlertDialogTrigger(props: Without<BaseAlertDialog.Trigger.Props>) {
  return <BaseAlertDialog.Trigger {...props} />;
}

export interface AlertDialogContentProps extends Without<BaseAlertDialog.Popup.Props> {
  /**
   * Width step, narrower than Dialog's by default; the actual width comes from the theme style.
   * @default "sm"
   */
  size?: DialogSize;
  children?: DialogContentProps["children"];
}

/** The dialog itself (portal, backdrop and popup in one); `size` defaults to "sm". */
function AlertDialogContent({ size = "sm", children, ...popup }: AlertDialogContentProps) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop data-slot="dialog-backdrop" />
      <BaseAlertDialog.Viewport data-slot="dialog-viewport">
        <BaseAlertDialog.Popup {...popup} data-slot="dialog" data-size={size} data-alert="">
          {children}
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Viewport>
    </BaseAlertDialog.Portal>
  );
}

AlertDialog.Trigger = AlertDialogTrigger;
AlertDialog.Content = AlertDialogContent;
AlertDialog.Title = Dialog.Title;
AlertDialog.Description = Dialog.Description;
AlertDialog.Body = Dialog.Body;
AlertDialog.Footer = Dialog.Footer;
AlertDialog.Close = Dialog.Close;
