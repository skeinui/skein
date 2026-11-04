import { Transfer, type TransferItem } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "transfer / transfer-actions", type: "slot" },
  { key: "list", name: "transfer-list", type: "slot" },
  {
    key: "header",
    name: "transfer-header / transfer-title / transfer-count / transfer-search",
    type: "slot",
  },
  {
    key: "body",
    name: "transfer-body / transfer-item / transfer-label / transfer-empty",
    type: "slot",
  },
];

const FRUITS: TransferItem[] = [
  { key: "apple", label: "Apple" },
  { key: "banana", label: "Banana" },
  { key: "cherry", label: "Cherry", disabled: true },
  { key: "date", label: "Date" },
  { key: "elderberry", label: "Elderberry" },
  { key: "fig", label: "Fig" },
  { key: "grape", label: "Grape" },
  { key: "honeydew", label: "Honeydew" },
];

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState<string[]>(["banana", "fig"]);
  return (
    <div className="pg-stack pg-stack--start">
      <Transfer
        aria-label="Fruits"
        items={FRUITS}
        value={value}
        onValueChange={setValue}
        titles={[t("controlled.available"), t("controlled.chosen")]}
      />
      <p className="pg-desc">
        {t("controlled.value")} <code>{value.join(", ") || t("controlled.none")}</code>
      </p>
    </div>
  );
}

export default function TransferPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Transfer</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Transfer } from "@skeinui/ui";

<Transfer
  items={[{ key: "apple", label: "Apple" }, { key: "banana", label: "Banana" }]}
  defaultValue={["banana"]}
/>`}
      >
        <Transfer aria-label="Fruits" items={FRUITS} defaultValue={["banana"]} />
      </Example>

      <Example
        id="controlled"
        code={`<Transfer items={items} value={value} onValueChange={setValue} titles={["Available", "Chosen"]} />`}
      >
        <ControlledDemo />
      </Example>

      <Example id="search" code={`<Transfer searchable … />`}>
        <Transfer aria-label="Searchable" items={FRUITS} searchable defaultValue={["date"]} />
      </Example>

      <Example id="one-way" code={`<Transfer oneWay … />`}>
        <Transfer aria-label="One way" items={FRUITS} oneWay defaultValue={["apple", "grape"]} />
      </Example>

      <Example id="sizes" code={`<Transfer size="sm" … />`}>
        <div className="pg-stack pg-stack--start">
          {(["sm", "lg"] as const).map((size) => (
            <Transfer key={size} aria-label={size} size={size} items={FRUITS.slice(0, 4)} />
          ))}
        </div>
      </Example>

      <Example id="disabled" code={`<Transfer disabled … />`}>
        <Transfer
          aria-label="Disabled"
          disabled
          items={FRUITS.slice(0, 4)}
          defaultValue={["apple"]}
        />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Transfer" />
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
