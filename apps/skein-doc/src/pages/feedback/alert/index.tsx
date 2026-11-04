import { ALERT_VARIANTS, Alert, Button, COLORS } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "frame", name: "alert / alert-icon / alert-content" },
  { key: "text", name: "alert-title / alert-description" },
  { key: "action", name: "alert-action / alert-close" },
];

function ClosableDemo() {
  const t = usePageT();
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t("action.showAgain")}
      </Button>
    );
  }
  return (
    <Alert
      color="success"
      title={t("action.saved")}
      action={
        <Button size="sm" variant="outline">
          Undo
        </Button>
      }
      onClose={() => setOpen(false)}
    >
      {t("action.message")}
    </Alert>
  );
}

export default function AlertPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Alert</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Alert } from "@skeinui/ui";

<Alert title="Heads up">You can add components to your app.</Alert>`}
      >
        <Alert title="Heads up">You can add components to your app.</Alert>
      </Example>

      <Example
        id="variants"
        code={`<Alert variant="soft" … />
<Alert variant="outline" … />
<Alert variant="solid" … />`}
      >
        <div className="pg-stack">
          {ALERT_VARIANTS.map((v) => (
            <Alert key={v} variant={v} title={v}>
              {t("variants.message")}
            </Alert>
          ))}
        </div>
      </Example>

      <Example id="colors" code={`<Alert color="success" title="Saved">…</Alert>`}>
        <div className="pg-stack">
          {COLORS.map((c) => (
            <Alert key={c} color={c} title={c}>
              {t("colors.message")}
            </Alert>
          ))}
        </div>
      </Example>

      <Example
        id="action"
        code={`<Alert action={<Button size="sm">Undo</Button>} onClose={() => …}>…</Alert>`}
      >
        <ClosableDemo />
      </Example>

      <Example id="no-icon" code={`<Alert icon={false} title="No icon">…</Alert>`}>
        <Alert icon={false} title={t("no-icon.alertTitle")}>
          {t("no-icon.message")}
        </Alert>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Alert" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
