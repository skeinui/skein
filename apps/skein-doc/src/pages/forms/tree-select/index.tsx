import { useState } from "react";
import { TreeSelect } from "@skeinui/ui";
import type { TreeSelectNode } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "treeselect", type: "slot" },
  { key: "trigger", name: "treeselect-trigger", type: "slot" },
  {
    key: "parts",
    name: "treeselect-value / treeselect-icon / treeselect-tags / treeselect-clear",
    type: "slot",
  },
  { key: "panel", name: "treeselect-panel / treeselect-search / treeselect-tree", type: "slot" },
];

const NODES: TreeSelectNode[] = [
  {
    id: "zj",
    label: "Zhejiang",
    children: [
      { id: "hz", label: "Hangzhou", children: [{ id: "xh", label: "West Lake" }] },
      { id: "nb", label: "Ningbo" },
    ],
  },
  {
    id: "js",
    label: "Jiangsu",
    children: [
      { id: "nj", label: "Nanjing" },
      { id: "sz", label: "Suzhou", disabled: true },
    ],
  },
  { id: "bj", label: "Beijing" },
];

function LazyDemo() {
  const [nodes, setNodes] = useState<TreeSelectNode[]>([
    { id: "a", label: "Remote group", lazy: true },
    { id: "b", label: "Local item" },
  ]);
  return (
    <TreeSelect
      aria-label="Lazy"
      nodes={nodes}
      onLoadChildren={async (id) => {
        await new Promise((r) => setTimeout(r, 600));
        setNodes((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  lazy: false,
                  children: [
                    { id: "a1", label: "Loaded 1" },
                    { id: "a2", label: "Loaded 2" },
                  ],
                }
              : n,
          ),
        );
      }}
    />
  );
}

export default function TreeSelectPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Tree Select</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { TreeSelect } from "@skeinui/ui";

<TreeSelect aria-label="City" nodes={[{ id: "zj", label: "Zhejiang", children: [...] }]} />`}
      >
        <TreeSelect
          aria-label="City"
          nodes={NODES}
          placeholder={t("basic.placeholder")}
          defaultExpandAll
        />
      </Example>

      <Example id="multiple" code={`<TreeSelect multiple maxTagCount={2} nodes={…} />`}>
        <TreeSelect
          aria-label="Cities"
          multiple
          maxTagCount={2}
          nodes={NODES}
          defaultExpandAll
          defaultValue={["xh", "nb", "nj"]}
          placeholder={t("multiple.placeholder")}
        />
      </Example>

      <Example id="search" code={`<TreeSelect searchable clearable nodes={…} />`}>
        <TreeSelect aria-label="Searchable" searchable clearable nodes={NODES} defaultValue="bj" />
      </Example>

      <Example id="lazy" code={`<TreeSelect nodes={nodes} onLoadChildren={async (id) => { … }} />`}>
        <LazyDemo />
      </Example>

      <Example
        id="states"
        code={`<TreeSelect size="sm" /> <TreeSelect invalid /> <TreeSelect disabled />`}
      >
        <div className="pg-row">
          <TreeSelect aria-label="Small" size="sm" nodes={NODES} />
          <TreeSelect aria-label="Large" size="lg" nodes={NODES} />
          <TreeSelect aria-label="Filled" variant="filled" nodes={NODES} />
          <TreeSelect aria-label="Invalid" invalid nodes={NODES} />
          <TreeSelect aria-label="Disabled" disabled nodes={NODES} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="TreeSelect" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
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
