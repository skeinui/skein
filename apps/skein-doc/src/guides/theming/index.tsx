import { Code, GuideSection, GuideTable, Lead, P } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

export default function ThemingGuide() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">{t("title")}</h1>
      <Lead />

      <GuideSection id="styles">
        <P k="styles.p1" />
        <GuideTable
          head={["styles.name", "styles.look"]}
          rows={[
            ["`default`", "styles.default"],
            ["`shadcn`", "styles.shadcn"],
            ["`heroui`", "styles.heroui"],
            ["`antd`", "styles.antd"],
          ]}
        />
        <P k="styles.p2" />
        <Code
          code={`import "@skeinui/themes/antd/index.css";
import "@skeinui/themes/heroui/index.css";

<ConfigProvider themeStyle={userChoice}>…</ConfigProvider>`}
        />
      </GuideSection>

      <GuideSection id="mode">
        <P k="mode.p1" />
      </GuideSection>

      <GuideSection id="colors">
        <P k="colors.p1" />
        <Code
          code={`import "@skeinui/themes/color/purple.css";
import "@skeinui/themes/density/compact.css";

<ConfigProvider themeStyle="shadcn" themeColor="purple" themeDensity="compact">…</ConfigProvider>`}
        />
        <P k="colors.p2" />
      </GuideSection>

      <GuideSection id="overrides">
        <P k="overrides.p1" />
        <Code
          code={`<ConfigProvider
  themeStyle="default"
  themeOverrides={{
    colors: { primary: "#0f766e" },
    dark: { primary: "#2dd4bf" },
    radius: 0.375,
    density: 0.9,
  }}
>
  …
</ConfigProvider>`}
        />
      </GuideSection>

      <GuideSection id="own-style">
        <P k="own-style.p1" />
        <Code
          language="bash"
          code={`npx skein theme init --name acme --from shadcn --use
npx skein theme check`}
        />
        <P k="own-style.p2" />
      </GuideSection>

      <GuideSection id="how">
        <P k="how.p1" />
        <Code
          language="css"
          code={`[data-theme-style="acme"] [data-slot="button"][data-variant="solid"] {
  background: var(--ui-c-primary);
  color: var(--ui-c-primary-fg);
}`}
        />
        <P k="how.p2" />
      </GuideSection>
    </article>
  );
}
