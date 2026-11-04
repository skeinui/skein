import type { ReactElement, ReactNode } from "react";
import type { OverlayAlign, OverlaySide } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { useConfirm } from "../confirm-dialog/use-confirm.ts";
import { Popover } from "../popover/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface PopconfirmProps {
  /** The element that pops up the confirmation bubble when clicked (a button or the like, a single element). */
  children: ReactElement;
  /** The question, e.g. "Delete this item?"; also the bubble's accessible name when it is a string. */
  title: ReactNode;
  /** Optional secondary text under the title (consequences, details). */
  description?: ReactNode;
  /** Icon before the title; a warning icon if not passed, pass null to hide it. */
  icon?: ReactNode | null;
  /** Text of the confirm button, default the locale's "OK". */
  confirmLabel?: ReactNode;
  /** Text of the cancel button, default the locale's "Cancel". */
  cancelLabel?: ReactNode;
  /**
   * Do not show the cancel button (for notices with only a "Got it" button).
   * @default false
   */
  hideCancel?: boolean;
  /**
   * With danger, the confirm button and icon use the danger color.
   * @default "default"
   */
  tone?: "default" | "danger";
  /**
   * Called on confirm. If it returns a Promise, the confirm button enters a loading state, and cancel or close is not possible meanwhile;
   * on success it closes automatically, on failure (reject) it stays open, and the consumer shows the error.
   */
  onConfirm?: () => void | Promise<void>;
  /** Called when the bubble is dismissed without confirming: the cancel button, Escape or a click outside. */
  onCancel?: () => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * When disabled, clicking the element does not pop up, and the element itself works as usual.
   * @default false
   */
  disabled?: boolean;
  /**
   * Which side of the element the bubble opens on.
   * @default "top"
   */
  side?: OverlaySide;
  /**
   * Alignment of the bubble against the element.
   * @default "center"
   */
  align?: OverlayAlign;
}

const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

/**
 * Popconfirm: click an element and a small bubble pops up beside it asking "Are you sure?", without interrupting the page (lighter than a dialog, suited to inline delete and disable).
 * The shell is this theme style's Popover, and inside are title / description / cancel / confirm.
 */
export function Popconfirm({
  children,
  title,
  description,
  icon,
  confirmLabel: confirmLabelProp,
  cancelLabel: cancelLabelProp,
  hideCancel = false,
  tone = "default",
  onConfirm,
  onCancel,
  open,
  defaultOpen,
  onOpenChange,
  disabled = false,
  side = "top",
  align = "center",
}: PopconfirmProps) {
  const c = useLabels("common");
  const cancelLabel = cancelLabelProp ?? c.cancel;
  const confirmLabel = confirmLabelProp ?? c.ok;
  const state = useConfirm({ open, defaultOpen, onOpenChange, onConfirm, onCancel });
  if (disabled) return children;
  return (
    <Popover open={state.open} onOpenChange={state.requestOpenChange}>
      <Popover.Trigger render={children} />
      <Popover.Content
        side={side}
        align={align}
        arrow
        role="alertdialog"
        aria-label={typeof title === "string" ? title : "Confirm"}
      >
        <div data-slot="popconfirm" data-tone={tone}>
          {icon === null ? null : (
            <span data-slot="popconfirm-icon">{icon ?? <WarningIcon />}</span>
          )}
          <div data-slot="popconfirm-title">{title}</div>
          {description ? <div data-slot="popconfirm-description">{description}</div> : null}
          <div data-slot="popconfirm-footer">
            {hideCancel ? null : (
              <Button
                size="sm"
                variant="outline"
                color="neutral"
                disabled={state.pending}
                onClick={state.cancel}
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              size="sm"
              color={tone === "danger" ? "danger" : "primary"}
              loading={state.pending}
              onClick={state.confirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Popover.Content>
    </Popover>
  );
}
