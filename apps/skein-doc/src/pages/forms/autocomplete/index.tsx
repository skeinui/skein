import { Autocomplete, Field } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "input", name: "input-group / input-group-input" },
  { key: "popup", name: "select-positioner / select / select-list / select-item …" },
  { key: "empty", name: "combobox-empty" },
];

const TAGS = ["react", "react-dom", "redux", "remix", "relay", "recoil", "rxjs", "vite", "vitest"];

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState("re");
  return (
    <div className="pg-stack pg-stack--start">
      <Autocomplete aria-label="Controlled" items={TAGS} value={value} onValueChange={setValue} />
      <p className="pg-desc">
        {t("controlled.text")} <code>{value}</code>
      </p>
    </div>
  );
}

export default function AutocompletePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Autocomplete</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Autocomplete } from "@skeinui/ui";

<Autocomplete placeholder="Search tags" items={["react", "redux", "remix"]} />`}
      >
        <Autocomplete
          aria-label={t("usage.label")}
          placeholder={t("usage.placeholder")}
          items={TAGS}
        />
      </Example>

      <Example
        id="controlled"
        code={`const [value, setValue] = useState("");

<Autocomplete value={value} onValueChange={setValue} items={tags} />`}
      >
        <ControlledDemo />
      </Example>

      <Example id="variants" code={`<Autocomplete variant="filled" size="lg" … />`}>
        <div className="pg-stack pg-stack--start">
          <Autocomplete aria-label="Small" size="sm" placeholder="Small" items={TAGS} />
          <Autocomplete aria-label="Filled" variant="filled" placeholder="Filled" items={TAGS} />
          <Autocomplete aria-label="Large" size="lg" placeholder="Large" items={TAGS} />
        </div>
      </Example>

      <Example
        id="in-field"
        code={`<Field><Field.Label>Tag</Field.Label><Autocomplete … /></Field>`}
      >
        <Field>
          <Field.Label>{t("in-field.label")}</Field.Label>
          <Autocomplete
            placeholder={t("in-field.placeholder")}
            items={TAGS}
            emptyText={t("in-field.empty")}
          />
          <Field.Description>{t("in-field.hint")}</Field.Description>
        </Field>
      </Example>

      <Example
        id="disabled"
        code={`<Autocomplete disabled … />
<Autocomplete invalid … />`}
      >
        <div className="pg-stack pg-stack--start">
          <Autocomplete aria-label="Disabled" disabled placeholder="Disabled" items={TAGS} />
          <Autocomplete aria-label="Invalid" invalid placeholder="Invalid" items={TAGS} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Autocomplete" />
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
