import { Button, ConfirmDialog, Input } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

function AsyncDemo() {
  const t = usePageT();
  const [fail, setFail] = useState(true);
  const [log, setLog] = useState("—");
  return (
    <div className="pg-stack pg-stack--start">
      <ConfirmDialog
        trigger={
          <Button color="danger" variant="outline">
            Delete (1s request)
          </Button>
        }
        title="Delete project?"
        description="The request takes one second."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 1000));
          if (fail) {
            setFail(false);
            setLog("failed — dialog stays open, click again to retry");
            throw new Error("network");
          }
          setLog("deleted");
          setFail(true);
        }}
      />
      <p className="pg-desc">
        {t("async.hint")} <code>{log}</code>
      </p>
    </div>
  );
}

function BodyDemo() {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button color="danger" variant="outline" onClick={() => setOpen(true)}>
        Delete workspace
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setName("");
        }}
        title="Delete workspace?"
        description='Type "acme" to confirm.'
        tone="danger"
        confirmLabel="Delete"
        onConfirm={() => setOpen(false)}
      >
        <Input aria-label="Workspace name" value={name} onValueChange={setName} fullWidth />
      </ConfirmDialog>
    </>
  );
}

export default function ConfirmDialogPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Confirm Dialog</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ConfirmDialog, Button } from "@skeinui/ui";

<ConfirmDialog
  trigger={<Button color="danger">Delete</Button>}
  title="Delete project?"
  description="This cannot be undone."
  confirmLabel="Delete"
  tone="danger"
  onConfirm={() => remove(id)}
/>`}
      >
        <ConfirmDialog
          trigger={
            <Button color="danger" variant="outline">
              Delete
            </Button>
          }
          title="Delete project?"
          description="This cannot be undone."
          confirmLabel="Delete"
          tone="danger"
        />
      </Example>

      <Example
        id="async"
        code={`<ConfirmDialog
  onConfirm={async () => {
    await api.remove(id); // the button spins meanwhile; closes on success, stays open if it throws
  }}
/>`}
      >
        <AsyncDemo />
      </Example>

      <Example
        id="body"
        code={`<ConfirmDialog open={open} onOpenChange={setOpen} title="…">
  <Input value={name} onValueChange={setName} />
</ConfirmDialog>`}
      >
        <BodyDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ConfirmDialog" />
        <p className="pg-desc">{t.rich("api.note")}</p>
      </section>
    </article>
  );
}
