import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { StepStatus, UIColor, UIOrientation } from "../../contract.ts";

export interface StepItem {
  /** Name of the step, e.g. "Shipping address". */
  title: ReactNode;
  /** Optional secondary line under the title. */
  description?: ReactNode;
  /** Set the status manually; if omitted it is derived from current (earlier ones complete, later ones not started). */
  status?: StepStatus;
}

export interface StepperProps extends Omit<
  ComponentPropsWithoutRef<"ol">,
  "className" | "style" | "children"
> {
  /** The steps in order: `{ title, description, status }`; `status` overrides the one derived from `current` (e.g. `error`). */
  steps: StepItem[];
  /** Index of the current step, starting from 0. */
  current: number;
  /**
   * Layout direction.
   * @default "horizontal"
   */
  orientation?: UIOrientation;
  /**
   * Colour of the completed and current steps; the theme style picks the actual colours.
   * @default "primary"
   */
  color?: UIColor;
  /** Called when a completed / current step is clicked; if omitted the steps are not clickable. */
  onStepClick?: (index: number) => void;
}

const Check = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m5 12 5 5 9-10" />
  </svg>
);

const Cross = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/** Stepper: data-driven, statuses are complete / current / upcoming / error; completed steps draw a check, errored ones draw a cross, the rest show the step number. */
export function Stepper({
  steps,
  current,
  orientation = "horizontal",
  color = "primary",
  onStepClick,
  ...rest
}: StepperProps) {
  return (
    <ol {...rest} data-slot="stepper" data-orientation={orientation} data-color={color}>
      {steps.map((step, i) => {
        const status: StepStatus =
          step.status ?? (i < current ? "complete" : i === current ? "current" : "upcoming");
        const clickable = !!onStepClick && (status === "complete" || status === "current");
        const body = (
          <>
            <span data-slot="stepper-indicator">
              {status === "complete" ? <Check /> : status === "error" ? <Cross /> : i + 1}
            </span>
            <span data-slot="stepper-content">
              <span data-slot="stepper-title">{step.title}</span>
              {step.description ? (
                <span data-slot="stepper-description">{step.description}</span>
              ) : null}
            </span>
          </>
        );
        return (
          <li
            key={i}
            data-slot="stepper-step"
            data-status={status}
            aria-current={status === "current" ? "step" : undefined}
          >
            {clickable ? (
              <button type="button" data-slot="stepper-trigger" onClick={() => onStepClick(i)}>
                {body}
              </button>
            ) : (
              <span data-slot="stepper-trigger">{body}</span>
            )}
            {i < steps.length - 1 ? (
              <span data-slot="stepper-connector" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
