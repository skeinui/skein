import { Plan, type PlanItem } from "@skeinui/ui";
import { useEffect, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "plan" },
  { key: "trigger", name: "plan-trigger / -title / -count / -chevron" },
  { key: "bar", name: "plan-bar / plan-bar-fill" },
  { key: "panel", name: "plan-panel / plan-items" },
  { key: "item", name: "plan-item / plan-item-icon / plan-spinner" },
  { key: "body", name: "plan-item-body / -label / -status / -detail" },
];

const items = (t: ReturnType<typeof usePageT>): PlanItem[] => [
  { id: "1", label: t("usage.read"), status: "done" },
  { id: "2", label: t("usage.design"), status: "done", detail: t("usage.designDetail") },
  { id: "3", label: t("usage.parser"), status: "active", detail: t("usage.parserDetail") },
  { id: "4", label: t("usage.tests"), status: "pending" },
  { id: "5", label: t("usage.docs"), status: "skipped", detail: t("usage.docsDetail") },
];

const STAGES: PlanItem["status"][][] = [
  ["active", "pending", "pending", "pending"],
  ["done", "active", "pending", "pending"],
  ["done", "done", "active", "pending"],
  ["done", "done", "done", "active"],
  ["done", "done", "done", "done"],
];
const STEPS = ["search", "read", "draft", "review"];

function RunningDemo() {
  const t = usePageT();
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (stage >= STAGES.length - 1) return;
    const id = setTimeout(() => setStage((s) => s + 1), 1500);
    return () => clearTimeout(id);
  }, [stage]);
  return (
    <div style={{ width: 460, maxWidth: "100%" }}>
      <Plan
        title={t("running.planTitle")}
        items={STEPS.map((step, i) => ({
          id: String(i),
          label: t(`running.${step}`),
          status: STAGES[stage]![i]!,
        }))}
      />
      <p style={{ marginTop: 12 }}>
        <button type="button" onClick={() => setStage(0)}>
          {t("running.replay")}
        </button>
      </p>
    </div>
  );
}

export default function PlanPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Plan</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Plan } from "@skeinui/ui";

<Plan
  items={[
    { id: "1", label: "Read the code", status: "done" },
    { id: "2", label: "Write the parser", status: "active", detail: "Handling tables" },
    { id: "3", label: "Add tests", status: "pending" },
  ]}
/>`}
      >
        <div style={{ width: 460, maxWidth: "100%" }}>
          <Plan title={t("usage.planTitle")} items={items(t)} />
        </div>
      </Example>

      <Example id="running" code={`<Plan title="Answering your question" items={items} />`}>
        <RunningDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Plan" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
