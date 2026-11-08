import type { ReactNode } from "react";
import type { LoginLayoutVariant } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { Card } from "../card/index.ts";

/** One "continue with …" way in, shown as a button under the form. */
export interface LoginLayoutProvider {
  /** Reported to `onProvider` when its button is pressed. */
  id: string;
  label: string;
  /** Usually the provider's logo. */
  icon?: ReactNode;
}

export interface LoginLayoutProps {
  /**
   * `centered`: the form in a card in the middle; `split`: a cover on the left, the form on the right (wide screens only);
   * `cover`: the card over a full-page background. How each one looks is up to the theme style.
   * @default "centered"
   */
  variant?: LoginLayoutVariant;
  /** The app's mark and name: part of the app, not of the page's text, so it stays the same in every language. */
  brand: ReactNode;
  title: ReactNode;
  /** A line under the title. */
  description?: ReactNode;
  /** The form. */
  children: ReactNode;
  /** Other ways in, under the form behind a divider. */
  providers?: LoginLayoutProvider[];
  /** The divider's text ("Or continue with"). */
  providersLabel?: string;
  onProvider?: (id: string) => void;
  /** Under the form: a hint, links, the copyright. */
  footer?: ReactNode;
  /** Top right: language, appearance… */
  toolbar?: ReactNode;
  /** `split`: what the left side shows instead of the brand over a soft glow. */
  cover?: ReactNode;
  /** `cover`: a picture for the whole page instead of the soft glow. */
  backgroundImage?: string;
}

/**
 * The page around a sign-in (or sign-up) form: three looks for the same parts. The brand, the title and the form are
 * the page's own, this only places them; the soft glow and the dividers come from the theme style.
 *
 * Theme style: `--ui-login-min-height` (default the viewport's height) sets how tall the page is, e.g. to show it
 * inside a box.
 */
export function LoginLayout({
  variant = "centered",
  brand,
  title,
  description,
  children,
  providers,
  providersLabel,
  onProvider,
  footer,
  toolbar,
  cover,
  backgroundImage,
}: LoginLayoutProps) {
  const body = (
    <>
      <header data-slot="login-layout-head">
        <div data-slot="login-layout-brand">{brand}</div>
        <h1 data-slot="login-layout-title">{title}</h1>
        {description ? <p data-slot="login-layout-description">{description}</p> : null}
      </header>
      {children}
      {providers?.length ? (
        <div data-slot="login-layout-providers">
          {providersLabel ? <div data-slot="login-layout-divider">{providersLabel}</div> : null}
          <div data-slot="login-layout-provider-list">
            {providers.map((p) => (
              <Button
                key={p.id}
                variant="outline"
                color="neutral"
                fullWidth
                startContent={p.icon}
                onClick={() => onProvider?.(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {footer ? <div data-slot="login-layout-footer">{footer}</div> : null}
    </>
  );
  return (
    <main data-slot="login-layout" data-variant={variant}>
      {variant === "split" ? (
        <aside data-slot="login-layout-cover">
          {cover ?? (
            <>
              <div data-slot="login-layout-glow" />
              <div data-slot="login-layout-cover-brand">{brand}</div>
            </>
          )}
        </aside>
      ) : null}
      {variant === "cover" ? (
        <div data-slot="login-layout-backdrop" aria-hidden>
          {backgroundImage ? (
            <img data-slot="login-layout-backdrop-image" src={backgroundImage} alt="" />
          ) : (
            <div data-slot="login-layout-glow" />
          )}
        </div>
      ) : null}
      <div data-slot="login-layout-main">
        {toolbar ? <div data-slot="login-layout-toolbar">{toolbar}</div> : null}
        <div data-slot="login-layout-panel">
          {variant === "split" ? (
            body
          ) : (
            <Card>
              <Card.Body>
                <div data-slot="login-layout-card">{body}</div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
