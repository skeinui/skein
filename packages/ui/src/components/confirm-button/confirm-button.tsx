import type { ReactNode } from "react";
import { Button } from "../button/index.ts";
import type { ButtonProps } from "../button/index.ts";
import { Popconfirm } from "../popconfirm/index.ts";

export interface ConfirmButtonProps extends Omit<ButtonProps, "onClick" | "title"> {
  /** The question asked before it happens: "Delete this ticket?" */
  question: ReactNode;
  /** Secondary text under the question: what follows from it. */
  description?: ReactNode;
  /** Text of the button that confirms; the button's own text when that is a string, else the locale's "OK". */
  confirmLabel?: ReactNode;
  /** Text of the button that backs out; the locale's "Cancel" by default. */
  cancelLabel?: ReactNode;
  /**
   * Called on confirm. A promise keeps the bubble open with the confirm button loading, closes it when it is done, and keeps it open when it fails
   * (show the error yourself).
   */
  onConfirm: () => void | Promise<void>;
}

/**
 * Confirm button: a Button that asks "are you sure?" in a bubble before it does what it says: Delete, Merge, Archive.
 * It takes the props of Button (`variant`, `color`, `size`, `loading`…), and `color="danger"` makes the bubble danger too.
 * For the row actions of a table use the `confirm` of a DataTable action; for a bubble around anything else use Popconfirm.
 */
export function ConfirmButton({
  question,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  children,
  color,
  ...rest
}: ConfirmButtonProps) {
  return (
    <Popconfirm
      tone={color === "danger" ? "danger" : "default"}
      title={question}
      description={description}
      confirmLabel={confirmLabel ?? (typeof children === "string" ? children : undefined)}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
    >
      <Button {...rest} color={color}>
        {children}
      </Button>
    </Popconfirm>
  );
}
