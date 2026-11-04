import { Calendar } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  {
    key: "root",
    name: "calendar / calendar-header / calendar-title / calendar-nav-button",
    type: "slot",
  },
  {
    key: "grid",
    name: "calendar-grid / calendar-weekday / calendar-week / calendar-cell",
    type: "slot",
  },
  { key: "day", name: "calendar-day", type: "slot" },
  { key: "range", name: "data-range-start / data-range-middle / data-range-end", type: "state" },
];

// Saturdays and Sundays are not selectable (dates are YYYY-MM-DD on the UTC calendar)
const isWeekend = (iso: string) => {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState<string | null>(null);
  return (
    <div className="pg-stack pg-stack--start">
      <Calendar value={value} onValueChange={setValue} />
      <p className="pg-desc">
        {t("controlled.selected")} <code>{String(value)}</code>
      </p>
    </div>
  );
}

export default function CalendarPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Calendar</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Calendar } from "@skeinui/ui";

<Calendar defaultValue="2026-10-15" />`}
      >
        <Calendar defaultValue="2026-10-15" />
      </Example>

      <Example
        id="range"
        code={`<Calendar mode="range" defaultValue={{ start: "2026-10-10", end: "2026-10-16" }} />`}
      >
        <Calendar mode="range" defaultValue={{ start: "2026-10-10", end: "2026-10-16" }} />
      </Example>

      <Example id="week" code={`<Calendar weekStartsOn={1} />`}>
        <Calendar weekStartsOn={1} defaultMonth="2026-10" />
      </Example>

      <Example
        id="limits"
        code={`<Calendar min="2026-10-05" max="2026-10-25" isDateDisabled={(d) => isWeekend(d)} />`}
      >
        <Calendar
          defaultMonth="2026-10"
          min="2026-10-05"
          max="2026-10-25"
          isDateDisabled={isWeekend}
        />
      </Example>

      <Example
        id="controlled"
        code={`const [value, setValue] = useState<string | null>(null);

<Calendar value={value} onValueChange={setValue} />`}
      >
        <ControlledDemo />
      </Example>

      <Example id="sizes" code={`<Calendar size="lg" color="success" />`}>
        <div className="pg-flex pg-flex--loose">
          <Calendar size="sm" defaultValue="2026-10-15" defaultMonth="2026-10" />
          <Calendar size="lg" color="success" defaultValue="2026-10-15" defaultMonth="2026-10" />
        </div>
      </Example>

      <Example id="locale" code={`<Calendar locale="fr-FR" weekStartsOn={1} />`}>
        <Calendar
          locale="fr-FR"
          weekStartsOn={1}
          defaultMonth="2026-10"
          defaultValue="2026-10-19"
        />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Calendar" />
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
