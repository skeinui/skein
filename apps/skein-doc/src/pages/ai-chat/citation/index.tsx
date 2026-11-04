import { Citation, Citations } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "citation", name: "citation" },
  { key: "icon", name: "citation-icon / citation-favicon / citation-fallback" },
  { key: "title", name: "citation-title" },
  { key: "preview", name: "citation-preview / -head / -host" },
  { key: "marker", name: "citation-marker" },
  { key: "citations", name: "citations" },
  { key: "trigger", name: "citations-trigger / citations-icon" },
  { key: "panel", name: "citations-panel / citations-list" },
];

const FAV = (host: string) => `https://www.google.com/s2/favicons?domain=${host}&sz=64`;

export default function CitationPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Citation</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Citation } from "@skeinui/ui";

<Citation href="https://base-ui.com" title="Base UI" faviconUrl="…" />`}
      >
        <div className="pg-flex pg-flex--center">
          <Citation href="https://base-ui.com" title="Base UI" faviconUrl={FAV("base-ui.com")} />
          <Citation href="https://react.dev/reference/react" faviconUrl={FAV("react.dev")} />
          <Citation href="https://example.org/no-icon" title={t("usage.noIcon")} />
        </div>
      </Example>

      <Example
        id="preview"
        code={`<Citation
  href="https://base-ui.com"
  title="Base UI"
  description="Unstyled, accessible React components."
/>`}
      >
        <Citation
          href="https://base-ui.com"
          title="Base UI"
          faviconUrl={FAV("base-ui.com")}
          description="Unstyled, accessible React components that give you full control over styling."
        />
      </Example>

      <Example
        id="document"
        code={`<Citation sourceType="document" title="report.pdf" onClick={openPreview} />`}
      >
        <div className="pg-flex pg-flex--center">
          <Citation sourceType="document" title="report.pdf" onClick={() => {}} />
          <Citation sourceType="document" title="notes.md" />
        </div>
      </Example>

      <Example
        id="group"
        code={`<Citations label="3 sources">
  <Citation … />
</Citations>`}
      >
        <Citations label={t("group.label")}>
          <Citation href="https://base-ui.com" title="Base UI" faviconUrl={FAV("base-ui.com")} />
          <Citation href="https://react.dev" title="React" faviconUrl={FAV("react.dev")} />
          <Citation sourceType="document" title="report.pdf" />
        </Citations>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Citation" />
        <h4>CitationMarker</h4>
        <p className="pg-desc">{t.rich("api.marker")}</p>
        <ApiReference component="CitationMarker" />
        <h4>Citations</h4>
        <p className="pg-desc">{t.rich("api.citations")}</p>
        <ApiReference component="Citations" />
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
