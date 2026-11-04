import { Rating } from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "rating" },
  { key: "item", name: "rating-item" },
  { key: "icon", name: "rating-icon / rating-icon-fill" },
  { key: "hit", name: "rating-hit" },
];

const Heart = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState(3);
  return (
    <div className="pg-stack pg-stack--start">
      <Rating aria-label="Score" value={value} onValueChange={setValue} />
      <p className="pg-desc">{t.rich("controlled.value", { value })}</p>
    </div>
  );
}

export default function RatingPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Rating</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Rating } from "@skeinui/ui";

<Rating aria-label="Score" defaultValue={3} />`}
      >
        <Rating aria-label="Score" defaultValue={3} />
      </Example>

      <Example id="controlled" code={`<Rating value={value} onValueChange={setValue} />`}>
        <ControlledDemo />
      </Example>

      <Example id="half" code={`<Rating allowHalf defaultValue={3.5} />`}>
        <Rating aria-label="Half score" allowHalf defaultValue={3.5} />
      </Example>

      <Example id="readonly" code={`<Rating readOnly value={4.5} allowHalf />`}>
        <Rating aria-label="Average" readOnly allowHalf value={4.5} />
      </Example>

      <Example id="icon" code={`<Rating icon={<HeartIcon />} color="danger" />`}>
        <Rating aria-label="Love" icon={<Heart />} color="danger" defaultValue={4} />
      </Example>

      <Example id="sizes" code={`<Rating size="lg" color="primary" />`}>
        <div className="pg-stack pg-stack--start">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Rating key={size} size={size} aria-label={size} defaultValue={3} />
          ))}
          {(["primary", "success", "danger"] as const).map((color) => (
            <Rating key={color} color={color} aria-label={color} defaultValue={4} />
          ))}
        </div>
      </Example>

      <Example id="disabled" code={`<Rating disabled defaultValue={2} />`}>
        <Rating aria-label="Disabled" disabled defaultValue={2} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Rating" />
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
