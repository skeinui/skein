import type { ComponentPropsWithoutRef } from "react";
import type { CardVariant, UIRadius } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface CardProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** @default "outline" */
  variant?: CardVariant;
  /** When not passed, the theme style decides. */
  radius?: UIRadius;
}

/**
 * Card: a container that groups related content into one panel.
 * Compose `Card.Header` (with `Card.Title` / `Card.Description`), `Card.Body` and `Card.Footer` (usually actions);
 * `variant` / `radius` set its look. For a key figure use Statistic; for a list of records use List or Table.
 *
 * Theme style: structure only; padding, outline and shadow are all decided by the theme style.
 */
function CardRoot({ variant = "outline", radius, ...rest }: CardProps) {
  return <div {...rest} data-slot="card" data-variant={variant} data-radius={radius} />;
}

export type CardPartProps = Without<ComponentPropsWithoutRef<"div">>;

const CardHeader = (props: CardPartProps) => <div {...props} data-slot="card-header" />;
const CardTitle = (props: Without<ComponentPropsWithoutRef<"h3">>) => (
  <h3 {...props} data-slot="card-title" />
);
const CardDescription = (props: Without<ComponentPropsWithoutRef<"p">>) => (
  <p {...props} data-slot="card-description" />
);
const CardBody = (props: CardPartProps) => <div {...props} data-slot="card-body" />;
const CardFooter = (props: CardPartProps) => <div {...props} data-slot="card-footer" />;

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Body: CardBody,
  Footer: CardFooter,
});
