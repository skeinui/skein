import { OtpField } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "cells", name: "otp-field / otp-cell" },
  { key: "input", name: "otp-input" },
  { key: "separator", name: "otp-separator" },
];

function CompleteDemo() {
  const t = usePageT();
  const [code, setCode] = useState<string | null>(null);
  return (
    <div className="pg-stack pg-stack--start">
      <OtpField length={4} onValueComplete={setCode} />
      <p className="pg-desc">
        {t("complete.completed")} <code>{code ?? "—"}</code>
      </p>
    </div>
  );
}

export default function OtpFieldPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">OTP Field</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { OtpField } from "@skeinui/ui";

<OtpField length={6} />`}
      >
        <OtpField length={6} />
      </Example>

      <Example id="separator" code={`<OtpField length={6} separatorAfter={3} />`}>
        <OtpField length={6} separatorAfter={3} />
      </Example>

      <Example id="sizes" code={`<OtpField length={4} size="lg" variant="filled" />`}>
        <div className="pg-stack pg-stack--start">
          <OtpField length={4} size="sm" />
          <OtpField length={4} size="md" variant="filled" />
          <OtpField length={4} size="lg" />
        </div>
      </Example>

      <Example id="mask" code={`<OtpField length={4} mask />`}>
        <OtpField length={4} mask />
      </Example>

      <Example
        id="complete"
        code={`<OtpField length={4} onValueComplete={(code) => verify(code)} />`}
      >
        <CompleteDemo />
      </Example>

      <Example
        id="invalid"
        code={`<OtpField length={4} disabled />
<OtpField length={4} invalid />`}
      >
        <div className="pg-stack pg-stack--start">
          <OtpField length={4} disabled />
          <OtpField length={4} invalid />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="OtpField" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
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
