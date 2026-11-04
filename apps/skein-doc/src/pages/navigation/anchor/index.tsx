import { Anchor } from "@skeinui/ui";
import type { AnchorItem } from "@skeinui/ui";
import { useRef, useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "anchor" },
  { key: "ink", name: "anchor-ink" },
  { key: "list", name: "anchor-list / anchor-item" },
  { key: "link", name: "anchor-link" },
];

const SECTIONS = ["Overview", "Install", "Usage", "API"];

/** Table of contents on the left, a scrollable area on the right; each demo uses a different id prefix, ids must be unique on the page. */
function Demo({
  prefix,
  items,
  direction = "vertical",
  value,
  onValueChange,
}: {
  prefix: string;
  items: AnchorItem[];
  direction?: "vertical" | "horizontal";
  value?: string;
  onValueChange?: (href: string) => void;
}) {
  const t = usePageT();
  const box = useRef<HTMLDivElement>(null);
  const ids = items.flatMap((i) => [i, ...(i.children ?? [])]).map((i) => i.href.slice(1));
  return (
    <div className={direction === "vertical" ? "pg-row pg-row--top" : "pg-stack pg-stack--start"}>
      <Anchor
        aria-label={`${prefix} contents`}
        items={items}
        direction={direction}
        container={box}
        value={value}
        onValueChange={onValueChange}
      />
      <div
        ref={box}
        className="pg-scrollbox"
        tabIndex={0}
        role="region"
        aria-label="Scrollable demo area"
      >
        {ids.map((id) => (
          <section key={id} id={id} className="pg-scrollbox-section">
            <h4>{id.replace(`${prefix}-`, "")}</h4>
            <p>{t.rich("usage.placeholder", { id })}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

const flat = (prefix: string): AnchorItem[] =>
  SECTIONS.map((s) => ({ href: `#${prefix}-${s}`, title: s }));

const nestedItems: AnchorItem[] = [
  { href: "#nested-Overview", title: "Overview" },
  {
    href: "#nested-Install",
    title: "Install",
    children: [
      { href: "#nested-npm", title: "npm" },
      { href: "#nested-pnpm", title: "pnpm" },
    ],
  },
  { href: "#nested-API", title: "API" },
];

function ControlledDemo() {
  const t = usePageT();
  const [active, setActive] = useState("#controlled-Install");
  return (
    <div className="pg-stack pg-stack--start">
      <Demo
        prefix="controlled"
        items={flat("controlled")}
        value={active}
        onValueChange={setActive}
      />
      <p className="pg-desc">{t.rich("controlled.active", { active })}</p>
    </div>
  );
}

export default function AnchorPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Anchor</h1>
      <Lead />
      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Anchor } from "@skeinui/ui";

const box = useRef(null);
<Anchor container={box} items={[{ href: "#usage", title: "Usage" }, { href: "#api", title: "API" }]} />
<div ref={box} style={{ overflow: "auto" }}>…<section id="usage" />…</div>`}
      >
        <Demo prefix="usage" items={flat("usage")} />
      </Example>

      <Example
        id="nested"
        code={`<Anchor items={[{ href: "#install", title: "Install", children: [{ href: "#npm", title: "npm" }] }]} />`}
      >
        <Demo prefix="nested" items={nestedItems} />
      </Example>

      <Example id="horizontal" code={`<Anchor direction="horizontal" items={items} />`}>
        <Demo prefix="horizontal" direction="horizontal" items={flat("horizontal")} />
      </Example>

      <Example
        id="controlled"
        code={`<Anchor value={active} onValueChange={setActive} items={items} />`}
      >
        <ControlledDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Anchor" />
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
