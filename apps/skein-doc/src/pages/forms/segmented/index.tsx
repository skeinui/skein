import { Segmented } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "segmented" },
  { key: "thumb", name: "segmented-thumb" },
  { key: "item", name: "segmented-item" },
  { key: "parts", name: "segmented-icon / segmented-label" },
];

const Grid = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
  </svg>
);
const List = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z" />
  </svg>
);

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState("weekly");
  return (
    <div className="pg-stack pg-stack--start">
      <Segmented
        aria-label="Range"
        value={value}
        onValueChange={setValue}
        options={[
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
        ]}
      />
      <p className="pg-desc">
        {t("controlled.value")} <code>{value}</code>
      </p>
    </div>
  );
}

export default function SegmentedPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Segmented</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Segmented } from "@skeinui/ui";

<Segmented aria-label="View" options={["Daily", "Weekly", "Monthly"]} defaultValue="Weekly" />`}
      >
        <Segmented
          aria-label="View"
          options={["Daily", "Weekly", "Monthly"]}
          defaultValue="Weekly"
        />
      </Example>

      <Example
        id="controlled"
        code={`<Segmented
  value={value}
  onValueChange={setValue}
  options={[{ value: "daily", label: "Daily" }, ...]}
/>`}
      >
        <ControlledDemo />
      </Example>

      <Example
        id="icons"
        code={`<Segmented
  options={[
    { value: "list", label: "List", icon: <ListIcon /> },
    { value: "grid", icon: <GridIcon /> }, // icon only: don't forget aria-label
  ]}
/>`}
      >
        <div className="pg-stack pg-stack--start">
          <Segmented
            aria-label="Layout"
            defaultValue="list"
            options={[
              { value: "list", label: "List", icon: <List /> },
              { value: "grid", label: "Grid", icon: <Grid /> },
            ]}
          />
          <Segmented
            aria-label="Icon layout"
            defaultValue="grid"
            options={[
              { value: "list", icon: <List />, title: "List" },
              { value: "grid", icon: <Grid />, title: "Grid" },
            ]}
          />
        </div>
      </Example>

      <Example id="sizes" code={`<Segmented size="sm" options={[...]} />`}>
        <div className="pg-stack pg-stack--start">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Segmented
              key={size}
              size={size}
              aria-label={size}
              defaultValue="B"
              options={["A", "B", "C"]}
            />
          ))}
        </div>
      </Example>

      <Example id="block" code={`<Segmented fullWidth options={[...]} />`}>
        <Segmented
          fullWidth
          aria-label="Full width"
          defaultValue="Two"
          options={["One", "Two", "Three"]}
        />
      </Example>

      <Example
        id="disabled"
        code={`<Segmented disabled ... />
<Segmented options={[{ value: "b", label: "B", disabled: true }, ...]} />`}
      >
        <div className="pg-stack pg-stack--start">
          <Segmented
            disabled
            aria-label="All disabled"
            defaultValue="A"
            options={["A", "B", "C"]}
          />
          <Segmented
            aria-label="One disabled"
            defaultValue="A"
            options={[
              { value: "A", label: "A" },
              { value: "B", label: "B", disabled: true },
              { value: "C", label: "C" },
            ]}
          />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Segmented" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
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
