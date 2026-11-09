import type { CardVariant, UIRadius } from "../../contract.ts";
import { Card } from "../card/index.ts";
import { Statistic } from "../statistic/index.ts";
import type { StatisticProps } from "../statistic/index.ts";

export interface StatisticCardProps extends StatisticProps {
  /**
   * Look of the card.
   * @default "outline"
   */
  variant?: CardVariant;
  /** Corner radius step of the card; when omitted the theme style decides. */
  radius?: UIRadius;
}

/**
 * Statistic card: a key figure in a card, the tile of a dashboard or a report (`title`, `value`, `prefix` / `suffix`, `color`, `loading`; `variant` / `radius` are the card's).
 * To lay several out use a Grid with `minColumnWidth`; for a figure inside other content use Statistic.
 */
export function StatisticCard({ variant, radius, ...statistic }: StatisticCardProps) {
  return (
    <Card variant={variant} radius={radius}>
      <Card.Body>
        <Statistic {...statistic} />
      </Card.Body>
    </Card>
  );
}
