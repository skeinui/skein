import type { ButtonProps } from "@skeinui/ui";

/**
 * Follows the structure of https://heroui.com/en/docs/react/components/button.
 * HeroUI v3's variants are primary / secondary / tertiary / outline / ghost / danger / danger-soft;
 * this package expresses them with a neutral variant + color, and here is how they are written in this package's API.
 * Secondary is "gray background + primary-colored text", which in the heroui theme style is carried by the secondary color;
 * other theme styles interpret secondary differently (purple / indigo), so it will look different from HeroUI.
 */
export const HERO_VARIANTS: { label: string; props: Pick<ButtonProps, "variant" | "color"> }[] = [
  { label: "Primary", props: { variant: "solid", color: "primary" } },
  { label: "Secondary", props: { variant: "soft", color: "secondary" } },
  { label: "Tertiary", props: { variant: "soft", color: "neutral" } },
  { label: "Outline", props: { variant: "outline", color: "neutral" } },
  { label: "Ghost", props: { variant: "ghost", color: "neutral" } },
  { label: "Danger", props: { variant: "solid", color: "danger" } },
  { label: "Danger Soft", props: { variant: "soft", color: "danger" } },
];
