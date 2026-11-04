import { KeepAlive, PageTabs, openTab } from "@skeinui/ui";
import type { PageTab, PageTabsVariant } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The fields of a `PageTab`; descriptions are the page's `api.tab.<name>` messages. */
const TAB_FIELDS = [
  { name: "key", type: "string" },
  { name: "title", type: "string" },
  { name: "icon", type: "ReactNode" },
  { name: "pinned", type: "boolean" },
  { name: "closable", type: "boolean", default: "true" },
];

/** Helper functions; descriptions are the page's `helpers.<key>` messages. */
const HELPERS = [
  { key: "closeTabs", name: "closeTabs(tabs, keys, activeKey)", type: "{ tabs, activeKey }" },
  { key: "keysToClose", name: "keysToClose(tabs, scope, key)", type: "string[]" },
  { key: "moveTab", name: "moveTab(tabs, key, index)", type: "PageTab[]" },
  { key: "pinTab", name: "pinTab(tabs, key, pinned)", type: "PageTab[]" },
  { key: "openTab", name: "openTab(tabs, tab)", type: "PageTab[]" },
];

/** The styling hooks; descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "page-tabs", type: "root" },
  { key: "list", name: "page-tabs-list", type: "role=tablist" },
  { key: "item", name: "page-tabs-item", type: "div" },
  { key: "tab", name: "page-tabs-tab", type: "role=tab" },
  { key: "title", name: "page-tabs-icon / title", type: "span" },
  { key: "close", name: "page-tabs-close", type: "button" },
  { key: "scroll", name: "page-tabs-scroll", type: "button" },
  { key: "keepAlive", name: "keep-alive / keep-alive-pane", type: "div" },
];

const PAGE_NAMES = ["dashboard", "users", "orders", "products", "reports", "settings", "audit-log"];

/** Tab titles: the page's `usage.pages.<name>` messages. */
function useTitles() {
  const t = usePageT();
  return (name: string) => t(`usage.pages.${name}`);
}

function initialTabs(title: (n: string) => string, names: string[]): PageTab[] {
  return names.map((n, i) => ({ key: `/${n}`, title: title(n), pinned: i === 0 || undefined }));
}

function UsageDemo({ variant = "card" as PageTabsVariant, count = 4, pinnable = true }) {
  const title = useTitles();
  const [tabs, setTabs] = useState<readonly PageTab[]>(() =>
    initialTabs(title, PAGE_NAMES.slice(0, count)),
  );
  const [active, setActive] = useState("/dashboard");
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <PageTabs
        aria-label="Pages"
        variant={variant}
        tabs={tabs}
        activeKey={active}
        onActiveKeyChange={setActive}
        onTabsChange={setTabs}
        pinnable={pinnable}
        onRefresh={(key) => setActive(key)}
      />
      <p style={{ marginTop: 12 }}>{active}</p>
    </div>
  );
}

/** Each page has a counter and an input: their state should still be there after switching tabs; only a refresh starts over. */
function Page({ name }: { name: string }) {
  const t = usePageT();
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");
  return (
    <div style={{ padding: 16, display: "grid", gap: 8, maxWidth: 360 }}>
      <strong>{name}</strong>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        {t("keep-alive.clicked", { n: count })}
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("keep-alive.placeholder")}
        aria-label={name}
      />
      <div style={{ height: 600 }}>{t("keep-alive.tall")}</div>
    </div>
  );
}

function KeepAliveDemo() {
  const t = usePageT();
  const title = useTitles();
  const [tabs, setTabs] = useState<readonly PageTab[]>(() =>
    initialTabs(title, PAGE_NAMES.slice(0, 4)),
  );
  const [active, setActive] = useState("/dashboard");
  const [versions, setVersions] = useState<Record<string, number>>({});
  const open = (name: string) => {
    setTabs((list) => openTab(list, { key: `/${name}`, title: title(name) }));
    setActive(`/${name}`);
  };
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {PAGE_NAMES.map((n) => (
          <button key={n} type="button" onClick={() => open(n)}>
            {t("keep-alive.open", { title: title(n) })}
          </button>
        ))}
      </div>
      <PageTabs
        aria-label="Pages"
        variant="chrome"
        tabs={tabs}
        activeKey={active}
        onActiveKeyChange={setActive}
        onTabsChange={setTabs}
        pinnable
        onRefresh={(key) => setVersions((v) => ({ ...v, [key]: (v[key] ?? 0) + 1 }))}
      />
      <div
        style={{ height: 240, display: "flex", flexDirection: "column", border: "1px solid #8884" }}
      >
        <KeepAlive
          activeKey={active}
          keepKeys={tabs.map((tab) => tab.key)}
          versions={versions}
          transition="fade"
        >
          <Page name={active} />
        </KeepAlive>
      </div>
      <p style={{ marginTop: 12 }}>{t("keep-alive.note")}</p>
    </div>
  );
}

export default function PageTabsPage() {
  const t = usePageT();
  const title = useTitles();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Page Tabs</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`const [tabs, setTabs] = useState<readonly PageTab[]>([
  { key: "/dashboard", title: "Dashboard", pinned: true },
  { key: "/users", title: "Users" },
]);
const [active, setActive] = useState("/dashboard");

<PageTabs
  tabs={tabs}
  activeKey={active}
  onActiveKeyChange={setActive}
  onTabsChange={setTabs}
  pinnable
/>`}
      >
        <UsageDemo />
      </Example>

      <Example
        id="variants"
        code={`<PageTabs variant="card" … />
<PageTabs variant="chrome" … />
<PageTabs variant="line" … />`}
      >
        <div style={{ display: "grid", gap: 24, width: "100%", maxWidth: 760 }}>
          <UsageDemo variant="card" />
          <UsageDemo variant="chrome" />
          <UsageDemo variant="line" />
        </div>
      </Example>

      <Example
        id="keep-alive"
        code={`const [versions, setVersions] = useState<Record<string, number>>({});

<PageTabs
  tabs={tabs}
  activeKey={active}
  onActiveKeyChange={setActive}
  onTabsChange={setTabs}
  onRefresh={(key) => setVersions((v) => ({ ...v, [key]: (v[key] ?? 0) + 1 }))}
/>
<KeepAlive
  activeKey={active}
  keepKeys={tabs.map((t) => t.key)}
  versions={versions}
  transition="fade"
>
  <Page path={active} />
</KeepAlive>`}
      >
        <KeepAliveDemo />
      </Example>

      <Example id="overflow" code={`<PageTabs tabs={manyTabs} … />`}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <OverflowDemo title={title} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="PageTabs" />
        <h4>PageTab</h4>
        <PropsTable
          first={t("api.field")}
          rows={TAB_FIELDS.map((f) => ({ ...f, description: t(`api.tab.${f.name}`) }))}
        />
      </section>

      <section id="keep-alive-api" className="pg-example">
        <h3>{t("keep-alive-api.title")}</h3>
        <ApiReference component="KeepAlive" />
      </section>

      <section id="helpers" className="pg-example">
        <h3>{t("helpers.title")}</h3>
        <PropsTable
          first={t("helpers.function")}
          rows={HELPERS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t(`helpers.${h.key}`),
          }))}
        />
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

function OverflowDemo({ title }: { title: (n: string) => string }) {
  const names = [...PAGE_NAMES, ...PAGE_NAMES.map((n) => `${n}-2`)];
  const [tabs, setTabs] = useState<readonly PageTab[]>(() =>
    names.map((n) => ({
      key: `/${n}`,
      title: title(n.replace("-2", "")) + (n.endsWith("-2") ? " 2" : ""),
    })),
  );
  const [active, setActive] = useState("/dashboard");
  return (
    <PageTabs
      aria-label="Pages"
      variant="card"
      tabs={tabs}
      activeKey={active}
      onActiveKeyChange={setActive}
      onTabsChange={setTabs}
    />
  );
}
