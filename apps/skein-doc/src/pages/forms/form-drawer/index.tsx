import { useState } from "react";
import { Button, FormDrawer, toast } from "@skeinui/ui";
import type { FormField } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component relies on; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [{ key: "composed", name: "drawer / form / button …" }];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ROLES = ["admin", "editor", "viewer"].map((r) => ({ value: r, label: r }));

function Usage() {
  const t = usePageT();
  const [open, setOpen] = useState(false);
  const fields: FormField[] = [
    { name: "name", label: t("field.name"), required: true, minLength: 2 },
    { name: "email", label: t("field.email"), type: "email", required: true },
    { name: "role", label: t("field.role"), type: "select", options: ROLES },
  ];
  return (
    <>
      <Button onClick={() => setOpen(true)}>{t("usage.open")}</Button>
      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title={t("usage.heading")}
        description={t("usage.about")}
        fields={fields}
        defaultValues={{ role: "viewer" }}
        onSubmit={async (values) => {
          await wait(700); // the save: Save spins and Cancel is off meanwhile
          toast.success(t("usage.saved", { name: String(values.name) }));
          setOpen(false); // closing is yours: a failed save keeps the drawer open
        }}
      />
    </>
  );
}

const PERSON = { name: "Ada Lin", email: "ada@example.com", role: "admin" };

function Edit() {
  const t = usePageT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("edit.open")}
      </Button>
      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title={t("edit.heading")}
        fields={[
          { name: "name", label: t("field.name"), required: true },
          { name: "email", label: t("field.email"), type: "email", required: true },
          { name: "role", label: t("field.role"), type: "select", options: ROLES },
        ]}
        defaultValues={PERSON}
        submitLabel={t("edit.save")}
        onSubmit={() => setOpen(false)}
      />
    </>
  );
}

function Conditional() {
  const t = usePageT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("conditional.open")}
      </Button>
      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title={t("conditional.heading")}
        size="lg"
        fields={[
          { name: "title", label: t("field.title"), required: true },
          { name: "reply", label: t("field.reply"), type: "switch" },
          {
            name: "body",
            label: t("field.body"),
            type: "textarea",
            required: true,
            // not shown, not checked and not submitted until the switch is on
            hidden: (values) => !values.reply,
          },
        ]}
        onSubmit={() => setOpen(false)}
      />
    </>
  );
}

export default function FormDrawerPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Form Drawer</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { FormDrawer } from "@skeinui/ui";

<FormDrawer
  open={open}
  onOpenChange={setOpen}
  title="New person"
  fields={[
    { name: "name", label: "Name", required: true, minLength: 2 },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "role", label: "Role", type: "select", options: roles },
  ]}
  defaultValues={{ role: "viewer" }}
  onSubmit={async (values) => {
    await save(values); // Save spins until this settles
    setOpen(false); // closing is yours: a failed save keeps the drawer open
  }}
/>`}
      >
        <Usage />
      </Example>

      <Example
        id="edit"
        code={`<FormDrawer
  open={open}
  onOpenChange={setOpen}
  title="Edit person"
  fields={fields}
  defaultValues={person}
  submitLabel="Save changes"
  onSubmit={update}
/>`}
      >
        <Edit />
      </Example>

      <Example
        id="conditional"
        code={`fields={[
  { name: "title", label: "Title", required: true },
  { name: "reply", label: "Send a reply", type: "switch" },
  { name: "body", label: "Reply", type: "textarea", required: true, hidden: (values) => !values.reply },
]}`}
      >
        <Conditional />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="FormDrawer" />
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
