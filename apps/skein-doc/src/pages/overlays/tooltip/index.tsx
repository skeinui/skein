import { Button, Tooltip } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";
import { PlusIcon } from "@/doc/icons.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "positioner", name: "tooltip-positioner", type: "slot" },
  { key: "popup", name: "tooltip", type: "slot" },
  { key: "arrow", name: "tooltip-arrow", type: "slot" },
  { key: "states", name: "data-starting-style / data-ending-style", type: "state" },
];

export default function TooltipPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Tooltip</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Button, Tooltip } from "@skeinui/ui";

<Tooltip content="Add a new item">
  <Button variant="outline">Hover me</Button>
</Tooltip>`}
      >
        <Tooltip content="Add a new item">
          <Button variant="outline">Hover me</Button>
        </Tooltip>
      </Example>

      <DocHeading id="examples" />

      <Example
        id="placement"
        code={`<Tooltip content="Top" side="top">…</Tooltip>
<Tooltip content="Right" side="right">…</Tooltip>
<Tooltip content="Bottom" side="bottom">…</Tooltip>
<Tooltip content="Left" side="left">…</Tooltip>`}
      >
        <div className="pg-flex pg-flex--loose">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <Tooltip key={side} content={side} side={side}>
              <Button variant="outline">{side}</Button>
            </Tooltip>
          ))}
        </div>
      </Example>

      <Example
        id="arrow"
        code={`<Tooltip content="With arrow" arrow>
  <Button variant="outline">Hover me</Button>
</Tooltip>`}
      >
        <Tooltip content="With arrow" arrow>
          <Button variant="outline">Hover me</Button>
        </Tooltip>
      </Example>

      <Example
        id="delay"
        code={`<Tooltip content="Instant" delay={0}>…</Tooltip>
<Tooltip content="After one second" delay={1000}>…</Tooltip>`}
      >
        <div className="pg-flex pg-flex--loose">
          <Tooltip content="Instant" delay={0}>
            <Button variant="outline">No delay</Button>
          </Tooltip>
          <Tooltip content="After one second" delay={1000}>
            <Button variant="outline">1s delay</Button>
          </Tooltip>
        </div>
      </Example>

      <Example
        id="icon-button"
        code={`<Tooltip content="Create">
  <Button iconOnly aria-label="Create"><PlusIcon /></Button>
</Tooltip>`}
      >
        <Tooltip content="Create" arrow>
          <Button iconOnly aria-label="Create">
            <PlusIcon />
          </Button>
        </Tooltip>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Tooltip" />
        <h4>Tooltip.Provider</h4>
        <ApiReference component="Tooltip.Provider" />
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
