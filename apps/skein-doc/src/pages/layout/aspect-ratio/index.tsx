import { AspectRatio } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

// Placeholder content for the demo, not the library's appearance
const Placeholder = ({ hue, label }: { hue: number; label: string }) => (
  <div
    style={{
      display: "grid",
      placeItems: "center",
      background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${hue + 40} 70% 45%))`,
      color: "#fff",
      fontSize: "1.25rem",
    }}
  >
    {label}
  </div>
);

export default function AspectRatioPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Aspect Ratio</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { AspectRatio } from "@skeinui/ui";

<AspectRatio ratio={16 / 9}>
  <img src="…" alt="…" />
</AspectRatio>`}
      >
        <div style={{ maxWidth: 420 }}>
          <AspectRatio ratio={16 / 9} radius="lg">
            <Placeholder hue={210} label="16 / 9" />
          </AspectRatio>
        </div>
      </Example>

      <Example
        id="ratios"
        code={`<AspectRatio ratio={1} />  <AspectRatio ratio="4/3" />  <AspectRatio ratio={21 / 9} />`}
      >
        <div className="pg-flex pg-flex--loose" style={{ alignItems: "flex-start" }}>
          {[
            { r: 1, h: 20, l: "1 / 1" },
            { r: "4/3", h: 140, l: "4 / 3" },
            { r: 21 / 9, h: 280, l: "21 / 9" },
          ].map(({ r, h, l }) => (
            <div key={l} style={{ width: 180 }}>
              <AspectRatio ratio={r} radius="md">
                <Placeholder hue={h} label={l} />
              </AspectRatio>
            </div>
          ))}
        </div>
      </Example>

      <Example id="radius" code={`<AspectRatio radius="full" ratio={1} />`}>
        <div className="pg-flex pg-flex--loose" style={{ alignItems: "flex-start" }}>
          {(["none", "sm", "md", "lg", "full"] as const).map((radius, i) => (
            <div key={radius} style={{ width: 96 }}>
              <AspectRatio ratio={1} radius={radius}>
                <Placeholder hue={i * 60} label={radius} />
              </AspectRatio>
            </div>
          ))}
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="AspectRatio" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={[{ name: "aspect-ratio", type: "slot", description: t.rich("styling.slot") }]}
        />
      </section>
    </article>
  );
}
