import { Menubar } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "menubar", name: "menubar / menubar-trigger", type: "slot" },
  { key: "menu-positioner", name: "menu-positioner / menu / menu-item …", type: "slot" },
];

function Demo() {
  return (
    <Menubar>
      <Menubar.Menu>
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>New file</Menubar.Item>
          <Menubar.Item>Open…</Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item>Exit</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>Undo</Menubar.Item>
          <Menubar.Item>Redo</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger>Help</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>Documentation</Menubar.Item>
          <Menubar.Item>About</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  );
}

export default function MenubarPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Menubar</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Menubar } from "@skeinui/ui";

<Menubar>
  <Menubar.Menu>
    <Menubar.Trigger>File</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Item>New</Menubar.Item>
      <Menubar.Item>Open</Menubar.Item>
    </Menubar.Content>
  </Menubar.Menu>
  …
</Menubar>`}
      >
        <Demo />
      </Example>

      <Example
        id="checkbox"
        code={`<Menubar.CheckboxItem defaultChecked>Show toolbar</Menubar.CheckboxItem>`}
      >
        <Menubar>
          <Menubar.Menu>
            <Menubar.Trigger>View</Menubar.Trigger>
            <Menubar.Content>
              <Menubar.CheckboxItem defaultChecked>Show toolbar</Menubar.CheckboxItem>
              <Menubar.CheckboxItem>Show status bar</Menubar.CheckboxItem>
            </Menubar.Content>
          </Menubar.Menu>
        </Menubar>
      </Example>

      <Example id="danger" code={`<Menubar.Item color="danger">Delete</Menubar.Item>`}>
        <Menubar>
          <Menubar.Menu>
            <Menubar.Trigger>Account</Menubar.Trigger>
            <Menubar.Content>
              <Menubar.Item>Profile</Menubar.Item>
              <Menubar.Separator />
              <Menubar.Item color="danger">Delete account</Menubar.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </Menubar>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <p className="pg-desc">{t.rich("api.description")}</p>
        <ApiReference component="Menubar" />
        <h4>Menubar.Menu</h4>
        <ApiReference component="Menubar.Menu" />
        <h4>Menubar.Trigger</h4>
        <ApiReference component="Menubar.Trigger" />
        <h4>Menubar.Content</h4>
        <ApiReference component="Menubar.Content" />
        <h4>Menubar.Item</h4>
        <ApiReference component="Menubar.Item" />
        <h4>Menubar.CheckboxItem</h4>
        <ApiReference component="Menubar.CheckboxItem" />
        <h4>Menubar.Group</h4>
        <ApiReference component="Menubar.Group" />
        <h4>Menubar.GroupLabel</h4>
        <ApiReference component="Menubar.GroupLabel" />
        <h4>Menubar.Separator</h4>
        <ApiReference component="Menubar.Separator" />
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
