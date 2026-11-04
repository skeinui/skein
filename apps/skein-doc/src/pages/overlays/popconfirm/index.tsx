import { Button, Popconfirm } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "popconfirm", type: "slot" },
  { key: "parts", name: "popconfirm-icon / -title / -description / -footer", type: "slot" },
];

function AsyncDemo() {
  const t = usePageT();
  const [n, setN] = useState(3);
  return (
    <div className="pg-stack pg-stack--start">
      <Popconfirm
        title="Remove this item?"
        tone="danger"
        confirmLabel="Remove"
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 900));
          setN((x) => x - 1);
        }}
      >
        <Button variant="outline" color="danger" disabled={n === 0}>
          Remove one
        </Button>
      </Popconfirm>
      <p className="pg-desc">{t.rich("async.left", { n })}</p>
    </div>
  );
}

export default function PopconfirmPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Popconfirm</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Popconfirm, Button } from "@skeinui/ui";

<Popconfirm title="Delete this task?" description="This cannot be undone." onConfirm={remove}>
  <Button variant="outline">Delete</Button>
</Popconfirm>`}
      >
        <Popconfirm title="Delete this task?" description="This cannot be undone.">
          <Button variant="outline">Delete</Button>
        </Popconfirm>
      </Example>

      <Example
        id="placement"
        code={`<Popconfirm side="right" title="…"><Button>Right</Button></Popconfirm>`}
      >
        <div className="pg-row">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <Popconfirm key={side} side={side} title={`Opens on the ${side}`}>
              <Button variant="outline">{side}</Button>
            </Popconfirm>
          ))}
        </div>
      </Example>

      <Example
        id="async"
        code={`<Popconfirm onConfirm={async () => { await api.remove(id); }}>…</Popconfirm>`}
      >
        <AsyncDemo />
      </Example>

      <Example
        id="custom"
        code={`<Popconfirm icon={null} hideCancel confirmLabel="Got it" title="Heads up">…</Popconfirm>`}
      >
        <div className="pg-row">
          <Popconfirm icon={null} hideCancel confirmLabel="Got it" title="Heads up">
            <Button variant="outline">No icon, one button</Button>
          </Popconfirm>
          <Popconfirm
            icon={<span aria-hidden="true">🗑️</span>}
            title="Empty the trash?"
            description="Files can't be recovered."
            tone="danger"
            confirmLabel="Empty"
          >
            <Button variant="outline" color="danger">
              Custom icon
            </Button>
          </Popconfirm>
        </div>
      </Example>

      <Example id="disabled" code={`<Popconfirm disabled …>`}>
        <Popconfirm disabled title="Never shown">
          <Button variant="outline">Does not ask</Button>
        </Popconfirm>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Popconfirm" />
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
