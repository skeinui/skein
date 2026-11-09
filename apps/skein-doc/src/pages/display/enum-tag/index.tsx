import { EnumTag, Flex } from "@skeinui/ui";
import type { EnumTagOption } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

function useStatus(): Record<string, EnumTagOption> {
  const t = usePageT();
  return {
    open: { label: t("status.open"), color: "primary" },
    pending: { label: t("status.pending"), color: "warning" },
    resolved: { label: t("status.resolved"), color: "success" },
    closed: { label: t("status.closed"), color: "neutral" },
  };
}

function usePriority(): Record<string, EnumTagOption> {
  const t = usePageT();
  return {
    urgent: { label: t("priority.urgent"), color: "danger", variant: "solid" },
    high: { label: t("priority.high"), color: "warning" },
    normal: { label: t("priority.normal"), color: "secondary" },
    low: { label: t("priority.low"), color: "neutral" },
  };
}

export default function EnumTagPage() {
  const t = usePageT();
  const status = useStatus();
  const priority = usePriority();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Enum Tag</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`const STATUS = {
  open: { label: "Open", color: "primary" },
  pending: { label: "Pending", color: "warning" },
  resolved: { label: "Resolved", color: "success" },
  closed: { label: "Closed", color: "neutral" },
};

<EnumTag value={ticket.status} options={STATUS} />`}
      >
        <Flex gap="sm" wrap>
          {Object.keys(status).map((value) => (
            <EnumTag key={value} value={value} options={status} />
          ))}
        </Flex>
      </Example>

      <Example
        id="variants"
        code={`const PRIORITY = {
  urgent: { label: "Urgent", color: "danger", variant: "solid" },
  high: { label: "High", color: "warning" },
  …
};`}
      >
        <Flex gap="sm" wrap>
          {Object.keys(priority).map((value) => (
            <EnumTag key={value} value={value} options={priority} />
          ))}
        </Flex>
      </Example>

      <Example id="fallback" code={`<EnumTag value="archived" options={STATUS} />`}>
        <EnumTag value="archived" options={status} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="EnumTag" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
