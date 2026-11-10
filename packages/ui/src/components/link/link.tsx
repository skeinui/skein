import type { ComponentPropsWithoutRef } from "react";
import type { LinkVariant, UIColor } from "../../contract.ts";

export interface LinkProps extends Omit<
  ComponentPropsWithoutRef<"a">,
  "className" | "style" | "color"
> {
  /**
   * `default` is always coloured; `subtle` uses the colour of the text around it with a faint underline and takes the colour on hover.
   * @default "default"
   */
  variant?: LinkVariant;
  /** @default "primary" */
  color?: UIColor;
  /** External link: opens in a new window with rel="noopener noreferrer"; the theme style may append an external-link icon. */
  external?: boolean;
  /** Removes `href`, so the link can't be followed. */
  disabled?: boolean;
}

/**
 * Link: an inline text link (`href`), with `color` / `variant`; `external` opens it in a new tab.
 * To integrate with a router, do not use the render prop: wrap the router's <Link>, or call the router navigation in onClick.
 * For an action that doesn't navigate use Button (`variant="ghost"`).
 */
export function Link({
  variant = "default",
  color = "primary",
  external = false,
  disabled = false,
  ...rest
}: LinkProps) {
  return (
    <a
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      {...rest}
      href={disabled ? undefined : rest.href}
      aria-disabled={disabled || undefined}
      data-slot="link"
      data-variant={variant}
      data-color={color}
      data-external={external ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
    />
  );
}
