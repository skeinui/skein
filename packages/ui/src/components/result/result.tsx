import type { ReactNode } from "react";

import type { ResultStatus } from "../../contract.ts";

export type { ResultStatus };

export interface ResultProps {
  /**
   * Result type: success / error / info / warning are statuses with icons; 403 / 404 / 500 are page-level errors and show a large error code.
   * @default "info"
   */
  status?: ResultStatus;
  /** Headline of the result, e.g. "Payment successful" or "Page not found". */
  title?: ReactNode;
  /** Description text below the title. */
  description?: ReactNode;
  /** Custom icon, replacing the default status icon (for 403 / 404 / 500 it replaces the error code). */
  icon?: ReactNode;
  /** Actions area at the bottom, usually holding one or two buttons. */
  extra?: ReactNode;
  /** Content beyond the description (e.g. a list of error details), placed in a light background block. */
  children?: ReactNode;
}

const ICON_PATHS: Record<"success" | "error" | "info" | "warning", string> = {
  success:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.4-3.7-3.7 1.4-1.4 2.3 2.3 5.3-5.3 1.4 1.4-6.7 6.7z",
  error:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.2 12.8-1.4 1.4L12 13.4l-2.8 2.8-1.4-1.4 2.8-2.8-2.8-2.8 1.4-1.4 2.8 2.8 2.8-2.8 1.4 1.4-2.8 2.8 2.8 2.8z",
  info: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  warning: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
};

/** Result page: a large icon (or error code), title, description and action buttons, centered; used for whole-page states such as operation success / failure and 404 / 403 / 500. */
export function Result({
  status = "info",
  title,
  description,
  icon,
  extra,
  children,
}: ResultProps) {
  const isCode = status === "403" || status === "404" || status === "500";
  const visual =
    icon ??
    (isCode ? (
      <span data-slot="result-code">{status}</span>
    ) : (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={ICON_PATHS[status]} />
      </svg>
    ));
  return (
    <div data-slot="result" data-status={status}>
      <div data-slot="result-icon">{visual}</div>
      {title ? <div data-slot="result-title">{title}</div> : null}
      {description ? <div data-slot="result-description">{description}</div> : null}
      {extra ? <div data-slot="result-extra">{extra}</div> : null}
      {children ? <div data-slot="result-content">{children}</div> : null}
    </div>
  );
}
