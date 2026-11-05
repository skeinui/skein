import { Code, GuideSection, GuideTable, Lead, P } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

export default function CliGuide() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">{t("title")}</h1>
      <Lead />

      <GuideSection id="run">
        <P k="run.p1" />
        <Code
          language="bash"
          code={`npm create skein my-app        # create a project
npx skein <command>            # in a project: @skeinui/cli is one of its devDependencies
npx skeinui <command>          # the same commands, anywhere`}
        />
      </GuideSection>

      <GuideSection id="create">
        <Code
          language="bash"
          code={`skein create [dir]
  [--template basic|admin]
  [--theme default|shadcn|heroui|antd|none]
  [--<feature>] [--no-<feature>]`}
        />
        <P k="create.p1" />
        <GuideTable
          head={["create.template", "create.gives"]}
          rows={[
            ["`basic`", "create.basic"],
            ["`admin`", "create.admin"],
          ]}
        />
        <GuideTable
          head={["create.feature", "create.adds"]}
          rows={[
            ["`router`", "create.router"],
            ["`query`", "create.query"],
            ["`i18n`", "create.i18n"],
            ["`mock`", "create.mock"],
            ["`auth`", "create.auth"],
            ["`shell`", "create.shell"],
            ["`mcp`", "create.mcp"],
            ["`preview`", "create.preview"],
            ["`tenant`", "create.tenant"],
          ]}
        />
        <P k="create.p2" />
      </GuideSection>

      <GuideSection id="layout">
        <P k="layout.p1" />
        <Code
          language="text"
          code={`src/
  routes/          thin route files pointing at pages/ (_auth/ = signed in)
  pages/<name>/    index.tsx, _meta.ts (menu), api/, components/, locales/, mocks/
  modules/<name>/  parts that aren't pages (user menu, preferences…)
  skein-shell/     AdminLayout wired to the router
  settings.ts      app name, home path, theme styles, layout, footer`}
        />
        <P k="layout.p2" />
      </GuideSection>

      <GuideSection id="pages">
        <Code
          language="bash"
          code={`skein new page orders                       # route, menu entry, API file, translations, mock
skein new page system/roles                 # nested: system/ becomes a menu group
skein new page orders --from openapi.yaml   # a working CRUD page for one OpenAPI resource
skein new module order-panel                # src/modules/order-panel/`}
        />
        <P k="pages.p1" />
      </GuideSection>

      <GuideSection id="theme-commands">
        <Code
          language="bash"
          code={`skein theme use heroui                     # the app's theme style
skein theme add antd heroui                # admin: more styles users can pick
skein theme remove antd
skein theme init --name acme --from antd   # a theme style of your own in src/theme/
skein theme check                          # does it cover every component`}
        />
        <P k="theme-commands.p1" />
      </GuideSection>

      <GuideSection id="tools">
        <GuideTable
          head={["tools.command", "tools.does"]}
          rows={[
            ["`skein docs [Component]`", "tools.docs"],
            ["`skein check`", "tools.check"],
            ["`skein preview <route>`", "tools.preview"],
            ["`skein list`", "tools.list"],
            ["`skein init`", "tools.init"],
            ["`skein mcp`", "tools.mcp"],
          ]}
        />
      </GuideSection>

      <GuideSection id="options">
        <P k="options.p1" />
      </GuideSection>
    </article>
  );
}
