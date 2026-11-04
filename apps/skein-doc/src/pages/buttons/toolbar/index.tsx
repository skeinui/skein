import { Toggle, ToggleGroup, Toolbar } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "toolbar", name: "toolbar / toolbar-group", type: "slot" },
  { key: "reused", name: "button / separator", type: "slot" },
];

export default function ToolbarPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Toolbar</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Toolbar } from "@skeinui/ui";

<Toolbar aria-label="Formatting">
  <Toolbar.Button>Cut</Toolbar.Button>
  <Toolbar.Button>Copy</Toolbar.Button>
  <Toolbar.Button>Paste</Toolbar.Button>
</Toolbar>`}
      >
        <Toolbar aria-label="Edit">
          <Toolbar.Button>Cut</Toolbar.Button>
          <Toolbar.Button>Copy</Toolbar.Button>
          <Toolbar.Button>Paste</Toolbar.Button>
        </Toolbar>
      </Example>

      <Example id="groups" code={`<Toolbar.Separator />`}>
        <Toolbar aria-label="Formatting">
          <Toolbar.Group>
            <Toolbar.Button>Undo</Toolbar.Button>
            <Toolbar.Button>Redo</Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Separator />
          <Toolbar.Group>
            <Toolbar.Button>Bold</Toolbar.Button>
            <Toolbar.Button>Italic</Toolbar.Button>
          </Toolbar.Group>
        </Toolbar>
      </Example>

      <Example
        id="toggle"
        code={`<Toolbar.Button render={<Toggle value="bold" />}>Bold</Toolbar.Button>`}
      >
        <Toolbar aria-label="Toggles">
          <ToggleGroup>
            <Toolbar.Button render={<Toggle value="bold" />}>Bold</Toolbar.Button>
            <Toolbar.Button render={<Toggle value="italic" />}>Italic</Toolbar.Button>
          </ToggleGroup>
        </Toolbar>
      </Example>

      <Example id="vertical" code={`<Toolbar orientation="vertical">…</Toolbar>`}>
        <Toolbar orientation="vertical" aria-label="Vertical">
          <Toolbar.Button>Cut</Toolbar.Button>
          <Toolbar.Button>Copy</Toolbar.Button>
          <Toolbar.Button>Paste</Toolbar.Button>
        </Toolbar>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>Toolbar</h4>
        <ApiReference component="Toolbar" />
        <h4>Toolbar.Group</h4>
        <ApiReference component="Toolbar.Group" />
        <h4>Toolbar.Button</h4>
        <ApiReference component="Toolbar.Button" />
        <h4>Toolbar.Separator</h4>
        <p className="pg-desc">{t.rich("api.separator")}</p>
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
