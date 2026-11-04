import { Input, Tree, moveTreeNode, type TreeNode } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "tree / tree-group", type: "slot" },
  { key: "item", name: "tree-item", type: "slot" },
  { key: "row", name: "tree-row", type: "slot" },
  { key: "parts", name: "tree-toggle / tree-checkbox / tree-icon / tree-label", type: "slot" },
  { key: "spinner", name: "tree-spinner", type: "slot" },
  { key: "match", name: "tree-match / tree-empty", type: "slot" },
  { key: "drag", name: "data-dragging / data-drop", type: "attribute" },
];

const FILES: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "components",
        label: "components",
        children: [
          { id: "button", label: "button.tsx" },
          { id: "input", label: "input.tsx" },
        ],
      },
      { id: "index", label: "index.ts" },
      { id: "legacy", label: "legacy.ts", disabled: true },
    ],
  },
  { id: "pkg", label: "package.json" },
  { id: "readme", label: "README.md" },
];

const FolderOpenIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="m6.379 4.5-.44-.44-.621-.62A1.5 1.5 0 0 0 4.258 3H3a1.5 1.5 0 0 0-1.5 1.5v5.25l1.376-2.293A3 3 0 0 1 5.45 6h7.05A1.5 1.5 0 0 0 11 4.5zM14 6.026V6a3 3 0 0 0-3-3H7l-.621-.621A3 3 0 0 0 4.257 1.5H3a3 3 0 0 0-3 3V11a3 3 0 0 0 3 3h8.301a3 3 0 0 0 2.573-1.457l1.791-2.985A2.35 2.35 0 0 0 14 6.026M10 12.5h1.301a1.5 1.5 0 0 0 1.287-.728l1.791-2.986 1.286.772-1.286-.772a.85.85 0 0 0-.728-1.286H5.449a1.5 1.5 0 0 0-1.287.728l-1.791 2.986a.85.85 0 0 0 .728 1.286z"
    />
  </svg>
);
const FolderIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="m6.44 4.06.439.44H12.5A1.5 1.5 0 0 1 14 6v5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11V4.5A1.5 1.5 0 0 1 3.5 3h1.257a1.5 1.5 0 0 1 1.061.44zM.5 4.5a3 3 0 0 1 3-3h1.257a3 3 0 0 1 2.122.879L7.5 3h5a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3zm4.25 2a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5z"
    />
  </svg>
);
const FileIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 13.5h6a1.5 1.5 0 0 0 1.5-1.5V7.243a1.5 1.5 0 0 0-.44-1.061L8.819 2.939a1.5 1.5 0 0 0-1.06-.439H5A1.5 1.5 0 0 0 3.5 4v8A1.5 1.5 0 0 0 5 13.5m9-6.257a3 3 0 0 0-.879-2.122L9.88 1.88A3 3 0 0 0 7.757 1H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3z"
    />
  </svg>
);

/** Folders change icon as they expand / collapse, files use a file icon */
const withIcons = (list: TreeNode[]): TreeNode[] =>
  list.map((n) => ({
    ...n,
    icon: n.children
      ? ({ expanded }) => (expanded ? <FolderOpenIcon /> : <FolderIcon />)
      : () => <FileIcon />,
    children: n.children ? withIcons(n.children) : undefined,
  }));

/** The permission tree; labels are the page's `checkable.<id>` messages. */
const permissions = (t: (key: string) => string): TreeNode[] => [
  {
    id: "user",
    label: t("checkable.user"),
    children: [
      { id: "user:read", label: t("checkable.userRead") },
      { id: "user:write", label: t("checkable.userWrite") },
      { id: "user:delete", label: t("checkable.userDelete") },
    ],
  },
  {
    id: "role",
    label: t("checkable.role"),
    children: [
      { id: "role:read", label: t("checkable.roleRead") },
      { id: "role:write", label: t("checkable.roleWrite") },
    ],
  },
];

/** Mock API: returns child nodes after an 800ms delay; directories whose name contains empty return empty and become leaves */
const fakeFetch = (id: string): Promise<TreeNode[]> =>
  new Promise((resolve) =>
    window.setTimeout(() => {
      if (id.includes("empty")) return resolve([]);
      resolve([
        { id: `${id}/docs`, label: "docs", lazy: true },
        { id: `${id}/empty`, label: "empty", lazy: true },
        { id: `${id}/readme.md`, label: "readme.md" },
      ]);
    }, 800),
  );

const setChildren = (list: TreeNode[], id: string, children: TreeNode[]): TreeNode[] =>
  list.map((n) =>
    n.id === id
      ? {
          ...n,
          lazy: children.length > 0 ? n.lazy : false,
          children: children.length ? children : undefined,
        }
      : n.children
        ? { ...n, children: setChildren(n.children, id, children) }
        : n,
  );

function AsyncDemo() {
  const [nodes, setNodes] = useState<TreeNode[]>([
    { id: "projects", label: "projects", lazy: true },
    { id: "archive", label: "archive", lazy: true },
  ]);
  return (
    <Tree
      aria-label="Remote files"
      nodes={nodes}
      onLoadChildren={async (id) => {
        const children = await fakeFetch(id);
        setNodes((list) => setChildren(list, id, children));
      }}
    />
  );
}

function FilterDemo() {
  const t = usePageT();
  const [query, setQuery] = useState("");
  return (
    <div className="pg-stack pg-stack--start">
      <Input
        aria-label={t("filter.search")}
        placeholder={t("filter.placeholder")}
        value={query}
        onValueChange={setQuery}
      />
      <Tree aria-label="Filtered files" nodes={FILES} filter={query} />
    </div>
  );
}

function DragDemo() {
  const t = usePageT();
  const [nodes, setNodes] = useState<TreeNode[]>(() => withIcons(FILES));
  const [expanded, setExpanded] = useState<string[]>(["src", "components"]);
  const [last, setLast] = useState("—");
  return (
    <div className="pg-stack pg-stack--start">
      <Tree
        aria-label="Draggable files"
        draggable
        nodes={nodes}
        expanded={expanded}
        onExpandedChange={setExpanded}
        onMove={(move) => {
          setNodes((prev) => moveTreeNode(prev, move));
          setLast(`${move.id} → ${move.position} ${move.targetId}`);
        }}
      />
      <p className="pg-desc">
        {t("drag.lastMove")} <code>{last}</code> {t("drag.keyboard")}
      </p>
    </div>
  );
}

function ControlledDemo() {
  const t = usePageT();
  const [expanded, setExpanded] = useState<string[]>(["src"]);
  const [selected, setSelected] = useState<string | null>("index");
  return (
    <div className="pg-stack pg-stack--start">
      <Tree
        aria-label="Files"
        nodes={FILES}
        expanded={expanded}
        onExpandedChange={setExpanded}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <p className="pg-desc">
        {t("controlled.selected")} <code>{selected ?? t("controlled.none")}</code> ·{" "}
        {t("controlled.expanded")} <code>{expanded.join(", ")}</code>
      </p>
    </div>
  );
}

function CheckableDemo() {
  const t = usePageT();
  const [checked, setChecked] = useState<string[]>([
    "user:read",
    "role:read",
    "role:write",
    "role",
  ]);
  return (
    <div className="pg-stack pg-stack--start">
      <Tree
        aria-label="Permissions"
        nodes={permissions(t)}
        checkable
        defaultExpanded={["user", "role"]}
        checked={checked}
        onCheckedChange={setChecked}
      />
      <p className="pg-desc">
        {t("checkable.checked")} <code>{checked.join(", ") || t("controlled.none")}</code>
      </p>
    </div>
  );
}

export default function TreePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Tree</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Tree } from "@skeinui/ui";

<Tree
  aria-label="Files"
  defaultExpanded={["src"]}
  nodes={[
    { id: "src", label: "src", children: [{ id: "index", label: "index.ts" }] },
    { id: "pkg", label: "package.json" },
  ]}
/>`}
      >
        <Tree aria-label="Files" nodes={FILES} defaultExpanded={["src"]} />
      </Example>

      <Example
        id="controlled"
        code={`<Tree expanded={expanded} onExpandedChange={setExpanded} selected={selected} onSelectedChange={setSelected} … />`}
      >
        <ControlledDemo />
      </Example>

      <Example
        id="checkable"
        code={`<Tree checkable checked={checked} onCheckedChange={setChecked} nodes={permissions} />`}
      >
        <CheckableDemo />
      </Example>

      <Example
        id="async"
        code={`<Tree
  nodes={nodes}
  onLoadChildren={async (id) => {
    const children = await fetchChildren(id);
    setNodes((list) => setChildren(list, id, children));
  }}
/>
// in nodes: { id: "projects", label: "projects", lazy: true }`}
      >
        <AsyncDemo />
      </Example>

      <Example
        id="filter"
        code={`<Tree nodes={nodes} filter={query} />
<Tree nodes={nodes} filter={query} filterMode="highlight" />`}
      >
        <FilterDemo />
      </Example>

      <Example
        id="drag"
        code={`const [nodes, setNodes] = useState(initial);
<Tree
  draggable
  nodes={nodes}
  onMove={(move) => setNodes((prev) => moveTreeNode(prev, move))}
  allowDrop={(move) => move.targetId !== "readme"}
/>`}
      >
        <DragDemo />
      </Example>

      <Example id="lines" code={`<Tree lines … />`}>
        <Tree
          lines
          aria-label="Files with lines"
          nodes={FILES}
          defaultExpanded={["src", "components"]}
        />
      </Example>

      <Example id="block" code={`<Tree block defaultSelected="index" … />`}>
        <Tree
          block
          aria-label="Block"
          nodes={FILES}
          defaultExpanded={["src"]}
          defaultSelected="index"
        />
      </Example>

      <Example
        id="icons"
        code={`{ id: "src", label: "src", children: […],\n  icon: ({ expanded }) => (expanded ? <FolderOpenIcon /> : <FolderIcon />) }`}
      >
        <Tree aria-label="Files with icons" nodes={withIcons(FILES)} defaultExpanded={["src"]} />
      </Example>

      <Example id="sizes" code={`<Tree size="sm" … />`}>
        <div className="pg-row">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Tree
              key={size}
              size={size}
              aria-label={size}
              nodes={FILES}
              defaultExpanded={["src"]}
              defaultSelected="index"
            />
          ))}
        </div>
      </Example>

      <Example id="colors" code={`<Tree color="success" defaultSelected="index" … />`}>
        <div className="pg-row">
          {(["neutral", "primary", "success", "danger"] as const).map((color) => (
            <Tree
              key={color}
              color={color}
              aria-label={color}
              nodes={FILES}
              defaultExpanded={["src"]}
              defaultSelected="index"
            />
          ))}
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Tree" />
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
