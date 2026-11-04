import type { ReactElement, ReactNode } from "react";
import type { DialogSize } from "../../contract.ts";
import { AlertDialog } from "../alert-dialog/index.ts";
import { Button } from "../button/index.ts";
import { useConfirm } from "./use-confirm.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface ConfirmDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the dialog when clicked (e.g. a button); if omitted, only open controls it. */
  trigger?: ReactElement;
  /** Question or action being confirmed, e.g. "Delete this project?". */
  title: ReactNode;
  /** Explanation under the title (consequences, what cannot be undone). */
  description?: ReactNode;
  /** Content besides the title and description (e.g. asking the user to type a name to confirm). */
  children?: ReactNode;
  /** Text of the confirm button; defaults to the language pack's "Confirm". */
  confirmLabel?: ReactNode;
  /** Text of the cancel button; defaults to the language pack's "Cancel". */
  cancelLabel?: ReactNode;
  /**
   * With danger, the confirm button uses the danger color (delete and the like).
   * @default "default"
   */
  tone?: "default" | "danger";
  /**
   * Called when confirm is clicked. If it returns a Promise the confirm button enters a loading state, and cancel / close are blocked meanwhile;
   * on success it closes automatically, on failure (reject) it stays open, and the caller shows the error.
   */
  onConfirm?: () => void | Promise<void>;
  /** Called when the dialog is dismissed without confirming (cancel button, Esc, closing). */
  onCancel?: () => void;
  /**
   * Width step, as on AlertDialog.
   * @default "sm"
   */
  size?: DialogSize;
}

/**
 * Confirm dialog: AlertDialog plus the common title / description / cancel / confirm, one component instead of a dozen lines of boilerplate.
 * For more customization (other buttons, forms) use AlertDialog directly.
 */
export function ConfirmDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  confirmLabel: confirmLabelProp,
  cancelLabel: cancelLabelProp,
  tone = "default",
  onConfirm,
  onCancel,
  size,
}: ConfirmDialogProps) {
  const c = useLabels("common");
  const cancelLabel = cancelLabelProp ?? c.cancel;
  const confirmLabel = confirmLabelProp ?? c.confirm;
  const state = useConfirm({ open, defaultOpen, onOpenChange, onConfirm, onCancel });
  return (
    <AlertDialog open={state.open} onOpenChange={state.requestOpenChange}>
      {trigger ? <AlertDialog.Trigger render={trigger} /> : null}
      <AlertDialog.Content size={size}>
        <AlertDialog.Title>{title}</AlertDialog.Title>
        {description ? <AlertDialog.Description>{description}</AlertDialog.Description> : null}
        {children ? <AlertDialog.Body>{children}</AlertDialog.Body> : null}
        <AlertDialog.Footer>
          <Button variant="outline" color="neutral" disabled={state.pending} onClick={state.cancel}>
            {cancelLabel}
          </Button>
          <Button
            color={tone === "danger" ? "danger" : "primary"}
            loading={state.pending}
            onClick={state.confirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}
