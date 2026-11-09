import { useState } from "react";
import { Button, FormDialog, toast } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component relies on; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [{ key: "composed", name: "dialog / form / button …" }];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Usage() {
  const t = usePageT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{t("usage.open")}</Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={t("usage.heading")}
        size="sm"
        fields={[
          { name: "name", label: t("field.name"), required: true, minLength: 2 },
          { name: "email", label: t("field.email"), type: "email", required: true },
        ]}
        onSubmit={async (values) => {
          await wait(600);
          toast.success(t("usage.saved", { name: String(values.name) }));
          setOpen(false);
        }}
      />
    </>
  );
}

export default function FormDialogPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Form Dialog</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { FormDialog } from "@skeinui/ui";

<FormDialog
  open={open}
  onOpenChange={setOpen}
  title="Invite someone"
  size="sm"
  fields={[
    { name: "name", label: "Name", required: true, minLength: 2 },
    { name: "email", label: "Email", type: "email", required: true },
  ]}
  onSubmit={async (values) => {
    await invite(values);
    setOpen(false);
  }}
/>`}
      >
        <Usage />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="FormDialog" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: t("styling.existing"),
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
