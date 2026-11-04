import { Affix, Button } from "@skeinui/ui";
import { useRef, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "affix", name: "affix", type: "slot" },
  { key: "content", name: "affix-content", type: "slot" },
];

function Filler({ n, label }: { n: number; label: string }) {
  const t = usePageT();
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <section key={i} className="pg-scrollbox-section">
          <h4>
            {label} {i + 1}
          </h4>
          <p>{t("demo.filler")}</p>
        </section>
      ))}
    </>
  );
}

function UsageDemo({ offsetTop }: { offsetTop?: number }) {
  const t = usePageT();
  const box = useRef<HTMLDivElement>(null);
  const [affixed, setAffixed] = useState(false);
  return (
    <div className="pg-stack pg-stack--start">
      <div
        ref={box}
        className="pg-scrollbox"
        tabIndex={0}
        role="region"
        aria-label={t("demo.area")}
      >
        <Filler n={1} label={t("demo.before")} />
        <Affix target={box} offsetTop={offsetTop} onChange={setAffixed}>
          <Button color="primary">{t(affixed ? "usage.affixed" : "usage.scroll")}</Button>
        </Affix>
        <Filler n={4} label={t("demo.after")} />
      </div>
      <p className="pg-desc">
        affixed: <code>{String(affixed)}</code> {t("usage.hint")}
      </p>
    </div>
  );
}

function BottomDemo() {
  const t = usePageT();
  const box = useRef<HTMLDivElement>(null);
  const [affixed, setAffixed] = useState(false);
  return (
    <div className="pg-stack pg-stack--start">
      <div
        ref={box}
        className="pg-scrollbox"
        tabIndex={0}
        role="region"
        aria-label={t("demo.area")}
      >
        <Filler n={4} label={t("demo.before")} />
        <Affix target={box} offsetBottom={8} onChange={setAffixed}>
          <Button color="primary">{t(affixed ? "bottom.affixed" : "bottom.inPlace")}</Button>
        </Affix>
        <Filler n={1} label={t("demo.after")} />
      </div>
      <p className="pg-desc">
        affixed: <code>{String(affixed)}</code> {t("bottom.hint")}
      </p>
    </div>
  );
}

export default function AffixPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Affix</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Affix } from "@skeinui/ui";

<Affix target={boxRef} onChange={(affixed) => …}>
  <Button>Pinned</Button>
</Affix>`}
      >
        <UsageDemo />
      </Example>

      <Example id="offset" code={`<Affix offsetTop={16} target={boxRef}>…</Affix>`}>
        <UsageDemo offsetTop={16} />
      </Example>

      <Example id="bottom" code={`<Affix offsetBottom={8} target={boxRef}>…</Affix>`}>
        <BottomDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Affix" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
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
