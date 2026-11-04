import { CODE_THEMES, CodeBlock } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "code-block", type: "data-slot" },
  { key: "header", name: "code-block-header", type: "data-slot" },
  { key: "language", name: "code-block-language", type: "data-slot" },
  { key: "copy", name: "code-block-copy", type: "data-slot" },
  { key: "status", name: "code-block-status", type: "data-slot" },
  { key: "pre", name: "code-block-pre", type: "data-slot" },
  { key: "code", name: "code-block-code / code-block-line", type: "data-slot" },
  { key: "token", name: "data-token", type: "attribute" },
];

const TS = `import { useState } from "react";

// A tiny counter
export function Counter({ step = 1 }: { step?: number }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + step)}>{count}</button>;
}`;

const JSON_CODE = `{
  "name": "@skeinui/ui",
  "version": "0.0.0",
  "private": true,
  "tags": ["react", "base-ui"],
  "size": 42
}`;

const PY = `def greet(name: str) -> str:
    """Return a greeting."""
    # build the message
    return f"Hello, {name}!"

print(greet("world"))`;

const SH = `# install and run
pnpm install
export PORT=5175
echo "Listening on $PORT"`;

const LONG = `const message = "This is a very long line that would normally need horizontal scrolling but wraps when wrap is on, so nothing is hidden.";`;

export default function CodeBlockPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Code Block</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { CodeBlock } from "@skeinui/ui";

<CodeBlock language="ts" code={code} />`}
      >
        <div style={{ width: 560, maxWidth: "100%" }}>
          <CodeBlock language="tsx" code={TS} />
        </div>
      </Example>

      <Example
        id="languages"
        code={`<CodeBlock language="json" code={json} />
<CodeBlock language="python" code={py} />
<CodeBlock language="bash" code={sh} />`}
      >
        <div className="pg-stack pg-stack--start" style={{ width: 560, maxWidth: "100%" }}>
          <CodeBlock language="json" code={JSON_CODE} />
          <CodeBlock language="python" code={PY} />
          <CodeBlock language="bash" code={SH} />
        </div>
      </Example>

      <Example
        id="line-numbers"
        code={`<CodeBlock language="ts" code={code} lineNumbers />
<CodeBlock language="ts" code={long} wrap />`}
      >
        <div className="pg-stack pg-stack--start" style={{ width: 560, maxWidth: "100%" }}>
          <CodeBlock language="tsx" code={TS} lineNumbers title="Counter.tsx" />
          <CodeBlock language="ts" code={LONG} wrap />
        </div>
      </Example>

      <Example
        id="themes"
        code={`import "@skeinui/themes/code/index.css";

<CodeBlock language="tsx" code={code} theme="github" />
<Markdown codeTheme="dracula">{text}</Markdown>
<DiffView codeTheme="one" oldText={a} newText={b} />`}
      >
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            width: "100%",
          }}
        >
          {CODE_THEMES.map((theme) => (
            <CodeBlock key={theme} language="tsx" code={TS} theme={theme} title={theme} />
          ))}
        </div>
      </Example>

      <Example
        id="custom"
        code={`<CodeBlock
  language="text"
  code={code}
  highlight={(code) => code.split("\\n").map((line) => <b key={line}>{line}</b>)}
/>`}
      >
        <div style={{ width: 560, maxWidth: "100%" }}>
          <CodeBlock
            language="text"
            code={"first line\nsecond line\nthird line"}
            highlight={(code) =>
              code.split("\n").map((line, i) => {
                const [head = "", ...rest] = line.split(" ");
                return (
                  <span key={i}>
                    <b>{head}</b> {rest.join(" ")}
                  </span>
                );
              })
            }
          />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="CodeBlock" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
