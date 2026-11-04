import { useState } from "react";
import { SplitButton, Text } from "@skeinui/ui";
import type { SplitButtonEntry } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component relies on; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [{ key: "composed", name: "button-group / button / menu …" }];

const ITEMS: SplitButtonEntry[] = [
  { key: "draft", label: "Save as draft" },
  { key: "template", label: "Save as template" },
  { key: "copy", label: "Save a copy", disabled: true },
  { type: "separator" },
  { key: "discard", label: "Discard changes", danger: true },
];

function Demo() {
  const t = usePageT();
  const [last, setLast] = useState("—");
  return (
    <div className="pg-stack pg-stack--start">
      <SplitButton
        color="primary"
        items={ITEMS}
        onClick={() => setLast(t("basic.main"))}
        onSelect={(key) => setLast(key)}
      >
        Save
      </SplitButton>
      <Text tone="secondary">{t("basic.last", { action: last })}</Text>
    </div>
  );
}

export default function SplitButtonPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Split Button</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { SplitButton } from "@skeinui/ui";

<SplitButton
  color="primary"
  onClick={save}
  onSelect={(key) => run(key)}
  items={[{ key: "draft", label: "Save as draft" }, { key: "template", label: "Save as template" }]}
>
  Save
</SplitButton>`}
      >
        <Demo />
      </Example>

      <Example
        id="variants"
        code={`<SplitButton variant="outline" size="sm" items={…}>Save</SplitButton>`}
      >
        <div className="pg-stack pg-stack--start">
          <div className="pg-row">
            {(["solid", "outline", "soft", "ghost"] as const).map((variant) => (
              <SplitButton key={variant} variant={variant} color="primary" items={ITEMS}>
                {variant}
              </SplitButton>
            ))}
          </div>
          <div className="pg-row">
            {(["sm", "md", "lg"] as const).map((size) => (
              <SplitButton key={size} size={size} items={ITEMS}>
                {size}
              </SplitButton>
            ))}
          </div>
        </div>
      </Example>

      <Example
        id="danger"
        code={`items={[…, { type: "separator" }, { key: "discard", label: "Discard", danger: true }]}`}
      >
        <SplitButton items={ITEMS}>Menu with danger item</SplitButton>
      </Example>

      <Example
        id="loading"
        code={`<SplitButton loading items={…}>Saving</SplitButton>
<SplitButton disabled items={…}>Save</SplitButton>`}
      >
        <div className="pg-row">
          <SplitButton loading color="primary" items={ITEMS}>
            Saving
          </SplitButton>
          <SplitButton disabled items={ITEMS}>
            Save
          </SplitButton>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="SplitButton" />
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
