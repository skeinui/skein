import { Button, Flex, Text, Title } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "flex", name: "flex", type: "slot" },
  { key: "spacer", name: "flex-spacer", type: "slot" },
];

const Box = ({ children, tall }: { children?: React.ReactNode; tall?: boolean }) => (
  <div className="pg-box" data-tall={tall ? "" : undefined}>
    {children}
  </div>
);

export default function FlexPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Flex</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { Flex } from "@skeinui/ui";

<Flex gap="sm"><Button>One</Button><Button>{t("basic.two")}</Button></Flex>
<Flex direction="column" gap="xs"><Text>A</Text><Text>B</Text></Flex> // Stack`}
      >
        <div className="pg-stack pg-stack--start">
          <Flex gap="sm">
            <Button>{t("basic.one")}</Button>
            <Button variant="outline">{t("basic.two")}</Button>
            <Button variant="ghost">{t("basic.three")}</Button>
          </Flex>
          <Flex direction="column" gap="xs">
            <Text>{t("basic.stacked", { n: "A" })}</Text>
            <Text tone="secondary">{t("basic.stacked", { n: "B" })}</Text>
            <Text tone="secondary">{t("basic.stacked", { n: "C" })}</Text>
          </Flex>
        </div>
      </Example>

      <Example id="gap" code={`<Flex gap="lg">…</Flex> // none xs sm md lg xl`}>
        <div className="pg-stack pg-stack--start">
          {(["none", "xs", "sm", "md", "lg", "xl"] as const).map((gap) => (
            <Flex key={gap} gap={gap} align="center">
              <Text tone="secondary">{gap}</Text>
              <Box>A</Box>
              <Box>B</Box>
              <Box>C</Box>
            </Flex>
          ))}
        </div>
      </Example>

      <Example id="align" code={`<Flex align="center" justify="between">…</Flex>`}>
        <div className="pg-stack">
          {(["start", "center", "end", "between", "around", "evenly"] as const).map((justify) => (
            <Flex key={justify} justify={justify} align="center">
              <Box tall>{justify}</Box>
              <Box>B</Box>
              <Box>C</Box>
            </Flex>
          ))}
        </div>
      </Example>

      <Example
        id="toolbar"
        code={`<Flex align="center"><Title level={4}>Users</Title><Flex.Spacer /><Button>New</Button></Flex>`}
      >
        <div className="pg-stack">
          <Flex align="center">
            <Title level={4}>{t("toolbar.users")}</Title>
            <Flex.Spacer />
            <Button variant="outline">{t("toolbar.export")}</Button>
            <Button color="primary">{t("toolbar.newUser")}</Button>
          </Flex>
          <Flex wrap gap="sm">
            {Array.from({ length: 16 }, (_, i) => (
              <Box key={i}>{t("toolbar.tag", { n: i + 1 })}</Box>
            ))}
          </Flex>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Flex" />
        <p className="pg-desc">{t.rich("api.spacer")}</p>
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
