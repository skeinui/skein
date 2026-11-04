import { Button, Menu } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "popup", name: "menu-positioner / menu", type: "slot" },
  { key: "item", name: "menu-item / menu-checkbox-item", type: "slot" },
  { key: "indicator", name: "menu-item-indicator", type: "slot" },
  { key: "group", name: "menu-group / menu-group-label", type: "slot" },
  { key: "separator", name: "menu-separator", type: "slot" },
];

const PARTS = ["Trigger", "Content", "Item", "CheckboxItem", "Group", "GroupLabel", "Separator"];

function CheckboxDemo() {
  const [bookmarks, setBookmarks] = useState(true);
  const [urls, setUrls] = useState(false);
  return (
    <Menu>
      <Menu.Trigger render={<Button variant="outline" />}>View</Menu.Trigger>
      <Menu.Content>
        <Menu.CheckboxItem checked={bookmarks} onCheckedChange={setBookmarks}>
          Show bookmarks
        </Menu.CheckboxItem>
        <Menu.CheckboxItem checked={urls} onCheckedChange={setUrls}>
          Show full URLs
        </Menu.CheckboxItem>
      </Menu.Content>
    </Menu>
  );
}

export default function MenuPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Menu</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Button, Menu } from "@skeinui/ui";

<Menu>
  <Menu.Trigger render={<Button variant="outline" />}>Actions</Menu.Trigger>
  <Menu.Content>
    <Menu.Item>New file</Menu.Item>
    <Menu.Item>Copy link</Menu.Item>
    <Menu.Item>Edit file</Menu.Item>
  </Menu.Content>
</Menu>`}
      >
        <Menu>
          <Menu.Trigger render={<Button variant="outline" />}>Actions</Menu.Trigger>
          <Menu.Content>
            <Menu.Item>New file</Menu.Item>
            <Menu.Item>Copy link</Menu.Item>
            <Menu.Item>Edit file</Menu.Item>
          </Menu.Content>
        </Menu>
      </Example>

      <DocHeading id="examples" />

      <Example
        id="groups"
        code={`<Menu.Group>
  <Menu.GroupLabel>Actions</Menu.GroupLabel>
  <Menu.Item>New file</Menu.Item>
</Menu.Group>
<Menu.Separator />`}
      >
        <Menu>
          <Menu.Trigger render={<Button variant="outline" />}>Open</Menu.Trigger>
          <Menu.Content>
            <Menu.Group>
              <Menu.GroupLabel>Actions</Menu.GroupLabel>
              <Menu.Item>New file</Menu.Item>
              <Menu.Item>Copy link</Menu.Item>
            </Menu.Group>
            <Menu.Separator />
            <Menu.Group>
              <Menu.GroupLabel>Account</Menu.GroupLabel>
              <Menu.Item>Profile</Menu.Item>
              <Menu.Item>Sign out</Menu.Item>
            </Menu.Group>
          </Menu.Content>
        </Menu>
      </Example>

      <Example id="danger" code={`<Menu.Item color="danger">Delete file</Menu.Item>`}>
        <Menu>
          <Menu.Trigger render={<Button variant="outline" />}>Manage</Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Rename</Menu.Item>
            <Menu.Item>Duplicate</Menu.Item>
            <Menu.Separator />
            <Menu.Item color="danger">Delete file</Menu.Item>
          </Menu.Content>
        </Menu>
      </Example>

      <Example
        id="checkbox"
        code={`<Menu.CheckboxItem checked={on} onCheckedChange={setOn}>Show bookmarks</Menu.CheckboxItem>`}
      >
        <CheckboxDemo />
      </Example>

      <Example id="disabled" code={`<Menu.Item disabled>Share</Menu.Item>`}>
        <Menu>
          <Menu.Trigger render={<Button variant="outline" />}>Open</Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Edit</Menu.Item>
            <Menu.Item disabled>Share (disabled)</Menu.Item>
            <Menu.Item>Archive</Menu.Item>
          </Menu.Content>
        </Menu>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Menu" />
        {PARTS.map((part) => (
          <div key={part}>
            <h4>Menu.{part}</h4>
            <ApiReference component={`Menu.${part}`} />
          </div>
        ))}
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
