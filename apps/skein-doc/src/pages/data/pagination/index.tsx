import { PAGINATION_VARIANTS, Pagination } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "pagination" },
  { key: "info", name: "pagination-info / pagination-page-info" },
  { key: "controls", name: "pagination-controls / pagination-nav / pagination-pages" },
  { key: "extras", name: "pagination-ellipsis / pagination-size" },
];

function Demo(props: Partial<React.ComponentProps<typeof Pagination>>) {
  const [page, setPage] = useState(3);
  const [pageSize, setPageSize] = useState(10);
  return (
    <Pagination
      page={page}
      pageSize={pageSize}
      total={186}
      onPageChange={setPage}
      onPageSizeChange={props.onPageSizeChange === undefined ? undefined : setPageSize}
      {...props}
    />
  );
}

export default function PaginationPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Pagination</h1>
      <Lead />
      <Example
        id="usage"
        code={`import { Pagination } from "@skeinui/ui";

<Pagination page={page} pageSize={10} total={186} onPageChange={setPage} />`}
      >
        <Demo />
      </Example>

      <DocHeading id="examples" />

      <Example id="pages" code={`<Pagination variant="pages" … />`}>
        <Demo variant={PAGINATION_VARIANTS[1]} />
      </Example>

      <Example
        id="page-size"
        code={`<Pagination onPageSizeChange={setPageSize} pageSizeOptions={[10, 20, 50]} … />`}
      >
        <Demo onPageSizeChange={() => undefined} pageSizeOptions={[10, 20, 50]} />
      </Example>

      <Example id="selected" code={`<Pagination selectedCount={3} … />`}>
        <Demo selectedCount={3} />
      </Example>

      <Example id="sizes" code={`<Pagination size="sm" variant="pages" … />`}>
        <div className="pg-stack">
          <Demo size="sm" variant="pages" />
          <Demo size="md" variant="pages" />
          <Demo size="lg" variant="pages" />
        </div>
      </Example>

      <Example
        id="labels"
        code={`<Pagination labels={{ total: (n) => \`\${n} orders\`, page: (c, t) => \`Page \${c} of \${t}\` }} … />`}
      >
        <Demo
          selectedCount={2}
          onPageSizeChange={() => undefined}
          labels={{
            total: (n) => t("labels.total", { n }),
            selected: (n) => t("labels.selected", { n }),
            page: (current, count) => t("labels.page", { current, count }),
            pageSize: (n) => t("labels.pageSize", { n }),
            first: t("labels.first"),
            previous: t("labels.previous"),
            next: t("labels.next"),
            last: t("labels.last"),
          }}
        />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Pagination" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "data-slot",
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
