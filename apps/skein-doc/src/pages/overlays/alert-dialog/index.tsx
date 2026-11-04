import { AlertDialog, Button, type DialogSize } from "@skeinui/ui";
import { Fragment, useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "slots", name: "dialog-backdrop / dialog-viewport / dialog", type: "slot" },
  { key: "alert", name: "data-alert", type: "state" },
];

/** The parts with props of their own, each with an API table. */
const PARTS = ["AlertDialog.Trigger", "AlertDialog.Content", "AlertDialog.Close"];

function Demo({ size, label = "Delete project" }: { size?: DialogSize; label?: string }) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger render={<Button color="danger" variant="outline" />}>
        {label}
      </AlertDialog.Trigger>
      <AlertDialog.Content size={size}>
        <AlertDialog.Title>Delete project?</AlertDialog.Title>
        <AlertDialog.Description>
          This action cannot be undone. All data will be removed.
        </AlertDialog.Description>
        <AlertDialog.Footer>
          <AlertDialog.Close render={<Button variant="ghost" />}>Cancel</AlertDialog.Close>
          <AlertDialog.Close render={<Button color="danger" />}>Delete</AlertDialog.Close>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}

function ControlledDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pg-stack pg-stack--start">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open
      </Button>
      <p className="pg-desc">
        open: <code>{String(open)}</code>
      </p>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialog.Content>
          <AlertDialog.Title>Sign out?</AlertDialog.Title>
          <AlertDialog.Description>You will need to sign in again.</AlertDialog.Description>
          <AlertDialog.Footer>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Stay
            </Button>
            <Button onClick={() => setOpen(false)}>Sign out</Button>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </div>
  );
}

export default function AlertDialogPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Alert Dialog</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { AlertDialog, Button } from "@skeinui/ui";

<AlertDialog>
  <AlertDialog.Trigger render={<Button color="danger" />}>Delete</AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Title>Delete project?</AlertDialog.Title>
    <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
    <AlertDialog.Footer>
      <AlertDialog.Close render={<Button variant="ghost" />}>Cancel</AlertDialog.Close>
      <AlertDialog.Close render={<Button color="danger" />}>Delete</AlertDialog.Close>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog>`}
      >
        <Demo />
      </Example>

      <Example id="sizes" code={`<AlertDialog.Content size="md">…</AlertDialog.Content>`}>
        <div className="pg-flex pg-flex--loose">
          <Demo size="sm" label="sm (default)" />
          <Demo size="md" label="md" />
        </div>
      </Example>

      <Example
        id="controlled"
        code={`<AlertDialog open={open} onOpenChange={setOpen}>…</AlertDialog>`}
      >
        <ControlledDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <p className="pg-desc">{t.rich("api.description")}</p>
        <ApiReference component="AlertDialog" />
        {PARTS.map((part) => (
          <Fragment key={part}>
            <h4>
              <code>{part}</code>
            </h4>
            <ApiReference component={part} />
          </Fragment>
        ))}
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
