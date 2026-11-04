import { Code, GuideSection, GuideTable, Lead, P } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

export default function AiGuide() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">{t("title")}</h1>
      <Lead />

      <GuideSection id="why">
        <P k="why.p1" />
        <P k="why.p2" />
      </GuideSection>

      <GuideSection id="project">
        <P k="project.p1" />
        <GuideTable
          head={["project.file", "project.for"]}
          rows={[
            ["`AGENTS.md`", "project.agents"],
            ["`CLAUDE.md`", "project.claude"],
            ["`.claude/skills/skein-ui`", "project.skillUi"],
            ["`.claude/skills/skein-page`", "project.skillPage"],
            ["`.claude/skills/skein-theme`", "project.skillTheme"],
          ]}
        />
      </GuideSection>

      <GuideSection id="loop">
        <P k="loop.p1" />
        <Code
          language="bash"
          code={`npx skein docs DataTable           # look it up instead of guessing
npx skein docs --search "date range"
npx skein check --json             # what is wrong, with hints
npx skein preview /orders --json   # does the page actually work`}
        />
        <P k="loop.p2" />
      </GuideSection>

      <GuideSection id="mcp">
        <P k="mcp.p1" />
        <Code
          language="bash"
          code={`npm create skein my-app -- --template admin --mcp --preview`}
        />
        <P k="mcp.p2" />
        <Code
          language="json"
          code={`{
  "mcpServers": {
    "skein": { "command": "npx", "args": ["skein", "mcp"] }
  }
}`}
        />
      </GuideSection>

      <GuideSection id="llms">
        <P k="llms.p1" />
      </GuideSection>
    </article>
  );
}
