import { COLORS, Link } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [{ key: "link", name: "link", type: "slot" }];

export default function LinkPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Link</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Link } from "@skeinui/ui";

<Link href="/docs">Read the docs</Link>`}
      >
        <Link href="#usage">Read the docs</Link>
      </Example>

      <Example id="variants" code={`<Link variant="subtle" href="#">Subtle</Link>`}>
        <div className="pg-flex pg-flex--loose">
          <Link href="#variants">default</Link>
          <Link href="#variants" variant="subtle">
            subtle
          </Link>
        </div>
      </Example>

      <Example id="colors" code={`<Link color="success" href="#">Success</Link>`}>
        <div className="pg-flex pg-flex--loose">
          {COLORS.map((c) => (
            <Link key={c} href="#colors" color={c}>
              {c}
            </Link>
          ))}
        </div>
      </Example>

      <Example id="external" code={`<Link external href="https://base-ui.com">Base UI</Link>`}>
        <Link external href="https://base-ui.com">
          Base UI
        </Link>
      </Example>

      <Example id="disabled" code={`<Link disabled href="#">Disabled</Link>`}>
        <Link disabled href="#">
          Disabled
        </Link>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Link" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({ ...h, description: t.rich(`styling.${h.key}`) }))}
        />
      </section>
    </article>
  );
}
