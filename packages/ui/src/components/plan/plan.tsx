import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { PlanStatus } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface PlanItem {
  /** Unique, stable id of the step (used as the React key). */
  id: string;
  /** What the step does, one line. */
  label: string;
  status: PlanStatus;
  /** A line of description under the label (what is being done, why it was skipped). */
  detail?: ReactNode;
}

export interface PlanLabels {
  /** Screen-reader text for each status. */
  status?: Partial<Record<PlanStatus, string>>;
  /** Name of the progress bar, default "Plan progress". */
  progress?: string;
}

export interface PlanProps extends Omit<Without<BaseCollapsible.Root.Props>, "title" | "children"> {
  /** Title of the plan. */
  title: ReactNode;
  /** The steps in order, each with an `id`, `label`, `status` and optional `detail`. */
  items: readonly PlanItem[];
  labels?: PlanLabels;
  /**
   * Whether the plan is initially expanded; the header is the trigger that collapses it.
   * To render a controlled plan, use the `open` prop instead.
   * @default true
   */
  defaultOpen?: boolean;
}

function StatusIcon({ status }: { status: PlanStatus }) {
  return (
    <span data-slot="plan-item-icon" data-status={status} aria-hidden="true">
      {status === "active" ? (
        <span data-slot="plan-spinner" />
      ) : status === "pending" ? null : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {status === "done" ? (
            <path d="M20 6 9 17l-5-5" />
          ) : status === "failed" ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M6 12h12" />
          )}
        </svg>
      )}
    </span>
  );
}

/**
 * Task plan: a series of things the agent will do, each with a status (todo / in progress / done / failed / skipped), with a header of title and "2 / 5" plus a progress bar,
 * and it can be collapsed. Data-driven (`items` is serializable); progress counts "done + skipped". Besides the icon, each item's status also has screen-reader text.
 */
export function Plan({ title, items, labels: labelsProp, defaultOpen = true, ...rest }: PlanProps) {
  const labels = useLabels("plan", labelsProp);
  const done = items.filter((i) => i.status === "done" || i.status === "skipped").length;
  const total = items.length;
  const fill = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    fill.current?.style.setProperty("--plan-progress", total ? `${(done / total) * 100}%` : "0%");
  }, [done, total]);
  const statusText = (s: PlanStatus) => labels.status[s];
  return (
    <BaseCollapsible.Root {...rest} defaultOpen={defaultOpen} data-slot="plan">
      <BaseCollapsible.Trigger data-slot="plan-trigger">
        <span data-slot="plan-title">{title}</span>
        <span data-slot="plan-count">
          {done} / {total}
        </span>
        <span data-slot="plan-chevron" aria-hidden="true">
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
      <div
        data-slot="plan-bar"
        role="progressbar"
        aria-label={labels.progress}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <span ref={fill} data-slot="plan-bar-fill" />
      </div>
      <BaseCollapsible.Panel data-slot="plan-panel">
        <ol data-slot="plan-items">
          {items.map((item) => (
            <li
              key={item.id}
              data-slot="plan-item"
              data-status={item.status}
              aria-current={item.status === "active" ? "step" : undefined}
            >
              <StatusIcon status={item.status} />
              <div data-slot="plan-item-body">
                <span data-slot="plan-item-label">
                  <span data-slot="plan-item-status">{statusText(item.status)}: </span>
                  {item.label}
                </span>
                {item.detail ? <span data-slot="plan-item-detail">{item.detail}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
