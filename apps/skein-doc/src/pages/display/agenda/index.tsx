import { Agenda, en } from "@skeinui/ui";
import { zhCN } from "@skeinui/ui/locales/zh-CN";
import type { AgendaEvent, AgendaProps } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { useSettings } from "@/site/settings.ts";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks (all `data-slot`); their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "agenda" },
  { key: "header", name: "agenda-header / agenda-title / agenda-controls" },
  { key: "controls", name: "agenda-views / agenda-nav" },
  { key: "heads", name: "agenda-heads / agenda-head / agenda-head-name / agenda-head-date" },
  { key: "allday", name: "agenda-allday / agenda-allday-label / agenda-allday-events" },
  {
    key: "grid",
    name: "agenda-scroll / agenda-gutter / agenda-hour / agenda-columns / agenda-column",
  },
  { key: "now", name: "agenda-now" },
  { key: "event", name: "agenda-event / agenda-event-title / agenda-event-time" },
  { key: "handle", name: "agenda-event-handle / agenda-status" },
  { key: "month", name: "agenda-month / agenda-weekdays / agenda-weekday / agenda-week" },
  { key: "day", name: "agenda-day / agenda-day-number / agenda-more" },
  { key: "reused", name: "button / segmented" },
];

/** Dates and times relative to today, so the sample data always lands in the current week. */
const iso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const at = (n: number, time: string) => `${iso(n)}T${time}`;

/** Sample events: titles are page messages, so they follow the UI language (event content is data, not translated by the component). */
const SAMPLE: (Omit<AgendaEvent, "title"> & { id: string })[] = [
  { id: "holiday", start: iso(2), color: "success" },
  { id: "offsite", start: iso(-1), end: iso(1), color: "primary" },
  { id: "standup", start: at(0, "09:30"), end: at(0, "10:00"), color: "secondary" },
  { id: "design", start: at(0, "14:00"), end: at(0, "15:30"), color: "primary" },
  { id: "quick", start: at(0, "14:00"), end: at(0, "14:30"), color: "warning" },
  { id: "client", start: at(0, "14:30"), end: at(0, "15:30"), color: "danger" },
  { id: "one", start: at(1, "16:00"), end: at(1, "16:30"), color: "success" },
  { id: "plan", start: at(-2, "10:00"), end: at(-2, "11:30"), color: "primary" },
  { id: "lunch", start: at(3, "12:00"), end: at(3, "13:00"), color: "neutral" },
  { id: "deploy", start: at(2, "22:00"), end: at(3, "01:00"), color: "danger" },
];

const wrap = { width: "100%", maxWidth: 960 } as const;

/** Sample data, the first day of the week and hint text all follow the UI language; the component text is provided by the locale pack (ConfigProvider) in the page header settings. */
function useDemo() {
  const t = usePageT();
  const { lang } = useSettings();
  const zh = lang === "zh-CN";
  const events: AgendaEvent[] = SAMPLE.map((e) => ({ ...e, title: t(`usage.events.${e.id}`) }));
  return { t, zh, events, weekStartsOn: zh ? (1 as const) : (0 as const) };
}

function DragDemo() {
  const { t, events: initial, weekStartsOn } = useDemo();
  const [events, setEvents] = useState(initial);
  const [last, setLast] = useState(t("drag.hint"));
  return (
    <div style={wrap}>
      <Agenda
        weekStartsOn={weekStartsOn}
        aria-label={t("drag.ariaLabel")}
        events={events}
        onEventChange={(event, next) => {
          setEvents((all) => all.map((e) => (e.id === event.id ? { ...e, ...next } : e)));
          setLast(`${event.title} → ${next.start}${next.end ? ` … ${next.end}` : ""}`);
        }}
      />
      <p style={{ marginTop: 12 }}>{last}</p>
    </div>
  );
}

function InteractiveDemo() {
  const { t, events: initial, weekStartsOn } = useDemo();
  const [events, setEvents] = useState(initial);
  const [picked, setPicked] = useState<string>(t("interactive.hint"));
  const add: AgendaProps["onSlotClick"] = ({ date, time }) => {
    const id = `new-${events.length}`;
    const start = time ? `${date}T${time}` : date;
    const [h, m] = (time ?? "00:00").split(":").map(Number);
    const end = time
      ? `${date}T${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      : undefined;
    setEvents((all) => [
      ...all,
      { id, title: t("interactive.newEvent"), start, end, color: "secondary" },
    ]);
    setPicked(t("interactive.added", { start }));
  };
  return (
    <div style={wrap}>
      <Agenda
        weekStartsOn={weekStartsOn}
        aria-label={t("interactive.ariaLabel")}
        events={events}
        onEventClick={(e) => setPicked(t("interactive.clicked", { title: e.title }))}
        onSlotClick={add}
      />
      <p style={{ marginTop: 12 }}>{picked}</p>
    </div>
  );
}

export default function AgendaPage() {
  const { t, zh, events, weekStartsOn } = useDemo();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Agenda</h1>
      <Lead />

      <DocHeading id="examples" />
      <Example
        id="usage"
        code={`import { Agenda } from "@skeinui/ui";

<Agenda
  events={[
    { id: "1", title: "Standup", start: "2026-10-21T09:30", end: "2026-10-21T10:00" },
    { id: "2", title: "Offsite", start: "2026-10-20", end: "2026-10-22" }, // all day, several days
  ]}
/>`}
      >
        <div style={wrap}>
          <Agenda aria-label={t("usage.ariaLabel")} events={events} weekStartsOn={weekStartsOn} />
        </div>
      </Example>

      <Example
        id="interactive"
        code={`<Agenda
  events={events}
  onEventClick={(event) => open(event)}
  onSlotClick={({ date, time }) => create(date, time)}
/>`}
      >
        <InteractiveDemo />
      </Example>

      <Example
        id="drag"
        code={`const [events, setEvents] = useState(initial);

<Agenda
  events={events}
  onEventChange={(event, next) =>
    setEvents((all) => all.map((e) => (e.id === event.id ? { ...e, ...next } : e)))
  }
/>`}
      >
        <DragDemo />
      </Example>

      <Example id="month" code={`<Agenda events={events} defaultView="month" maxEvents={2} />`}>
        <div style={wrap}>
          <Agenda
            aria-label={t("month.ariaLabel")}
            events={events}
            weekStartsOn={weekStartsOn}
            defaultView="month"
            maxEvents={2}
          />
        </div>
      </Example>

      <Example
        id="range"
        code={`import { zhCN } from "@skeinui/ui/locales/zh-CN";

// the whole app: <ConfigProvider {...zhCN}>
<Agenda events={events} startHour={8} endHour={19} />

// only this one in another language:
<Agenda
  events={events}
  locale="en-US"
  labels={{ today: "Today", day: "Day", week: "Week", month: "Month" }}
/>`}
      >
        <div style={wrap}>
          <Agenda
            aria-label={t("range.ariaLabel")}
            events={events}
            startHour={8}
            endHour={19}
            scrollToHour={8}
            locale={zh ? en.locale : zhCN.locale}
            labels={zh ? en.labels.agenda : zhCN.labels.agenda}
            weekStartsOn={zh ? 0 : 1}
          />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Agenda" />
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
