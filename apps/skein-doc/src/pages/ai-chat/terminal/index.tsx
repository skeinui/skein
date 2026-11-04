import { Terminal } from "@skeinui/ui";
import { useEffect, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "terminal", name: "terminal" },
  { key: "header", name: "terminal-header / -title" },
  { key: "status", name: "terminal-status" },
  { key: "copy", name: "terminal-copy" },
  { key: "output", name: "terminal-output" },
  { key: "line", name: "terminal-line / terminal-prompt" },
  { key: "text", name: "terminal-text" },
];

const E = "\u001b";
const RESULT = [
  `${E}[1m> skeinui@0.0.0 test${E}[0m`,
  `${E}[32m ✓ ${E}[0mtests/markdown.test.tsx ${E}[2m(29 tests)${E}[0m`,
  `${E}[32m ✓ ${E}[0mtests/terminal.test.tsx ${E}[2m(15 tests)${E}[0m`,
  `${E}[33m ⚠ ${E}[0m1 skipped`,
  "",
  `${E}[1m Test Files ${E}[0m ${E}[32m2 passed${E}[0m (2)`,
  `${E}[1m      Tests ${E}[0m ${E}[32m44 passed${E}[0m (44)`,
].join("\n");

const FAILED = [
  `${E}[31m ✗ ${E}[0mtests/parser.test.tsx`,
  `${E}[31m   AssertionError:${E}[0m expected ${E}[32m"2026-10-23"${E}[0m, received ${E}[31m"2026-10-32"${E}[0m`,
  `${E}[2m   at tests/parser.test.tsx:12:5${E}[0m`,
].join("\n");

const STREAM = [
  "Installing dependencies…",
  `${E}[36mresolve${E}[0m react@19.2.0`,
  `${E}[36mresolve${E}[0m @base-ui/react@1.2.0`,
  "Downloading  10%",
  "Downloading  60%",
  "Downloading 100%",
  `${E}[32mdone${E}[0m in 2.4s`,
];

function StreamingDemo() {
  const t = usePageT();
  const [n, setN] = useState(0);
  const running = n < STREAM.length;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setN((v) => v + 1), 700);
    return () => clearTimeout(id);
  }, [n, running]);
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <Terminal
        title="pnpm install"
        command="pnpm install"
        status={running ? "running" : "done"}
        exitCode={0}
        output={STREAM.slice(0, n).join("\n")}
      />
      <p style={{ marginTop: 12 }}>
        <button type="button" onClick={() => setN(0)}>
          {t("streaming.replay")}
        </button>
      </p>
    </div>
  );
}

export default function TerminalPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Terminal</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Terminal } from "@skeinui/ui";

<Terminal command="pnpm test" status="done" exitCode={0} output={output} />`}
      >
        <div style={{ width: 560, maxWidth: "100%" }}>
          <Terminal
            title="pnpm test"
            command="pnpm test"
            status="done"
            exitCode={0}
            output={RESULT}
          />
        </div>
      </Example>

      <Example
        id="streaming"
        code={`<Terminal status={running ? "running" : "done"} output={partialOutput} />`}
      >
        <StreamingDemo />
      </Example>

      <Example id="failed" code={`<Terminal status="error" exitCode={1} output={output} />`}>
        <div style={{ width: 560, maxWidth: "100%" }}>
          <Terminal
            title="pnpm test"
            command="pnpm test parser"
            status="error"
            exitCode={1}
            output={FAILED}
          />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Terminal" />
        <p className="pg-desc">{t("api.helpers")}</p>
        <PropsTable
          first={t("api.function")}
          rows={[
            {
              name: "parseAnsi(text) / stripAnsi(text)",
              type: "function",
              description: t.rich("api.ansi"),
            },
          ]}
        />
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
