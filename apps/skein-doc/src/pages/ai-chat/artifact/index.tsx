import { Artifact, ArtifactCard, CodeBlock, Markdown } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The parts; their descriptions are the page's `api.<key>` messages. */
const PARTS = [
  { key: "root", name: "Artifact", type: "section" },
  { key: "header", name: "Artifact.Header", type: "div" },
  { key: "titlePart", name: "Artifact.Title", type: "h2" },
  { key: "meta", name: "Artifact.Meta", type: "span" },
  { key: "views", name: "Artifact.Views", type: "Segmented" },
  { key: "actions", name: "Artifact.Actions", type: "div" },
  { key: "action", name: "Artifact.Action / Artifact.Close", type: "Button" },
  { key: "body", name: "Artifact.Body", type: "div" },
];

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "artifact" },
  { key: "header", name: "artifact-header / -title / -meta / -actions" },
  { key: "body", name: "artifact-body" },
  { key: "card", name: "artifact-card / -icon / -text / -title / -meta" },
];

const DOC = `# Quarterly report

Revenue grew **12%** this quarter.

- Product: steady
- Services: up`;

const CopyIcon = (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

function PanelDemo() {
  const t = usePageT();
  const [view, setView] = useState("preview");
  return (
    <div style={{ width: 560, maxWidth: "100%", height: 320 }}>
      <Artifact>
        <Artifact.Header>
          <Artifact.Title>report.md</Artifact.Title>
          <Artifact.Meta>Document · v2</Artifact.Meta>
          <Artifact.Views
            value={view}
            onValueChange={setView}
            options={[
              { value: "preview", label: t("usage.preview") },
              { value: "code", label: t("usage.code") },
            ]}
          />
          <Artifact.Actions>
            <Artifact.Action aria-label={t("usage.copy")}>{CopyIcon}</Artifact.Action>
            <Artifact.Close />
          </Artifact.Actions>
        </Artifact.Header>
        <Artifact.Body aria-label={t("usage.content")}>
          {view === "preview" ? (
            <div style={{ padding: 16 }}>
              <Markdown>{DOC}</Markdown>
            </div>
          ) : (
            <CodeBlock code={DOC} language="markdown" title="report.md" />
          )}
        </Artifact.Body>
      </Artifact>
    </div>
  );
}

function CardDemo() {
  const t = usePageT();
  const [open, setOpen] = useState<string | null>("a");
  return (
    <div className="pg-stack pg-stack--start">
      <ArtifactCard
        title="greet.ts"
        meta="Code · v1"
        selected={open === "a"}
        onOpen={() => setOpen("a")}
      />
      <ArtifactCard
        title="report.md"
        meta="Document · v2"
        selected={open === "b"}
        onOpen={() => setOpen("b")}
      />
      <p>{t("card.open", { id: open ?? "-" })}</p>
    </div>
  );
}

export default function ArtifactPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Artifact</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Artifact } from "@skeinui/ui";

<Artifact>
  <Artifact.Header>
    <Artifact.Title>report.md</Artifact.Title>
    <Artifact.Meta>Document · v2</Artifact.Meta>
    <Artifact.Views value={view} onValueChange={setView} options={[…]} />
    <Artifact.Actions>
      <Artifact.Action aria-label="Copy">…</Artifact.Action>
      <Artifact.Close onClick={close} />
    </Artifact.Actions>
  </Artifact.Header>
  <Artifact.Body>…</Artifact.Body>
</Artifact>`}
      >
        <PanelDemo />
      </Example>

      <Example
        id="card"
        code={`<ArtifactCard title="greet.ts" meta="Code · v1" selected={open === id} onOpen={() => setOpen(id)} />`}
      >
        <CardDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <p className="pg-desc">{t.rich("api.description")}</p>
        <PropsTable
          first={t("api.part")}
          rows={PARTS.map((p) => ({
            name: p.name,
            type: p.type,
            description: t.rich(`api.${p.key}`),
          }))}
        />
        <h4>Artifact.Views</h4>
        <ApiReference component="Artifact.Views" />
        <h4>Artifact.Action</h4>
        <ApiReference component="Artifact.Action" />
        <h4>Artifact.Close</h4>
        <ApiReference component="Artifact.Close" />
        <h4>Artifact.Body</h4>
        <ApiReference component="Artifact.Body" />
        <h4>ArtifactCard</h4>
        <p className="pg-desc">{t.rich("api.card")}</p>
        <ApiReference component="ArtifactCard" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "data-slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
