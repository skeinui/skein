import { Markdown } from "@skeinui/ui";
import { useEffect, useMemo, useState } from "react";
import "katex/dist/katex.min.css";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "markdown" },
  { key: "inlineCode", name: "markdown-inline-code" },
  { key: "link", name: "markdown-link" },
  { key: "math", name: "markdown-math" },
  { key: "image", name: "markdown-image" },
  { key: "task", name: "markdown-task" },
  { key: "caret", name: "markdown-caret" },
  { key: "tableWrap", name: "markdown-table-wrap" },
];

function StreamingDemo() {
  const t = usePageT();
  const source = t("streaming.sample");
  const [length, setLength] = useState(0);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLength((n) => {
        if (n >= source.length) {
          setRunning(false);
          return n;
        }
        return n + 3;
      });
    }, 40);
    return () => clearInterval(id);
  }, [running, source]);
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <Markdown streaming={running}>{source.slice(0, length)}</Markdown>
      <p style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => {
            setLength(0);
            setRunning(true);
          }}
        >
          {t("streaming.replay")}
        </button>
      </p>
    </div>
  );
}

/** KaTeX is loaded on demand (dynamic import), showing the raw text until loading finishes. */
function Katex({ tex, display }: { tex: string; display: boolean }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void import("katex").then((m) => {
      if (!active) return;
      setHtml(
        m.default.renderToString(tex, {
          displayMode: display,
          throwOnError: false,
          trust: false,
          output: "htmlAndMathml",
        }),
      );
    });
    return () => {
      active = false;
    };
  }, [tex, display]);
  return html === null ? <code>{tex}</code> : <span dangerouslySetInnerHTML={{ __html: html }} />;
}

const renderMath = (tex: string, { display }: { display: boolean }) => (
  <Katex tex={tex} display={display} />
);

export default function MarkdownPage() {
  const t = usePageT();
  const baseUi = t("citations.baseUi");
  // Markdown redraws every block when `citations` changes: keep it stable across renders
  const citations = useMemo(
    () => [
      { href: "https://base-ui.com", title: "Base UI", description: baseUi },
      { href: "https://react.dev", title: "React" },
    ],
    [baseUi],
  );
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Markdown</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Markdown } from "@skeinui/ui";

<Markdown>{response}</Markdown>`}
      >
        <div style={{ width: 560, maxWidth: "100%" }}>
          <Markdown>{t("usage.sample")}</Markdown>
        </div>
      </Example>

      <Example id="lists" code={`<Markdown>{"- [x] done\\n- [ ] todo"}</Markdown>`}>
        <div style={{ width: 560, maxWidth: "100%" }}>
          <Markdown>{t("lists.sample")}</Markdown>
        </div>
      </Example>

      <Example id="table" code={`<Markdown>{table}</Markdown>`}>
        <div style={{ width: 560, maxWidth: "100%" }}>
          <Markdown>{t("table.sample")}</Markdown>
        </div>
      </Example>

      <Example id="streaming" code={`<Markdown>{partialResponse}</Markdown>`}>
        <StreamingDemo />
      </Example>

      <Example
        id="citations"
        code={`<Markdown citations={[{ href: "https://base-ui.com", title: "Base UI" }]}>
  {"Unstyled components[1]."}
</Markdown>`}
      >
        <div style={{ width: 560, maxWidth: "100%" }}>
          <Markdown citations={citations}>{t("citations.sample")}</Markdown>
        </div>
      </Example>

      <Example
        id="math"
        code={`import katex from "katex";
import "katex/dist/katex.min.css";

const math = (tex, { display }) => (
  <span
    dangerouslySetInnerHTML={{
      __html: katex.renderToString(tex, { displayMode: display, throwOnError: false, trust: false }),
    }}
  />
);

<Markdown math={math}>{text}</Markdown>`}
      >
        <div style={{ width: 560, maxWidth: "100%" }}>
          <Markdown math={renderMath}>{t("math.sample")}</Markdown>
        </div>
      </Example>

      <Example id="safety" code={`<Markdown>{untrusted}</Markdown>`}>
        <div style={{ width: 560, maxWidth: "100%" }}>
          <Markdown breaks>{t("safety.sample")}</Markdown>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Markdown" />
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
