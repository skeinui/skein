import { Flex, Paragraph, Text, Title, Typography } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "text", name: "title / paragraph / text", type: "slot" },
  { key: "parts", name: "text-content / text-copy / text-expand", type: "slot" },
  { key: "container", name: "typography", type: "slot" },
];

export default function TypographyPage() {
  const t = usePageT();
  const long = t("ellipsis.long");
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Typography</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="title"
        code={`import { Title } from "@skeinui/ui";

<Title level={1}>h1</Title> … <Title level={5}>h5</Title>`}
      >
        <Flex direction="column" gap="sm">
          {([1, 2, 3, 4, 5] as const).map((level) => (
            <Title key={level} level={level}>
              {t("title.heading", { level })}
            </Title>
          ))}
        </Flex>
      </Example>

      <Example
        id="text"
        code={`<Text strong>Bold</Text> <Text italic>Italic</Text> <Text code>code</Text> <Text mark>mark</Text>`}
      >
        <Flex wrap gap="md" align="baseline">
          <Text>{t("text.default")}</Text>
          <Text strong>{t("text.bold")}</Text>
          <Text italic>{t("text.italic")}</Text>
          <Text underline>{t("text.underline")}</Text>
          <Text strikethrough>{t("text.strikethrough")}</Text>
          <Text code>code</Text>
          <Text mark>mark</Text>
          <Text strong italic underline>
            {t("text.combined")}
          </Text>
        </Flex>
      </Example>

      <Example id="tones" code={`<Text tone="danger">Danger</Text>`}>
        <Flex wrap gap="md" align="baseline">
          {(
            ["default", "secondary", "primary", "success", "warning", "danger", "disabled"] as const
          ).map((tone) => (
            <Text key={tone} tone={tone}>
              {tone}
            </Text>
          ))}
        </Flex>
      </Example>

      <Example
        id="ellipsis"
        code={`<Text ellipsis>…</Text>
<Paragraph ellipsis={{ rows: 2, expandable: true }}>…</Paragraph>`}
      >
        <Flex direction="column" gap="md">
          <div className="pg-narrow">
            <Text ellipsis>{long}</Text>
          </div>
          <Paragraph ellipsis={{ rows: 2 }}>{long}</Paragraph>
          <Paragraph ellipsis={{ rows: 2, expandable: true }}>{long}</Paragraph>
          <Paragraph ellipsis={{ rows: 3, expandable: true }}>{t("ellipsis.short")}</Paragraph>
        </Flex>
      </Example>

      <Example
        id="copy"
        code={`<Text copyable>copy me</Text>
<Text copyable={{ text: "sk-live-…", onCopy: () => toast("Copied") }}>sk-live-••••</Text>`}
      >
        <Flex direction="column" gap="sm">
          <Text copyable>{t("copy.sentence")}</Text>
          <Text code copyable={{ text: "sk-live-1234567890abcdef" }}>
            sk-live-••••••••••
          </Text>
          <Title level={4} copyable>
            {t("copy.heading")}
          </Title>
        </Flex>
      </Example>

      <Example
        id="prose"
        code={`<Typography><h2>…</h2><p>…</p><ul>…</ul><blockquote>…</blockquote></Typography>`}
      >
        <Typography>
          <h2>{t("prose.heading")}</h2>
          <p>
            {t.rich("prose.p1")}
            <a href="#prose">{t("prose.link")}</a>
            {t.rich("prose.p2")}
          </p>
          <ul>
            <li>{t("prose.li1")}</li>
            <li>{t("prose.li2")}</li>
            <li>{t("prose.li3")}</li>
          </ul>
          <blockquote>{t("prose.quote")}</blockquote>
          <h3>{t("prose.tokens")}</h3>
          <table>
            <thead>
              <tr>
                <th>{t("prose.name")}</th>
                <th>{t("prose.usedFor")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>--ui-radius</code>
                </td>
                <td>{t("prose.radius")}</td>
              </tr>
              <tr>
                <td>
                  <code>--ui-ring</code>
                </td>
                <td>{t("prose.ring")}</td>
              </tr>
            </tbody>
          </table>
          <pre>
            <code>{`<Button color="primary">Save</Button>`}</code>
          </pre>
        </Typography>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>Title</h4>
        <ApiReference component="Title" />
        <h4>Text</h4>
        <ApiReference component="Text" />
        <h4>Paragraph</h4>
        <ApiReference component="Paragraph" />
        <h4>Typography</h4>
        <ApiReference component="Typography" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
