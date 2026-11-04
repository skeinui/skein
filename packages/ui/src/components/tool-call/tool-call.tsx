import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import type { ReactNode } from "react";
import type { ToolCallState } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { CodeBlock } from "../code-block/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface ToolCallLabels {
  /** Text for each status on the trigger (also the screen reader text). */
  states?: Partial<Record<ToolCallState, string>>;
  input?: string;
  output?: string;
  error?: string;
  approve?: string;
  reject?: string;
  /** Name of the approval area, default "Approval". */
  approval?: string;
}

export interface ToolCallProps extends Without<BaseCollapsible.Root.Props> {
  /** Tool name, shown on the trigger. */
  toolName: string;
  /**
   * State: input-streaming arguments are still being generated, input-available arguments are complete and executing, output-available a result is ready,
   * output-error an error occurred, requires-action the user must approve before continuing.
   * The panel is open by default on output-error and requires-action.
   */
  state: ToolCallState;
  /** Tool input (any serializable value, shown as JSON; a string is shown as is). */
  input?: unknown;
  /** Tool result (same as above). */
  output?: unknown;
  /** Already-formatted input text, used when arguments are streamed and the JSON is not yet complete; when given, `input` is not used. */
  argsText?: string;
  /** Error details shown when state is output-error. */
  errorText?: string;
  /** Text before the tool name on the trigger, e.g. "Used tool: ". */
  triggerPrefix?: ReactNode;
  /** Called when the user approves the call (state requires-action); the approve button is shown only when this is passed. */
  onApprove?: () => void;
  /** Called when the user rejects the call (state requires-action); the reject button is shown only when this is passed. */
  onReject?: () => void;
  labels?: ToolCallLabels;
  /** Extra content in the panel, placed after the input / result. */
  children?: ReactNode;
}

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function StatusIcon({ state }: { state: ToolCallState }) {
  return (
    <span data-slot="tool-call-status" data-state={state} aria-hidden="true">
      {state === "input-streaming" || state === "input-available" ? (
        <span data-slot="tool-call-spinner" />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {state === "output-available" ? (
            <path d="M20 6 9 17l-5-5" />
          ) : state === "output-error" ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M12 8v5M12 17h.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          )}
        </svg>
      )}
    </span>
  );
}

const Chevron = () => (
  <span data-slot="tool-call-icon" aria-hidden="true">
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
);

/**
 * Card for one tool call made by an AI assistant: the trigger is "status icon + tool name + status text", and when expanded it shows the input, the result (as JSON),
 * error details, and approve / reject buttons when approval is needed.
 * Pass `toolName`, `state` (input-streaming / input-available / output-available / output-error / requires-action), `input` / `output` (or `argsText` while streaming) and `errorText`;
 * for approval give `onApprove` / `onReject`. Expanded by default on error and when pending approval; `open` / `onOpenChange` control it.
 * To group several calls under one summary use ToolCallGroup; for the model's thinking steps use Reasoning.
 *
 * Theme style: expand / collapse comes from Base UI's Collapsible; input and output are rendered with `CodeBlock`.
 */
export function ToolCall({
  toolName,
  state,
  input,
  output,
  argsText,
  errorText,
  triggerPrefix,
  onApprove,
  onReject,
  labels: labelsProp,
  children,
  defaultOpen,
  ...rest
}: ToolCallProps) {
  const labels = useLabels("toolCall", labelsProp);
  const stateText = labels.states[state];
  const args = argsText ?? (input === undefined ? undefined : toText(input));
  const result = output === undefined ? undefined : toText(output);
  const inputLabel = labels.input;
  const outputLabel = labels.output;
  const errorLabel = labels.error;
  const hasBody =
    args !== undefined ||
    result !== undefined ||
    (state === "output-error" && !!errorText) ||
    state === "requires-action" ||
    children != null;
  return (
    <BaseCollapsible.Root
      {...rest}
      defaultOpen={defaultOpen ?? (state === "requires-action" || state === "output-error")}
      data-slot="tool-call"
      data-state={state}
    >
      <BaseCollapsible.Trigger data-slot="tool-call-trigger" disabled={!hasBody}>
        <StatusIcon state={state} />
        <span data-slot="tool-call-name">
          {triggerPrefix}
          <strong>{toolName}</strong>
        </span>
        <span data-slot="tool-call-state">{stateText}</span>
        {hasBody ? <Chevron /> : null}
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel data-slot="tool-call-panel">
        <div data-slot="tool-call-content">
          {args !== undefined ? (
            <div data-slot="tool-call-section">
              <CodeBlock code={args} language="json" title={inputLabel} />
            </div>
          ) : null}
          {result !== undefined ? (
            <div data-slot="tool-call-section">
              <CodeBlock code={result} language="json" title={outputLabel} />
            </div>
          ) : null}
          {state === "output-error" && errorText ? (
            <div data-slot="tool-call-error" role="alert">
              <span data-slot="tool-call-error-label">{errorLabel}</span>
              {errorText}
            </div>
          ) : null}
          {children}
          {state === "requires-action" && (onApprove || onReject) ? (
            <div data-slot="tool-call-actions" role="group" aria-label={labels.approval}>
              {onReject ? (
                <Button variant="outline" color="neutral" size="sm" onClick={onReject}>
                  {labels.reject}
                </Button>
              ) : null}
              {onApprove ? (
                <Button size="sm" onClick={onApprove}>
                  {labels.approve}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}

export interface ToolCallGroupProps extends Without<BaseCollapsible.Root.Props> {
  /** Summary of a group of tool calls, shown on the trigger, e.g. "3 tool calls". */
  label: ReactNode;
  children?: ReactNode;
}

/** Groups several tool calls together: the trigger is a one-line summary, and when expanded it is a row of `ToolCall`s. */
export function ToolCallGroup({ label, children, ...rest }: ToolCallGroupProps) {
  return (
    <BaseCollapsible.Root {...rest} data-slot="tool-call-group">
      <BaseCollapsible.Trigger data-slot="tool-call-group-trigger">
        <span data-slot="tool-call-name">{label}</span>
        <Chevron />
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel data-slot="tool-call-group-panel">
        <div data-slot="tool-call-group-content">{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
