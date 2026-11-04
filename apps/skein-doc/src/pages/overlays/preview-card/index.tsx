import { PreviewCard } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "slots", name: "popover-positioner / popover", type: "slot" },
  { key: "preview", name: "data-preview", type: "state" },
];

export default function PreviewCardPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Preview Card</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { PreviewCard } from "@skeinui/ui";

<PreviewCard>
  <PreviewCard.Trigger href="/docs">Base UI</PreviewCard.Trigger>
  <PreviewCard.Content>Unstyled, accessible components.</PreviewCard.Content>
</PreviewCard>`}
      >
        <p className="pg-desc">
          {t("usage.before")}
          <PreviewCard>
            <PreviewCard.Trigger href="#">{t("usage.link")}</PreviewCard.Trigger>
            <PreviewCard.Content>
              <PreviewCard.Title>Documentation</PreviewCard.Title>
              <PreviewCard.Description>Guides, examples and API reference.</PreviewCard.Description>
            </PreviewCard.Content>
          </PreviewCard>
          {t("usage.after")}
        </p>
      </Example>

      <Example id="placement" code={`<PreviewCard.Content side="right">…</PreviewCard.Content>`}>
        <div className="pg-flex pg-flex--loose">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <PreviewCard key={side}>
              <PreviewCard.Trigger href="#">{side}</PreviewCard.Trigger>
              <PreviewCard.Content side={side}>Preview on the {side}.</PreviewCard.Content>
            </PreviewCard>
          ))}
        </div>
      </Example>

      <Example id="delay" code={`<PreviewCard.Trigger delay={0} closeDelay={0} … />`}>
        <PreviewCard>
          <PreviewCard.Trigger href="#" delay={0} closeDelay={0}>
            instant
          </PreviewCard.Trigger>
          <PreviewCard.Content>No delay.</PreviewCard.Content>
        </PreviewCard>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="PreviewCard" />
        <h4>PreviewCard.Trigger</h4>
        <ApiReference component="PreviewCard.Trigger" />
        <h4>PreviewCard.Content</h4>
        <ApiReference component="PreviewCard.Content" />
        <p className="pg-desc">{t.rich("api.parts")}</p>
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
