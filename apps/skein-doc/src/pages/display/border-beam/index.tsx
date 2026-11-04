import { useState } from "react";
import { BorderBeam, Button, Card, ColorPicker, Segmented } from "@skeinui/ui";
import type { BorderBeamStop } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "border-beam", type: "slot" },
  { key: "layer", name: "border-beam-layer", type: "slot" },
  { key: "beam", name: "border-beam-beam", type: "slot" },
];

const PALETTES: Record<string, BorderBeamStop[]> = {
  Ocean: [
    { color: "#1677ff", percent: 0 },
    { color: "#36cfc9", percent: 52 },
    { color: "#95de64", percent: 100 },
  ],
  Sunset: [
    { color: "#ff7a45", percent: 0 },
    { color: "#ff4d4f", percent: 50 },
    { color: "#c41d7f", percent: 100 },
  ],
  Aurora: [
    { color: "#722ed1", percent: 0 },
    { color: "#13c2c2", percent: 55 },
    { color: "#52c41a", percent: 100 },
  ],
};

function Panel({ title, children }: { title: string; children: string }) {
  return (
    <Card>
      <Card.Header>{title}</Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  );
}

/** Switch the beam color on containers of several different shapes, to see whether it follows each one's border */
function CustomDemo() {
  const t = usePageT();
  const [name, setName] = useState("Primary");
  const [custom, setCustom] = useState("#fa541c");
  const color = name === "Primary" ? undefined : name === "Custom" ? custom : PALETTES[name];
  const label = (v: string) =>
    v === "Primary" ? t("custom.primary") : v === "Custom" ? t("custom.custom") : v;
  return (
    <div className="pg-stack">
      <div className="pg-flex pg-flex--center">
        <Segmented
          aria-label={t("custom.beamColor")}
          value={name}
          onValueChange={setName}
          options={["Primary", ...Object.keys(PALETTES), "Custom"].map((v) => ({
            value: v,
            label: label(v),
          }))}
        />
        {name === "Custom" ? (
          <ColorPicker
            aria-label={t("custom.customColor")}
            value={custom}
            onValueChange={setCustom}
            showValue
          />
        ) : null}
      </div>
      <div className="pg-flex pg-flex--loose">
        <BorderBeam fit radius="full" size={60} duration={4} color={color}>
          <Button color="primary" radius="full">
            {t("custom.upgrade")}
          </Button>
        </BorderBeam>
        <BorderBeam fit radius="md" size={60} color={color}>
          <Button variant="outline">{t("custom.assistant")}</Button>
        </BorderBeam>
        <BorderBeam fit radius="lg" size={80} count={2} color={color}>
          <Panel title={t("custom.panelTitle")}>{t("custom.panelText")}</Panel>
        </BorderBeam>
      </div>
    </div>
  );
}

function ColorDemo() {
  const t = usePageT();
  const [name, setName] = useState("Ocean");
  return (
    <div className="pg-stack">
      <Segmented
        aria-label={t("color.palette")}
        value={name}
        onValueChange={setName}
        options={Object.keys(PALETTES).map((v) => ({ value: v, label: v }))}
      />
      <BorderBeam color={PALETTES[name]} size={140}>
        <Panel title={name}>{t("basic.panelText")}</Panel>
      </BorderBeam>
    </div>
  );
}

export default function BorderBeamPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Border Beam</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { BorderBeam } from "@skeinui/ui";

<BorderBeam>
  <Card>…</Card>
</BorderBeam>`}
      >
        <BorderBeam>
          <Panel title={t("basic.panelTitle")}>{t("basic.panelText")}</Panel>
        </BorderBeam>
      </Example>

      <Example id="hover" code={`<BorderBeam trigger="hover">…</BorderBeam>`}>
        <BorderBeam trigger="hover">
          <Panel title={t("hover.panelTitle")}>{t("hover.panelText")}</Panel>
        </BorderBeam>
      </Example>

      <Example id="count" code={`<BorderBeam count={3}>…</BorderBeam>`}>
        <BorderBeam count={3}>
          <Panel title={t("count.panelTitle")}>{t("count.panelText")}</Panel>
        </BorderBeam>
      </Example>

      <Example
        id="color"
        code={`<BorderBeam color={[
  { color: "#1677ff", percent: 0 },
  { color: "#36cfc9", percent: 52 },
  { color: "#95de64", percent: 100 },
]}>…</BorderBeam>`}
      >
        <ColorDemo />
      </Example>

      <Example id="size" code={`<BorderBeam size={56} duration={3} lineWidth={2}>…</BorderBeam>`}>
        <div className="pg-stack">
          <BorderBeam size={56} duration={3}>
            <Panel title={t("size.compactTitle")}>{t("size.compactText")}</Panel>
          </BorderBeam>
          <BorderBeam size={160} duration={12} lineWidth={2}>
            <Panel title={t("size.extendedTitle")}>{t("size.extendedText")}</Panel>
          </BorderBeam>
        </div>
      </Example>

      <Example
        id="custom"
        code={`<BorderBeam fit radius="full" color="#fa541c"><Button radius="full">…</Button></BorderBeam>`}
      >
        <CustomDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="BorderBeam" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
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
