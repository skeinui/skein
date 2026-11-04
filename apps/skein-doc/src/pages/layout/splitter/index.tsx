import { Splitter } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "splitter", name: "splitter" },
  { key: "panel", name: "splitter-panel" },
  { key: "bar", name: "splitter-bar / splitter-handle" },
];

const Pane = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="pg-pane">
    <strong>{title}</strong>
    {children ? <span>{children}</span> : null}
  </div>
);

function ControlledDemo() {
  const t = usePageT();
  const [sizes, setSizes] = useState<number[]>([220, 380]);
  return (
    <div className="pg-stack pg-stack--start">
      <div className="pg-split-frame">
        <Splitter sizes={sizes} onResize={setSizes}>
          <Splitter.Panel>
            <Pane title={t("usage.left")} />
          </Splitter.Panel>
          <Splitter.Panel>
            <Pane title={t("usage.right")} />
          </Splitter.Panel>
        </Splitter>
      </div>
      <p className="pg-desc">
        sizes: <code>{sizes.map((s) => Math.round(s)).join(" / ")}</code>
      </p>
    </div>
  );
}

export default function SplitterPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Splitter</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Splitter } from "@skeinui/ui";

<div style={{ height: 200 }}>
  <Splitter>
    <Splitter.Panel defaultSize="30%" min={100}>Left</Splitter.Panel>
    <Splitter.Panel>Right</Splitter.Panel>
  </Splitter>
</div>`}
      >
        <div className="pg-split-frame">
          <Splitter>
            <Splitter.Panel defaultSize="30%" min={100}>
              <Pane title={t("usage.left")}>{t("usage.leftNote")}</Pane>
            </Splitter.Panel>
            <Splitter.Panel>
              <Pane title={t("usage.right")}>{t("usage.rest")}</Pane>
            </Splitter.Panel>
          </Splitter>
        </div>
      </Example>

      <Example id="vertical" code={`<Splitter orientation="vertical">…</Splitter>`}>
        <div className="pg-split-frame pg-split-frame--tall">
          <Splitter orientation="vertical">
            <Splitter.Panel defaultSize="40%">
              <Pane title={t("vertical.top")} />
            </Splitter.Panel>
            <Splitter.Panel>
              <Pane title={t("vertical.bottom")} />
            </Splitter.Panel>
          </Splitter>
        </div>
      </Example>

      <Example id="limits" code={`<Splitter.Panel defaultSize={160} min={120} max={240} />`}>
        <div className="pg-split-frame">
          <Splitter>
            <Splitter.Panel defaultSize={160} min={120} max={240}>
              <Pane title={t("limits.nav")}>120–240px</Pane>
            </Splitter.Panel>
            <Splitter.Panel min="30%">
              <Pane title={t("limits.content")}>{t("limits.contentNote")}</Pane>
            </Splitter.Panel>
            <Splitter.Panel defaultSize={140} min={80} max={200}>
              <Pane title={t("limits.aside")}>80–200px</Pane>
            </Splitter.Panel>
          </Splitter>
        </div>
      </Example>

      <Example
        id="nested"
        code={`<Splitter orientation="vertical"><Splitter.Panel><Splitter>…</Splitter></Splitter.Panel>…</Splitter>`}
      >
        <div className="pg-split-frame pg-split-frame--tall">
          <Splitter orientation="vertical">
            <Splitter.Panel defaultSize="60%" min={80}>
              <Splitter>
                <Splitter.Panel defaultSize="35%" min={80}>
                  <Pane title={t("nested.explorer")} />
                </Splitter.Panel>
                <Splitter.Panel>
                  <Pane title={t("nested.editor")} />
                </Splitter.Panel>
              </Splitter>
            </Splitter.Panel>
            <Splitter.Panel min={60}>
              <Pane title={t("nested.terminal")} />
            </Splitter.Panel>
          </Splitter>
        </div>
      </Example>

      <Example id="controlled" code={`<Splitter sizes={sizes} onResize={setSizes}>…</Splitter>`}>
        <ControlledDemo />
      </Example>

      <Example id="disabled" code={`<Splitter disabled>…</Splitter>`}>
        <div className="pg-split-frame">
          <Splitter disabled>
            <Splitter.Panel defaultSize="50%">
              <Pane title={t("disabled.fixed")} />
            </Splitter.Panel>
            <Splitter.Panel>
              <Pane title={t("disabled.fixed")} />
            </Splitter.Panel>
          </Splitter>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Splitter" />
        <ApiReference component="Splitter.Panel" />
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
