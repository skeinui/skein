import { Button, DIALOG_SIZES, Dialog } from "@skeinui/ui";
import { Fragment, useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "backdrop", name: "dialog-backdrop" },
  { key: "viewport", name: "dialog-viewport" },
  { key: "dialog", name: "dialog" },
  { key: "parts", name: "dialog-title / description / body / footer" },
  { key: "close", name: "dialog-close" },
];

/** The parts with props of their own, each with an API table. */
const PARTS = ["Dialog.Trigger", "Dialog.Content", "Dialog.Close"];

function ControlledDemo() {
  const t = usePageT();
  const [open, setOpen] = useState(false);
  return (
    <div className="pg-stack pg-stack--start">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open controlled
      </Button>
      <p className="pg-desc">
        open: <code>{String(open)}</code>
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Content>
          <Dialog.Title>Controlled</Dialog.Title>
          <Dialog.Body>{t("controlled.body")}</Dialog.Body>
          <Dialog.Footer>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

export default function DialogPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Dialog</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Button, Dialog } from "@skeinui/ui";

<Dialog>
  <Dialog.Trigger render={<Button variant="outline" />}>Open dialog</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Delete project</Dialog.Title>
    <Dialog.Description>This action cannot be undone.</Dialog.Description>
    <Dialog.Footer>
      <Dialog.Close render={<Button variant="ghost" />}>Cancel</Dialog.Close>
      <Dialog.Close render={<Button color="danger" />}>Delete</Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>`}
      >
        <Dialog>
          <Dialog.Trigger render={<Button variant="outline" />}>Open dialog</Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>Delete project</Dialog.Title>
            <Dialog.Description>This action cannot be undone.</Dialog.Description>
            <Dialog.Footer>
              <Dialog.Close render={<Button variant="ghost" />}>Cancel</Dialog.Close>
              <Dialog.Close render={<Button color="danger" />}>Delete</Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </Example>

      <DocHeading id="examples" />

      <Example id="sizes" code={`<Dialog.Content size="lg">…</Dialog.Content>`}>
        <div className="pg-flex pg-flex--loose">
          {DIALOG_SIZES.map((size) => (
            <Dialog key={size}>
              <Dialog.Trigger render={<Button variant="outline" />}>{size}</Dialog.Trigger>
              <Dialog.Content size={size}>
                <Dialog.Title>Size {size}</Dialog.Title>
                <Dialog.Body>{t("sizes.body", { size })}</Dialog.Body>
                <Dialog.Footer>
                  <Dialog.Close render={<Button />}>Close</Dialog.Close>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog>
          ))}
        </div>
      </Example>

      <Example
        id="controlled"
        code={`const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>…</Dialog>`}
      >
        <ControlledDemo />
      </Example>

      <Example id="no-close-button" code={`<Dialog.Content closeButton={false}>…</Dialog.Content>`}>
        <Dialog>
          <Dialog.Trigger render={<Button variant="outline" />}>Open</Dialog.Trigger>
          <Dialog.Content closeButton={false}>
            <Dialog.Title>No close icon</Dialog.Title>
            <Dialog.Body>{t("no-close-button.body")}</Dialog.Body>
            <Dialog.Footer>
              <Dialog.Close render={<Button />}>OK</Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </Example>

      <Example id="scrolling" code={`<Dialog.Body>…long content…</Dialog.Body>`}>
        <Dialog>
          <Dialog.Trigger render={<Button variant="outline" />}>Long content</Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>Terms</Dialog.Title>
            <Dialog.Body>
              {Array.from({ length: 14 }, (_, i) => (
                <p key={i} style={{ margin: "0 0 12px" }}>
                  Paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              ))}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.Close render={<Button />}>Accept</Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Dialog" />
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
            type: "slot",
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
