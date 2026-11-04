import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { createContext, useContext } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { ReasoningStepStatus } from "../../contract.ts";
import { ShimmerText } from "../shimmer-text/index.ts";

type Without<T> = Omit<T, "className" | "style">;

const StreamingContext = createContext(false);

export interface ReasoningProps extends Without<BaseCollapsible.Root.Props> {
  /**
   * Still thinking / generating: the text on the trigger shimmers.
   * @default false
   */
  streaming?: boolean;
}

/**
 * The assistant's reasoning: a collapsible region whose trigger is one sentence ("Thought for 4s"), and which expands into a vertical timeline of steps.
 * Compose `Reasoning.Trigger` (the sentence), `Reasoning.Content` (the collapsible body), and inside it `Reasoning.Steps` with `Reasoning.Step` items (`label`, `status`).
 * `streaming` makes the trigger text shimmer while the model is still thinking; `open` / `onOpenChange` (or `defaultOpen`) control expansion.
 * For a list of planned tasks with progress use Plan; for a single tool invocation use ToolCall.
 *
 * Theme style: expand / collapse, `aria-expanded` / `aria-controls` and the keyboard all come from Base UI's Collapsible.
 */
function ReasoningRoot({ streaming = false, ...rest }: ReasoningProps) {
  return (
    <StreamingContext.Provider value={streaming}>
      <BaseCollapsible.Root
        {...rest}
        data-slot="reasoning"
        data-streaming={streaming ? "" : undefined}
      />
    </StreamingContext.Provider>
  );
}

export type ReasoningTriggerProps = Without<BaseCollapsible.Trigger.Props>;

/** Trigger: one sentence plus an expand arrow; the text shimmers while streaming. */
function ReasoningTrigger({ children, ...rest }: ReasoningTriggerProps) {
  const streaming = useContext(StreamingContext);
  return (
    <BaseCollapsible.Trigger {...rest} data-slot="reasoning-trigger">
      {typeof children === "string" ? (
        <ShimmerText active={streaming}>{children}</ShimmerText>
      ) : (
        children
      )}
      <span data-slot="reasoning-icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </BaseCollapsible.Trigger>
  );
}

export type ReasoningContentProps = Without<BaseCollapsible.Panel.Props>;

/** Collapsible body under the trigger; holds the steps or free text. */
function ReasoningContent({ children, ...rest }: ReasoningContentProps) {
  return (
    <BaseCollapsible.Panel {...rest} data-slot="reasoning-panel">
      <div data-slot="reasoning-content">{children}</div>
    </BaseCollapsible.Panel>
  );
}

/** Vertical timeline of steps (an ordered list). */
function ReasoningSteps(props: Without<ComponentPropsWithoutRef<"ol">>) {
  return <ol {...props} data-slot="reasoning-steps" />;
}

export interface ReasoningStepProps extends Without<ComponentPropsWithoutRef<"li">> {
  /** Title of the step, shown above the content. */
  label?: ReactNode;
  /**
   * done is completed (default), active is in progress (pulsing dot and `aria-current="step"`), pending has not started (hollow dot).
   * @default "done"
   */
  status?: ReasoningStepStatus;
}

/** One step of the timeline: optional `label` above, the content as children, and a `status` dot. */
function ReasoningStep({ label, status = "done", children, ...rest }: ReasoningStepProps) {
  return (
    <li
      {...rest}
      data-slot="reasoning-step"
      data-status={status}
      aria-current={status === "active" ? "step" : undefined}
    >
      {label ? <div data-slot="reasoning-step-label">{label}</div> : null}
      <div data-slot="reasoning-step-content">{children}</div>
    </li>
  );
}

export const Reasoning = Object.assign(ReasoningRoot, {
  Trigger: ReasoningTrigger,
  Content: ReasoningContent,
  Steps: ReasoningSteps,
  Step: ReasoningStep,
});
