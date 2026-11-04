import { Kbd } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

export default function KbdPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Kbd</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Kbd } from "@skeinui/ui";

<Kbd>Esc</Kbd>`}
      >
        <Kbd>Esc</Kbd>
      </Example>

      <Example id="group" code={`<Kbd.Group><Kbd>⌘</Kbd><Kbd>K</Kbd></Kbd.Group>`}>
        <Kbd.Group>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </Kbd.Group>
      </Example>

      <Example id="sizes" code={`<Kbd size="lg">Enter</Kbd>`}>
        <div className="pg-flex pg-flex--center">
          <Kbd size="sm">Tab</Kbd>
          <Kbd size="md">Tab</Kbd>
          <Kbd size="lg">Tab</Kbd>
        </div>
      </Example>

      <Example id="inline" code={`Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search.`}>
        <p className="pg-desc">
          {t("inline.before")}{" "}
          <Kbd.Group>
            <Kbd size="sm">⌘</Kbd>
            <Kbd size="sm">K</Kbd>
          </Kbd.Group>{" "}
          {t("inline.after")}
        </p>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Kbd" />
        <h4>Kbd.Group</h4>
        <ApiReference component="Kbd.Group" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={[{ name: "kbd / kbd-group", type: "data-slot", description: t("styling.slot") }]}
        />
      </section>
    </article>
  );
}
