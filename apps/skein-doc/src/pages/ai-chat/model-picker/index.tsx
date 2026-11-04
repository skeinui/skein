import { Composer, ModelPicker, type ModelOption } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "trigger", name: "model-picker-trigger" },
  { key: "triggerParts", name: "model-picker-name / -icon / -caret" },
  { key: "item", name: "model-picker-item-icon / -body / -name / -badge / -description" },
];

const Dot = (c: string) => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="6" fill={c} />
  </svg>
);

type T = ReturnType<typeof usePageT>;

const models = (t: T): ModelOption[] => [
  {
    id: "fast",
    name: "Fast",
    description: t("models.fast"),
    badge: "New",
    icon: Dot("#16a34a"),
  },
  {
    id: "smart",
    name: "Smart",
    description: t("models.smart"),
    icon: Dot("#4f46e5"),
  },
  {
    id: "legacy",
    name: "Legacy",
    description: t("models.legacy"),
    disabled: true,
    icon: Dot("#a1a1aa"),
  },
];

const grouped = (t: T): ModelOption[] => [
  { id: "a-small", name: "Atlas Small", description: t("models.atlasSmall"), group: "Atlas" },
  {
    id: "a-large",
    name: "Atlas Large",
    description: t("models.atlasLarge"),
    badge: "Beta",
    group: "Atlas",
  },
  { id: "b-chat", name: "Borealis Chat", description: t("models.borealis"), group: "Borealis" },
];

function Demo({ models }: { models: ModelOption[] }) {
  const t = usePageT();
  const [id, setId] = useState(models[0]!.id);
  return (
    <div>
      <ModelPicker models={models} value={id} onValueChange={setId} side="bottom" />
      <p>{t("usage.current", { id })}</p>
    </div>
  );
}

function ComposerDemo() {
  const t = usePageT();
  const [id, setId] = useState("fast");
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <Composer onSubmit={() => {}}>
        <Composer.Shell>
          <Composer.TextArea placeholder={t("composer.placeholder")} />
          <Composer.Toolbar>
            <Composer.ToolbarStart>
              <ModelPicker models={models(t)} value={id} onValueChange={setId} />
            </Composer.ToolbarStart>
            <Composer.ToolbarEnd>
              <Composer.Send />
            </Composer.ToolbarEnd>
          </Composer.Toolbar>
        </Composer.Shell>
      </Composer>
    </div>
  );
}

export default function ModelPickerPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Model Picker</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ModelPicker } from "@skeinui/ui";

<ModelPicker
  models={[{ id: "fast", name: "Fast", description: "Quick answers", badge: "New" }]}
  value={model}
  onValueChange={setModel}
/>`}
      >
        <Demo models={models(t)} />
      </Example>

      <Example
        id="groups"
        code={`<ModelPicker models={[{ id: "a", name: "Atlas Small", group: "Atlas" }, …]} />`}
      >
        <Demo models={grouped(t)} />
      </Example>

      <Example
        id="composer"
        code={`<Composer.ToolbarStart>
  <ModelPicker models={models} value={model} onValueChange={setModel} />
</Composer.ToolbarStart>`}
      >
        <ComposerDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ModelPicker" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
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
