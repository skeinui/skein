import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { AlertVariant, UIColor } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

const ICON_PATHS: Record<string, string> = {
  neutral: "M12 11v5M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  primary: "M12 11v5M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  secondary: "M12 11v5M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  success: "m8 12 3 3 5-6M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  warning:
    "M12 9v4M12 17h.01M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z",
  danger: "m9 9 6 6m0-6-6 6M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
};

export interface AlertProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "className" | "style" | "color" | "title"
> {
  /**
   * Visual variant; how each one looks is up to the theme style.
   * @default "soft"
   */
  variant?: AlertVariant;
  /**
   * Semantic colour, which also picks the default icon; danger and warning get `role="alert"`, the others `role="status"`.
   * @default "primary"
   */
  color?: UIColor;
  /** Bold heading line above the message (`children`). */
  title?: ReactNode;
  /** Icon: when not passed the default icon for the color is used, pass false to hide it, pass a node to replace it. */
  icon?: ReactNode | false;
  /** Action area on the right (usually a button or link). */
  action?: ReactNode;
  /** When passed, a close button is shown and the callback is called on click; whether it is actually removed is up to the caller. */
  onClose?: () => void;
}

/**
 * Alert: an inline banner for a static info, success, warning or error message on the page.
 * `children` is the message, `title` an optional heading, `color` picks the kind (and the default icon), `variant` the look;
 * `icon` replaces or hides the icon, `action` adds a button / link on the right, and `onClose` shows a close button
 * (the caller removes the alert). danger / warning get `role="alert"`, others `role="status"`.
 * For a transient notification use Toast; for a message that needs a decision use AlertDialog.
 */
export function Alert({
  variant = "soft",
  color = "primary",
  title,
  icon,
  action,
  onClose,
  children,
  ...rest
}: AlertProps) {
  const c = useLabels("common");
  return (
    <div
      role={color === "danger" || color === "warning" ? "alert" : "status"}
      {...rest}
      data-slot="alert"
      data-variant={variant}
      data-color={color}
    >
      {icon === false ? null : (
        <span data-slot="alert-icon" aria-hidden="true">
          {icon ?? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={ICON_PATHS[color]} />
            </svg>
          )}
        </span>
      )}
      <div data-slot="alert-content">
        {title ? <div data-slot="alert-title">{title}</div> : null}
        {children ? <div data-slot="alert-description">{children}</div> : null}
      </div>
      {action ? <div data-slot="alert-action">{action}</div> : null}
      {onClose ? (
        <button type="button" data-slot="alert-close" aria-label={c.close} onClick={onClose}>
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
        </button>
      ) : null}
    </div>
  );
}
