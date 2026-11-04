import { useState } from "react";
import { Button, Carousel } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "carousel" },
  { key: "viewport", name: "carousel-viewport / carousel-track" },
  { key: "slide", name: "carousel-slide" },
  { key: "arrow", name: "carousel-arrow" },
  { key: "dots", name: "carousel-dots / carousel-dot" },
  { key: "pause", name: "carousel-pause" },
];

const COLORS = ["#3b6fd4", "#2e8b6a", "#c0653a", "#7a4fb0"];

// Pages for the demo: the color blocks are just content, not the library's appearance
function Slide({ n }: { n: number }) {
  const t = usePageT();
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        height: "10rem",
        background: COLORS[n % COLORS.length],
        color: "#fff",
        fontSize: "1.5rem",
      }}
    >
      {t("basic.slide", { n: n + 1 })}
    </div>
  );
}
const slides = [0, 1, 2, 3].map((n) => <Slide key={n} n={n} />);

function ControlledDemo() {
  const [index, setIndex] = useState(0);
  return (
    <div className="pg-stack">
      <Carousel aria-label="Controlled" index={index} onIndexChange={setIndex}>
        {slides}
      </Carousel>
      <div className="pg-row">
        {slides.map((_, i) => (
          <Button key={i} size="sm" variant="outline" onClick={() => setIndex(i)}>
            {i + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function CarouselPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Carousel</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { Carousel } from "@skeinui/ui";

<Carousel aria-label="Gallery">
  <Slide /> <Slide /> <Slide />
</Carousel>`}
      >
        <Carousel aria-label="Gallery">{slides}</Carousel>
      </Example>

      <Example
        id="effect"
        code={`<Carousel effect="fade" dotPosition="top" aria-label="…">…</Carousel>`}
      >
        <Carousel aria-label="Fade" effect="fade" dotPosition="top">
          {slides}
        </Carousel>
      </Example>

      <Example id="autoplay" code={`<Carousel autoplay={3000} aria-label="…">…</Carousel>`}>
        <Carousel aria-label="Autoplay" autoplay={3000}>
          {slides}
        </Carousel>
      </Example>

      <Example
        id="controlled"
        code={`<Carousel index={index} onIndexChange={setIndex} aria-label="…">…</Carousel>`}
      >
        <ControlledDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Carousel" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
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
