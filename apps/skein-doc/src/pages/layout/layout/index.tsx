import { Container, Layout } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the components write; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "layout", name: "layout" },
  { key: "parts", name: "layout-header / layout-content / layout-footer" },
  { key: "container", name: "container" },
];

const Body = ({ children }: { children?: React.ReactNode }) => (
  <div className="pg-shell-body">{children}</div>
);

export default function LayoutPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Layout</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { Layout } from "@skeinui/ui";

<Layout>
  <Layout.Header>Header</Layout.Header>
  <Layout.Content>Content</Layout.Content>
  <Layout.Footer>Footer</Layout.Footer>
</Layout>`}
      >
        <div className="pg-shell">
          <Layout>
            <Layout.Header>Header</Layout.Header>
            <Layout.Content>
              <Body>Content</Body>
            </Layout.Content>
            <Layout.Footer>Footer</Layout.Footer>
          </Layout>
        </div>
      </Example>

      <Example
        id="nested"
        code={`<Layout>
  <Layout.Header>Header</Layout.Header>
  <Layout>
    <Layout.Content>Content</Layout.Content>
    <Layout.Footer>Footer</Layout.Footer>
  </Layout>
</Layout>`}
      >
        <div className="pg-shell" data-short="">
          <Layout>
            <Layout.Header>Header</Layout.Header>
            <Layout>
              <Layout.Content>
                <Body>Content</Body>
              </Layout.Content>
              <Layout.Footer>Footer</Layout.Footer>
            </Layout>
          </Layout>
        </div>
      </Example>

      <Example id="container" code={`<Container size="sm">…</Container> // sm md lg xl full`}>
        <div className="pg-stack">
          {(["sm", "md", "lg", "xl", "full"] as const).map((size) => (
            <Container key={size} size={size} padded={false}>
              <div className="pg-box">size {size}</div>
            </Container>
          ))}
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <PropsTable
          first={t("api.part")}
          rows={[
            {
              name: "Layout.Header / Content / Footer",
              type: "—",
              description: t.rich("api.parts"),
            },
          ]}
        />
        <ApiReference component="Container" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
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
