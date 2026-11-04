import { Breadcrumb } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "breadcrumb", name: "breadcrumb / breadcrumb-list / breadcrumb-item", type: "slot" },
  { key: "breadcrumb-link", name: "breadcrumb-link / breadcrumb-page", type: "slot" },
  { key: "breadcrumb-icon", name: "breadcrumb-icon", type: "slot" },
  { key: "breadcrumb-separator", name: "breadcrumb-separator", type: "slot" },
];

export default function BreadcrumbPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Breadcrumb</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Breadcrumb } from "@skeinui/ui";

<Breadcrumb
  items={[
    { label: "Home", href: "/" },
    { label: "Users", href: "/users" },
    { label: "Ann Lee" },
  ]}
/>`}
      >
        <Breadcrumb
          items={[
            { label: "Home", href: "#" },
            { label: "Users", href: "#" },
            { label: "Ann Lee" },
          ]}
        />
      </Example>

      <Example id="separator" code={`<Breadcrumb separator="/" items={…} />`}>
        <Breadcrumb
          separator="/"
          items={[
            { label: "Home", href: "#" },
            { label: "Docs", href: "#" },
            { label: "Breadcrumb" },
          ]}
        />
      </Example>

      <Example id="onclick" code={`items={[{ label: "Home", onClick: () => navigate("/") }, …]}`}>
        <Breadcrumb
          items={[
            { label: "Home", onClick: () => undefined },
            { label: "Projects", onClick: () => undefined },
            { label: "skein" },
          ]}
        />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Breadcrumb" />
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
