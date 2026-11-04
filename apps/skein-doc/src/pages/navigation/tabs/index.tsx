import { TABS_VARIANTS, Tabs, type TabsProps } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "parts", name: "tabs / tabs-list / tabs-tab / tabs-panel", type: "slot" },
  { key: "indicator", name: "tabs-indicator", type: "slot" },
  { key: "active", name: "data-active", type: "state" },
];

function Demo({
  disabledSecond = false,
  ...props
}: Omit<TabsProps, "children"> & { disabledSecond?: boolean }) {
  return (
    <Tabs defaultValue="photos" {...props}>
      <Tabs.List>
        <Tabs.Tab value="photos">Photos</Tabs.Tab>
        <Tabs.Tab value="music" disabled={disabledSecond}>
          Music
        </Tabs.Tab>
        <Tabs.Tab value="videos">Videos</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="photos">Photos panel</Tabs.Panel>
      <Tabs.Panel value="music">Music panel</Tabs.Panel>
      <Tabs.Panel value="videos">Videos panel</Tabs.Panel>
    </Tabs>
  );
}

export default function TabsPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Tabs</h1>
      <Lead />
      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Tabs } from "@skeinui/ui";

<Tabs defaultValue="photos">
  <Tabs.List>
    <Tabs.Tab value="photos">Photos</Tabs.Tab>
    <Tabs.Tab value="music">Music</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="photos">…</Tabs.Panel>
  <Tabs.Panel value="music">…</Tabs.Panel>
</Tabs>`}
      >
        <Demo />
      </Example>

      <Example
        id="variants"
        code={`<Tabs variant="underline">…</Tabs>
<Tabs variant="solid">…</Tabs>
<Tabs variant="soft">…</Tabs>`}
      >
        <div className="pg-stack pg-stack--start">
          {TABS_VARIANTS.map((v) => (
            <Demo key={v} variant={v} />
          ))}
        </div>
      </Example>

      <Example id="colors" code={`<Tabs color="success">…</Tabs>`}>
        <div className="pg-stack pg-stack--start">
          {(["primary", "success", "danger"] as const).map((c) => (
            <Demo key={c} variant="solid" color={c} />
          ))}
        </div>
      </Example>

      <Example id="sizes" code={`<Tabs size="sm">…</Tabs>`}>
        <div className="pg-stack pg-stack--start">
          <Demo size="sm" />
          <Demo size="md" />
          <Demo size="lg" />
        </div>
      </Example>

      <Example id="vertical" code={`<Tabs orientation="vertical">…</Tabs>`}>
        <Demo orientation="vertical" />
      </Example>

      <Example id="disabled" code={`<Tabs.Tab value="music" disabled>Music</Tabs.Tab>`}>
        <Demo disabledSecond />
      </Example>

      <Example id="full-width" code={`<Tabs fullWidth>…</Tabs>`}>
        <Demo variant="solid" fullWidth />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Tabs" />
        <h4>Tabs.List</h4>
        <ApiReference component="Tabs.List" />
        <h4>Tabs.Tab</h4>
        <ApiReference component="Tabs.Tab" />
        <h4>Tabs.Panel</h4>
        <ApiReference component="Tabs.Panel" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
