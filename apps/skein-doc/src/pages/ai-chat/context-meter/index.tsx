import { Composer, ContextMeter } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "context-meter" },
  { key: "ring", name: "context-meter-ring / -track / -value / -percent" },
  { key: "popup", name: "context-meter-popup / -heading / -total" },
  { key: "bar", name: "context-meter-bar / -segment" },
  { key: "list", name: "context-meter-list / -item / -swatch / -item-label / -item-value" },
];

export default function ContextMeterPage() {
  const t = usePageT();
  const segments = [
    { id: "sys", label: t("usage.system"), tokens: 4200 },
    { id: "msg", label: t("usage.messages"), tokens: 38500 },
    { id: "tool", label: t("usage.tools"), tokens: 14900 },
  ];
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Context Meter</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ContextMeter } from "@skeinui/ui";

<ContextMeter used={57600} max={128000} segments={[{ id: "msg", label: "Messages", tokens: 38500 }]} />`}
      >
        <ContextMeter used={57600} max={128000} segments={segments} side="bottom" />
      </Example>

      <Example
        id="levels"
        code={`<ContextMeter used={20} max={100} />   // ok
<ContextMeter used={75} max={100} />   // warn
<ContextMeter used={95} max={100} />   // danger`}
      >
        <div className="pg-flex pg-flex--center">
          <ContextMeter used={20000} max={100000} side="bottom" />
          <ContextMeter used={75000} max={100000} side="bottom" />
          <ContextMeter used={95000} max={100000} side="bottom" />
        </div>
      </Example>

      <Example
        id="composer"
        code={`<Composer.ToolbarEnd>
  <ContextMeter used={used} max={max} segments={segments} />
  <Composer.Send />
</Composer.ToolbarEnd>`}
      >
        <div style={{ width: 560, maxWidth: "100%" }}>
          <Composer onSubmit={() => {}}>
            <Composer.Shell>
              <Composer.TextArea placeholder={t("composer.placeholder")} />
              <Composer.Toolbar>
                <Composer.ToolbarStart />
                <Composer.ToolbarEnd>
                  <ContextMeter used={57600} max={128000} segments={segments} />
                  <Composer.Send />
                </Composer.ToolbarEnd>
              </Composer.Toolbar>
            </Composer.Shell>
          </Composer>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ContextMeter" />
        <p className="pg-desc">{t.rich("api.formatTokens")}</p>
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "data-slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
