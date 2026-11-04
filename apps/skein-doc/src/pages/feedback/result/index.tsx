import { Button, Result } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "result" },
  { key: "icon", name: "result-icon / result-code" },
  { key: "text", name: "result-title / result-description" },
  { key: "extra", name: "result-extra / result-content" },
];

export default function ResultPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Result</h1>
      <Lead />
      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Result, Button } from "@skeinui/ui";

<Result
  status="success"
  title="Saved"
  description="Your changes are live."
  extra={<Button color="primary">Back to list</Button>}
/>`}
      >
        <Result
          status="success"
          title="Saved"
          description="Your changes are live."
          extra={<Button color="primary">Back to list</Button>}
        />
      </Example>

      <Example
        id="statuses"
        code={`<Result status="error" … /> // success / error / info / warning`}
      >
        <div className="pg-grid-2">
          <Result
            status="error"
            title="Submission failed"
            description="Check the form and try again."
          />
          <Result status="info" title="Heads up" description="The import runs in the background." />
          <Result status="warning" title="Almost there" description="One step is still missing." />
          <Result status="success" title="Verified" />
        </div>
      </Example>

      <Example
        id="pages"
        code={`<Result status="404" title="Page not found" extra={<Button>Back home</Button>} />`}
      >
        <div className="pg-grid-2">
          <Result
            status="404"
            title="Page not found"
            description="The page you are looking for does not exist."
            extra={<Button color="primary">Back home</Button>}
          />
          <Result
            status="403"
            title="No access"
            description="You do not have permission to view this page."
            extra={<Button variant="outline">Request access</Button>}
          />
          <Result status="500" title="Something went wrong" description="Please try again later." />
        </div>
      </Example>

      <Example id="content" code={`<Result status="error" title="…">{details}</Result>`}>
        <Result
          status="error"
          title="3 rows failed to import"
          description="Fix the rows below and upload again."
          extra={<Button color="primary">Upload again</Button>}
        >
          <ul className="pg-plain-list">
            <li>Row 4: email is invalid</li>
            <li>Row 9: user already exists</li>
            <li>Row 12: role not found</li>
          </ul>
        </Result>
      </Example>

      <Example id="icon" code={`<Result icon={<SmileIcon />} title="…" />`}>
        <Result icon={<span className="pg-emoji-icon">🎉</span>} title="You are all caught up" />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Result" />
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
