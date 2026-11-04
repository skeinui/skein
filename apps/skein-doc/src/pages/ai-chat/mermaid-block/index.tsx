import { Markdown, MermaidBlock } from "@skeinui/ui";
import type { MermaidTheme } from "@skeinui/ui";
import { useEffect, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "mermaid" },
  { key: "header", name: "mermaid-header / mermaid-title / mermaid-actions" },
  { key: "action", name: "mermaid-action" },
  { key: "body", name: "mermaid-body / mermaid-image" },
  { key: "status", name: "mermaid-status" },
  { key: "error", name: "mermaid-error" },
  { key: "source", name: "mermaid-source" },
];

// mermaid is only loaded when used, and rendering is queued (it has global state internally)
let loading: Promise<typeof import("mermaid").default> | null = null;
let queue: Promise<unknown> = Promise.resolve();
let seq = 0;

function render(code: string, { theme }: { theme: MermaidTheme }): Promise<string> {
  const run = async () => {
    loading ??= import("mermaid").then((m) => m.default);
    const mermaid = await loading;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: theme === "dark" ? "dark" : "default",
      flowchart: { htmlLabels: false },
    });
    // First only do a syntax check: on failure throw directly and put nothing into the page (when render fails Mermaid leaves a "Syntax error" diagram at the end of body)
    await mermaid.parse(code);
    const id = `mermaid-${seq++}`;
    try {
      const { svg } = await mermaid.render(id, code);
      return svg;
    } finally {
      document.getElementById(`d${id}`)?.remove();
    }
  };
  const result = queue.then(run, run);
  queue = result.catch(() => {});
  return result;
}

const FLOW = `graph TD
  A[User message] --> B{Needs a tool?}
  B -- yes --> C[Call tool]
  B -- no --> D[Answer]
  C --> D`;

const SEQUENCE = `sequenceDiagram
  participant U as User
  participant A as Assistant
  U->>A: Validate this form
  A->>A: Plan
  A-->>U: Code and tests`;

const BROKEN = `graph TD
  A[Start --> ???`;

const ANSWER = `Here is the flow:

\`\`\`mermaid
${FLOW}
\`\`\`

Each step is a node.`;

const renderers = {
  mermaid: ({ code }: { code: string }) => <MermaidBlock code={code} render={render} />,
};

function StreamingDemo() {
  const t = usePageT();
  const [n, setN] = useState(0);
  const running = n < ANSWER.length;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setN((v) => Math.min(v + 6, ANSWER.length)), 60);
    return () => clearTimeout(id);
  }, [n, running]);
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <Markdown codeRenderers={renderers} streaming={running}>
        {ANSWER.slice(0, n)}
      </Markdown>
      <p style={{ marginTop: 12 }}>
        <button type="button" onClick={() => setN(0)}>
          {t("markdown.replay")}
        </button>
      </p>
    </div>
  );
}

const wrap = { width: 560, maxWidth: "100%" } as const;

export default function MermaidBlockPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">MermaidBlock</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { MermaidBlock } from "@skeinui/ui";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, securityLevel: "strict", flowchart: { htmlLabels: false } });

const render = async (code, { theme }) => {
  mermaid.initialize({ theme: theme === "dark" ? "dark" : "default" });
  return (await mermaid.render(id, code)).svg;
};

<MermaidBlock code={source} render={render} />`}
      >
        <div className="pg-stack" style={wrap}>
          <MermaidBlock code={FLOW} render={render} labels={{ diagram: t("usage.flowchart") }} />
          <MermaidBlock code={SEQUENCE} render={render} labels={{ diagram: t("usage.sequence") }} />
        </div>
      </Example>

      <Example id="error" code={`<MermaidBlock code={brokenSource} render={render} />`}>
        <div style={wrap}>
          <MermaidBlock code={BROKEN} render={render} labels={{ diagram: t("error.broken") }} />
        </div>
      </Example>

      <Example
        id="markdown"
        code={`const renderers = {
  mermaid: ({ code }) => <MermaidBlock code={code} render={render} />,
};

<Markdown codeRenderers={renderers} streaming={streaming}>{text}</Markdown>`}
      >
        <StreamingDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="MermaidBlock" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
