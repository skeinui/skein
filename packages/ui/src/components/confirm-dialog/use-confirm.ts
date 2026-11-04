import { useCallback, useRef, useState } from "react";

/** Controlled / uncontrolled, pick one: if open is passed it wins, otherwise internal state is used. */
function useOpen(
  open: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  const [inner, setInner] = useState(defaultOpen);
  const value = open !== undefined ? open : inner;
  const set = useCallback(
    (next: boolean) => {
      if (open === undefined) setInner(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );
  return [value, set] as const;
}

/**
 * State shared by confirm-type components: the open / close switch and the "click confirm" flow.
 * onConfirm may be async: when it returns a Promise, the confirm button enters a loading state and cancel and close are blocked;
 * on success it closes automatically; on failure (reject) it stays open so the caller can show a message, and the user can retry.
 */
export function useConfirm(options: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [open, setOpen] = useOpen(options.open, options.defaultOpen ?? false, options.onOpenChange);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  /** onOpenChange handed to the underlying component: closing is not allowed while a confirmation is in progress. */
  const requestOpenChange = (next: boolean) => {
    if (!next && pendingRef.current) return;
    if (!next && open) options.onCancel?.();
    setOpen(next);
  };

  const confirm = async () => {
    if (pendingRef.current) return;
    const result = options.onConfirm?.();
    if (result && typeof (result as Promise<void>).then === "function") {
      pendingRef.current = true;
      setPending(true);
      try {
        await result;
      } catch {
        pendingRef.current = false;
        setPending(false);
        return; // failed: stay open, the caller handles the error
      }
      pendingRef.current = false;
      setPending(false);
    }
    setOpen(false);
  };

  const cancel = () => {
    if (pendingRef.current) return;
    options.onCancel?.();
    setOpen(false);
  };

  return { open, pending, requestOpenChange, confirm, cancel };
}
