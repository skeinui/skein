import { Button, Field, Input, InputGroup, Textarea } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { MailIcon } from "@/doc/icons.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "slot", name: "data-slot", type: "field | field-label | field-description | field-error" },
  { key: "required", name: "data-required", type: "boolean attribute" },
  {
    key: "states",
    name: "data-invalid / data-disabled / data-touched / data-dirty / data-filled",
    type: "boolean attribute",
  },
  {
    key: "transitions",
    name: "data-starting-style / data-ending-style",
    type: "boolean attribute",
  },
];

function ControlledInvalid() {
  const [value, setValue] = useState("ab");
  const invalid = value.length < 3;
  return (
    <Field invalid={invalid} name="username">
      <Field.Label>Username</Field.Label>
      <Input value={value} onValueChange={setValue} />
      <Field.Description>At least 3 characters.</Field.Description>
      <Field.Error match={invalid}>Username must be at least 3 characters.</Field.Error>
    </Field>
  );
}

export default function FieldPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Field</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Field, Input } from "@skeinui/ui";

<Field name="email">
  <Field.Label>Email</Field.Label>
  <Input type="email" placeholder="john@example.com" />
</Field>`}
      >
        <div style={{ width: "min(256px, 100%)" }}>
          <Field name="email">
            <Field.Label>Email</Field.Label>
            <Input type="email" placeholder="john@example.com" />
          </Field>
        </div>
      </Example>

      <Example
        id="anatomy"
        code={`<Field>
  <Field.Label />
  <Input />
  <Field.Description />
  <Field.Error />
</Field>`}
      >
        <div style={{ width: "min(320px, 100%)" }}>
          <Field invalid>
            <Field.Label>Label</Field.Label>
            <Input defaultValue="Control" />
            <Field.Description>Description</Field.Description>
            <Field.Error match>Error</Field.Error>
          </Field>
        </div>
      </Example>

      <DocHeading id="examples" />

      <Example
        id="description"
        code={`<Field name="email">
  <Field.Label>Email</Field.Label>
  <Input type="email" placeholder="john@example.com" />
  <Field.Description>We will never share your email.</Field.Description>
</Field>`}
      >
        <div style={{ width: "min(320px, 100%)" }}>
          <Field name="email">
            <Field.Label>Email</Field.Label>
            <Input type="email" placeholder="john@example.com" />
            <Field.Description>We will never share your email.</Field.Description>
          </Field>
        </div>
      </Example>

      <Example
        id="required"
        code={`<Field required name="name">
  <Field.Label>Name</Field.Label>
  <Input required placeholder="Enter your name" />
</Field>`}
      >
        <div style={{ width: "min(320px, 100%)" }}>
          <Field required name="name">
            <Field.Label>Name</Field.Label>
            <Input required placeholder="Enter your name" />
          </Field>
        </div>
      </Example>

      <Example
        id="validation"
        code={`<Field name="email" validationMode="onBlur">
  <Field.Label>Email</Field.Label>
  <Input type="email" required placeholder="john@example.com" />
  <Field.Error match="valueMissing">Please enter your email.</Field.Error>
  <Field.Error match="typeMismatch">Please enter a valid email.</Field.Error>
</Field>`}
      >
        <div style={{ width: "min(320px, 100%)" }}>
          <Field name="email" required validationMode="onBlur">
            <Field.Label>Email</Field.Label>
            <Input type="email" required placeholder="john@example.com" />
            <Field.Error match="valueMissing">Please enter your email.</Field.Error>
            <Field.Error match="typeMismatch">Please enter a valid email.</Field.Error>
          </Field>
        </div>
      </Example>

      <Example
        id="controlled-invalid"
        code={`const [value, setValue] = useState("ab");
const invalid = value.length < 3;

<Field invalid={invalid}>
  <Field.Label>Username</Field.Label>
  <Input value={value} onValueChange={setValue} />
  <Field.Description>At least 3 characters.</Field.Description>
  <Field.Error match={invalid}>Username must be at least 3 characters.</Field.Error>
</Field>`}
      >
        <div style={{ width: "min(320px, 100%)" }}>
          <ControlledInvalid />
        </div>
      </Example>

      <Example
        id="variants"
        code={`<Field variant="filled" size="lg">
  <Field.Label>Filled, large</Field.Label>
  <Input placeholder="Inherited from Field" />
</Field>`}
      >
        <div className="pg-flex pg-flex--start pg-flex--loose">
          <div style={{ width: "13rem" }}>
            <Field variant="outline" size="sm">
              <Field.Label>Outline, small</Field.Label>
              <Input placeholder="Inherited from Field" />
            </Field>
          </div>
          <div style={{ width: "13rem" }}>
            <Field variant="filled" size="lg">
              <Field.Label>Filled, large</Field.Label>
              <Input placeholder="Inherited from Field" />
            </Field>
          </div>
        </div>
      </Example>

      <Example
        id="textarea"
        code={`<Field name="bio">
  <Field.Label>Bio</Field.Label>
  <Textarea rows={4} placeholder="Tell us about yourself" />
  <Field.Description>Brief description for your profile.</Field.Description>
</Field>`}
      >
        <div style={{ width: "min(420px, 100%)" }}>
          <Field name="bio">
            <Field.Label>Bio</Field.Label>
            <Textarea rows={4} placeholder="Tell us about yourself" />
            <Field.Description>Brief description for your profile.</Field.Description>
          </Field>
        </div>
      </Example>

      <Example
        id="input-group"
        code={`<Field name="website">
  <Field.Label>Website</Field.Label>
  <InputGroup>
    <InputGroup.Prefix>https://</InputGroup.Prefix>
    <InputGroup.Input placeholder="example.com" />
  </InputGroup>
</Field>`}
      >
        <div style={{ width: "min(320px, 100%)" }}>
          <Field name="website">
            <Field.Label>Website</Field.Label>
            <InputGroup>
              <InputGroup.Prefix>https://</InputGroup.Prefix>
              <InputGroup.Input placeholder="example.com" />
            </InputGroup>
            <Field.Description>Without the protocol.</Field.Description>
          </Field>
        </div>
      </Example>

      <Example
        id="disabled"
        code={`<Field disabled>
  <Field.Label>Email</Field.Label>
  <Input defaultValue="john@example.com" />
</Field>`}
      >
        <div style={{ width: "min(320px, 100%)" }}>
          <Field disabled>
            <Field.Label>Email</Field.Label>
            <Input defaultValue="john@example.com" />
            <Field.Description>This field is disabled.</Field.Description>
          </Field>
        </div>
      </Example>

      <Example
        id="form"
        code={`<form>
  <Field required><Field.Label>Email</Field.Label><Input type="email" required /></Field>
  <Field required><Field.Label>Password</Field.Label><Input type="password" required /></Field>
  <Button type="submit">Sign in</Button>
</form>`}
      >
        <form
          className="pg-stack"
          style={{ width: "min(320px, 100%)" }}
          onSubmit={(e) => e.preventDefault()}
        >
          <Field required name="email" validationMode="onBlur">
            <Field.Label>Email</Field.Label>
            <InputGroup>
              <InputGroup.Prefix>
                <MailIcon />
              </InputGroup.Prefix>
              <InputGroup.Input type="email" required placeholder="john@example.com" />
            </InputGroup>
            <Field.Error match="valueMissing">Please enter your email.</Field.Error>
            <Field.Error match="typeMismatch">Please enter a valid email.</Field.Error>
          </Field>
          <Field required name="password" validationMode="onBlur">
            <Field.Label>Password</Field.Label>
            <Input type="password" required placeholder="••••••••" />
            <Field.Error match="valueMissing">Please enter your password.</Field.Error>
          </Field>
          <Button type="submit" fullWidth>
            Sign in
          </Button>
        </form>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>Field</h4>
        <ApiReference component="Field" />
        <h4>Field.Label</h4>
        <p className="pg-desc">{t.rich("api.label")}</p>
        <ApiReference component="Field.Label" />
        <h4>Field.Description</h4>
        <p className="pg-desc">{t.rich("api.desc")}</p>
        <ApiReference component="Field.Description" />
        <h4>Field.Error</h4>
        <p className="pg-desc">{t.rich("api.error")}</p>
        <ApiReference component="Field.Error" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
