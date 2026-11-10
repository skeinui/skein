import {
  Button,
  Card,
  Empty,
  Flex,
  Page,
  PageFooter,
  PageHeader,
  Segmented,
  Text,
  toast,
} from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

export default function PagePage() {
  const t = usePageT();
  const [level, setLevel] = useState("3");
  const [state, setState] = useState("loading");
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Page</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<Page title="Tickets" description="Every request that became a ticket">
  <Card>…</Card>
</Page>`}
      >
        <div className="pg-page-box">
          <Page title={t("usage.title")} description={t("usage.description")}>
            <Card>
              <Card.Body>
                <Text>{t("usage.content")}</Text>
              </Card.Body>
            </Card>
          </Page>
        </div>
      </Example>

      <Example
        id="actions"
        code={`<Page
  title="Customers"
  description="…"
  actions={<Button color="primary">New customer</Button>}
>
  …
</Page>`}
      >
        <div className="pg-page-box">
          <Page
            title={t("actions.title")}
            description={t("actions.description")}
            actions={
              <>
                <Button variant="outline">{t("actions.import")}</Button>
                <Button color="primary" onClick={() => toast(t("actions.clicked"))}>
                  {t("actions.new")}
                </Button>
              </>
            }
          >
            <Card>
              <Card.Body>
                <Text>{t("usage.content")}</Text>
              </Card.Body>
            </Card>
          </Page>
        </div>
      </Example>

      <Example
        id="footer"
        code={`<Page
  title="Edit rule"
  footer={
    <PageFooter sticky>
      <Button variant="ghost">Cancel</Button>
      <Button color="primary">Save</Button>
    </PageFooter>
  }
>
  …a long form…
</Page>`}
      >
        <div className="pg-page-box pg-page-box--scroll">
          <Page
            title={t("footer.title")}
            footer={
              <PageFooter sticky>
                <Button variant="ghost">{t("footer.cancel")}</Button>
                <Button color="primary" onClick={() => toast.success(t("footer.saved"))}>
                  {t("footer.save")}
                </Button>
              </PageFooter>
            }
          >
            {[1, 2, 3, 4].map((n) => (
              <Card key={n}>
                <Card.Body>
                  <Text>{t("footer.section", { n })}</Text>
                </Card.Body>
              </Card>
            ))}
          </Page>
        </div>
      </Example>

      <Example
        id="fill"
        code={`<Page fill title="Tickets">
  <Card fill>…a table that scrolls its rows…</Card>
</Page>`}
      >
        <div className="pg-page-box pg-page-box--tall">
          <Page fill title={t("fill.title")}>
            <Card fill>
              <Card.Body>
                <Text>{t("fill.content")}</Text>
              </Card.Body>
            </Card>
          </Page>
        </div>
      </Example>

      <Example
        id="states"
        code={`<Page title="T-1016" loading={ticket.isPending} notFound={ticket.error ? <Empty title="Not found" /> : undefined}>
  {ticket.data ? <TicketBody ticket={ticket.data} /> : null}
</Page>`}
      >
        <Flex direction="column" gap="md">
          <Segmented
            size="sm"
            aria-label={t("states.label")}
            value={state}
            onValueChange={setState}
            options={[
              { value: "loading", label: t("states.loading") },
              { value: "notFound", label: t("states.notFound") },
            ]}
          />
          <div className="pg-page-box">
            <Page
              title="T-1016"
              loading={state === "loading"}
              notFound={state === "notFound" ? <Empty title={t("states.empty")} /> : undefined}
            />
          </div>
        </Flex>
      </Example>

      <Example
        id="back"
        code={`<Page
  title="T-1016"
  back={<RouterLink to="/tickets">Tickets</RouterLink>}
>
  …
</Page>`}
      >
        <div className="pg-page-box">
          <Page title="T-1016" back={<a href="#back">{t("back.link")}</a>}>
            <Text>{t("back.content")}</Text>
          </Page>
        </div>
      </Example>

      <Example id="levels" code={`<PageHeader title="Tickets" level={1} />`}>
        <Flex direction="column" gap="md">
          <Segmented
            size="sm"
            aria-label={t("levels.label")}
            value={level}
            onValueChange={setLevel}
            options={["1", "2", "3", "4", "5"].map((v) => ({ value: v, label: `h${v}` }))}
          />
          <PageHeader
            title={t("usage.title")}
            description={t("usage.description")}
            level={Number(level) as 1 | 2 | 3 | 4 | 5}
          />
        </Flex>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Page" />
      </section>

      <section id="headerApi" className="pg-example">
        <h3>{t("headerApi.title")}</h3>
        <ApiReference component="PageHeader" />
      </section>

      <section id="footerApi" className="pg-example">
        <h3>{t("footerApi.title")}</h3>
        <ApiReference component="PageFooter" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
