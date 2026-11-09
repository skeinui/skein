import { Grid, StatisticCard } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

export default function StatisticCardPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Statistic Card</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<StatisticCard title="Open tickets" value={128} color="primary" />`}
      >
        <StatisticCard title={t("usage.title")} value={128} color="primary" />
      </Example>

      <Example
        id="grid"
        code={`<Grid minColumnWidth="sm" gap="md">
  <StatisticCard title="SLA met" value={96.4} precision={1} suffix="%" color="success" />
  …
</Grid>`}
      >
        <Grid minColumnWidth="sm" gap="md">
          <StatisticCard
            title={t("grid.sla")}
            value={96.4}
            precision={1}
            suffix="%"
            color="success"
          />
          <StatisticCard
            title={t("grid.csat")}
            value={4.6}
            precision={1}
            suffix="/ 5"
            color="warning"
          />
          <StatisticCard title={t("grid.open")} value={42} variant="elevated" />
          <StatisticCard title={t("grid.loading")} loading />
        </Grid>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="StatisticCard" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
