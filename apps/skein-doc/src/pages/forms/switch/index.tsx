import { Switch } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  {
    key: "slot",
    name: "data-slot",
    type: "switch | switch-control | switch-thumb | switch-content | switch-label | switch-description",
  },
  { key: "size", name: "data-size", type: "sm | md | lg" },
  {
    key: "states",
    name: "data-checked / data-unchecked / data-disabled / data-invalid",
    type: "boolean attribute",
  },
];

function ControlledDemo() {
  const t = usePageT();
  const [on, setOn] = useState(true);
  return (
    <div className="pg-stack pg-stack--start">
      <Switch checked={on} onCheckedChange={setOn}>
        {t("controlled.airplane")}
      </Switch>
      <p className="pg-desc">
        {t("controlled.selected")} <code>{String(on)}</code>
      </p>
    </div>
  );
}

export default function SwitchPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Switch</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Switch } from "@skeinui/ui";

<Switch>Enable notifications</Switch>`}
      >
        <Switch>{t("usage.notifications")}</Switch>
      </Example>

      <DocHeading id="examples" />

      <Example id="default-selected" code={`<Switch defaultChecked>Enable notifications</Switch>`}>
        <Switch defaultChecked>{t("usage.notifications")}</Switch>
      </Example>

      <Example
        id="sizes"
        code={`<Switch size="sm" defaultChecked>Small</Switch>
<Switch size="md" defaultChecked>Medium</Switch>
<Switch size="lg" defaultChecked>Large</Switch>`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Switch size="sm" defaultChecked>
            Small
          </Switch>
          <Switch size="md" defaultChecked>
            Medium
          </Switch>
          <Switch size="lg" defaultChecked>
            Large
          </Switch>
        </div>
      </Example>

      <Example
        id="disabled"
        code={`<Switch disabled>Disabled off</Switch>
<Switch disabled defaultChecked>Disabled on</Switch>`}
      >
        <div className="pg-flex pg-flex--loose">
          <Switch disabled>{t("disabled.off")}</Switch>
          <Switch disabled defaultChecked>
            {t("disabled.on")}
          </Switch>
        </div>
      </Example>

      <Example
        id="with-description"
        code={`<Switch defaultChecked description="Receive alerts when someone mentions you.">
  Enable notifications
</Switch>`}
      >
        <Switch defaultChecked description={t("with-description.sample")}>
          {t("usage.notifications")}
        </Switch>
      </Example>

      <Example
        id="controlled"
        code={`const [on, setOn] = useState(true);

<Switch checked={on} onCheckedChange={setOn}>Airplane mode</Switch>`}
      >
        <ControlledDemo />
      </Example>

      <Example id="without-label" code={`<Switch aria-label="Toggle theme" />`}>
        <div className="pg-flex pg-flex--center">
          <Switch aria-label="Toggle theme" />
          <Switch aria-label="Toggle theme on" defaultChecked />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Switch" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
