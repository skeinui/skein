import { useState } from "react";
import { Card, Flex, SavedViews, TableToolbar, Text, toast } from "@skeinui/ui";
import type { SavedViewItem } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

/** What a view holds is the page's business: here a keyword. */
interface View extends SavedViewItem {
  keyword: string;
}

function Demo({ slow }: { slow?: boolean }) {
  const t = usePageT();
  const [views, setViews] = useState<View[]>([
    { id: "v1", name: t("usage.first"), keyword: "ada" },
  ]);
  const [active, setActive] = useState<string>();
  const [keyword, setKeyword] = useState("");
  return (
    <Card>
      <Card.Body>
        <Flex direction="column" gap="md">
          <SavedViews
            views={views}
            value={active}
            canSave={keyword.trim() !== ""}
            onSelect={(view) => {
              setActive(view.id);
              setKeyword(view.keyword);
            }}
            onDelete={(view) => {
              setViews((all) => all.filter((v) => v.id !== view.id));
              if (active === view.id) setActive(undefined);
            }}
            onSave={async (name) => {
              // Anywhere: a request, localStorage, a store. The dialog waits for the promise.
              if (slow) await new Promise((resolve) => setTimeout(resolve, 800));
              const view = { id: `v${Date.now()}`, name, keyword: keyword.trim() };
              setViews((all) => [...all, view]);
              setActive(view.id);
              toast.success(t("usage.saved", { name }));
            }}
          />
          <TableToolbar
            keyword={keyword}
            onKeywordChange={(value) => {
              setKeyword(value);
              setActive(undefined);
            }}
            onSearch={() => {}}
            searchPlaceholder={t("usage.placeholder")}
          />
          <Text tone="secondary">{t("usage.hint")}</Text>
        </Flex>
      </Card.Body>
    </Card>
  );
}

export default function SavedViewsPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Saved Views</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<SavedViews
  views={views}                       // [{ id, name, ...whatever the view holds }]
  value={activeId}
  canSave={Boolean(keyword || filter)}
  onSelect={(view) => apply(view)}    // put what it holds back in the search
  onDelete={(view) => remove(view.id)}
  onSave={(name) => add({ name, keyword, filter })}
/>`}
      >
        <Demo />
      </Example>

      <Example
        id="storage"
        code={`// onSave may return a promise: the dialog waits for it, and stays open if it fails
onSave={async (name) => {
  await api.post("/views", { name, keyword, filter });
  refetchViews();
}}`}
      >
        <Demo slow />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="SavedViews" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
