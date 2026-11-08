import { Code, GuideSection, GuideTable, Lead, P } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

export default function ExamplesGuide() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">{t("title")}</h1>
      <Lead />

      {/* One section per app of site/examples.ts: its id and the key of its messages */}
      <GuideSection id="admin">
        <P k="admin.p1" />
        <P k="admin.p2" />

        <h3 className="pg-doc-h3">{t("admin.shows.title")}</h3>
        <GuideTable
          head={["admin.shows.part", "admin.shows.how"]}
          rows={[
            ["admin.shows.shell", "admin.shows.shellHow"],
            ["admin.shows.tenants", "admin.shows.tenantsHow"],
            ["admin.shows.access", "admin.shows.accessHow"],
            ["admin.shows.lists", "admin.shows.listsHow"],
            ["admin.shows.login", "admin.shows.loginHow"],
          ]}
        />

        <h3 className="pg-doc-h3">{t("admin.run.title")}</h3>
        <Code
          language="bash"
          code={`git clone https://github.com/skeinui/skein-admin.git
cd skein-admin
pnpm install
pnpm dev`}
        />
        <P k="admin.run.p1" />

        <h3 className="pg-doc-h3">{t("admin.built.title")}</h3>
        <P k="admin.built.p1" />
        <Code
          language="bash"
          code={`npm create skein skein-admin -- --template admin --theme heroui --preview --tenant`}
        />
        <P k="admin.built.p2" />
      </GuideSection>

      <GuideSection id="mail">
        <P k="mail.p1" />
        <P k="mail.p2" />

        <h3 className="pg-doc-h3">{t("mail.shows.title")}</h3>
        <GuideTable
          head={["mail.shows.part", "mail.shows.how"]}
          rows={[
            ["mail.shows.menu", "mail.shows.menuHow"],
            ["mail.shows.list", "mail.shows.listHow"],
            ["mail.shows.compose", "mail.shows.composeHow"],
            ["mail.shows.query", "mail.shows.queryHow"],
            ["mail.shows.themes", "mail.shows.themesHow"],
          ]}
        />

        <h3 className="pg-doc-h3">{t("mail.run.title")}</h3>
        <Code
          language="bash"
          code={`git clone https://github.com/skeinui/skein-mail.git
cd skein-mail
pnpm install
pnpm dev`}
        />
        <P k="mail.run.p1" />

        <h3 className="pg-doc-h3">{t("mail.built.title")}</h3>
        <P k="mail.built.p1" />
        <Code
          language="bash"
          code={`npm create skein skein-mail -- --template admin --theme heroui --no-tenant`}
        />
        <P k="mail.built.p2" />
      </GuideSection>
    </article>
  );
}
