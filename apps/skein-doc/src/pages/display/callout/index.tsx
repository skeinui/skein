import { CALLOUT_VARIANTS, COLORS, Callout, Flex, Text } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "slot", name: "data-slot", type: "callout" },
  { key: "variants", name: "data-variant / data-color / data-size / data-radius" },
];

export default function CalloutPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Callout</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example id="usage" code={`<Callout>Anything: text, a heading and a list, a form.</Callout>`}>
        <Callout>{t("usage.content")}</Callout>
      </Example>

      <Example
        id="variants"
        code={`<Callout variant="outline">…</Callout>
<Callout variant="soft" color="primary">…</Callout>
<Callout variant="dashed" color="warning">…</Callout>`}
      >
        <Flex direction="column" gap="sm">
          {CALLOUT_VARIANTS.map((v) => (
            <Callout key={v} variant={v} color="primary">
              {v}
            </Callout>
          ))}
        </Flex>
      </Example>

      <Example id="colors" code={`<Callout variant="soft" color="success">…</Callout>`}>
        <Flex direction="column" gap="sm">
          {COLORS.map((c) => (
            <Callout key={c} variant="soft" color={c} size="sm">
              {c}
            </Callout>
          ))}
        </Flex>
      </Example>

      <Example
        id="conversation"
        code={`<Callout>…the customer…</Callout>
<Callout variant="soft" color="primary">…the agent…</Callout>
<Callout variant="dashed" color="warning">…an internal note…</Callout>`}
      >
        <Flex direction="column" gap="sm">
          <Callout>
            <Flex direction="column" gap="xs">
              <Text strong>{t("conversation.customer")}</Text>
              <Text>{t("conversation.customerText")}</Text>
            </Flex>
          </Callout>
          <Callout variant="soft" color="primary">
            <Flex direction="column" gap="xs">
              <Text strong>{t("conversation.agent")}</Text>
              <Text>{t("conversation.agentText")}</Text>
            </Flex>
          </Callout>
          <Callout variant="dashed" color="warning">
            <Flex direction="column" gap="xs">
              <Text strong>{t("conversation.note")}</Text>
              <Text>{t("conversation.noteText")}</Text>
            </Flex>
          </Callout>
        </Flex>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Callout" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type ?? t("styling.sameAsProps"),
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
