import { Button, Result } from "@skeinui/ui";
import { useNavigate } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { AccessDeniedError } from "@/modules/access";
import { ForbiddenPage } from "@/pages/forbidden";
import { settings } from "@/settings";
import { useErrorTranslation } from "./locales";

/**
 * What the router shows when a page throws (`defaultErrorComponent`, router.ts): the 403 page for a missing
 * permission (`requireAccess`), else a "failed to load" page with a retry; the message itself only in development.
 */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const { t } = useErrorTranslation();
  const navigate = useNavigate();
  if (error instanceof AccessDeniedError) return <ForbiddenPage />;
  return (
    <div className="page">
      <Result
        status="500"
        title={t("title")}
        description={t("description")}
        extra={
          <>
            <Button color="primary" onClick={reset}>
              {t("retry")}
            </Button>
            <Button variant="outline" onClick={() => void navigate({ to: settings.homePath })}>
              {t("home")}
            </Button>
          </>
        }
      >
        {import.meta.env.DEV ? (
          <code>{error instanceof Error ? error.message : String(error)}</code>
        ) : null}
      </Result>
    </div>
  );
}
