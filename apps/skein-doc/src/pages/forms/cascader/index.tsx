import { Cascader, type CascaderOption } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  {
    key: "trigger",
    name: "cascader / cascader-trigger / cascader-value / cascader-icon",
    type: "slot",
  },
  { key: "clear", name: "cascader-clear", type: "slot" },
  { key: "tags", name: "cascader-tags", type: "slot" },
  { key: "search", name: "cascader-search / cascader-columns", type: "slot" },
  { key: "check", name: "cascader-option-check / cascader-spinner", type: "slot" },
  { key: "panel", name: "cascader-panel / cascader-menu", type: "slot" },
  {
    key: "option",
    name: "cascader-option / cascader-option-label / cascader-option-arrow",
    type: "slot",
  },
  { key: "empty", name: "cascader-empty", type: "slot" },
];

const OPTIONS: CascaderOption[] = [
  {
    value: "zhejiang",
    label: "Zhejiang",
    children: [
      {
        value: "hangzhou",
        label: "Hangzhou",
        children: [
          { value: "xihu", label: "West Lake" },
          { value: "xiasha", label: "Xiasha" },
        ],
      },
      {
        value: "ningbo",
        label: "Ningbo",
        children: [{ value: "dongqian", label: "Dongqian Lake" }],
      },
    ],
  },
  {
    value: "jiangsu",
    label: "Jiangsu",
    children: [
      {
        value: "nanjing",
        label: "Nanjing",
        children: [{ value: "zhonghua", label: "Zhonghua Gate" }],
      },
      { value: "suzhou", label: "Suzhou", disabled: true },
    ],
  },
  { value: "beijing", label: "Beijing" },
  { value: "closed", label: "Closed", disabled: true },
];

/** Mock API: returns the next level after a 700ms delay; names containing leaf return empty and become leaves */
const fakeChildren = (path: string[]): Promise<CascaderOption[]> =>
  new Promise((resolve) =>
    window.setTimeout(() => {
      const last = path[path.length - 1]!;
      if (path.length >= 3 || last.includes("leaf")) return resolve([]);
      resolve([
        { value: `${last}-a`, label: `${last} A`, lazy: path.length < 2 },
        { value: `${last}-leaf`, label: `${last} (leaf)` },
      ]);
    }, 700),
  );

const setChildren = (
  list: CascaderOption[],
  path: string[],
  children: CascaderOption[],
): CascaderOption[] =>
  list.map((o) => {
    if (o.value !== path[0]) return o;
    if (path.length === 1) {
      return children.length ? { ...o, children } : { ...o, lazy: false, children: undefined };
    }
    return { ...o, children: setChildren(o.children ?? [], path.slice(1), children) };
  });

function AsyncDemo() {
  const t = usePageT();
  const [options, setOptions] = useState<CascaderOption[]>([
    { value: "north", label: "North", lazy: true },
    { value: "south", label: "South", lazy: true },
  ]);
  const [value, setValue] = useState<string[]>([]);
  return (
    <div className="pg-stack pg-stack--start">
      <Cascader
        aria-label="Async"
        options={options}
        value={value}
        onValueChange={setValue}
        onLoadChildren={async (path) => {
          const children = await fakeChildren(path);
          setOptions((list) => setChildren(list, path, children));
        }}
      />
      <p className="pg-desc">
        {t("controlled.path")} <code>{value.join(" > ") || t("controlled.none")}</code>
      </p>
    </div>
  );
}

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState<string[]>(["zhejiang", "hangzhou", "xihu"]);
  return (
    <div className="pg-stack pg-stack--start">
      <Cascader aria-label="Location" options={OPTIONS} value={value} onValueChange={setValue} />
      <p className="pg-desc">
        {t("controlled.path")} <code>{value.join(" > ") || t("controlled.none")}</code>
      </p>
    </div>
  );
}

export default function CascaderPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Cascader</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Cascader } from "@skeinui/ui";

<Cascader
  aria-label="Location"
  placeholder="Select location"
  options={[
    { value: "zhejiang", label: "Zhejiang", children: [{ value: "hangzhou", label: "Hangzhou" }] },
    { value: "beijing", label: "Beijing" },
  ]}
/>`}
      >
        <Cascader aria-label="Location" placeholder="Select location" options={OPTIONS} />
      </Example>

      <Example
        id="controlled"
        code={`<Cascader value={value} onValueChange={setValue} options={options} />`}
      >
        <ControlledDemo />
      </Example>

      <Example id="hover" code={`<Cascader expandTrigger="hover" … />`}>
        <Cascader aria-label="Hover" expandTrigger="hover" options={OPTIONS} />
      </Example>

      <Example id="change-on-select" code={`<Cascader changeOnSelect … />`}>
        <Cascader aria-label="Any level" changeOnSelect options={OPTIONS} />
      </Example>

      <Example
        id="multiple"
        code={`<Cascader multiple clearable maxTagCount={2} onValueChange={(paths) => … /* string[][] */} … />`}
      >
        <Cascader
          aria-label="Multiple"
          multiple
          clearable
          maxTagCount={2}
          options={OPTIONS}
          defaultValue={[
            ["zhejiang", "hangzhou", "xihu"],
            ["zhejiang", "ningbo", "dongqian"],
            ["beijing"],
          ]}
        />
      </Example>

      <Example id="search" code={`<Cascader searchable … />`}>
        <div className="pg-row">
          <Cascader aria-label="Searchable" searchable options={OPTIONS} />
          <Cascader aria-label="Searchable multiple" searchable multiple options={OPTIONS} />
        </div>
      </Example>

      <Example
        id="async"
        code={`<Cascader
  options={options}
  onLoadChildren={async (path) => {
    const children = await fetchChildren(path);
    setOptions((list) => setChildren(list, path, children));
  }}
/>
// in options: { value: "north", label: "North", lazy: true }`}
      >
        <AsyncDemo />
      </Example>

      <Example id="clearable" code={`<Cascader clearable defaultValue={["beijing"]} … />`}>
        <Cascader aria-label="Clearable" clearable defaultValue={["beijing"]} options={OPTIONS} />
      </Example>

      <Example id="variants" code={`<Cascader variant="filled" size="lg" … />`}>
        <div className="pg-row">
          <Cascader aria-label="Filled" variant="filled" options={OPTIONS} />
          {(["sm", "md", "lg"] as const).map((size) => (
            <Cascader
              key={size}
              aria-label={size}
              size={size}
              options={OPTIONS}
              defaultValue={["beijing"]}
            />
          ))}
        </div>
      </Example>

      <Example id="invalid" code={`<Cascader invalid />\n<Cascader disabled />`}>
        <div className="pg-row">
          <Cascader aria-label="Invalid" invalid options={OPTIONS} />
          <Cascader aria-label="Disabled" disabled options={OPTIONS} defaultValue={["beijing"]} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Cascader" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({ ...h, description: t.rich(`styling.${h.key}`) }))}
        />
      </section>
    </article>
  );
}
