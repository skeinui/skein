import { Card, Statistic } from "@skeinui/ui";
import type { UIColor } from "@skeinui/ui";
import type { ReactNode } from "react";

export function StatCard({
  title,
  value,
  color,
  icon,
  loading,
}: {
  title: ReactNode;
  value?: number;
  color?: UIColor;
  icon?: ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <Card.Body>
        <Statistic title={title} value={value} color={color} prefix={icon} loading={loading} />
      </Card.Body>
    </Card>
  );
}
