import { DiffView } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "diff-view", type: "data-slot" },
  { key: "header", name: "diff-header / diff-file", type: "data-slot" },
  { key: "stats", name: "diff-stats / diff-stat", type: "data-slot" },
  { key: "scroll", name: "diff-scroll / diff-table", type: "data-slot" },
  { key: "row", name: "diff-row", type: "data-slot" },
  { key: "gutter", name: "diff-gutter", type: "data-slot" },
  { key: "code", name: "diff-code / diff-sign", type: "data-slot" },
  { key: "label", name: "diff-label", type: "data-slot" },
  { key: "gap", name: "diff-gap / diff-expand", type: "data-slot" },
  { key: "token", name: "[data-token]", type: "attribute" },
];

/** The exported helpers; their descriptions are the page's `helpers.<name>` messages. */
const HELPERS = [
  { name: "diffLines", type: "(before: string, after: string) => DiffLine[]" },
  { name: "parsePatch", type: "(patch: string) => DiffLine[]" },
  { name: "collapse", type: "(lines: readonly DiffLine[], context: number) => DiffItem[]" },
];

const OLD = `import { useState } from "react";

export function Counter() {
  const [n, setN] = useState(0);
  return (
    <button onClick={() => setN(n + 1)}>
      Clicked {n} times
    </button>
  );
}
`;

const NEW = `import { useState } from "react";

export function Counter({ step = 1 }: { step?: number }) {
  const [n, setN] = useState(0);
  return (
    <button type="button" onClick={() => setN(n + step)}>
      Clicked {n} times
    </button>
  );
}
`;

const PATCH = `diff --git a/src/server.ts b/src/server.ts
index 3f2a1b0..9c4d7e2 100644
--- a/src/server.ts
+++ b/src/server.ts
@@ -12,7 +12,8 @@ export function start(port: number) {
   const app = createApp();
-  app.listen(port);
-  console.log("listening");
+  app.listen(port, "127.0.0.1");
+  // listen on localhost only; outside traffic goes through the gateway
+  console.log(\`listening on \${port}\`);
   return app;
 }
`;

const LONG_OLD = Array.from({ length: 40 }, (_, i) => `const item${i} = ${i};`).join("\n");
const LONG_NEW = LONG_OLD.replace("item7 = 7", "item7 = 70").replace("item31 = 31", "item31 = 310");

const wrap = { width: 640, maxWidth: "100%" } as const;

export default function DiffViewPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">DiffView</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { DiffView } from "@skeinui/ui";

<DiffView fileName="counter.tsx" language="tsx" oldText={before} newText={after} />`}
      >
        <div style={wrap}>
          <DiffView fileName="counter.tsx" language="tsx" oldText={OLD} newText={NEW} />
        </div>
      </Example>

      <Example
        id="patch"
        code={`<DiffView fileName="src/server.ts" language="ts" patch={patch} />`}
      >
        <div style={wrap}>
          <DiffView fileName="src/server.ts" language="ts" patch={PATCH} />
        </div>
      </Example>

      <Example id="collapsed" code={`<DiffView context={2} oldText={before} newText={after} />`}>
        <div style={wrap}>
          <DiffView
            fileName="items.ts"
            language="ts"
            context={2}
            oldText={LONG_OLD}
            newText={LONG_NEW}
          />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="DiffView" />
        <h4>{t("helpers.title")}</h4>
        <p className="pg-desc">{t.rich("helpers.description")}</p>
        <PropsTable
          first={t("helpers.function")}
          rows={HELPERS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`helpers.${h.name}`),
          }))}
        />
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
