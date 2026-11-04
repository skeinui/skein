import { Button, Card, Statistic } from "@skeinui/ui";
import { useEffect, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "statistic", type: "slot" },
  {
    key: "rows",
    name: "statistic-title / statistic-content / statistic-description",
    type: "slot",
  },
  { key: "value", name: "statistic-prefix / statistic-value / statistic-suffix", type: "slot" },
  { key: "skeleton", name: "statistic-skeleton", type: "slot" },
];

function LoadingDemo() {
  const t = usePageT();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setLoading((l) => !l), 1800);
    return () => clearInterval(id);
  }, []);
  return <Statistic title={t("demo.activeUsers")} value={112893} loading={loading} />;
}

function AnimatedDemo() {
  const t = usePageT();
  const [value, setValue] = useState(126_560.28);
  return (
    <div className="pg-flex pg-flex--loose">
      <Statistic title={t("demo.revenue")} value={value} prefix="$" precision={2} animated />
      <Statistic
        title={t("demo.orders")}
        value={Math.round(value / 37)}
        animated
        size="sm"
        color="success"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setValue(Math.round(Math.random() * 9_999_999) / 100)}
      >
        {t("animated.randomize")}
      </Button>
    </div>
  );
}

function CountdownDemo() {
  const t = usePageT();
  const [deadline] = useState(() => Date.now() + 90_000);
  const [done, setDone] = useState(false);
  return (
    <div className="pg-flex pg-flex--loose">
      <Statistic.Countdown
        title={t("countdown.saleEnds")}
        deadline={deadline}
        format="mm:ss"
        description={done ? t("countdown.finished") : undefined}
        onFinish={() => setDone(true)}
      />
      <Statistic.Countdown
        title={t("countdown.launch")}
        deadline={Date.now() + 3 * 86_400_000 + 4 * 3_600_000}
        format={t("countdown.launchFormat")}
        size="sm"
      />
    </div>
  );
}

export default function StatisticPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Statistic</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Statistic } from "@skeinui/ui";

<Statistic title="Active users" value={112893} />`}
      >
        <Statistic title={t("demo.activeUsers")} value={112893} />
      </Example>

      <Example
        id="format"
        code={`<Statistic value={93.1} precision={2} />
<Statistic value={1234567} groupSeparator="." />
<Statistic value={0.256} format={(v) => \`\${(Number(v) * 100).toFixed(1)}%\`} />`}
      >
        <div className="pg-row pg-row--top">
          <Statistic title="precision 2" value={93.1} precision={2} />
          <Statistic title="groupSeparator" value={1234567} groupSeparator="." />
          <Statistic
            title="format"
            value={0.256}
            format={(v) => `${(Number(v) * 100).toFixed(1)}%`}
          />
          <Statistic title={t("demo.string")} value="N/A" />
          <Statistic title={t("demo.empty")} />
        </div>
      </Example>

      <Example
        id="affixes"
        code={`<Statistic title="Revenue" value={8846} prefix="$" suffix="USD" description="+12% vs last week" />`}
      >
        <div className="pg-row pg-row--top">
          <Statistic
            title={t("demo.revenue")}
            value={8846}
            prefix="$"
            description={t("demo.weekly")}
          />
          <Statistic
            title={t("demo.uptime")}
            value={99.98}
            precision={2}
            suffix="%"
            color="success"
          />
        </div>
      </Example>

      <Example id="colors" code={`<Statistic color="danger" size="lg" … />`}>
        <div className="pg-row pg-row--top">
          {(["primary", "success", "warning", "danger"] as const).map((c) => (
            <Statistic key={c} title={c} value={1280} color={c} />
          ))}
          {(["sm", "md", "lg"] as const).map((s) => (
            <Statistic key={s} title={`size ${s}`} value={1280} size={s} />
          ))}
        </div>
      </Example>

      <Example id="loading" code={`<Statistic title="Active users" value={…} loading />`}>
        <LoadingDemo />
      </Example>

      <Example
        id="animated"
        code={`<Statistic title="Revenue" value={value} prefix="$" precision={2} animated />`}
      >
        <AnimatedDemo />
      </Example>

      <Example
        id="countdown"
        code={`<Statistic.Countdown title="Sale ends in" deadline={Date.now() + 90_000} format="mm:ss" onFinish={…} />
<Statistic.Countdown deadline={…} format="D [days] HH:mm:ss" />`}
      >
        <CountdownDemo />
      </Example>

      <Example
        id="cards"
        code={`<Card><Statistic title="Users" value={1234} description="+3.2%" /></Card>`}
      >
        <div className="pg-grid-2">
          <Card>
            <Statistic title={t("demo.users")} value={12893} description={t("demo.usersTrend")} />
          </Card>
          <Card>
            <Statistic
              title={t("demo.orders")}
              value={3421}
              color="primary"
              description={t("demo.ordersTrend")}
            />
          </Card>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Statistic" />
        <h4>Statistic.Countdown</h4>
        <ApiReference component="Statistic.Countdown" />
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
