import type { CSSProperties } from "react";
import { Button, Flex, Form, LoginLayout, Text } from "@skeinui/ui";
import type { LoginLayoutProps } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "login-layout", type: "root" },
  { key: "cover", name: "login-layout-cover / cover-brand / cover-body", type: "aside" },
  { key: "glow", name: "login-layout-glow", type: "div" },
  { key: "backdrop", name: "login-layout-backdrop / backdrop-image", type: "div / img" },
  { key: "main", name: "login-layout-main / toolbar / panel / card", type: "div" },
  { key: "head", name: "login-layout-head / brand / title / description", type: "header" },
  { key: "providers", name: "login-layout-providers / divider / provider-list", type: "div" },
  { key: "footer", name: "login-layout-footer", type: "div" },
];

/** The page is as tall as the viewport; in the docs it sits in a box. */
const BOX: CSSProperties & Record<string, string> = {
  "--ui-login-min-height": "32rem",
  overflow: "hidden",
  border: "1px solid var(--ui-border)",
  borderRadius: "0.75rem",
};

function Demo(props: Partial<LoginLayoutProps>) {
  const t = usePageT();
  return (
    <div style={BOX}>
      <LoginLayout
        brand={<strong>Acme</strong>}
        title={t("demo.title")}
        description={t("demo.description")}
        footer={<Text tone="secondary">{t("demo.footer")}</Text>}
        {...props}
      >
        <Form
          fields={[
            { name: "email", type: "email", label: t("demo.email"), required: true },
            { name: "password", type: "password", label: t("demo.password"), required: true },
          ]}
          submitLabel={t("demo.submit")}
          onSubmit={() => undefined}
        />
      </LoginLayout>
    </div>
  );
}

export default function LoginLayoutPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Login Layout</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="centered"
        code={`<LoginLayout brand={<Logo />} title="Sign in" description="Welcome back" footer={…}>
  <Form fields={[…]} onSubmit={…} />
</LoginLayout>`}
      >
        <Demo />
      </Example>

      <Example
        id="split"
        code={`<LoginLayout
  variant="split"
  coverTitle="Out of the box"
  coverDescription="Ready to use"
  … /> // or cover={<MyCover />}`}
      >
        <Demo
          variant="split"
          coverTitle={t("demo.coverTitle")}
          coverDescription={t("demo.coverText")}
        />
      </Example>

      <Example id="cover" code={`<LoginLayout variant="cover" backgroundImage="/bg.jpg" … />`}>
        <Demo variant="cover" />
      </Example>

      <Example
        id="providers"
        code={`<LoginLayout
  providers={[{ id: "github", label: "GitHub", icon: <GithubIcon /> }]}
  providersLabel="Or continue with"
  onProvider={(id) => signInWith(id)}
  toolbar={<LanguageSwitch />}
  …
/>`}
      >
        <Demo
          providers={[
            { id: "github", label: "GitHub" },
            { id: "google", label: "Google" },
          ]}
          providersLabel={t("demo.providers")}
          toolbar={
            <Flex gap="xs">
              <Button variant="ghost" color="neutral" size="sm">
                {t("demo.language")}
              </Button>
            </Flex>
          }
        />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="LoginLayout" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`styling.${h.key}`),
          }))}
        />
        <p className="pg-desc">{t.rich("styling.height")}</p>
      </section>
    </article>
  );
}
