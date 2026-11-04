import { Button, Form } from "@skeinui/ui";
import type { FormField, FormInstance, FormValues } from "@skeinui/ui";
import { useRef, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The fields of a `FormField`; their descriptions are the page's `field.<key>` messages. */
const FIELD_ROWS = [
  { key: "name", name: "name", type: "string" },
  {
    key: "type",
    name: "type",
    type: "text | password | email | url | tel | search | textarea | number | select | radio | checkbox | checkbox-group | switch | slider | rating | date | time | datetime | segmented | custom",
    default: "'text'",
  },
  { key: "label", name: "label / description / placeholder", type: "ReactNode" },
  { key: "required", name: "required", type: "boolean | string" },
  { key: "rules", name: "minLength / maxLength / min / max / pattern", type: "—" },
  {
    key: "validate",
    name: "validate",
    type: "(value, values) => string | void | Promise<string | void>",
  },
  { key: "messages", name: "messages", type: "Partial<FormMessages>" },
  { key: "dependencies", name: "dependencies", type: "string[]" },
  { key: "hidden", name: "hidden / disabled", type: "boolean | (values) => boolean" },
  { key: "options", name: "options", type: "{ value, label, disabled? }[]" },
  { key: "span", name: "span / defaultValue / props", type: "—" },
  { key: "render", name: "render", type: "(control) => ReactNode" },
];

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "form", name: "form" },
  { key: "fields", name: "form-fields / form-item" },
  { key: "actions", name: "form-actions" },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
function Result({ value }: { value: unknown }) {
  const t = usePageT();
  return (
    <pre className="pg-values">
      {value === undefined ? t("result") : JSON.stringify(value, null, 2)}
    </pre>
  );
}

const SIGNUP: FormField[] = [
  { name: "name", label: "Name", required: true, minLength: 2, placeholder: "Ada Lovelace" },
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    placeholder: "ada@example.com",
    description: "We never share it.",
  },
  { name: "password", label: "Password", type: "password", required: true, minLength: 8 },
  {
    name: "confirm",
    label: "Confirm password",
    type: "password",
    required: true,
    dependencies: ["password"],
    validate: (value, values) => (value === values.password ? undefined : "Passwords do not match"),
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    placeholder: "Pick a role",
    options: [
      { value: "admin", label: "Admin" },
      { value: "editor", label: "Editor" },
      { value: "viewer", label: "Viewer" },
    ],
  },
  {
    name: "agree",
    type: "checkbox",
    label: "I agree to the terms",
    required: "You must agree to continue",
  },
];

function UsageDemo() {
  const [result, setResult] = useState<unknown>();
  return (
    <div className="pg-stack pg-stack--start">
      <div className="pg-form-box">
        <Form
          fields={SIGNUP}
          submitLabel="Create account"
          onSubmit={async (values) => {
            await wait(900);
            setResult(values);
          }}
        />
      </div>
      <Result value={result} />
    </div>
  );
}

const SMALL: FormField[] = [
  { name: "username", label: "Username", required: true },
  { name: "bio", label: "Bio", type: "textarea", props: { rows: 2 }, description: "A few words." },
  { name: "newsletter", type: "switch", label: "Send me the newsletter" },
];

const ADDRESS: FormField[] = [
  { name: "first", label: "First name", required: true },
  { name: "last", label: "Last name", required: true },
  { name: "address", label: "Address", span: 2 },
  { name: "address.city", label: "City" },
  { name: "address.zip", label: "ZIP", pattern: /^\d{6}$/, messages: { pattern: "6 digits" } },
];

const TYPES: FormField[] = [
  { name: "text", label: "Text", placeholder: "text" },
  { name: "number", label: "Number", type: "number", props: { min: 0, max: 10 } },
  { name: "textarea", label: "Textarea", type: "textarea", props: { rows: 2 } },
  {
    name: "select",
    label: "Select",
    type: "select",
    options: [
      { value: "a", label: "Option A" },
      { value: "b", label: "Option B" },
    ],
  },
  {
    name: "radio",
    label: "Radio",
    type: "radio",
    props: { orientation: "horizontal" },
    options: [
      { value: "x", label: "X" },
      { value: "y", label: "Y" },
    ],
  },
  {
    name: "tags",
    label: "Checkbox group",
    type: "checkbox-group",
    options: [
      { value: "1", label: "One" },
      { value: "2", label: "Two" },
      { value: "3", label: "Three" },
    ],
  },
  { name: "checkbox", type: "checkbox", label: "Checkbox" },
  { name: "switch", type: "switch", label: "Switch" },
  { name: "slider", label: "Slider", type: "slider", props: { showValue: true } },
  { name: "rating", label: "Rating", type: "rating" },
  { name: "date", label: "Date", type: "date" },
  { name: "time", label: "Time", type: "time" },
  { name: "datetime", label: "Date and time", type: "datetime" },
  {
    name: "segmented",
    label: "Segmented",
    type: "segmented",
    options: [
      { value: "day", label: "Day" },
      { value: "week", label: "Week" },
      { value: "month", label: "Month" },
    ],
  },
];

function TypesDemo() {
  const [result, setResult] = useState<unknown>();
  return (
    <div className="pg-stack pg-stack--start">
      <div className="pg-form-box">
        <Form fields={TYPES} columns={2} onSubmit={(v) => setResult(v)} />
      </div>
      <Result value={result} />
    </div>
  );
}

function ConditionalDemo() {
  const t = usePageT();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<unknown>();
  const fields: FormField[] = [
    {
      name: "type",
      label: "Account type",
      type: "segmented",
      defaultValue: "personal",
      options: [
        { value: "personal", label: "Personal" },
        { value: "company", label: "Company" },
      ],
    },
    { name: "company", label: "Company name", required: true, hidden: (v) => v.type !== "company" },
    { name: "taxId", label: "Tax ID", required: true, hidden: (v) => v.type !== "company" },
    {
      name: "username",
      label: "Username",
      required: true,
      description: t("conditional.hint"),
    },
  ];
  return (
    <div className="pg-stack pg-stack--start">
      <div className="pg-form-box">
        <Form
          fields={fields}
          errors={errors}
          onValuesChange={(_v, name) => {
            if (name === "username") setErrors({});
          }}
          onSubmit={async (values) => {
            await wait(600);
            if (values.username === "admin") {
              setErrors({ username: "That username is taken" });
              return;
            }
            setResult(values);
          }}
        />
      </div>
      <Result value={result} />
    </div>
  );
}

function InstanceDemo() {
  const ref = useRef<FormInstance>(null);
  const [values, setValues] = useState<FormValues>({});
  return (
    <div className="pg-stack pg-stack--start">
      <div className="pg-form-box">
        <Form
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "body", label: "Body", type: "textarea", props: { rows: 2 } },
          ]}
          instanceRef={ref}
          onValuesChange={(v) => setValues(v)}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() =>
                  ref.current?.setValues({ title: "Hello", body: "Filled from outside" })
                }
              >
                Fill
              </Button>
              <Button variant="outline" onClick={() => void ref.current?.validate()}>
                Validate
              </Button>
              <Button variant="ghost" onClick={() => ref.current?.reset()}>
                Reset
              </Button>
              <Button color="primary" onClick={() => void ref.current?.submit()}>
                Submit
              </Button>
            </>
          }
        />
      </div>
      <Result value={values} />
    </div>
  );
}

export default function FormPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Form</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Form } from "@skeinui/ui";

<Form
  fields={[
    { name: "name", label: "Name", required: true, minLength: 2 },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "confirm", label: "Confirm", type: "password", dependencies: ["password"],
      validate: (value, values) => (value === values.password ? undefined : "Passwords do not match") },
    { name: "role", label: "Role", type: "select", options: [{ value: "admin", label: "Admin" }] },
    { name: "agree", type: "checkbox", label: "I agree", required: "You must agree" },
  ]}
  onSubmit={async (values) => { await api.signUp(values); }}
/>`}
      >
        <UsageDemo />
      </Example>

      <Example
        id="layouts"
        code={`<Form layout="horizontal" … /> // vertical | horizontal | inline`}
      >
        <div className="pg-stack">
          {(["vertical", "horizontal", "inline"] as const).map((layout) => (
            <div key={layout} className="pg-form-box">
              <strong className="pg-desc">{layout}</strong>
              <Form
                layout={layout}
                fields={layout === "inline" ? SMALL.slice(0, 2) : SMALL}
                submitLabel="Save"
              />
            </div>
          ))}
        </div>
      </Example>

      <Example
        id="columns"
        code={`<Form columns={2} fields={[{ name: "address", span: 2 }, …]} />`}
      >
        <div className="pg-form-box pg-form-box--wide">
          <Form columns={2} fields={ADDRESS} resetLabel="Reset" onSubmit={() => undefined} />
        </div>
      </Example>

      <Example
        id="types"
        code={`{ name: "rating", type: "rating" }, { name: "date", type: "date" }, …`}
      >
        <TypesDemo />
      </Example>

      <Example
        id="conditional"
        code={`{ name: "taxId", hidden: (values) => values.type !== "company" }
<Form errors={{ username: "That username is taken" }} … />`}
      >
        <ConditionalDemo />
      </Example>

      <Example
        id="instance"
        code={`const ref = useRef<FormInstance>(null);
<Form instanceRef={ref} … />
ref.current?.setValues({ title: "Hello" }); ref.current?.submit();`}
      >
        <InstanceDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Form" />
      </section>

      <section id="field" className="pg-example">
        <h3>{t("field.title")}</h3>
        <p className="pg-desc">{t.rich("field.description")}</p>
        <PropsTable
          rows={FIELD_ROWS.map((f) => ({
            name: f.name,
            type: f.type,
            default: f.default,
            description: t.rich(`field.${f.key}`),
          }))}
        />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
