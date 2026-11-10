import { ConfirmButton } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

function AsyncDemo() {
  const t = usePageT();
  const [n, setN] = useState(3);
  return (
    <div className="pg-stack pg-stack--start">
      <ConfirmButton
        variant="outline"
        color="danger"
        question="Remove this item?"
        disabled={n === 0}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 900));
          setN((x) => x - 1);
        }}
      >
        Remove one
      </ConfirmButton>
      <p className="pg-desc">{t.rich("async.left", { n })}</p>
    </div>
  );
}

export default function ConfirmButtonPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Confirm Button</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ConfirmButton } from "@skeinui/ui";

<ConfirmButton variant="outline" question="Merge these tickets?" onConfirm={merge}>
  Merge
</ConfirmButton>`}
      >
        <ConfirmButton variant="outline" question="Merge these tickets?" onConfirm={() => {}}>
          Merge
        </ConfirmButton>
      </Example>

      <Example
        id="danger"
        code={`<ConfirmButton
  variant="outline"
  color="danger"
  question="Delete this article?"
  description="It cannot be restored."
  onConfirm={remove}
>
  Delete
</ConfirmButton>`}
      >
        <ConfirmButton
          variant="outline"
          color="danger"
          question="Delete this article?"
          description="It cannot be restored."
          onConfirm={() => {}}
        >
          Delete
        </ConfirmButton>
      </Example>

      <Example
        id="async"
        code={`<ConfirmButton question="Remove this item?" onConfirm={async () => { await api.remove(id); }}>
  Remove
</ConfirmButton>`}
      >
        <AsyncDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ConfirmButton" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
