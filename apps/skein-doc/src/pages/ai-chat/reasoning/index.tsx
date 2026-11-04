import { Reasoning } from "@skeinui/ui";
import { useEffect, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "reasoning" },
  { key: "trigger", name: "reasoning-trigger" },
  { key: "icon", name: "reasoning-icon" },
  { key: "panel", name: "reasoning-panel / reasoning-content" },
  { key: "steps", name: "reasoning-steps" },
  { key: "step", name: "reasoning-step" },
  { key: "stepParts", name: "reasoning-step-label / reasoning-step-content" },
];

/** The streaming demo's steps: `streaming.<key>` and `streaming.<key>Text`. */
const STEPS = ["understand", "explore", "plan", "write"];

function StreamingDemo() {
  const t = usePageT();
  const [shown, setShown] = useState(1);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= STEPS.length) {
          setRunning(false);
          return n;
        }
        return n + 1;
      });
    }, 1200);
    return () => clearInterval(id);
  }, [running]);
  return (
    <div style={{ width: 480, maxWidth: "100%" }}>
      <Reasoning streaming={running} defaultOpen>
        <Reasoning.Trigger>
          {running ? t("streaming.thinking") : t("streaming.done")}
        </Reasoning.Trigger>
        <Reasoning.Content>
          <Reasoning.Steps>
            {STEPS.slice(0, shown).map((step, i) => (
              <Reasoning.Step
                key={step}
                label={t(`streaming.${step}`)}
                status={running && i === shown - 1 ? "active" : "done"}
              >
                {t(`streaming.${step}Text`)}
              </Reasoning.Step>
            ))}
          </Reasoning.Steps>
        </Reasoning.Content>
      </Reasoning>
      <p style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => {
            setShown(1);
            setRunning(true);
          }}
        >
          {t("streaming.replay")}
        </button>
      </p>
    </div>
  );
}

export default function ReasoningPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Reasoning</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Reasoning } from "@skeinui/ui";

<Reasoning defaultOpen>
  <Reasoning.Trigger>Thought for 2s</Reasoning.Trigger>
  <Reasoning.Content>
    <Reasoning.Steps>
      <Reasoning.Step label="Explore">Read layout and globals.</Reasoning.Step>
    </Reasoning.Steps>
  </Reasoning.Content>
</Reasoning>`}
      >
        <div style={{ width: 480, maxWidth: "100%" }}>
          <Reasoning defaultOpen>
            <Reasoning.Trigger>{t("usage.trigger")}</Reasoning.Trigger>
            <Reasoning.Content>
              <Reasoning.Steps>
                <Reasoning.Step label={t("usage.explore")}>{t("usage.exploreText")}</Reasoning.Step>
                <Reasoning.Step label={t("usage.plan")}>{t("usage.planText")}</Reasoning.Step>
              </Reasoning.Steps>
            </Reasoning.Content>
          </Reasoning>
        </div>
      </Example>

      <Example
        id="streaming"
        code={`<Reasoning streaming={isStreaming}>
  <Reasoning.Trigger>{isStreaming ? "Thinking…" : "Thought for 5s"}</Reasoning.Trigger>
  <Reasoning.Content>
    <Reasoning.Steps>
      {steps.map((s, i) => (
        <Reasoning.Step key={s.label} label={s.label} status={i === last && isStreaming ? "active" : "done"}>
          {s.text}
        </Reasoning.Step>
      ))}
    </Reasoning.Steps>
  </Reasoning.Content>
</Reasoning>`}
      >
        <StreamingDemo />
      </Example>

      <Example
        id="status"
        code={`<Reasoning.Step status="done">…</Reasoning.Step>
<Reasoning.Step status="active">…</Reasoning.Step>
<Reasoning.Step status="pending">…</Reasoning.Step>`}
      >
        <div style={{ width: 480, maxWidth: "100%" }}>
          <Reasoning defaultOpen>
            <Reasoning.Trigger>{t("status.trigger")}</Reasoning.Trigger>
            <Reasoning.Content>
              <Reasoning.Steps>
                <Reasoning.Step status="done" label={t("status.search")}>
                  {t("status.searchText")}
                </Reasoning.Step>
                <Reasoning.Step status="active" label={t("status.summarize")}>
                  {t("status.summarizeText")}
                </Reasoning.Step>
                <Reasoning.Step status="pending" label={t("status.answer")}>
                  {t("status.answerText")}
                </Reasoning.Step>
              </Reasoning.Steps>
            </Reasoning.Content>
          </Reasoning>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>Reasoning</h4>
        <p className="pg-desc">{t.rich("api.root")}</p>
        <ApiReference component="Reasoning" />
        <h4>Reasoning.Trigger</h4>
        <p className="pg-desc">{t.rich("api.trigger")}</p>
        <ApiReference component="Reasoning.Trigger" />
        <h4>Reasoning.Content</h4>
        <p className="pg-desc">{t.rich("api.content")}</p>
        <ApiReference component="Reasoning.Content" />
        <h4>Reasoning.Steps</h4>
        <p className="pg-desc">{t.rich("api.steps")}</p>
        <h4>Reasoning.Step</h4>
        <p className="pg-desc">{t.rich("api.step")}</p>
        <ApiReference component="Reasoning.Step" />
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
