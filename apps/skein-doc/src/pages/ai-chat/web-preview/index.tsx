import { WebPreview } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "web-preview" },
  { key: "toolbar", name: "web-preview-toolbar" },
  { key: "action", name: "web-preview-action" },
  { key: "url", name: "web-preview-url" },
  { key: "error", name: "web-preview-error" },
  { key: "viewport", name: "web-preview-viewport" },
  { key: "frame", name: "web-preview-frame / web-preview-loading" },
];

/** The demo page for `html`, in the page's language. */
const demoHtml = (t: (key: string) => string) =>
  `<!doctype html><html><body style="font-family:system-ui;margin:0;padding:24px;background:#f5f7ff">
<h2 style="margin:0 0 8px">${t("html.heading")}</h2>
<p>${t("html.text")}</p>
<button onclick="this.textContent='${t("html.clicked")} ' + (++window.n||(window.n=1))">${t("html.button")}</button>
</body></html>`;

const wrap = { width: 720, maxWidth: "100%" } as const;

export default function WebPreviewPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">WebPreview</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { WebPreview } from "@skeinui/ui";

<WebPreview src="https://example.com" title="Example" height={300} />`}
      >
        <div style={wrap}>
          <WebPreview src="https://example.com" title={t("usage.frame")} height={300} />
        </div>
      </Example>

      <Example
        id="html"
        code={`<WebPreview html={generatedHtml} title="Generated page" height={220} />`}
      >
        <div style={wrap}>
          <WebPreview html={demoHtml(t)} title={t("html.frame")} height={220} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="WebPreview" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
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
