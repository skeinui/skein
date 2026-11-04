import { Quote, QuoteSelection } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "quote", name: "quote" },
  { key: "text", name: "quote-source / quote-text" },
  { key: "remove", name: "quote-remove" },
  { key: "selection", name: "quote-selection" },
  { key: "action", name: "quote-selection-action" },
];

function Demo() {
  const t = usePageT();
  const [quote, setQuote] = useState<string | null>(null);
  return (
    <div style={{ width: 520, maxWidth: "100%" }}>
      <QuoteSelection onQuote={setQuote}>
        <p style={{ margin: 0 }}>{t("usage.text")}</p>
      </QuoteSelection>
      <p style={{ margin: "12px 0 8px" }}>{t("usage.hint")}</p>
      {quote ? (
        <Quote source="Assistant" onRemove={() => setQuote(null)}>
          {quote}
        </Quote>
      ) : (
        <p style={{ margin: 0, opacity: 0.6 }}>{t("usage.empty")}</p>
      )}
    </div>
  );
}

export default function QuotePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Quote</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Quote, QuoteSelection } from "@skeinui/ui";

<QuoteSelection onQuote={setQuote}>
  <Markdown>{reply}</Markdown>
</QuoteSelection>

{quote ? <Quote source="Assistant" onRemove={() => setQuote(null)}>{quote}</Quote> : null}`}
      >
        <Demo />
      </Example>

      <Example id="quote" code={`<Quote source="You">{text}</Quote>`}>
        <div style={{ width: 520, maxWidth: "100%" }}>
          <Quote source="Assistant">{t("quote.text")}</Quote>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>Quote</h4>
        <ApiReference component="Quote" />
        <h4>QuoteSelection</h4>
        <ApiReference component="QuoteSelection" />
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
