import { Button, Result } from "@skeinui/ui";
import { useNavigate } from "@tanstack/react-router";
import { settings } from "@/settings";
import { useForbiddenTranslation } from "./locales";

/** What a page shows to a user without the permission it asks for (`requireAccess`, modules/access). */
export function ForbiddenPage() {
  const { t } = useForbiddenTranslation();
  const navigate = useNavigate();
  return (
    <div className="page">
      <Result
        status="403"
        title={t("title")}
        description={t("description")}
        extra={
          <Button color="primary" onClick={() => void navigate({ to: settings.homePath })}>
            {t("home")}
          </Button>
        }
      />
    </div>
  );
}
