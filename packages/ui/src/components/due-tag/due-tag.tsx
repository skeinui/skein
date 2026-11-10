import { useEffect, useState } from "react";
import { useLabels } from "../../locales/use-labels.ts";
import type { DueTagLabels } from "../../locales/messages.ts";
import { RelativeTime } from "../relative-time/index.ts";
import { Tag } from "../tag/index.ts";
import { Text } from "../typography/index.ts";

export interface DueTagProps {
  /** The deadline: a `Date`, an ISO string or a timestamp in milliseconds. */
  value: Date | string | number;
  /** Nothing is due any more (the ticket is resolved, the task is done): a dash. */
  done?: boolean;
  /** The clock is stopped (waiting for the customer): "Paused" instead of the time. */
  paused?: boolean;
  /**
   * How long the time counts in hours before it counts in days: "30 hours ago", not "1 day ago".
   * @default 48
   */
  hoursUntil?: number;
  /** Texts of the tag, for another language. */
  labels?: Partial<DueTagLabels>;
}

/**
 * Due tag: when something is due. Before the deadline the time left in plain text ("in 5 hours"), after it a red tag with "Overdue" and how long ago.
 * A `done` item has nothing due (a dash) and a `paused` clock says so in a grey tag. It counts again every minute, so a page that stays open turns red on time.
 */
export function DueTag({ value, done, paused, hoursUntil = 48, labels }: DueTagProps) {
  const t = { ...useLabels("dueTag"), ...labels };
  const [, tick] = useState(0);
  const running = !done && !paused;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(timer);
  }, [running]);
  if (done) return <Text nowrap>—</Text>;
  if (paused)
    return (
      <Tag variant="soft" color="neutral">
        {t.paused}
      </Tag>
    );
  // Hours up to two days, days after that
  const time = <RelativeTime value={value} numeric="always" hoursUntil={hoursUntil} refresh={60} />;
  return new Date(value).getTime() < Date.now() ? (
    <Tag variant="soft" color="danger">
      {t.overdue} · {time}
    </Tag>
  ) : (
    <Text nowrap>{time}</Text>
  );
}
