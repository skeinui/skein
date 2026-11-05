import { Code, GuideSection, Lead, P } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

export default function InstallationGuide() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">{t("title")}</h1>
      <Lead />

      <GuideSection id="new-project">
        <P k="new-project.p1" />
        <Code
          language="bash"
          code={`npm create skein my-app
npm create skein my-admin -- --template admin --theme antd`}
        />
        <P k="new-project.p2" />
      </GuideSection>

      <GuideSection id="existing">
        <P k="existing.p1" />
        <Code language="bash" code="npm install @skeinui/ui @skeinui/themes" />
        <P k="existing.p2" />
        <Code
          code={`import "@skeinui/themes/default/index.css";
import { Button, ConfigProvider } from "@skeinui/ui";

export function App() {
  return (
    <ConfigProvider themeStyle="default" mode="system">
      <Button variant="soft" color="danger">
        Delete
      </Button>
    </ConfigProvider>
  );
}`}
        />
      </GuideSection>

      <GuideSection id="vite">
        <P k="vite.p1" />
        <Code
          code={`// vite.config.ts
import { skeinThemes } from "@skeinui/themes/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), skeinThemes()],
});`}
        />
        <P k="vite.p2" />
      </GuideSection>

      <GuideSection id="provider">
        <P k="provider.p1" />
        <P k="provider.p2" />
      </GuideSection>

      <GuideSection id="language">
        <P k="language.p1" />
        <Code
          code={`import { zhCN } from "@skeinui/ui/locales/zh-CN";

<ConfigProvider themeStyle="default" {...zhCN}>
  <App />
</ConfigProvider>`}
        />
      </GuideSection>

      <GuideSection id="next">
        <P k="next.p1" />
      </GuideSection>
    </article>
  );
}
