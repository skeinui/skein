import { COLORS, TOGGLE_VARIANTS, Toggle, ToggleGroup, type ToggleGroupProps } from "@skeinui/ui";
import { useState } from "react";
import { AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon, AlignRightIcon } from "@/doc/icons.tsx";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "slot", name: "toggle / toggle-group", type: "slot" },
  { key: "pressed", name: "data-pressed", type: "state" },
  { key: "group", name: "data-attached / data-orientation", type: "state" },
];

const BoldIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" />
  </svg>
);

function AlignDemo(props: Omit<ToggleGroupProps, "children">) {
  const [value, setValue] = useState<string[]>(["left"]);
  return (
    <ToggleGroup value={value} onValueChange={(v) => setValue([...v])} {...props}>
      <Toggle value="left" iconOnly aria-label="Left">
        <AlignLeftIcon />
      </Toggle>
      <Toggle value="center" iconOnly aria-label="Center">
        <AlignCenterIcon />
      </Toggle>
      <Toggle value="right" iconOnly aria-label="Right">
        <AlignRightIcon />
      </Toggle>
      <Toggle value="justify" iconOnly aria-label="Justify">
        <AlignJustifyIcon />
      </Toggle>
    </ToggleGroup>
  );
}

export default function TogglePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Toggle</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Toggle } from "@skeinui/ui";

<Toggle value="bold" aria-label="Bold"><BoldIcon /></Toggle>`}
      >
        <Toggle value="bold" aria-label="Bold" iconOnly>
          <BoldIcon />
        </Toggle>
      </Example>

      <Example
        id="variants"
        code={`<Toggle variant="ghost" />
<Toggle variant="outline" />
<Toggle variant="soft" />`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          {TOGGLE_VARIANTS.map((v) => (
            <Toggle key={v} value={v} variant={v} defaultPressed>
              {v}
            </Toggle>
          ))}
        </div>
      </Example>

      <Example id="colors" code={`<Toggle color="primary" defaultPressed>…</Toggle>`}>
        <div className="pg-flex pg-flex--center pg-flex--loose">
          {COLORS.map((c) => (
            <Toggle key={c} value={c} color={c} variant="outline" defaultPressed>
              {c}
            </Toggle>
          ))}
        </div>
      </Example>

      <Example id="sizes" code={`<Toggle size="sm">…</Toggle>`}>
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Toggle value="s" size="sm" variant="outline">
            Small
          </Toggle>
          <Toggle value="m" size="md" variant="outline">
            Medium
          </Toggle>
          <Toggle value="l" size="lg" variant="outline">
            Large
          </Toggle>
        </div>
      </Example>

      <Example
        id="group"
        code={`<ToggleGroup defaultValue={["left"]}>
  <Toggle value="left" iconOnly aria-label="Left"><AlignLeftIcon /></Toggle>
  …
</ToggleGroup>`}
      >
        <AlignDemo />
      </Example>

      <Example id="attached" code={`<ToggleGroup attached variant="outline">…</ToggleGroup>`}>
        <AlignDemo attached variant="outline" />
      </Example>

      <Example id="multiple" code={`<ToggleGroup multiple>…</ToggleGroup>`}>
        <AlignDemo multiple color="primary" variant="soft" />
      </Example>

      <Example id="vertical" code={`<ToggleGroup orientation="vertical" attached>…</ToggleGroup>`}>
        <AlignDemo orientation="vertical" attached variant="outline" />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>Toggle</h4>
        <ApiReference component="Toggle" />
        <h4>ToggleGroup</h4>
        <ApiReference component="ToggleGroup" />
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
