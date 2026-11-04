import { ColorPicker } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "trigger", name: "colorpicker-trigger / colorpicker-swatch / colorpicker-value" },
  { key: "panel", name: "colorpicker-panel" },
  { key: "area", name: "colorpicker-area / colorpicker-area-thumb" },
  { key: "controls", name: "colorpicker-controls / colorpicker-preview / colorpicker-sliders" },
  { key: "sliders", name: "colorpicker-hue / colorpicker-alpha (+ -thumb)" },
  { key: "formats", name: "colorpicker-formats" },
  { key: "input", name: "colorpicker-input / colorpicker-field" },
  { key: "presets", name: "colorpicker-presets / colorpicker-preset" },
];

const PRESETS = [
  "#f5222d",
  "#fa8c16",
  "#fadb14",
  "#52c41a",
  "#13c2c2",
  "#1677ff",
  "#722ed1",
  "#eb2f96",
];

function ControlledDemo() {
  const t = usePageT();
  const [color, setColor] = useState("#1677ff");
  return (
    <div className="pg-stack pg-stack--start">
      <ColorPicker value={color} onValueChange={setColor} showValue />
      <p className="pg-desc">
        {t("controlled.value")} <code>{color}</code>
      </p>
    </div>
  );
}

export default function ColorPickerPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Color Picker</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ColorPicker } from "@skeinui/ui";

<ColorPicker aria-label="Brand color" defaultValue="#1677ff" />`}
      >
        <ColorPicker aria-label="Brand color" defaultValue="#1677ff" />
      </Example>

      <Example
        id="controlled"
        code={`<ColorPicker value={color} onValueChange={setColor} showValue />`}
      >
        <ControlledDemo />
      </Example>

      <Example
        id="formats"
        code={`<ColorPicker defaultFormat="rgb" defaultValue="rgb(22 119 255)" />
<ColorPicker defaultFormat="hsb" defaultValue="hsb(215 91% 100%)" />`}
      >
        <div className="pg-row">
          <ColorPicker aria-label="Hex" defaultFormat="hex" showValue defaultValue="#1677ff" />
          <ColorPicker
            aria-label="RGB"
            defaultFormat="rgb"
            showValue
            defaultValue="rgb(22 119 255)"
          />
          <ColorPicker
            aria-label="HSB"
            defaultFormat="hsb"
            showValue
            defaultValue="hsb(215 91% 100%)"
          />
        </div>
      </Example>

      <Example
        id="alpha"
        code={`<ColorPicker alpha defaultValue="#1677ff80" />
<ColorPicker alpha defaultFormat="rgb" defaultValue="rgb(22 119 255 / 0.5)" />`}
      >
        <div className="pg-row">
          <ColorPicker aria-label="With alpha" alpha showValue defaultValue="#1677ff80" />
          <ColorPicker
            aria-label="RGB with alpha"
            alpha
            defaultFormat="rgb"
            showValue
            defaultValue="rgb(22 119 255 / 0.5)"
          />
        </div>
      </Example>

      <Example id="presets" code={`<ColorPicker presets={["#f5222d", "#fa8c16", …]} />`}>
        <ColorPicker aria-label="With presets" presets={PRESETS} defaultValue="#52c41a" />
      </Example>

      <Example id="show-value" code={`<ColorPicker showValue />`}>
        <ColorPicker aria-label="With value" showValue defaultValue="#722ed1" />
      </Example>

      <Example id="sizes" code={`<ColorPicker size="sm" />`}>
        <div className="pg-row">
          {(["sm", "md", "lg"] as const).map((size) => (
            <ColorPicker
              key={size}
              size={size}
              aria-label={size}
              showValue
              defaultValue="#fa8c16"
            />
          ))}
        </div>
      </Example>

      <Example id="disabled" code={`<ColorPicker disabled />`}>
        <ColorPicker aria-label="Disabled" disabled showValue defaultValue="#13c2c2" />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ColorPicker" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
