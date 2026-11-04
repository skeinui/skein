import { useState } from "react";
import { Badge, Marquee, Switch } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "marquee", type: "slot" },
  { key: "parts", name: "marquee-viewport / marquee-track / marquee-content", type: "slot" },
  { key: "pause", name: "marquee-pause", type: "slot" },
];

function News() {
  const t = usePageT();
  return (
    <span>
      <Badge color="primary">{t("basic.new")}</Badge> {t("basic.news")}
    </span>
  );
}

function Controlled() {
  const t = usePageT();
  const [paused, setPaused] = useState(false);
  return (
    <div className="pg-stack">
      <Switch checked={paused} onCheckedChange={setPaused} aria-label={t("controlled.paused")} />
      <Marquee aria-label={t("controlled.title")} paused={paused} onPausedChange={setPaused}>
        <News />
      </Marquee>
    </div>
  );
}

export default function MarqueePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Marquee</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { Marquee } from "@skeinui/ui";

<Marquee aria-label={t("basic.label")}>…long content…</Marquee>`}
      >
        <Marquee aria-label={t("basic.label")}>
          <News />
        </Marquee>
      </Example>

      <Example id="direction" code={`<Marquee direction="end" speed={80}>…</Marquee>`}>
        <Marquee aria-label={t("direction.label")} direction="end" speed={80}>
          <News />
        </Marquee>
      </Example>

      <Example
        id="controlled"
        code={`<Marquee paused={paused} onPausedChange={setPaused}>…</Marquee>`}
      >
        <Controlled />
      </Example>

      <Example id="short" code={`<Marquee>Short text</Marquee>`}>
        <Marquee aria-label={t("short.label")}>{t("short.text")}</Marquee>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Marquee" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
