import { Button, Popover } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "positioner", name: "popover-positioner", type: "slot" },
  { key: "popup", name: "popover", type: "slot" },
  { key: "arrow", name: "popover-arrow", type: "slot" },
  { key: "text", name: "popover-title / popover-description", type: "slot" },
  { key: "close", name: "popover-close", type: "slot" },
];

const PARTS = ["Trigger", "Content", "Title", "Description", "Close"];

export default function PopoverPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Popover</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Button, Popover } from "@skeinui/ui";

<Popover>
  <Popover.Trigger render={<Button variant="outline" />}>Open popover</Popover.Trigger>
  <Popover.Content>
    <Popover.Title>Notifications</Popover.Title>
    <Popover.Description>You are all caught up.</Popover.Description>
  </Popover.Content>
</Popover>`}
      >
        <Popover>
          <Popover.Trigger render={<Button variant="outline" />}>Open popover</Popover.Trigger>
          <Popover.Content>
            <Popover.Title>Notifications</Popover.Title>
            <Popover.Description>You are all caught up.</Popover.Description>
          </Popover.Content>
        </Popover>
      </Example>

      <DocHeading id="examples" />

      <Example
        id="placement"
        code={`<Popover.Content side="right" align="start">…</Popover.Content>`}
      >
        <div className="pg-flex pg-flex--loose">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <Popover key={side}>
              <Popover.Trigger render={<Button variant="outline" />}>{side}</Popover.Trigger>
              <Popover.Content side={side}>
                <Popover.Description>Placed on the {side}.</Popover.Description>
              </Popover.Content>
            </Popover>
          ))}
        </div>
      </Example>

      <Example id="arrow" code={`<Popover.Content arrow>…</Popover.Content>`}>
        <Popover>
          <Popover.Trigger render={<Button variant="outline" />}>With arrow</Popover.Trigger>
          <Popover.Content arrow>
            <Popover.Title>Arrow</Popover.Title>
            <Popover.Description>Points at the trigger.</Popover.Description>
          </Popover.Content>
        </Popover>
      </Example>

      <Example
        id="close"
        code={`<Popover.Close render={<Button size="sm" />}>Got it</Popover.Close>`}
      >
        <Popover>
          <Popover.Trigger render={<Button variant="outline" />}>Open</Popover.Trigger>
          <Popover.Content>
            <Popover.Title>Update available</Popover.Title>
            <Popover.Description>Restart to apply the latest version.</Popover.Description>
            <div style={{ marginTop: 12 }}>
              <Popover.Close render={<Button size="sm" />}>Got it</Popover.Close>
            </div>
          </Popover.Content>
        </Popover>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Popover" />
        {PARTS.map((part) => (
          <div key={part}>
            <h4>Popover.{part}</h4>
            <ApiReference component={`Popover.${part}`} />
          </div>
        ))}
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({ ...h, description: t.rich(`styling.${h.key}`) }))}
        />
      </section>
    </article>
  );
}
