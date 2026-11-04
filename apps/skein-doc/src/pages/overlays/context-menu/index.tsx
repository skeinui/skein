import { ContextMenu } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "trigger", name: "context-menu-trigger", type: "slot" },
  { key: "menu", name: "menu-positioner / menu / menu-item …", type: "slot" },
];

function Area(props: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 120,
        border: "1px dashed var(--ui-border)",
        borderRadius: 12,
        color: "var(--ui-fg-muted)",
        fontSize: 14,
      }}
    />
  );
}

export default function ContextMenuPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Context Menu</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ContextMenu } from "@skeinui/ui";

<ContextMenu>
  <ContextMenu.Trigger>Right click here</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>Copy</ContextMenu.Item>
    <ContextMenu.Item>Paste</ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu>`}
      >
        <ContextMenu>
          <ContextMenu.Trigger render={<Area />}>Right click here</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Copy</ContextMenu.Item>
            <ContextMenu.Item>Paste</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>
      </Example>

      <Example
        id="groups"
        code={`<ContextMenu.Separator />
<ContextMenu.Item color="danger">Delete</ContextMenu.Item>`}
      >
        <ContextMenu>
          <ContextMenu.Trigger render={<Area />}>Right click for more</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Group>
              <ContextMenu.GroupLabel>Edit</ContextMenu.GroupLabel>
              <ContextMenu.Item>Rename</ContextMenu.Item>
              <ContextMenu.Item>Duplicate</ContextMenu.Item>
            </ContextMenu.Group>
            <ContextMenu.Separator />
            <ContextMenu.Item color="danger">Delete</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>
      </Example>

      <Example
        id="checkbox"
        code={`<ContextMenu.CheckboxItem defaultChecked>Show hidden files</ContextMenu.CheckboxItem>`}
      >
        <ContextMenu>
          <ContextMenu.Trigger render={<Area />}>Right click for view options</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.CheckboxItem defaultChecked>Show hidden files</ContextMenu.CheckboxItem>
            <ContextMenu.CheckboxItem>Show extensions</ContextMenu.CheckboxItem>
          </ContextMenu.Content>
        </ContextMenu>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ContextMenu" />
        <h4>ContextMenu.Trigger</h4>
        <ApiReference component="ContextMenu.Trigger" />
        <h4>ContextMenu.Content</h4>
        <ApiReference component="ContextMenu.Content" />
        <p className="pg-desc">{t.rich("api.items")}</p>
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
