import { Timeline } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "timeline / timeline-item", type: "slot" },
  { key: "time", name: "timeline-time", type: "slot" },
  { key: "dot", name: "timeline-separator / timeline-dot / timeline-connector", type: "slot" },
  {
    key: "content",
    name: "timeline-content / timeline-title / timeline-description",
    type: "slot",
  },
];

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="m5 12 5 5 9-10" />
  </svg>
);
const Alert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="M12 6v7m0 4v.01" />
  </svg>
);

export default function TimelinePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Timeline</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Timeline } from "@skeinui/ui";

<Timeline
  items={[
    { title: "Order placed", description: "We received your order" },
    { title: "Paid" },
    { title: "Shipped" },
  ]}
/>`}
      >
        <Timeline
          items={[
            { title: t("usage.placed"), description: t("usage.received") },
            { title: t("usage.paid"), description: t("usage.card") },
            { title: t("usage.shipped") },
          ]}
        />
      </Example>

      <Example id="time" code={`items={[{ time: "09:00", title: "…" }]}`}>
        <Timeline
          items={[
            { time: "09:00", title: t("time.created"), description: t("time.opened") },
            { time: "09:30", title: t("time.assigned"), description: t("time.to") },
            { time: "11:15", title: t("time.resolved") },
          ]}
        />
      </Example>

      <Example id="icons" code={`items={[{ title: "Paid", color: "success", icon: <Check /> }]}`}>
        <Timeline
          items={[
            { title: t("icons.created"), color: "neutral" },
            { title: t("icons.paid"), color: "success", icon: <Check /> },
            {
              title: t("icons.failed"),
              color: "danger",
              icon: <Alert />,
              description: t("icons.notFound"),
            },
            { title: t("icons.retry"), color: "warning" },
          ]}
        />
      </Example>

      <Example id="pending" code={`items={[…, { title: "Shipping", pending: true }]}`}>
        <Timeline
          items={[
            { title: t("pending.placed"), color: "success", icon: <Check /> },
            { title: t("pending.packed"), color: "success", icon: <Check /> },
            { title: t("pending.shipping"), description: t("pending.onTheWay"), pending: true },
          ]}
        />
      </Example>

      <Example id="sizes" code={`<Timeline size="sm" … />`}>
        <div className="pg-row">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Timeline
              key={size}
              size={size}
              items={[
                { title: t("sizes.size", { size }), description: t("sizes.description") },
                { title: t("sizes.next") },
              ]}
            />
          ))}
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Timeline" />
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
