import { ToolCall, ToolCallGroup } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "tool-call" },
  { key: "trigger", name: "tool-call-trigger" },
  { key: "status", name: "tool-call-status / tool-call-spinner" },
  { key: "name", name: "tool-call-name / tool-call-state" },
  { key: "icon", name: "tool-call-icon" },
  { key: "panel", name: "tool-call-panel / tool-call-content / tool-call-section" },
  { key: "error", name: "tool-call-error / tool-call-error-label" },
  { key: "actions", name: "tool-call-actions" },
  { key: "groupHooks", name: "tool-call-group / -trigger / -panel / -content" },
];

function ApprovalDemo() {
  const t = usePageT();
  const [decision, setDecision] = useState<"pending" | "approved" | "rejected">("pending");
  return (
    <div style={{ width: 520, maxWidth: "100%" }}>
      <ToolCall
        key={decision}
        toolName="deleteFile"
        state={
          decision === "pending"
            ? "requires-action"
            : decision === "approved"
              ? "output-available"
              : "output-error"
        }
        input={{ path: "/tmp/report.pdf" }}
        output={decision === "approved" ? { deleted: true } : undefined}
        errorText={decision === "rejected" ? t("approval.rejected") : undefined}
        onApprove={() => setDecision("approved")}
        onReject={() => setDecision("rejected")}
      />
      {decision !== "pending" ? (
        <p style={{ marginTop: 12 }}>
          <button type="button" onClick={() => setDecision("pending")}>
            {t("approval.reset")}
          </button>
        </p>
      ) : null}
    </div>
  );
}

export default function ToolCallPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Tool Call</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ToolCall } from "@skeinui/ui";

<ToolCall
  toolName="searchDocs"
  state="output-available"
  triggerPrefix="Used tool: "
  input={{ query: "Base UI" }}
  output={{ matches: 3 }}
/>`}
      >
        <div style={{ width: 520, maxWidth: "100%" }}>
          <ToolCall
            toolName="searchDocs"
            state="output-available"
            triggerPrefix={t("usage.prefix")}
            input={{ query: "Base UI" }}
            output={{ matches: 3 }}
            defaultOpen
          />
        </div>
      </Example>

      <Example
        id="states"
        code={`<ToolCall toolName="t" state="input-streaming" argsText='{"q": "Bas' />
<ToolCall toolName="t" state="input-available" input={{ q: "Base UI" }} />
<ToolCall toolName="t" state="output-available" output="ok" />
<ToolCall toolName="t" state="output-error" errorText="Rate limited" />`}
      >
        <div className="pg-stack" style={{ width: 520, maxWidth: "100%" }}>
          <ToolCall toolName="searchDocs" state="input-streaming" argsText={'{"query": "Bas'} />
          <ToolCall toolName="searchDocs" state="input-available" input={{ query: "Base UI" }} />
          <ToolCall toolName="searchDocs" state="output-available" output={t("states.results")} />
          <ToolCall
            toolName="searchDocs"
            state="output-error"
            errorText={t("states.rateLimited")}
          />
        </div>
      </Example>

      <Example
        id="approval"
        code={`<ToolCall
  toolName="deleteFile"
  state="requires-action"
  input={{ path: "/tmp/report.pdf" }}
  onApprove={approve}
  onReject={reject}
/>`}
      >
        <ApprovalDemo />
      </Example>

      <Example
        id="group"
        code={`<ToolCallGroup label="3 tool calls">
  <ToolCall … />
  <ToolCall … />
</ToolCallGroup>`}
      >
        <div style={{ width: 520, maxWidth: "100%" }}>
          <ToolCallGroup label={t("group.label")} defaultOpen>
            <ToolCall toolName="searchDocs" state="output-available" output={{ matches: 3 }} />
            <ToolCall toolName="readFile" state="output-available" output="…" />
            <ToolCall toolName="runTests" state="input-available" input={{ filter: "ui" }} />
          </ToolCallGroup>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>ToolCall</h4>
        <ApiReference component="ToolCall" />
        <h4>ToolCallGroup</h4>
        <ApiReference component="ToolCallGroup" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
