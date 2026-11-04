import { Button, Result } from "@skeinui/ui";
import { useNavigate } from "@tanstack/react-router";
import { settings } from "@/settings";
import { useNotFoundTranslation } from "./locales";

export function NotFoundPage() {
  const { t } = useNotFoundTranslation();
  const navigate = useNavigate();
  return (
    <div className="page">
      <Result
        status="404"
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
