import { NavigationMenu } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  {
    key: "navigation-menu",
    name: "navigation-menu / navigation-menu-list / navigation-menu-item",
    type: "slot",
  },
  {
    key: "navigation-menu-trigger",
    name: "navigation-menu-trigger / navigation-menu-icon / navigation-menu-link",
    type: "slot",
  },
  {
    key: "navigation-menu-positioner",
    name: "navigation-menu-positioner / navigation-menu-popup / navigation-menu-viewport / navigation-menu-content",
    type: "slot",
  },
];

function Demo() {
  return (
    <NavigationMenu>
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="#analytics">Analytics</NavigationMenu.Link>
            <NavigationMenu.Link href="#engagement">Engagement</NavigationMenu.Link>
            <NavigationMenu.Link href="#security">Security</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Resources</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="#blog">Blog</NavigationMenu.Link>
            <NavigationMenu.Link href="#guides">Guides</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="#docs">Docs</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  );
}

export default function NavigationMenuPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Navigation Menu</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { NavigationMenu } from "@skeinui/ui";

<NavigationMenu>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link href="/a">Analytics</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Item>
      <NavigationMenu.Link href="/docs">Docs</NavigationMenu.Link>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu>`}
      >
        <Demo />
      </Example>

      <Example
        id="links-only"
        code={`<NavigationMenu.Item><NavigationMenu.Link href="#" /></NavigationMenu.Item>`}
      >
        <NavigationMenu>
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="#home">Home</NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="#pricing">Pricing</NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="#about">About</NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <p className="pg-desc">{t.rich("api.description")}</p>
        <ApiReference component="NavigationMenu" />
        <h4>NavigationMenu.List</h4>
        <ApiReference component="NavigationMenu.List" />
        <h4>NavigationMenu.Item</h4>
        <ApiReference component="NavigationMenu.Item" />
        <h4>NavigationMenu.Trigger</h4>
        <ApiReference component="NavigationMenu.Trigger" />
        <h4>NavigationMenu.Content</h4>
        <ApiReference component="NavigationMenu.Content" />
        <h4>NavigationMenu.Link</h4>
        <ApiReference component="NavigationMenu.Link" />
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
