import { Avatar, BADGE_PLACEMENTS, Badge, Button, COLORS, SIZES } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "slot", name: "data-slot", type: "badge / badge-indicator" },
  { key: "root", name: "data-color / data-size / data-placement / data-wrapped" },
  { key: "dot", name: "data-dot", type: "badge-indicator" },
];

export default function BadgePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Badge</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<Badge count={5}>
  <Button variant="outline">Inbox</Button>
</Badge>
<Badge count={5}>
  <Avatar fallback="AL" color="primary" />
</Badge>`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Badge count={5}>
            <Button variant="outline">Inbox</Button>
          </Badge>
          <Badge count={5}>
            <Avatar fallback="AL" color="primary" />
          </Badge>
        </div>
      </Example>

      <Example
        id="max"
        code={`<Badge count={120}>…</Badge>
<Badge count={120} max={999}>…</Badge>
<Badge count={0}>…</Badge>
<Badge count={0} showZero>…</Badge>`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Badge count={120}>
            <Avatar fallback="99+" />
          </Badge>
          <Badge count={120} max={999}>
            <Avatar fallback="120" />
          </Badge>
          <Badge count={0}>
            <Avatar fallback="0" />
          </Badge>
          <Badge count={0} showZero>
            <Avatar fallback="0" />
          </Badge>
        </div>
      </Example>

      <Example
        id="dot"
        code={`<Badge dot>
  <Avatar fallback="AL" color="primary" />
</Badge>`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Badge dot>
            <Avatar fallback="AL" color="primary" />
          </Badge>
          <Badge dot color="success">
            <Avatar fallback="BK" color="secondary" />
          </Badge>
        </div>
      </Example>

      <Example id="colors" code={`<Badge count={5} color="success">…</Badge>`}>
        <div className="pg-flex pg-flex--center pg-flex--loose">
          {COLORS.map((c) => (
            <Badge key={c} count={5} color={c}>
              <Avatar fallback={c.slice(0, 2).toUpperCase()} />
            </Badge>
          ))}
        </div>
      </Example>

      <Example
        id="sizes"
        code={`<Badge count={5} size="sm">…</Badge>
<Badge count={5} size="md">…</Badge>
<Badge count={5} size="lg">…</Badge>`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          {SIZES.map((s) => (
            <Badge key={s} count={5} size={s}>
              <Avatar fallback={s} size="lg" />
            </Badge>
          ))}
        </div>
      </Example>

      <Example id="placement" code={`<Badge count={5} placement="bottom-end">…</Badge>`}>
        <div className="pg-flex pg-flex--center pg-flex--loose">
          {BADGE_PLACEMENTS.map((p) => (
            <Badge key={p} count={5} placement={p}>
              <Avatar fallback="AL" color="primary" size="lg" />
            </Badge>
          ))}
        </div>
      </Example>

      <Example
        id="standalone"
        code={`<Badge count={25} />
<Badge count="new" color="success" />
<Badge count={5} color="primary" size="lg" />`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Badge count={25} />
          <Badge count="new" color="success" />
          <Badge count={5} color="primary" size="lg" />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Badge" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type ?? t("styling.sameAsProps"),
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
