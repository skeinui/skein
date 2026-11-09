import { useId, useState } from "react";
import type { ReactNode } from "react";
import type { DialogSize, DrawerSize } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { Button } from "../button/index.ts";
import { Dialog } from "../dialog/index.ts";
import { Drawer } from "../drawer/index.ts";
import { Form } from "../form/index.ts";
import type { FormProps, FormValues } from "../form/index.ts";

/** The props of `Form` that a form panel passes on. */
type FormPassthrough =
  | "fields"
  | "defaultValues"
  | "values"
  | "onValuesChange"
  | "errors"
  | "validateOn"
  | "layout"
  | "columns"
  | "variant"
  | "disabled"
  | "messages"
  | "instanceRef";

/** What a form in a drawer or a dialog takes: the form's own props, and the panel around it. */
export interface FormPanelProps extends Pick<FormProps, FormPassthrough> {
  /** Whether the panel is open. */
  open: boolean;
  /** Called when the panel asks to close (Esc, the close button, the backdrop, Cancel). It is never closed by a submit: do that in `onSubmit` once the save worked. */
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /**
   * Called with the values once they pass validation. While the promise it returns is pending, the button spins and
   * Cancel is disabled; if it rejects the panel stays open.
   */
  onSubmit: (values: FormValues) => unknown;
  /** Text of the submit button; defaults to the locale's "Save". */
  submitLabel?: ReactNode;
  /** Text of the cancel button; defaults to the locale's "Cancel". */
  cancelLabel?: ReactNode;
  /** Size step of the fields. */
  fieldSize?: FormProps["size"];
}

export interface FormDrawerProps extends FormPanelProps {
  /** Width of the drawer. */
  size?: DrawerSize;
}

export interface FormDialogProps extends FormPanelProps {
  /** Width of the dialog. */
  size?: DialogSize;
}

/** The form with the buttons that go with it: Cancel, and Save, which is outside the `<form>` and submits it by `form={id}`. */
function useFormPanel({
  onSubmit,
  onOpenChange,
}: Pick<FormPanelProps, "onSubmit" | "onOpenChange">) {
  const id = useId();
  const [saving, setSaving] = useState(false);
  const submit = async (values: FormValues) => {
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  };
  return { id, saving, submit, close: () => onOpenChange(false) };
}

function PanelForm({
  id,
  submit,
  size,
  ...form
}: Pick<FormProps, FormPassthrough> & {
  id: string;
  submit: (values: FormValues) => Promise<void>;
  size?: FormProps["size"];
}) {
  return <Form {...form} id={id} size={size} actions={false} onSubmit={submit} />;
}

/**
 * A form in a drawer: the title, the fields (a `Form`) in the scrolling body, and Cancel and Save in the footer, which stays
 * in view. `fields` describe the form as for `Form`; `onSubmit` gets the values once they are valid. The drawer starts
 * from `defaultValues` every time it opens; give it a `key` when it edits another record without closing in between.
 *
 * Theme style: it is Drawer, Form and Button together and has no slot of its own.
 */
export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel,
  cancelLabel,
  size = "md",
  fieldSize,
  ...form
}: FormDrawerProps) {
  const t = useLabels("formDrawer");
  const { id, saving, submit, close } = useFormPanel({ onSubmit, onOpenChange });
  return (
    <Drawer open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Drawer.Content size={size}>
        <Drawer.Title>{title}</Drawer.Title>
        {description ? <Drawer.Description>{description}</Drawer.Description> : null}
        <Drawer.Body>
          <PanelForm {...form} id={id} submit={submit} size={fieldSize} />
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="ghost" color="neutral" disabled={saving} onClick={close}>
            {cancelLabel ?? t.cancel}
          </Button>
          <Button type="submit" form={id} color="primary" loading={saving} disabled={form.disabled}>
            {submitLabel ?? t.submit}
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

/**
 * A form in a dialog: the same as `FormDrawer`, centered on the page. Use it for a few fields; a longer form is better in
 * a drawer.
 *
 * Theme style: it is Dialog, Form and Button together and has no slot of its own.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel,
  cancelLabel,
  size = "md",
  fieldSize,
  ...form
}: FormDialogProps) {
  const t = useLabels("formDrawer");
  const { id, saving, submit, close } = useFormPanel({ onSubmit, onOpenChange });
  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Content size={size}>
        <Dialog.Title>{title}</Dialog.Title>
        {description ? <Dialog.Description>{description}</Dialog.Description> : null}
        <Dialog.Body>
          <PanelForm {...form} id={id} submit={submit} size={fieldSize} />
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="ghost" color="neutral" disabled={saving} onClick={close}>
            {cancelLabel ?? t.cancel}
          </Button>
          <Button type="submit" form={id} color="primary" loading={saving} disabled={form.disabled}>
            {submitLabel ?? t.submit}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
