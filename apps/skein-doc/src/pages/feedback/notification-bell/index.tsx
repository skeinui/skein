import { useState } from "react";
import { NotificationBell, toast } from "@skeinui/ui";
import type { NotificationItem } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

const START = (t: (key: string) => string): NotificationItem[] => [
  {
    id: 1,
    title: t("usage.n1"),
    description: "T-1016",
    time: Date.now() - 3 * 3600_000,
    canOpen: true,
  },
  {
    id: 2,
    title: t("usage.n2"),
    description: "T-1014",
    time: Date.now() - 7 * 3600_000,
    canOpen: true,
  },
  { id: 3, title: t("usage.n3"), time: Date.now() - 4 * 86_400_000, read: true },
];

function Demo() {
  const t = usePageT();
  const [items, setItems] = useState(() => START(t));
  return (
    <NotificationBell
      items={items}
      onRead={(item) =>
        setItems((all) => all.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
      }
      onReadAll={() => setItems((all) => all.map((n) => ({ ...n, read: true })))}
      onOpen={(item) => toast(t("usage.opened", { id: String(item.id) }))}
    />
  );
}

export default function NotificationBellPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Notification Bell</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<NotificationBell
  items={items}
  onRead={(item) => markRead(item.id)}
  onReadAll={markAllRead}
  onOpen={(item) => navigate(item.id)}
/>`}
      >
        <Demo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="NotificationBell" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
