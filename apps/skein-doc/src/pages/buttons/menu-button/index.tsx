import { MenuButton, toast } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

const PEOPLE = [
  { key: "ada", label: "Ada Lin" },
  { key: "ben", label: "Ben Carter" },
  { key: "chen", label: "Chen Yu" },
];

export default function MenuButtonPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Menu Button</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<MenuButton
  items={[{ key: "ada", label: "Ada Lin" }, { key: "ben", label: "Ben Carter" }]}
  onSelect={(key) => assign(key)}
>
  Assign to
</MenuButton>`}
      >
        <MenuButton items={PEOPLE} onSelect={(key) => toast.success(t("usage.picked", { key }))}>
          {t("usage.label")}
        </MenuButton>
      </Example>

      <Example
        id="variants"
        code={`<MenuButton variant="solid" color="primary" …>Actions</MenuButton>
<MenuButton variant="ghost" size="sm" …>More</MenuButton>`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <MenuButton variant="solid" color="primary" items={PEOPLE}>
            {t("variants.actions")}
          </MenuButton>
          <MenuButton variant="outline" items={PEOPLE}>
            {t("variants.actions")}
          </MenuButton>
          <MenuButton variant="ghost" size="sm" items={PEOPLE}>
            {t("variants.more")}
          </MenuButton>
        </div>
      </Example>

      <Example
        id="items"
        code={`items={[
  { key: "edit", label: "Edit" },
  { type: "separator" },
  { key: "delete", label: "Delete", danger: true },
  { key: "archive", label: "Archive", disabled: true },
]}`}
      >
        <MenuButton
          items={[
            { key: "edit", label: t("items.edit") },
            { type: "separator" },
            { key: "delete", label: t("items.delete"), danger: true },
            { key: "archive", label: t("items.archive"), disabled: true },
          ]}
          onSelect={(key) => toast(key)}
        >
          {t("items.label")}
        </MenuButton>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="MenuButton" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
