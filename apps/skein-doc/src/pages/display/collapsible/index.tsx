import { useState } from "react";
import { Button, Collapsible, Text } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "collapsible" },
  { key: "trigger", name: "collapsible-trigger / collapsible-icon" },
  { key: "panel", name: "collapsible-panel / collapsible-content" },
];

function Controlled() {
  const t = usePageT();
  const [open, setOpen] = useState(false);
  return (
    <div className="pg-stack pg-stack--start">
      <Collapsible open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger>{t("controlled.trigger")}</Collapsible.Trigger>
        <Collapsible.Panel>
          <Text tone="secondary">{t("controlled.text")}</Text>
        </Collapsible.Panel>
      </Collapsible>
      <Button variant="outline" onClick={() => setOpen((o) => !o)}>
        {t(open ? "controlled.close" : "controlled.open")}
      </Button>
    </div>
  );
}

export default function CollapsiblePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Collapsible</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Collapsible } from "@skeinui/ui";

<Collapsible>
  <Collapsible.Trigger>Show more</Collapsible.Trigger>
  <Collapsible.Panel>Hidden content…</Collapsible.Panel>
</Collapsible>`}
      >
        <Collapsible>
          <Collapsible.Trigger>{t("usage.trigger")}</Collapsible.Trigger>
          <Collapsible.Panel>
            <Text tone="secondary">{t("usage.text")}</Text>
          </Collapsible.Panel>
        </Collapsible>
      </Example>

      <Example
        id="controlled"
        code={`<Collapsible open={open} onOpenChange={setOpen}>…</Collapsible>`}
      >
        <Controlled />
      </Example>

      <Example
        id="no-icon"
        code={`<Collapsible.Trigger icon={false} render={<Button variant="outline" />}>Details</Collapsible.Trigger>`}
      >
        <Collapsible>
          <Collapsible.Trigger icon={false} render={<Button variant="outline" />}>
            {t("no-icon.trigger")}
          </Collapsible.Trigger>
          <Collapsible.Panel>
            <Text tone="secondary">{t("no-icon.text")}</Text>
          </Collapsible.Panel>
        </Collapsible>
      </Example>

      <Example id="disabled" code={`<Collapsible disabled>…</Collapsible>`}>
        <Collapsible disabled>
          <Collapsible.Trigger>{t("disabled.trigger")}</Collapsible.Trigger>
          <Collapsible.Panel>{t("disabled.text")}</Collapsible.Panel>
        </Collapsible>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Collapsible" />
        <h4>Collapsible.Trigger</h4>
        <ApiReference component="Collapsible.Trigger" />
        <h4>Collapsible.Panel</h4>
        <ApiReference component="Collapsible.Panel" />
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
